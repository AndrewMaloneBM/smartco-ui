import { CATEGORIES, GRADES, MARKETS, RATE_MIN, RATE_MAX, type Market } from "@/lib/types";
import { BRANDS, OFFER_TYPES, type Step3Rule } from "../iteration-3/logic";
import { SELLER_POOL, isKnownProductId } from "../iteration-3/data";
import type { Step1Rule } from "../iteration-1/logic";

/**
 * Step 5 CSV import/export logic (sub-PRD 6505926261). Pure functions:
 * parse a CSV string into rows, validate create/update rows against the same
 * rules the create drawer enforces, and serialize rules/tasks back out.
 * No dependencies — a small hand-rolled RFC-4180-ish parser is enough for the
 * prototype (quoted fields, commas in values, CRLF).
 */

// ── Templates ───────────────────────────────────────────────────────────────

export const CREATE_TEMPLATE_COLUMNS = [
  "campaign_name",
  "market",
  "category",
  "product_id",
  "seller_id",
  "grade",
  "brand",
  "offer_type",
  "commission_rate",
  "start_date",
  "end_date",
] as const;

export const UPDATE_TEMPLATE_COLUMNS = [
  "rule_id",
  "campaign_name",
  "commission_rate",
  "start_date",
  "end_date",
] as const;

export const CREATE_TEMPLATE_CSV = `${CREATE_TEMPLATE_COLUMNS.join(",")}
Summer smartphones push,FR,Smartphones,,GreenMobile,EXCELLENT,Apple,Normal,8.5,2026-10-15,2026-11-15
Autumn laptops push,DE,Laptops,,,GOOD,,,12,,2026-12-31`;

export const UPDATE_TEMPLATE_CSV = `${UPDATE_TEMPLATE_COLUMNS.join(",")}
RULE-1042,Black Friday smartphones,15.5,2026-11-20,2026-12-01
RULE-1043,,9,,`;

// ── Parsing ─────────────────────────────────────────────────────────────────

/** Minimal RFC-4180-ish CSV → string[][]. Handles quoted fields + CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.length > 1 || row[0] !== "") rows.push(row); }
  return rows;
}

export type CsvMode = "create" | "update";

export interface CsvRow {
  /** 1-based row number in the file (header = 0, first data row = 1). Kept for task-results export. */
  inputRow: number;
  cells: Record<string, string>;
}

/** Parse raw CSV text into header-checked rows for the chosen mode. */
export function readCsv(text: string, mode: CsvMode): { rows: CsvRow[]; headerError?: string } {
  const parsed = parseCsv(text);
  if (parsed.length === 0) return { rows: [], headerError: "The file is empty." };
  const expected = mode === "create" ? CREATE_TEMPLATE_COLUMNS : UPDATE_TEMPLATE_COLUMNS;
  const header = parsed[0].map((h) => h.trim());
  const missing = expected.filter((c) => !header.includes(c));
  if (missing.length)
    return { rows: [], headerError: `Missing column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}. Download the template for the exact headers.` };
  return {
    rows: parsed.slice(1).map((r, i) => {
      const cells: Record<string, string> = {};
      expected.forEach((c) => { cells[c] = (header.indexOf(c) < r.length ? r[header.indexOf(c)] : "").trim(); });
      return { inputRow: i + 1, cells };
    }),
  };
}

// ── Validation ──────────────────────────────────────────────────────────────

export type RowVerdict = "VALID" | "BLOCKED" | "WARNING" | "DUPLICATE";

export interface RowIssue {
  inputRow: number;
  verdict: RowVerdict;
  message: string;
  /** For DUPLICATE rows: which past rule the row looks like a re-import of. */
  relatedRuleId?: string;
}

/**
 * Re-import guardrail ("Handle repeated or interrupted imports", sub-PRD
 * #10). Flags create rows whose scope + campaign name match a rule created
 * by a past CSV import task, so the editor can skip them instead of
 * double-importing. Never silently dedupes: flagged rows default to skip in
 * the review step and surface as SKIPPED in the task results + export.
 *
 * Production note: the real backend should make imports idempotent (task
 * idempotency key or resume-on-retry); this prototype only demonstrates the
 * editor-facing guardrail.
 */
export function flagReImports(
  rows: CsvRow[],
  issues: RowIssue[],
  importedScopes: { scopeKey: string; ruleId: string }[]
): RowIssue[] {
  const blockedRows = new Set(issues.filter((i) => i.verdict === "BLOCKED").map((i) => i.inputRow));
  const byKey = new Map(importedScopes.map((s) => [s.scopeKey, s.ruleId]));
  const out = [...issues];
  for (const row of rows) {
    if (blockedRows.has(row.inputRow)) continue; // already blocked, don't double-flag
    const c = row.cells;
    const split = (v: string) => (!v || v.toUpperCase() === ALL ? [] : v.split(";").map((s) => s.trim()).filter(Boolean));
    const key = [
      split(c.market).join("|"),
      split(c.category).join("|"),
      split(c.product_id).join("|"),
      split(c.grade).join("|"),
      split(c.brand).join("|"),
      split(c.offer_type).join("|"),
      split(c.seller_id).join("|"),
      c.campaign_name ?? "",
    ].join("·");
    const match = byKey.get(key);
    if (match)
      out.push({
        inputRow: row.inputRow,
        verdict: "DUPLICATE",
        message: `Possible duplicate — this row matches ${match} from a previous import (re-import?).`,
        relatedRuleId: match,
      });
  }
  return out;
}

/** Scope key for a created rule, matching flagReImports' row key format. */
export function importedScopeKey(rule: Step3Rule): string {
  return [
    rule.market,
    rule.category ?? "",
    rule.product_id ?? "",
    rule.grade ?? "",
    rule.brand ?? "",
    rule.offer_type !== null ? OFFER_TYPES.find((o) => o.code === rule.offer_type)?.label ?? "" : "",
    rule.seller_ids[0] ?? "",
    rule.name,
  ].join("·");
}

const ALL = "ALL";

function parseScope(v: string): string[] {
  const t = v.trim();
  return !t || t.toUpperCase() === ALL ? [] : t.split(";").map((s) => s.trim()).filter(Boolean);
}

function validDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());
}

/**
 * Validate create rows. Empty/ALL scope = all values for that dimension (same
 * convention as the drawer). Multi-values are ;-separated (fan-out, like the
 * create form's multi-selects). Mirrors CreateRulePanel's checks.
 */
export function validateCreateRows(rows: CsvRow[]): RowIssue[] {
  const issues: RowIssue[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const c = row.cells;
    const push = (verdict: RowVerdict, message: string) => issues.push({ inputRow: row.inputRow, verdict, message });

    if (!c.campaign_name) push("BLOCKED", "Campaign name is required.");
    const markets = parseScope(c.market);
    const unknownMarkets = markets.filter((m) => !MARKETS.includes(m as Market));
    if (unknownMarkets.length) push("BLOCKED", `Unknown market${unknownMarkets.length === 1 ? "" : "s"}: ${unknownMarkets.join(", ")}.`);
    const categories = parseScope(c.category);
    const unknownCats = categories.filter((x) => !CATEGORIES.includes(x as (typeof CATEGORIES)[number]));
    if (unknownCats.length) push("BLOCKED", `Unknown categor${unknownCats.length === 1 ? "y" : "ies"}: ${unknownCats.join(", ")}.`);
    if (c.product_id && categories.length) push("BLOCKED", "Category and product_id can't both be set on one row (a product already belongs to one category).");
    const grades = parseScope(c.grade);
    const unknownGrades = grades.filter((g) => !GRADES.includes(g as (typeof GRADES)[number]));
    if (unknownGrades.length) push("BLOCKED", `Unknown grade${unknownGrades.length === 1 ? "" : "s"}: ${unknownGrades.join(", ")}.`);
    const brands = parseScope(c.brand);
    const unknownBrands = brands.filter((b) => !BRANDS.includes(b as (typeof BRANDS)[number]));
    if (unknownBrands.length) push("BLOCKED", `Unknown brand${unknownBrands.length === 1 ? "" : "s"}: ${unknownBrands.join(", ")}.`);
    const offerTypes = parseScope(c.offer_type);
    const unknownOffers = offerTypes.filter((o) => !OFFER_TYPES.some((ot) => ot.label === o));
    if (unknownOffers.length) push("BLOCKED", `Unknown offer type${unknownOffers.length === 1 ? "" : "s"}: ${unknownOffers.join(", ")}.`);
    const sellers = parseScope(c.seller_id);
    const unknownSellers = sellers.filter((s) => !SELLER_POOL.includes(s));
    if (unknownSellers.length) push("WARNING", `Seller${unknownSellers.length === 1 ? "" : "s"} not in the known pool: ${unknownSellers.join(", ")}.`);

    const products = parseScope(c.product_id);
    const unknownProducts = products.filter((p) => !isKnownProductId(p));
    if (unknownProducts.length) push("BLOCKED", `Unknown product ID${unknownProducts.length === 1 ? "" : "s"}: ${unknownProducts.join(", ")}.`);

    const rate = c.commission_rate;
    const rateNum = rate === "" ? NaN : Number(rate);
    if (rate === "" || Number.isNaN(rateNum) || rateNum < 0 || rateNum > 99.99)
      push("BLOCKED", "commission_rate must be a number between 0 and 99.99.");
    else if (rateNum < RATE_MIN || rateNum > RATE_MAX)
      push("WARNING", `Rate ${rateNum}% is outside the standard ${RATE_MIN}–${RATE_MAX}% band.`);

    if (c.start_date && !validDate(c.start_date)) push("BLOCKED", `start_date "${c.start_date}" must be yyyy-mm-dd.`);
    if (c.end_date && !validDate(c.end_date)) push("BLOCKED", `end_date "${c.end_date}" must be yyyy-mm-dd.`);
    if (c.start_date && c.end_date && validDate(c.start_date) && validDate(c.end_date) && c.end_date < c.start_date)
      push("BLOCKED", "end_date is before start_date.");

    // Duplicate-row check within the file (same scope key) — interrupted/repeated imports.
    const key = [markets.join("|"), categories.join("|"), products.join("|"), grades.join("|"), brands.join("|"), offerTypes.join("|"), sellers.join("|")].join("·");
    if (seen.has(key)) push("BLOCKED", "Duplicate of an earlier row in this file (same scope).");
    seen.add(key);
  }
  return issues;
}

/** Validate update rows: rule_id must exist; only the Step-2-updatable fields. */
export function validateUpdateRows(rows: CsvRow[], rules: Step1Rule[]): RowIssue[] {
  const issues: RowIssue[] = [];
  const ids = new Set(rules.map((r) => r.id));
  for (const row of rows) {
    const c = row.cells;
    const push = (verdict: RowVerdict, message: string) => issues.push({ inputRow: row.inputRow, verdict, message });
    if (!c.rule_id) { push("BLOCKED", "rule_id is required for updates."); continue; }
    if (!ids.has(c.rule_id)) { push("BLOCKED", `Rule ${c.rule_id} doesn't exist.`); continue; }
    if (!c.campaign_name && !c.commission_rate && !c.start_date && !c.end_date)
      push("BLOCKED", "Nothing to update — set at least one of campaign_name, commission_rate, start_date, end_date.");
    if (c.commission_rate) {
      const n = Number(c.commission_rate);
      if (Number.isNaN(n) || n < 0 || n > 99.99) push("BLOCKED", "commission_rate must be a number between 0 and 99.99.");
      else if (n < RATE_MIN || n > RATE_MAX) push("WARNING", `Rate ${n}% is outside the standard ${RATE_MIN}–${RATE_MAX}% band.`);
    }
    if (c.start_date && !validDate(c.start_date)) push("BLOCKED", `start_date "${c.start_date}" must be yyyy-mm-dd.`);
    if (c.end_date && !validDate(c.end_date)) push("BLOCKED", `end_date "${c.end_date}" must be yyyy-mm-dd.`);
  }
  return issues;
}

// ── Conflict review (create mode) ───────────────────────────────────────────

export interface CandidateRow {
  inputRow: number;
  markets: Market[]; // empty = all markets (fan-out at build time)
  categories: string[];
  productIds: string[];
  grades: string[];
  brands: string[];
  offerTypes: string[];
  sellerIds: string[];
  campaignName: string;
  rate: number;
  startDate: string | null;
  endDate: string | null;
}

/** Reuse the Step 3 engine's classification per fanned-out scope. */
export function classifyCandidate(
  cand: CandidateRow,
  existing: Step1Rule[]
): { result: "CREATED" | "OVERLAP" | "STRICT_CONFLICT"; relatedRuleId?: string; scopeLabel: string } {
  // Build the same Scope shape the engine's classifyScope expects. We classify
  // one representative scope per row (first value of each dimension, ALL→null)
  // — enough to flag conflicts in the prototype review step.
  const scope = {
    market: (cand.markets[0] ?? "FR") as Market,
    category: cand.categories[0] ?? null,
    product_id: cand.productIds[0] ?? null,
    seller_targeting: cand.sellerIds.length ? ("KEY_SELLERS" as const) : ("ALL" as const),
    seller_ids: cand.sellerIds.slice(0, 1),
  };
  const live = existing.filter((r) => r.status !== "ARCHIVED");
  const strict = live.find(
    (r) =>
      r.market === scope.market &&
      (r.category ?? null) === scope.category &&
      (r.product_id ?? null) === scope.product_id &&
      (r.seller_targeting === "ALL" ? "ALL" : r.seller_ids[0]) ===
        (scope.seller_targeting === "ALL" ? "ALL" : scope.seller_ids[0])
  );
  const label = [
    scope.market,
    scope.category ?? "All categories",
    scope.product_id ?? "",
    cand.brands.length ? `Brand: ${cand.brands.join(", ")}` : "",
    cand.grades.length ? `Grade: ${cand.grades.join(", ")}` : "",
    scope.seller_targeting === "ALL" ? "All sellers" : scope.seller_ids[0],
  ]
    .filter(Boolean)
    .join(" · ");
  if (strict)
    return { result: "STRICT_CONFLICT", relatedRuleId: strict.id, scopeLabel: label };
  const broader = live.find(
    (r) =>
      r.market === scope.market &&
      r.category === null &&
      r.product_id === null &&
      (scope.category !== null || scope.product_id !== null) &&
      r.seller_targeting === "ALL"
  );
  if (broader) return { result: "OVERLAP", relatedRuleId: broader.id, scopeLabel: label };
  return { result: "CREATED", scopeLabel: label };
}

// ── Export serialization ────────────────────────────────────────────────────

const EXPORT_COLUMNS = [
  "rule_id", "campaign_name", "status", "state", "market", "category", "product_id",
  "seller_id", "grade", "brand", "offer_type", "commission_rate", "start_date",
  "end_date", "priority", "created_at", "updated_at", "marketplace",
] as const;

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function scopeOrAll(values: string[] | string | null | undefined, allLabel = "ALL"): string {
  const arr = Array.isArray(values) ? values : values ? [values] : [];
  return arr.length ? arr.join(";") : allLabel;
}

function marketplaceOf(market: string): string {
  if (market === "US") return "US";
  if (market === "JP") return "AP";
  return "EU";
}

function offerTypeLabelFor(rule: Step3Rule): string {
  const ot = OFFER_TYPES.find((o) => o.code === rule.offer_type);
  return ot ? ot.label : "ALL";
}

/** Export the filtered rule set → CSV string (PRD column order). */
export function rulesToCsv(rules: Step3Rule[]): string {
  const lines = rules.map((r) =>
    [
      r.id,
      r.name,
      r.status,
      r.state,
      r.market,
      scopeOrAll(r.category ? [r.category] : []),
      scopeOrAll(r.product_id),
      scopeOrAll(r.seller_ids),
      scopeOrAll(r.grade),
      scopeOrAll(r.brand),
      offerTypeLabelFor(r),
      r.commission_rate.toFixed(2),
      r.start_date ?? "ALL",
      r.end_date ?? "ALL",
      r.priority,
      r.created_at,
      // PRD flags updated_at as "can we do that?" — the mock data model has no
      // updated_at, so we fall back to created_at and note it in the column.
      r.created_at,
      marketplaceOf(r.market),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  return [EXPORT_COLUMNS.join(","), ...lines].join("\n");
}

/** PRD filename: smartco-rules-{date}-{status}.csv. */
export function exportFileName(statusFilter: string[]): string {
  const date = new Date().toISOString().slice(0, 10);
  const status =
    statusFilter.length === 1 ? statusFilter[0].toLowerCase() : statusFilter.length === 0 ? "all" : "mixed";
  return `smartco-rules-${date}-${status}.csv`;
}

export interface TaskResultExportRow {
  inputRow: number;
  scope: string;
  result: string;
  message: string;
  ruleId: string;
}

/** Export a task's results → CSV string (PRD: all outcomes + input row + task meta). */
export function taskResultsToCsv(
  task: { id: string; submittedAt: string; items: { inputRow?: number; scope: string; result: string; message: string; ruleId: string }[] }
): string {
  const cols = ["task_id", "submitted_at", "input_row", "scope", "result", "rule_id", "message"];
  const lines = task.items.map((it) =>
    [task.id, task.submittedAt, it.inputRow ?? "—", it.scope, it.result, it.ruleId, it.message]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );
  return [cols.join(","), ...lines].join("\n");
}

/** Trigger a client-side download of a CSV string. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

