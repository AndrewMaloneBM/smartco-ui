import type { CommissionRule } from "@/lib/types";
import type { Step1Rule } from "./logic";

/**
 * Step 1 demo dataset — lives here (not in Adri's read-only `src/lib/mock-data.ts`).
 *
 * Curated to exercise the read view: a mix of seller-specific (KEY_SELLERS) and
 * all-sellers rules so the Priority column shows both values (seller-specific
 * outranks all sellers), real end dates, readable refurbisher seller names, a few
 * INACTIVE rules, and two out-of-band commission rates to trigger the 2–20% soft
 * warning.
 *
 * Default filter is State = ACTIVE (per PRD), so the INACTIVE rules appear only
 * when you switch the State filter.
 */
const BASE = {
  created_by: "demo.user@example.com",
  conflicts: [] as string[],
  orderlines_30d: null,
  gmv_30d: null,
} satisfies Partial<CommissionRule>;

const CURATED: Step1Rule[] = [
  // ── Active ───────────────────────────────────────────────────────────────
  {
    ...BASE,
    id: "RULE-2041",
    name: "iPhone 15 Pro — FR launch",
    market: "FR",
    category: "Smartphones",
    product_id: "iPhone15Pro-256",
    grade: "GOOD",
    battery_type: null,
    seller_targeting: "KEY_SELLERS",
    seller_ids: ["TechReborn"],
    commission_rate: 6.5,
    start_date: "2026-01-15",
    end_date: "2026-09-30",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-01-12T09:24:00Z",
  }, // priority 16
  {
    ...BASE,
    id: "RULE-2055",
    name: "Galaxy S24 — DE deal",
    market: "DE",
    category: "Smartphones",
    product_id: "GalaxyS24-128",
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 7.0,
    start_date: "2026-02-01",
    end_date: "2026-08-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-01-28T14:02:00Z",
  }, // priority 15
  {
    ...BASE,
    id: "RULE-2070",
    name: "MacBook bulk rate — GB",
    market: "GB",
    category: null,
    product_id: "MBA-M3-13",
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 9.0,
    start_date: "2026-03-01",
    end_date: null,
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-02-20T11:15:00Z",
  }, // priority 13
  {
    ...BASE,
    id: "RULE-2068",
    name: "Premium audio — FR",
    market: "FR",
    category: "Audio",
    product_id: null,
    grade: "EXCELLENT",
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 5.5,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2025-12-18T16:40:00Z",
  }, // priority 12
  {
    ...BASE,
    id: "RULE-2072",
    name: "Tablets push — ES",
    market: "ES",
    category: "Tablets",
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 8.0,
    start_date: "2026-04-01",
    end_date: "2026-10-15",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-03-22T08:05:00Z",
  }, // priority 11
  {
    ...BASE,
    id: "RULE-2160",
    name: "Key-seller bundle — DE",
    market: "DE",
    category: "Smartphones",
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "KEY_SELLERS",
    seller_ids: ["TechReborn", "GadgetLoop", "PhoenixPhones"],
    commission_rate: 7.0,
    start_date: "2026-02-10",
    end_date: "2026-09-15",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-02-06T13:30:00Z",
  }, // priority 11 (shows "3 sellers")
  {
    ...BASE,
    id: "RULE-2080",
    name: "Key-seller boost — IT",
    market: "IT",
    category: null,
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "KEY_SELLERS",
    seller_ids: ["PixelPerfect Refurb"],
    commission_rate: 4.5,
    start_date: "2026-02-15",
    end_date: null,
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-02-11T10:48:00Z",
  }, // priority 9
  {
    ...BASE,
    id: "RULE-2090",
    name: "AirPods Pro — DE",
    market: "DE",
    category: "Audio",
    product_id: "AirPodsPro2",
    grade: "GOOD",
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 10.0,
    start_date: "2026-03-10",
    end_date: "2026-07-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-03-05T09:00:00Z",
  }, // priority 8
  {
    ...BASE,
    id: "RULE-2095",
    name: "iPad Air — GB",
    market: "GB",
    category: "Tablets",
    product_id: "iPadAir-2025",
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 11.5,
    start_date: "2026-01-20",
    end_date: "2026-09-30",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-01-16T15:12:00Z",
  }, // priority 7
  {
    ...BASE,
    id: "RULE-2101",
    name: "Smartphone batteries — FR",
    market: "FR",
    category: "Smartphones",
    product_id: null,
    grade: "FAIR",
    battery_type: "New Battery",
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 12.0,
    start_date: "2026-02-01",
    end_date: "2026-11-30",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-01-29T12:20:00Z",
  }, // priority 5
  {
    ...BASE,
    id: "RULE-2110",
    name: "Laptops (Excellent) — NL",
    market: "NL",
    category: "Laptops",
    product_id: null,
    grade: "EXCELLENT",
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 13.0,
    start_date: "2026-03-01",
    end_date: null,
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-02-24T17:05:00Z",
  }, // priority 4
  {
    ...BASE,
    id: "RULE-2120",
    name: "Accessories — US",
    market: "US",
    category: "Accessories",
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 14.0,
    start_date: "2026-01-05",
    end_date: "2026-12-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-01-02T08:30:00Z",
  }, // priority 3
  {
    ...BASE,
    id: "RULE-2122",
    name: "Seasonal clearance — PT",
    market: "PT",
    category: "Audio",
    categories: ["Audio", "Accessories"],
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 1.5, // below 2% → soft warning
    start_date: null, // "All time"
    end_date: null, // "No expiry"
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-04-09T10:10:00Z",
  }, // priority 3, out-of-range
  {
    ...BASE,
    id: "RULE-2150",
    name: "Overstock clearance — US",
    market: "US",
    category: "Accessories",
    categories: ["Accessories", "Audio", "Tablets"],
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 22.0, // above 20% → soft warning
    start_date: "2026-05-01",
    end_date: "2026-08-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2026-04-27T14:55:00Z",
  }, // priority 3, out-of-range
  {
    ...BASE,
    id: "RULE-2130",
    name: "Flat marketplace rate — BE",
    market: "BE",
    category: null,
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 15.0,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: "2025-12-15T09:00:00Z",
  }, // priority 1
  // ── Inactive (hidden until the State filter is changed) ───────────────────
  {
    ...BASE,
    id: "RULE-2140",
    name: "Winter sale — DE",
    market: "DE",
    category: "Smartphones",
    categories: ["Smartphones", "Tablets", "Laptops"],
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 7.5,
    start_date: "2025-11-01",
    end_date: "2026-02-28", // expired → inactive
    state: "INACTIVE",
    status: "VALIDATED",
    created_at: "2025-10-22T11:00:00Z",
  }, // priority 11
  {
    ...BASE,
    id: "RULE-2142",
    name: "Q3 tablets (draft) — GB",
    market: "GB",
    category: "Tablets",
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 6.0,
    start_date: "2026-07-01", // not started yet → inactive
    end_date: "2026-12-31",
    state: "INACTIVE",
    status: "DRAFT",
    created_at: "2026-06-18T16:25:00Z",
  }, // priority 11
  {
    ...BASE,
    id: "RULE-2141",
    name: "Spring promo — FR",
    market: "FR",
    category: "Audio",
    product_id: null,
    grade: "GOOD",
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: 8.0,
    start_date: "2026-03-01",
    end_date: "2026-05-31", // expired → inactive
    state: "INACTIVE",
    status: "ARCHIVED",
    created_at: "2026-02-24T10:40:00Z",
  }, // priority 4
];

// Generated filler so the table exceeds one page (25/page) and pagination is
// demonstrable. All ALL-sellers + ACTIVE (keeps the curated 3 seller-specific
// rules intact), with varied markets, categories, rates and dates. Deterministic
// (index-based) so the render is stable. Created in 2025 so the curated 2026
// "hero" rows sort to the top under the default Created-desc order.
const GEN_MARKETS = ["FR", "DE", "GB", "ES", "IT", "NL", "BE", "US", "PT", "JP"];
const GEN_CATS: (string[] | null)[] = [
  ["Smartphones"],
  ["Laptops"],
  ["Tablets"],
  ["Accessories"],
  ["Audio"],
  ["Smartphones", "Tablets"],
  ["Audio", "Accessories"],
  null, // all categories
];
const GEN_NAMES = [
  "Seasonal promo",
  "Volume discount",
  "Trade-in boost",
  "Refurb push",
  "Margin campaign",
  "Category deal",
  "Loyalty rate",
  "Clearance",
];
const pad = (n: number) => String(n).padStart(2, "0");

const GENERATED: Step1Rule[] = Array.from({ length: 45 }, (_, i) => {
  const market = GEN_MARKETS[i % GEN_MARKETS.length];
  const cats = GEN_CATS[i % GEN_CATS.length];
  const rate = 4 + (i % 13) + (i % 2) * 0.5; // 4–16.5, inside the 2–20% band
  const createdMonth = (i % 12) + 1;
  const createdDay = ((i * 3) % 27) + 1;
  const endsSoon = i % 3 === 0;
  return {
    ...BASE,
    id: `RULE-4${pad(i)}`,
    name: `${GEN_NAMES[i % GEN_NAMES.length]} — ${market}`,
    market: market as Step1Rule["market"],
    category: cats?.[0] ?? null,
    categories: cats && cats.length > 1 ? cats : undefined,
    product_id: null,
    grade: null,
    battery_type: null,
    seller_targeting: "ALL",
    seller_ids: [],
    commission_rate: rate,
    start_date: `2025-${pad(createdMonth)}-01`,
    end_date: endsSoon ? null : "2026-12-31",
    state: "ACTIVE",
    status: "VALIDATED",
    created_at: `2025-${pad(createdMonth)}-${pad(createdDay)}T09:00:00Z`,
  };
});

export const STEP1_RULES: Step1Rule[] = [...CURATED, ...GENERATED];
