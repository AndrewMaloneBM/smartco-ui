export type Market =
  | "FR"
  | "DE"
  | "GB"
  | "US"
  | "ES"
  | "IT"
  | "NL"
  | "BE"
  | "PT"
  | "JP";

export type Grade =
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "PREMIUM"
  | "STALLION";

export type BatteryType = "Standard" | "New Battery";

export type SellerTargeting = "ALL" | "KEY_SELLERS";

export type RuleState = "ACTIVE" | "INACTIVE";

export type RuleStatus = "DRAFT" | "VALIDATED" | "PAUSED" | "ARCHIVED";

export type CommissionRule = {
  id: string; // e.g. "RULE-1042"
  name: string;
  market: Market;
  category: string | null; // null = all categories
  product_id: string | null; // BMID — null = full category
  grade: Grade | null;
  battery_type: BatteryType | null;
  seller_targeting: SellerTargeting;
  seller_ids: string[]; // empty if ALL
  commission_rate: number; // percentage, e.g. 8.5
  start_date: string | null; // ISO date
  end_date: string | null; // ISO date
  state: RuleState; // computed: ACTIVE if validated + within date range
  status: RuleStatus;
  created_by: string; // user email
  created_at: string; // ISO timestamp
  conflicts: string[]; // array of conflicting rule IDs
  orderlines_30d: number | null; // null if not computed yet
  gmv_30d: number | null; // EUR, null if not computed yet
};

export const MARKETS: Market[] = [
  "FR",
  "DE",
  "GB",
  "US",
  "ES",
  "IT",
  "NL",
  "BE",
  "PT",
  "JP",
];

export const CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Accessories",
  "Audio",
] as const;

export const GRADES: Grade[] = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "PREMIUM",
  "STALLION",
];

export const BATTERY_TYPES: BatteryType[] = ["Standard", "New Battery"];

export const MARKET_FLAGS: Record<Market, string> = {
  FR: "🇫🇷",
  DE: "🇩🇪",
  GB: "🇬🇧",
  US: "🇺🇸",
  ES: "🇪🇸",
  IT: "🇮🇹",
  NL: "🇳🇱",
  BE: "🇧🇪",
  PT: "🇵🇹",
  JP: "🇯🇵",
};

export const RATE_MIN = 2;
export const RATE_MAX = 20;

/** A rule has "seller-specific" priority when it targets key sellers. */
export function isSellerSpecific(rule: CommissionRule): boolean {
  return rule.seller_targeting === "KEY_SELLERS";
}

/** Rule is outside the typical 2–20% band → flag amber. */
export function isRateOutOfRange(rate: number): boolean {
  return rate < RATE_MIN || rate > RATE_MAX;
}
