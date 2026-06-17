import { CommissionRule, RuleState } from "./types";
import { scopeKey } from "./utils";

export type RuleAction = "validate" | "pause" | "archive" | "delete";

const TODAY = "2026-06-15";

/** state = ACTIVE iff VALIDATED and today is within [start, end]. */
export function computeState(rule: CommissionRule): RuleState {
  if (rule.status !== "VALIDATED") return "INACTIVE";
  const afterStart = !rule.start_date || rule.start_date <= TODAY;
  const beforeEnd = !rule.end_date || rule.end_date >= TODAY;
  return afterStart && beforeEnd ? "ACTIVE" : "INACTIVE";
}

/** Recompute conflicts across all non-archived rules sharing an identical scope. */
export function recomputeConflicts(rules: CommissionRule[]): CommissionRule[] {
  const groups = new Map<string, CommissionRule[]>();
  for (const r of rules) {
    r.conflicts = [];
    if (r.status === "ARCHIVED") continue;
    const key = scopeKey(r);
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    for (const r of list) {
      r.conflicts = list.filter((o) => o.id !== r.id).map((o) => o.id);
    }
  }
  return rules;
}

export function applyAction(
  rules: CommissionRule[],
  id: string,
  action: RuleAction
): CommissionRule[] {
  let next: CommissionRule[];
  if (action === "delete") {
    next = rules.filter((r) => r.id !== id);
  } else {
    next = rules.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r };
      if (action === "validate") updated.status = "VALIDATED";
      else if (action === "pause") updated.status = "PAUSED";
      else if (action === "archive") updated.status = "ARCHIVED";
      updated.state = computeState(updated);
      return updated;
    });
  }
  return recomputeConflicts(next.map((r) => ({ ...r })));
}

/** Find existing non-archived rules whose scope matches a draft scope (pre-submission conflict check). */
export function findScopeConflicts(
  rules: CommissionRule[],
  candidate: {
    market: string;
    category: string | null;
    product_id: string | null;
    grade: string | null;
    battery_type: string | null;
    seller_targeting: string;
  }
): CommissionRule[] {
  const key = scopeKey(candidate);
  return rules.filter(
    (r) => r.status !== "ARCHIVED" && scopeKey(r) === key
  );
}
