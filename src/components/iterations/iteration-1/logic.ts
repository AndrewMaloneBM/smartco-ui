import { isSellerSpecific, type CommissionRule } from "@/lib/types";

/**
 * Step 1 extends Adri's single `category` with an optional `categories` array so a
 * rule can scope to several categories. `categories` (when present) is the source
 * of truth; otherwise we fall back to the single `category`. Adri's type is
 * read-only, so this augments it locally.
 */
export type Step1Rule = CommissionRule & { categories?: string[] };

/** Normalised category scope: `categories` if set, else the single `category`, else [] (all). */
export function ruleCategories(rule: Step1Rule): string[] {
  if (rule.categories && rule.categories.length) return rule.categories;
  return rule.category ? [rule.category] : [];
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

function fieldValue(rule: CommissionRule, field: SortField): number {
  // Priority (PRD): seller-specific rules always outrank all-sellers rules.
  if (field === "priority") return isSellerSpecific(rule) ? 1 : 0;
  const iso =
    field === "created_at"
      ? rule.created_at
      : field === "start_date"
      ? rule.start_date
      : rule.end_date;
  // null dates sort last regardless of direction-friendliness; use 0 as the floor.
  return iso ? new Date(iso).getTime() : 0;
}

export function sortRules<T extends CommissionRule>(
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
