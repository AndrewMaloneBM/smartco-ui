/**
 * Step 3 dev scenarios — states a developer or reviewer can jump straight to
 * from the sidebar, scoped to *this step's* PRD (Grade / Offer type). Not a
 * port of Step 2's scenario list — Step 2's Create/Task/table scenarios
 * (fan-out, product ID, overlap, bulk update, etc.) already live in Step 2 and
 * aren't repeated here.
 */
export const STEP3_SCENARIOS: { id: string; label: string; group: string }[] = [
  { id: "grade-create", label: "Create with Grade", group: "Create rule" },
  { id: "offer-type-create", label: "Create with Offer type", group: "Create rule" },
  { id: "grade-filter", label: "Grade filter", group: "Filters" },
  { id: "offer-type-filter", label: "Offer type filter", group: "Filters" },
];
