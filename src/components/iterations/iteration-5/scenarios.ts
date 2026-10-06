/**
 * Step 5 dev scenarios — jump straight to each CSV import/export state from
 * the sidebar (sub-PRD 6505926261).
 */
export const STEP5_SCENARIOS: { id: string; label: string; group: string }[] = [
  { id: "export-rules", label: "Export filtered rules", group: "Export" },
  { id: "import-clean", label: "Import — clean file", group: "Import" },
  { id: "import-errors", label: "Import — blocked rows", group: "Import" },
  { id: "import-conflicts", label: "Import — conflicts", group: "Import" },
  { id: "import-tracking", label: "Import — task tracking + results export", group: "Import" },
];
