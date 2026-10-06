import { CREATE_TEMPLATE_COLUMNS, type CsvMode } from "./csv";

/**
 * Sample files for the Step 5 dev scenarios, so each import state can be opened
 * from the sidebar without preparing a CSV by hand. The rows are written against
 * the seed rules (iteration-1/mock-rules.ts): the strict conflicts and overlaps
 * below are real hits from `classifyCandidate`, not hard-coded results.
 */

export interface ImportSample {
  fileName: string;
  mode: CsvMode;
  text: string;
}

const HEADER = CREATE_TEMPLATE_COLUMNS.join(",");

/** 6 rows, all valid, no overlap or conflict with the seed rules. */
const CLEAN = `${HEADER}
Back to school — FR,FR,Laptops,,GreenMobile,EXCELLENT,Apple,Normal,8.5,2026-10-15,2026-11-15
Back to school — GB,GB,Laptops,,ReFone,GOOD,,,9,2026-10-15,2026-11-15
Autumn audio — IT,IT,Audio,,CircularTech,,Sony,,7.5,2026-10-20,2026-12-31
Autumn audio — PT,PT,Audio,,PixelRevive,,,,7.5,2026-10-20,2026-12-31
Battery push — FR,FR,,iPhone14-128,BatteryKings,GOOD,Apple,New Battery,12,2026-11-01,
Tablet refresh — GB,GB,,iPadAir-2022,GreenMobile,,,,10,2026-11-01,2026-12-31`;

/** 8 rows: 3 blocked (rows 3, 5, 7) and 1 warning (row 6, rate outside the band). */
const BLOCKED = `${HEADER}
Back to school — FR,FR,Laptops,,GreenMobile,EXCELLENT,Apple,Normal,8.5,2026-10-15,2026-11-15
Back to school — GB,GB,Laptops,,ReFone,GOOD,,,9,2026-10-15,2026-11-15
Back to school — IT,IT,Laptops,,CircularTech,,,,nine,2026-10-15,2026-11-15
Autumn audio — IT,IT,Audio,,CircularTech,,Sony,,7.5,2026-10-20,2026-12-31
Autumn audio — PT,PT,Audio,,PixelRevive,,,,7.5,2026-12-31,2026-10-20
Battery push — FR,FR,,iPhone14-128,BatteryKings,GOOD,Apple,New Battery,25,2026-11-01,
Tablet refresh — UK,UK,Tablets,,GreenMobile,,,,10,2026-11-01,2026-12-31
Tablet refresh — GB,GB,,iPadAir-2022,GreenMobile,,,,10,2026-11-01,2026-12-31`;

/**
 * 8 rows: 3 overlaps (rows 2, 4, 6 — a market-wide rule already exists in BE, ES
 * and NL) and 2 strict conflicts (rows 3 and 7 — identical to RULE-2068 and
 * RULE-2072).
 */
const CONFLICTS = `${HEADER}
Back to school — FR,FR,Laptops,,GreenMobile,EXCELLENT,Apple,Normal,8.5,2026-10-15,2026-11-15
Back to school — BE,BE,,iPhone14-128,,,,,8.5,2026-10-15,2026-11-15
Premium audio — FR,FR,Audio,,,,,,9,2026-10-15,2026-11-15
Autumn deals — ES,ES,,GalaxyS23-256,,,,,7.5,2026-10-20,2026-12-31
Autumn audio — PT,PT,Audio,,PixelRevive,,,,7.5,2026-10-20,2026-12-31
Autumn deals — NL,NL,,PixelBuds-Pro,,,,,7.5,2026-10-20,2026-12-31
Tablets push — ES,ES,Tablets,,,,,,11,2026-11-01,2026-12-31
Tablet refresh — GB,GB,,iPadAir-2022,GreenMobile,,,,10,2026-11-01,2026-12-31`;

/** A file exported from another tool: none of the template columns are present. */
const WRONG_COLUMNS = `seller,deal_campaign,month,orders,gmv
GreenMobile,Back to school,2026-08,412,58210.40
ReFone,Back to school,2026-09,389,51877.15`;

export const IMPORT_SAMPLES: Record<string, ImportSample> = {
  "import-clean": { fileName: "smartco_rules_oct_2026.csv", mode: "create", text: CLEAN },
  "import-errors": { fileName: "smartco_rules_oct_2026.csv", mode: "create", text: BLOCKED },
  "import-conflicts": { fileName: "smartco_rules_oct_2026.csv", mode: "create", text: CONFLICTS },
  "import-wrong-columns": { fileName: "seller_deal_campaigns_by_seller.csv", mode: "create", text: WRONG_COLUMNS },
};
