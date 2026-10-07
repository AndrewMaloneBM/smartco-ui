/**
 * Friendly device names for Product IDs. The CSV stores machine IDs
 * (e.g. "iPhone14-128"); the UI renders them as human labels. Unknown IDs
 * fall back to the raw ID so nothing breaks when new products appear.
 * Kept in iteration-5 so it can be imported by other iterations later
 * (src/lib/ is off-limits).
 */
const DEVICE_NAMES: Record<string, string> = {
  "iPhone14-128": "iPhone 14 128GB",
  "iPhone15Pro-256": "iPhone 15 Pro 256GB",
  "GalaxyS23-256": "Galaxy S23 256GB",
  "GalaxyS24-128": "Galaxy S24 128GB",
  "MacBookAir-M2": "MacBook Air M2",
  "MBA-M3-13": "MacBook Air M3 13\"",
  "iPadAir-2022": "iPad Air (2022)",
  "iPadAir-2025": "iPad Air (2025)",
  "AirPodsPro2": "AirPods Pro (2nd gen)",
  "PixelBuds-Pro": "Pixel Buds Pro",
};

/** Friendly label for a Product ID; raw ID when unknown. */
export function deviceLabel(productId: string): string {
  return DEVICE_NAMES[productId.trim()] ?? productId.trim();
}
