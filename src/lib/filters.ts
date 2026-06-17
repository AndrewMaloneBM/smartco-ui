import { CommissionRule, RuleStatus } from "./types";

export type Filters = {
  markets: string[];
  categories: string[];
  sellerTargeting: "ANY" | "ALL" | "KEY_SELLERS";
  state: "ANY" | "ACTIVE" | "INACTIVE";
  status: "ANY" | RuleStatus;
  conflicts: "ANY" | "WITH" | "WITHOUT";
  applied: "ANY" | "HAS_ORDERS" | "NO_ORDERS";
  search: string;
};

export const EMPTY_FILTERS: Filters = {
  markets: [],
  categories: [],
  sellerTargeting: "ANY",
  state: "ANY",
  status: "ANY",
  conflicts: "ANY",
  applied: "ANY",
  search: "",
};

export function filterRules(
  rules: CommissionRule[],
  filters: Filters
): CommissionRule[] {
  const search = filters.search.trim().toLowerCase();
  return rules.filter((r) => {
    if (filters.markets.length && !filters.markets.includes(r.market))
      return false;
    if (
      filters.categories.length &&
      !filters.categories.includes(r.category ?? "All categories")
    )
      return false;
    if (
      filters.sellerTargeting !== "ANY" &&
      r.seller_targeting !== filters.sellerTargeting
    )
      return false;
    if (filters.state !== "ANY" && r.state !== filters.state) return false;
    if (filters.status !== "ANY" && r.status !== filters.status) return false;
    if (filters.conflicts === "WITH" && r.conflicts.length === 0) return false;
    if (filters.conflicts === "WITHOUT" && r.conflicts.length > 0) return false;
    if (filters.applied === "HAS_ORDERS" && !(r.orderlines_30d ?? 0))
      return false;
    if (filters.applied === "NO_ORDERS" && (r.orderlines_30d ?? 0) > 0)
      return false;
    if (search) {
      const hay = `${r.name} ${r.id}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

export function activeFilterCount(filters: Filters): number {
  let n = 0;
  if (filters.markets.length) n++;
  if (filters.categories.length) n++;
  if (filters.sellerTargeting !== "ANY") n++;
  if (filters.state !== "ANY") n++;
  if (filters.status !== "ANY") n++;
  if (filters.conflicts !== "ANY") n++;
  if (filters.applied !== "ANY") n++;
  if (filters.search.trim()) n++;
  return n;
}

export type Stats = {
  activeRules: number;
  withConflicts: number;
  deadWeight: number; // active rules w/ zero orders
  totalGmv30d: number;
};

export function computeStats(rules: CommissionRule[]): Stats {
  let activeRules = 0;
  let withConflicts = 0;
  let deadWeight = 0;
  let totalGmv30d = 0;
  const conflictSet = new Set<string>();

  for (const r of rules) {
    if (r.state === "ACTIVE") {
      activeRules++;
      totalGmv30d += r.gmv_30d ?? 0;
      if (!(r.orderlines_30d ?? 0)) deadWeight++;
    }
    if (r.conflicts.length > 0) conflictSet.add(r.id);
  }
  withConflicts = conflictSet.size;

  return { activeRules, withConflicts, deadWeight, totalGmv30d };
}
