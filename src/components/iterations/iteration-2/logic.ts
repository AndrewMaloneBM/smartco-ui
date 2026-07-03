import type { RuleStatus } from "@/lib/types";
import type { Step1Rule } from "../iteration-1/logic";
import { ruleCategories } from "../iteration-1/logic";

/**
 * Step 2 filters. Step 1 filtered on the computed State (ACTIVE / INACTIVE); Step 2
 * adds the new lifecycle Status dimension (PRD: State is automatic from dates,
 * Status is the manual lifecycle field — ARCHIVED in this step). The two are
 * independent filters, so we keep our own filter type rather than reusing Step 1's.
 */
export type Step2Filters = {
  market: string[]; // empty = all markets
  category: string[]; // empty = all categories
  product: string; // free-text substring on product_id
  seller: string; // free-text substring on seller_ids
  state: string[]; // empty = all states
  /** Lifecycle status. "ACTIVE" is our label for "not archived" (status != ARCHIVED). */
  status: ("ACTIVE" | RuleStatus)[];
  search: string;
};

/**
 * Default view hides archived rules (status filter = not-archived). Unlike Step 1,
 * both states show by default — the seed data's Inactive rows (expired / not yet
 * started) are a dev/reviewer reference for how the State tag looks when off, so
 * they shouldn't require changing a filter to find. Archived rules still only
 * surface when the user explicitly adds Archived to the Status filter.
 */
export const DEFAULT_FILTERS: Step2Filters = {
  market: [],
  category: [],
  product: "",
  seller: "",
  state: ["ACTIVE", "INACTIVE"],
  status: ["ACTIVE"],
  search: "",
};

export const STATUS_FILTER_OPTIONS: ("ACTIVE" | "ARCHIVED")[] = [
  "ACTIVE",
  "ARCHIVED",
];

/** Maps a rule onto the filter's status vocabulary (not-archived → "ACTIVE"). */
function statusFilterValue(r: Step1Rule): "ACTIVE" | RuleStatus {
  return r.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
}

export function filterRules(rules: Step1Rule[], f: Step2Filters): Step1Rule[] {
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
    if (f.status.length && !f.status.includes(statusFilterValue(r)))
      return false;
    if (q && !`${r.id} ${r.name}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export { sortRules, ruleCategories } from "../iteration-1/logic";
export type { SortField, SortDir } from "../iteration-1/logic";
export { DEFAULT_SORT } from "../iteration-1/logic";
