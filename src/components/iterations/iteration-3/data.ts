import type { Market } from "@/lib/types";
import { STEP1_RULES } from "../iteration-1/mock-rules";
import { OFFER_TYPES, type Step3Rule } from "./logic";

/**
 * Deterministic-by-index demo Offer type spread: mostly null (the PRD's
 * default — applies to all values), with enough of each specific code
 * represented that the new column/filter/scenarios have something real to
 * show. Grade is NOT backfilled here — `STEP1_RULES` already has real,
 * curated grade values (Adri's original `CommissionRule.grade` field); Step 3
 * just surfaces them, it doesn't invent new ones.
 */
function demoOfferType(index: number): Step3Rule["offer_type"] {
  const slot = (index + 3) % 9;
  return slot < OFFER_TYPES.length ? OFFER_TYPES[slot].code : null;
}

/**
 * Step 2/3 seed dataset. Step 1 was read-only, so it could share its static array.
 * Step 2 mutates rules (create / bulk update / archive), so the view holds the
 * rules in React state — this just provides the initial (deep-cloned) snapshot so
 * resetting or remounting starts from a clean baseline. Step 3 additionally backfills
 * the new Offer type field (real rules default to null — unaffected, per the PRD).
 */
export function seedRules(): Step3Rule[] {
  return STEP1_RULES.map((r, i) => ({
    ...r,
    seller_ids: [...r.seller_ids],
    conflicts: [...r.conflicts],
    offer_type: demoOfferType(i),
  }));
}

/**
 * Marketplaces group the markets (PRD: "user will have to create rules for each
 * marketplace: EU, US and APAC"). Used to label the market multi-select.
 */
export const MARKETPLACES: { id: string; label: string; markets: Market[] }[] = [
  { id: "EU", label: "Europe", markets: ["FR", "DE", "GB", "ES", "IT", "NL", "BE", "PT"] },
  { id: "US", label: "United States", markets: ["US"] },
  { id: "APAC", label: "Asia-Pacific", markets: ["JP"] },
];

/**
 * Seller pool for the seller-targeting autocomplete. PRD notes seller search is
 * already available in bo-staff; here we mock it from the seed dataset's sellers
 * plus a few extras so the dropdown has something to search.
 */
export const SELLER_POOL: string[] = (() => {
  const set = new Set<string>();
  for (const r of STEP1_RULES) for (const id of r.seller_ids) set.add(id);
  ["GreenMobile", "ReFone", "CircularTech", "BatteryKings", "PixelRevive"].forEach(
    (s) => set.add(s)
  );
  return [...set].sort();
})();

/**
 * Product ID validation set. PRD: Product ID is a UUID field validated against a
 * "local copy" endpoint before submission (no autocomplete, validation only).
 * We mock that local copy as the set of known product IDs — the seed dataset's
 * IDs plus a handful of extras — so the create form can flag unknown IDs.
 */
export const KNOWN_PRODUCT_IDS: Set<string> = (() => {
  const set = new Set<string>();
  for (const r of STEP1_RULES) if (r.product_id) set.add(r.product_id);
  [
    "iPhone14-128",
    "GalaxyS23-256",
    "MacBookAir-M2",
    "iPadAir-2022",
    "PixelBuds-Pro",
  ].forEach((p) => set.add(p));
  return set;
})();

/** True if a non-empty product_id is present in the mocked validation endpoint. */
export function isKnownProductId(id: string): boolean {
  return KNOWN_PRODUCT_IDS.has(id.trim());
}
