import type { CommissionRule } from "@/lib/types";

/**
 * `Step1Rule` extends Adri's read-only `CommissionRule` with `priority` — a
 * number the real backend computes and returns, the same way it already returns
 * `orderlines_30d` / `gmv_30d`. We never derive it ourselves: the scoring logic
 * lives in the backend, not here. Values in the mock dataset are plausible demo
 * numbers only, not a reproduction of the real algorithm.
 */
export type Step1Rule = CommissionRule & { priority: number };

/** Normalised category scope: the rule's single category, or [] (all). */
export function ruleCategories(rule: Step1Rule): string[] {
  return rule.category ? [rule.category] : [];
}

/**
 * Display colour for a priority number — bucketed into a few bands (not a precise
 * mapping to specific values, since we don't know or reproduce the backend's real
 * scoring breakpoints). Purely presentational.
 */
export function priorityColor(score: number): { bg: string; fg: string } {
  if (score >= 1250) return { bg: "hsl(2, 100%, 85%)", fg: "hsl(350, 91%, 29%)" };
  if (score >= 1000) return { bg: "hsl(3, 100%, 92%)", fg: "hsl(355, 90%, 60%)" };
  if (score >= 750) return { bg: "hsl(39, 70%, 69%)", fg: "hsl(42, 98%, 19%)" };
  if (score >= 500) return { bg: "hsl(38, 90%, 84%)", fg: "hsl(39, 48%, 43%)" };
  if (score >= 250) return { bg: "hsl(219, 65%, 82%)", fg: "hsl(219, 35%, 31%)" };
  return { bg: "hsl(221, 86%, 92%)", fg: "hsl(218, 26%, 55%)" };
}

/** Arbitrary demo priority (0–1400), derived from the rule id — display filler
 * only. The real value is computed and returned by the backend; we don't reproduce
 * that logic here, same as we don't reproduce how orderlines_30d/gmv_30d are computed. */
export function demoPriority(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) | 0;
  hash = hash >>> 0;
  // IDs like RULE-400 vs RULE-401 differ by one trailing digit, so a plain
  // polynomial hash clusters them together. Bit-mix (Murmur-style finalizer) so
  // near-identical IDs still spread across the full range and every colour band
  // in priorityColor shows up somewhere in the demo dataset.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b);
  hash ^= hash >>> 16;
  // Math.imul returns a signed 32-bit int, so hash can be negative here — force
  // unsigned before the modulo or the result (and the displayed priority) goes negative.
  return (hash >>> 0) % 1400;
}

/** State filter replaces the old Active/Inactive tabs (per Roberto's revision). */
export type StateFilter = "ACTIVE" | "INACTIVE" | "ALL";

/** Sortable columns. Default ordering is Created desc (most recent first). */
export type SortField = "priority" | "created_at" | "start_date" | "end_date";
export type SortDir = "asc" | "desc";

export type IterationFilters = {
  market: string[]; // empty = all markets
  category: string[]; // empty = all categories
  product: string; // free-text substring on product_id
  seller: string; // free-text substring on seller_ids
  state: string[]; // empty = all states; default ["ACTIVE"]
  search: string;
};

export const DEFAULT_FILTERS: IterationFilters = {
  market: [],
  category: [],
  product: "",
  seller: "",
  state: ["ACTIVE"],
  search: "",
};

export const DEFAULT_SORT: { field: SortField; dir: SortDir } = {
  field: "created_at",
  dir: "desc",
};

/** Distinct, sorted seller IDs across the dataset (for the Seller ID filter). */
export function sellerOptions(rules: CommissionRule[]): string[] {
  const set = new Set<string>();
  for (const r of rules) for (const id of r.seller_ids) set.add(id);
  return [...set].sort();
}

/** Distinct, sorted product IDs across the dataset (for the Product ID filter). */
export function productOptions(rules: CommissionRule[]): string[] {
  const set = new Set<string>();
  for (const r of rules) if (r.product_id) set.add(r.product_id);
  return [...set].sort();
}

export function filterRules(
  rules: Step1Rule[],
  f: IterationFilters
): Step1Rule[] {
  const q = f.search.trim().toLowerCase();
  const product = f.product.trim().toLowerCase();
  const seller = f.seller.trim().toLowerCase();
  return rules.filter((r) => {
    if (f.market.length && !f.market.includes(r.market)) return false;
    if (
      f.category.length &&
      !ruleCategories(r).some((c) => f.category.includes(c))
    )
      return false;
    if (product && !(r.product_id ?? "").toLowerCase().includes(product))
      return false;
    if (seller && !r.seller_ids.some((id) => id.toLowerCase().includes(seller)))
      return false;
    if (f.state.length && !f.state.includes(r.state)) return false;
    if (q && !`${r.id} ${r.name}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function fieldValue(rule: Step1Rule, field: SortField): number {
  if (field === "priority") return rule.priority;
  const iso =
    field === "created_at"
      ? rule.created_at
      : field === "start_date"
      ? rule.start_date
      : rule.end_date;
  // null dates sort last regardless of direction-friendliness; use 0 as the floor.
  return iso ? new Date(iso).getTime() : 0;
}

export function sortRules<T extends Step1Rule>(
  rules: T[],
  field: SortField,
  dir: SortDir
): T[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...rules].sort((a, b) => {
    const diff = (fieldValue(a, field) - fieldValue(b, field)) * mult;
    if (diff !== 0) return diff;
    // Stable tiebreak: most recently created first (matches the default ordering).
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
