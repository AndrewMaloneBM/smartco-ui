import type { Market, SellerTargeting } from "@/lib/types";
import { MARKETS } from "@/lib/types";
import type { Step1Rule } from "../iteration-1/logic";

/**
 * Step 2 write engine — pure functions for conflict detection and the async task
 * model. The PRD makes every write (create / bulk update / archive) asynchronous:
 * the UI submits, gets a task back, polls until DONE, then shows a per-rule result
 * breakdown. We mock the backend by computing results synchronously and revealing
 * them after a short delay.
 */

/** Per-rule outcome of a CREATE submission (PRD task-detail result column). */
export type RuleResult = "CREATED" | "OVERLAP" | "STRICT_CONFLICT" | "SYSTEM_ERROR";

export type TaskKind = "CREATE" | "UPDATE" | "ARCHIVE";
export type TaskStatus = "ONGOING" | "DONE";

export interface TaskItem {
  /** Rule id this line refers to (the new rule's id for CREATE, existing id otherwise). */
  ruleId: string;
  /** Human-readable scope, e.g. "FR · Smartphones · TechReborn". */
  scope: string;
  result: RuleResult;
  /** Explanation shown in the task detail panel. */
  message: string;
  /** For STRICT_CONFLICT / OVERLAP: the id of the rule we collided with. */
  relatedRuleId?: string;
}

/** Fields a bulk update can change (PRD/specs bulk update drawer). */
export interface BulkUpdateValues {
  name?: string;
  commission_rate?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface Task {
  id: string;
  kind: TaskKind;
  submittedAt: string; // ISO timestamp
  durationMs: number; // simulated processing time
  status: TaskStatus;
  /** New rules to commit once a CREATE task resolves (excludes strict conflicts). */
  pendingRules: Step1Rule[];
  /** Rule ids + new values to apply once a bulk UPDATE task resolves. */
  update?: { ruleIds: string[]; values: BulkUpdateValues };
  /** Rule ids to set status=ARCHIVED once an ARCHIVE task resolves. */
  archiveIds?: string[];
  items: TaskItem[];
}

/** Scope shape used for conflict comparison. */
interface Scope {
  market: Market;
  category: string | null;
  product_id: string | null;
  seller_targeting: SellerTargeting;
  seller_ids: string[];
}

function sellerKey(targeting: SellerTargeting, ids: string[]): string {
  return targeting === "ALL" || ids.length === 0
    ? "ALL"
    : [...ids].sort().join(",");
}

/** Exact-match key for strict-conflict detection: seller × category × market × product. */
function strictKey(s: Scope): string {
  return [
    s.market,
    s.category ?? "*",
    s.product_id ?? "*",
    sellerKey(s.seller_targeting, s.seller_ids),
  ].join("|");
}

/**
 * Is `existing` a broader (or equal) scope than `candidate` in the same market?
 * A null dimension on the existing rule means "all", which covers any candidate
 * value for that dimension. Used to detect OVERLAP (candidate is created but a
 * wider rule already applies and takes priority).
 */
function covers(existing: Scope, candidate: Scope): boolean {
  if (existing.market !== candidate.market) return false;
  if (existing.category !== null && existing.category !== candidate.category)
    return false;
  if (existing.product_id !== null && existing.product_id !== candidate.product_id)
    return false;
  const eSellers = sellerKey(existing.seller_targeting, existing.seller_ids);
  const cSellers = sellerKey(candidate.seller_targeting, candidate.seller_ids);
  if (eSellers !== "ALL" && eSellers !== cSellers) return false;
  return true;
}

/**
 * Classify a candidate scope against the live (non-archived) rules.
 * - STRICT_CONFLICT: an identical rule already exists → not created.
 * - OVERLAP: a broader rule already covers this scope → created, lower priority.
 * - CREATED: clean.
 */
export function classifyScope(
  candidate: Scope,
  existing: Step1Rule[]
): { result: Exclude<RuleResult, "SYSTEM_ERROR">; relatedRuleId?: string } {
  const live = existing.filter((r) => r.status !== "ARCHIVED");
  const cKey = strictKey(candidate);

  const strict = live.find((r) => strictKey(toScope(r)) === cKey);
  if (strict) return { result: "STRICT_CONFLICT", relatedRuleId: strict.id };

  const broader = live.find(
    (r) => covers(toScope(r), candidate) && strictKey(toScope(r)) !== cKey
  );
  if (broader) return { result: "OVERLAP", relatedRuleId: broader.id };

  return { result: "CREATED" };
}

function toScope(r: Step1Rule): Scope {
  return {
    market: r.market,
    category: r.category,
    product_id: r.product_id,
    seller_targeting: r.seller_targeting,
    seller_ids: r.seller_ids,
  };
}

export function scopeLabel(r: Pick<Step1Rule, "market" | "category" | "product_id" | "seller_ids" | "seller_targeting">): string {
  const parts: string[] = [r.market];
  parts.push(r.category ?? "All categories");
  if (r.product_id) parts.push(r.product_id);
  parts.push(
    r.seller_targeting === "ALL" || r.seller_ids.length === 0 ? "All sellers" : r.seller_ids[0]
  );
  return parts.join(" · ");
}

export const RESULT_META: Record<
  RuleResult,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  CREATED: { label: "Created", tone: "success" },
  OVERLAP: { label: "Overlap", tone: "warning" },
  STRICT_CONFLICT: { label: "Strict conflict", tone: "danger" },
  SYSTEM_ERROR: { label: "System error", tone: "danger" },
};

// ── Task builders ──────────────────────────────────────────────────────────
// These mock the SXP bulk endpoints: each returns an ONGOING task with the work
// already classified. The view reveals results (and commits the effects) after a
// simulated delay, mirroring the real async celery-task + polling flow.

/** Short pseudo-id derived from a seed string — avoids Math.random for stable demos. */
function shortId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

/** Next sequential RULE-#### id above the current max in the store. */
function nextRuleId(existing: Step1Rule[], offset: number): string {
  let max = 3000;
  for (const r of existing) {
    const n = Number(r.id.replace(/\D/g, ""));
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `RULE-${max + 1 + offset}`;
}

/** State is automatic: ACTIVE if VALIDATED and within its date range, else INACTIVE. */
export function computeState(
  rule: Pick<Step1Rule, "status" | "start_date" | "end_date">,
  nowIso: string
): "ACTIVE" | "INACTIVE" {
  if (rule.status === "ARCHIVED" || rule.status === "DRAFT" || rule.status === "PAUSED")
    return "INACTIVE";
  const now = new Date(nowIso).getTime();
  if (rule.start_date && new Date(rule.start_date).getTime() > now) return "INACTIVE";
  if (rule.end_date && new Date(rule.end_date).getTime() < now) return "INACTIVE";
  return "ACTIVE";
}

export interface CreateInput {
  campaignName: string;
  sellerTargeting: SellerTargeting;
  sellerIds: string[];
  markets: Market[]; // empty = all markets
  categories: string[]; // empty = all categories (one rule, category=null)
  productIds: string[]; // empty = all products (one rule, product_id=null)
  commissionRate: number;
  startDate: string | null;
  endDate: string | null;
  author: string;
}

/**
 * Build a CREATE task. Multi-selects fan out: markets × categories × productIds ×
 * sellerIds — a rule scopes to exactly one value per dimension (or all), so picking
 * several key sellers creates one seller-specific rule per seller, same as picking
 * several categories creates one rule per category. Empty market = all markets;
 * empty category/product = a single "all" rule for that dimension. Each candidate
 * is classified; strict conflicts are not created.
 */
export function buildCreateTask(
  input: CreateInput,
  existing: Step1Rule[],
  nowIso: string
): Task {
  const markets = input.markets.length ? input.markets : [...MARKETS];
  const categories = input.categories.length ? input.categories : [null];
  const products = input.productIds.length ? input.productIds : [null];
  const sellers: { targeting: SellerTargeting; ids: string[] }[] =
    input.sellerTargeting === "KEY_SELLERS" && input.sellerIds.length
      ? input.sellerIds.map((id) => ({ targeting: "KEY_SELLERS" as const, ids: [id] }))
      : [{ targeting: input.sellerTargeting, ids: [] }];

  const items: TaskItem[] = [];
  const pendingRules: Step1Rule[] = [];
  // Classify against the live store plus rules created earlier in this same task,
  // so a submission can't silently create two identical rules.
  const working = [...existing];

  let i = 0;
  for (const market of markets) {
    for (const category of categories) {
      for (const product of products) {
        for (const seller of sellers) {
          const scope = {
            market,
            category,
            product_id: product,
            seller_targeting: seller.targeting,
            seller_ids: seller.ids,
          };
          const { result, relatedRuleId } = classifyScope(scope, working);
          const label = scopeLabel(scope);

          if (result === "STRICT_CONFLICT") {
            items.push({
              ruleId: "—",
              scope: label,
              result,
              message: `Not created — an identical rule already exists (${relatedRuleId}).`,
              relatedRuleId,
            });
            continue;
          }

          const id = nextRuleId(working, i++);
          const rule: Step1Rule = {
            id,
            name: input.campaignName,
            market,
            category,
            product_id: product,
            grade: null,
            battery_type: null,
            seller_targeting: seller.targeting,
            seller_ids: [...seller.ids],
            commission_rate: input.commissionRate,
            start_date: input.startDate,
            end_date: input.endDate,
            state: computeState(
              { status: "VALIDATED", start_date: input.startDate, end_date: input.endDate },
              nowIso
            ),
            status: "VALIDATED",
            created_by: input.author,
            created_at: nowIso,
            conflicts: relatedRuleId ? [relatedRuleId] : [],
            orderlines_30d: null,
            gmv_30d: null,
          };
          working.push(rule);
          pendingRules.push(rule);
          items.push({
            ruleId: id,
            scope: label,
            result,
            message:
              result === "OVERLAP"
                ? `Created — a broader rule (${relatedRuleId}) already covers this scope and takes priority.`
                : "Created successfully.",
            relatedRuleId,
          });
        }
      }
    }
  }

  return {
    id: `TASK-${shortId(nowIso + input.campaignName)}`,
    kind: "CREATE",
    submittedAt: nowIso,
    durationMs: 1200 + items.length * 120,
    status: "ONGOING",
    pendingRules,
    items,
  };
}

export function buildUpdateTask(
  ruleIds: string[],
  values: BulkUpdateValues,
  existing: Step1Rule[],
  nowIso: string
): Task {
  const byId = new Map(existing.map((r) => [r.id, r]));
  const items: TaskItem[] = ruleIds.map((id) => {
    const r = byId.get(id);
    return {
      ruleId: id,
      scope: r ? scopeLabel(r) : id,
      result: "CREATED",
      message: "Updated successfully.",
    };
  });
  return {
    id: `TASK-${shortId(nowIso + ruleIds.join())}`,
    kind: "UPDATE",
    submittedAt: nowIso,
    durationMs: 1000 + ruleIds.length * 100,
    status: "ONGOING",
    pendingRules: [],
    update: { ruleIds, values },
    items,
  };
}

export function buildArchiveTask(
  ruleIds: string[],
  existing: Step1Rule[],
  nowIso: string
): Task {
  const byId = new Map(existing.map((r) => [r.id, r]));
  const items: TaskItem[] = ruleIds.map((id) => {
    const r = byId.get(id);
    return {
      ruleId: id,
      scope: r ? scopeLabel(r) : id,
      result: "CREATED",
      message: "Archived (soft delete) — preserved for audit.",
    };
  });
  return {
    id: `TASK-${shortId(nowIso + "archive" + ruleIds.join())}`,
    kind: "ARCHIVE",
    submittedAt: nowIso,
    durationMs: 900 + ruleIds.length * 80,
    status: "ONGOING",
    pendingRules: [],
    archiveIds: ruleIds,
    items,
  };
}

/** Apply a resolved task's effects to the rule store, returning the new array. */
export function commitTask(task: Task, rules: Step1Rule[], nowIso: string): Step1Rule[] {
  if (task.kind === "CREATE") return [...task.pendingRules, ...rules];
  if (task.kind === "UPDATE" && task.update) {
    const ids = new Set(task.update.ruleIds);
    const v = task.update.values;
    return rules.map((r) => {
      if (!ids.has(r.id)) return r;
      const next = {
        ...r,
        ...(v.name !== undefined ? { name: v.name } : {}),
        ...(v.commission_rate !== undefined
          ? { commission_rate: v.commission_rate }
          : {}),
        ...(v.start_date !== undefined ? { start_date: v.start_date } : {}),
        ...(v.end_date !== undefined ? { end_date: v.end_date } : {}),
      };
      next.state = computeState(next, nowIso);
      return next;
    });
  }
  if (task.kind === "ARCHIVE" && task.archiveIds) {
    const ids = new Set(task.archiveIds);
    return rules.map((r) =>
      ids.has(r.id) ? { ...r, status: "ARCHIVED" as const, state: "INACTIVE" as const } : r
    );
  }
  return rules;
}
