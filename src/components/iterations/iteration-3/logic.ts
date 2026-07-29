import type { Grade, RuleStatus } from "@/lib/types";
import type { Step1Rule } from "../iteration-1/logic";
import { ruleCategories } from "../iteration-1/logic";

/**
 * Step 2 filters. Step 1 filtered on the computed State (ACTIVE / INACTIVE); Step 2
 * adds the new lifecycle Status dimension (PRD: State is automatic from dates,
 * Status is the manual lifecycle field — ARCHIVED in this step). The two are
 * independent filters, so we keep our own filter type rather than reusing Step 1's.
 * Step 3 adds Grade (multiselect), Offer type (single-select), and Brand
 * (multiselect, per PRD update Jul 29 2026 — confirmed for inclusion, values
 * still TBC from product).
 */
export type Step3Filters = {
  market: string[]; // empty = all markets
  category: string[]; // empty = all categories
  product: string; // free-text substring on product_id
  seller: string; // free-text substring on seller_ids
  state: string[]; // empty = all states
  /** Lifecycle status. "ACTIVE" is our label for "not archived" (status != ARCHIVED). */
  status: ("ACTIVE" | RuleStatus)[];
  grade: Grade[]; // empty = all grades
  offerType: OfferTypeCode[]; // empty = all offer types; UI enforces at most one
  brand: Brand[]; // empty = all brands
  search: string;
};

/**
 * Both State values and both Status filter buckets show by default — the seed
 * data's Inactive rows and its one example of each Status (Validated, Archived,
 * Draft, Paused) are a dev/reviewer reference for how those tags look, so they
 * shouldn't require changing a filter to find.
 */
export const DEFAULT_FILTERS: Step3Filters = {
  market: [],
  category: [],
  product: "",
  seller: "",
  state: ["ACTIVE", "INACTIVE"],
  status: ["ACTIVE", "ARCHIVED"],
  grade: [],
  offerType: [],
  brand: [],
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

export function filterRules<T extends Step3Rule>(rules: T[], f: Step3Filters): T[] {
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
    // Same convention as Category/Product ID: a null (applies-to-all) rule
    // doesn't match a specific-value filter selection.
    if (f.grade.length && !(r.grade !== null && f.grade.includes(r.grade)))
      return false;
    if (
      f.offerType.length &&
      !(r.offer_type !== null && f.offerType.includes(r.offer_type))
    )
      return false;
    if (f.brand.length && !(r.brand !== null && f.brand.includes(r.brand)))
      return false;
    if (q && !`${r.id} ${r.name}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export { sortRules, ruleCategories } from "../iteration-1/logic";
export type { SortField, SortDir } from "../iteration-1/logic";
export { DEFAULT_SORT } from "../iteration-1/logic";

/**
 * Step 3 PRD: Grade and Offer type are optional, additive rule-scope
 * dimensions (null = applies to all values for that dimension, same as an
 * unset Category or Product ID).
 *
 * Grade already exists on Adri's `CommissionRule` (`grade: Grade | null`,
 * imported from `@/lib/types` — not redefined here) with exactly the 5 values
 * the PRD's data-model table lists (incl. STALLION); it's just never been
 * surfaced in a Step 1/2 UI. Offer type is genuinely new: Adri's type has an
 * old `battery_type` field the PRD explicitly retires ("there is no
 * battery_type field on a listing"). `offer_type` replaces it — the field OMS
 * actually sends, confirmed to include 10=Outlet (Andrew, Jul 28 2026).
 */
export type OfferTypeCode = 0 | 5 | 7 | 9 | 10;
export const OFFER_TYPES: { code: OfferTypeCode; label: string }[] = [
  { code: 0, label: "Normal" },
  { code: 5, label: "SIS" },
  { code: 7, label: "New Battery" },
  { code: 9, label: "Battery 90-99%" },
  { code: 10, label: "Outlet" },
];

/** Look up an Offer type's display label by code. */
export function offerTypeLabel(code: OfferTypeCode): string {
  return OFFER_TYPES.find((o) => o.code === code)?.label ?? String(code);
}

/**
 * Brand — PRD-confirmed for inclusion (Jul 29 2026, Loren), but no value list
 * exists yet anywhere in the PRD or data model ("brand ? tbc"). PLACEHOLDER
 * values below (spanning the existing device categories) — swap for the real
 * list once product confirms it. Unlike Grade, Brand doesn't exist on Adri's
 * `CommissionRule` at all, so it's a new field, same as Offer type.
 */
export type Brand = "Apple" | "Samsung" | "Google" | "Xiaomi" | "Sony" | "Other";
export const BRANDS: Brand[] = ["Apple", "Samsung", "Google", "Xiaomi", "Sony", "Other"];

/** Step 3 rule: Step 1/2's rule shape (Grade included) plus the new Offer type / Brand fields. */
export type Step3Rule = Step1Rule & {
  offer_type: OfferTypeCode | null;
  brand: Brand | null;
};
