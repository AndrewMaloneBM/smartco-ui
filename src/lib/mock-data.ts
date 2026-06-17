import {
  BatteryType,
  CommissionRule,
  Grade,
  Market,
  RuleStatus,
} from "./types";
import { scopeKey } from "./utils";

/** Deterministic PRNG (mulberry32) so SSR and client render identical data. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260615);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const chance = (p: number) => rng() < p;

const NOW = "2026-06-15T09:00:00Z";

const PRODUCTS: Record<string, string[]> = {
  Smartphones: ["iPhone13", "iPhone14", "iPhone15Pro", "GalaxyS23", "Pixel8"],
  Laptops: ["MacBookAir M2", "MacBookPro14", "DellXPS13", "ThinkPadX1"],
  Tablets: ["iPadAir", "iPad10", "GalaxyTabS9"],
  Accessories: ["MagSafeCharger", "AppleCase", "USBCcable"],
  Audio: ["AirPodsPro2", "AirPodsMax", "SonyWH1000", "GalaxyBuds"],
};

const EDITORS = [
  "adrien.moison@backmarket.com",
  "loren.bousquet@backmarket.com",
  "torrin.balsollier@backmarket.com",
  "cyprien.andres@backmarket.com",
  "qp-team@backmarket.com",
];

const MARKET_POOL: Market[] = ["FR", "DE", "GB", "US", "FR", "DE", "GB"];
const CATEGORY_POOL = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Accessories",
  "Audio",
];
const GRADES: Grade[] = ["EXCELLENT", "GOOD", "FAIR", "PREMIUM", "STALLION"];
const BATTERY: BatteryType[] = ["Standard", "New Battery"];

function randDate(startDay: number, spread: number): string {
  // produce a date in early 2026 deterministically
  const base = new Date("2026-01-01T00:00:00Z").getTime();
  const day = startDay + Math.floor(rng() * spread);
  return new Date(base + day * 86400000).toISOString().slice(0, 10);
}

function buildName(
  market: Market,
  category: string | null,
  product: string | null,
  grade: Grade | null,
  battery: BatteryType | null
): string {
  const parts = [product ?? category ?? "All products", market];
  if (grade) parts.push(grade);
  if (battery === "New Battery") parts.push("New Bat.");
  return parts.join(" — ");
}

type Seed = {
  market: Market;
  category: string | null;
  product_id: string | null;
  grade: Grade | null;
  battery_type: BatteryType | null;
  keySellers: boolean;
  status: RuleStatus;
  rate: number;
  noOrders: boolean;
};

function makeRule(seed: Seed, index: number): CommissionRule {
  const id = `RULE-${1000 + index}`;
  const created_by = pick(EDITORS);
  const created_at = `2026-${String(1 + (index % 5)).padStart(2, "0")}-${String(
    1 + (index % 27)
  ).padStart(2, "0")}T${String(8 + (index % 9)).padStart(2, "0")}:${String(
    (index * 7) % 60
  ).padStart(2, "0")}:00Z`;

  const start_date = chance(0.7) ? randDate(0, 120) : null;
  const end_date =
    start_date && chance(0.35)
      ? new Date(new Date(start_date).getTime() + 90 * 86400000)
          .toISOString()
          .slice(0, 10)
      : null;

  // state computed: ACTIVE iff VALIDATED + within date window
  let state: "ACTIVE" | "INACTIVE" = "INACTIVE";
  if (seed.status === "VALIDATED") {
    const today = NOW.slice(0, 10);
    const afterStart = !start_date || start_date <= today;
    const beforeEnd = !end_date || end_date >= today;
    state = afterStart && beforeEnd ? "ACTIVE" : "INACTIVE";
  }

  const hasOrders = !seed.noOrders;
  const orderlines_30d = hasOrders ? 20 + Math.floor(rng() * 1400) : 0;
  const gmv_30d = hasOrders
    ? Math.round((orderlines_30d * (45 + rng() * 220)) / 100) * 100
    : 0;

  const seller_ids = seed.keySellers
    ? Array.from(
        { length: 1 + Math.floor(rng() * 3) },
        () => `${100 + Math.floor(rng() * 9000)}EU`
      )
    : [];

  return {
    id,
    name: buildName(
      seed.market,
      seed.category,
      seed.product_id,
      seed.grade,
      seed.battery_type
    ),
    market: seed.market,
    category: seed.category,
    product_id: seed.product_id,
    grade: seed.grade,
    battery_type: seed.battery_type,
    seller_targeting: seed.keySellers ? "KEY_SELLERS" : "ALL",
    seller_ids,
    commission_rate: seed.rate,
    start_date,
    end_date,
    state,
    status: seed.status,
    created_by,
    created_at,
    conflicts: [],
    orderlines_30d,
    gmv_30d,
  };
}

function genSeed(): Seed {
  const market = pick(MARKET_POOL);
  const hasCategory = chance(0.92);
  const category = hasCategory ? pick(CATEGORY_POOL) : null;
  const hasProduct = category !== null && chance(0.4);
  const product_id =
    hasProduct && PRODUCTS[category!] ? pick(PRODUCTS[category!]) : null;
  const grade = chance(0.4) ? pick(GRADES) : null;
  const battery_type =
    (category === "Smartphones" || category === "Tablets") && chance(0.35)
      ? pick(BATTERY)
      : null;
  const keySellers = chance(0.3);

  // status distribution: mostly VALIDATED, some draft/paused/archived
  const r = rng();
  let status: RuleStatus = "VALIDATED";
  if (r < 0.12) status = "DRAFT";
  else if (r < 0.22) status = "PAUSED";
  else if (r < 0.32) status = "ARCHIVED";

  // ~77% with no orders, plus a few rate outliers
  const noOrders = chance(0.77);
  let rate = Math.round((5 + rng() * 12) * 10) / 10; // 5–17%
  const outlier = rng();
  if (outlier < 0.06) rate = Math.round((21 + rng() * 8) * 10) / 10; // > 20% outlier
  else if (outlier < 0.1) rate = Math.round((0.5 + rng() * 1.2) * 10) / 10; // < 2% outlier

  return {
    market,
    category,
    product_id,
    grade,
    battery_type,
    keySellers,
    status,
    rate,
    noOrders,
  };
}

function buildAll(): CommissionRule[] {
  const rules: CommissionRule[] = [];

  // 1. A few hand-crafted always-active, well-known rules (top of list).
  const fixtures: Seed[] = [
    {
      market: "DE",
      category: "Audio",
      product_id: null,
      grade: null,
      battery_type: null,
      keySellers: false,
      status: "VALIDATED",
      rate: 9.0,
      noOrders: false,
    },
    {
      market: "DE",
      category: "Audio",
      product_id: "AirPodsPro2",
      grade: "GOOD",
      battery_type: null,
      keySellers: true,
      status: "VALIDATED",
      rate: 7.0,
      noOrders: false,
    },
    {
      market: "FR",
      category: "Smartphones",
      product_id: null,
      grade: null,
      battery_type: null,
      keySellers: false,
      status: "VALIDATED",
      rate: 10.0,
      noOrders: false,
    },
    {
      market: "FR",
      category: "Smartphones",
      product_id: "iPhone13",
      grade: "GOOD",
      battery_type: "New Battery",
      keySellers: false,
      status: "VALIDATED",
      rate: 8.0,
      noOrders: false,
    },
  ];

  fixtures.forEach((s, i) => rules.push(makeRule(s, i)));

  // 2. Three intentional duplicates (same market + category + targeting) for the
  //    "325 duplicate rules" pain point.
  const dupSeed: Seed = {
    market: "GB",
    category: "Tablets",
    product_id: null,
    grade: null,
    battery_type: null,
    keySellers: false,
    status: "VALIDATED",
    rate: 9.0,
    noOrders: true,
  };
  rules.push(makeRule({ ...dupSeed }, fixtures.length));
  rules.push(makeRule({ ...dupSeed, rate: 9.5 }, fixtures.length + 1));
  rules.push(makeRule({ ...dupSeed, rate: 8.0 }, fixtures.length + 2));

  // Two more intentional overlaps with fixtures[0] (DE Audio, all sellers) and
  // fixtures[2] (FR Smartphones, all sellers) so the conflict set is realistic.
  rules.push(
    makeRule(
      {
        market: "DE",
        category: "Audio",
        product_id: null,
        grade: null,
        battery_type: null,
        keySellers: false,
        status: "VALIDATED",
        rate: 8.5,
        noOrders: true,
      },
      fixtures.length + 3
    )
  );
  rules.push(
    makeRule(
      {
        market: "FR",
        category: "Smartphones",
        product_id: null,
        grade: null,
        battery_type: null,
        keySellers: false,
        status: "VALIDATED",
        rate: 11.0,
        noOrders: false,
      },
      fixtures.length + 4
    )
  );

  // 3. Bulk of generated rules → total 44.
  const start = rules.length;
  const target = 44;
  for (let i = start; i < target; i++) {
    rules.push(makeRule(genSeed(), i));
  }

  // 4. Compute conflicts: non-archived rules sharing an identical scope conflict.
  const groups = new Map<string, CommissionRule[]>();
  for (const r of rules) {
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

export const MOCK_RULES: CommissionRule[] = buildAll();
