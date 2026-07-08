import type { Step1Rule } from "../iteration-1/logic";
import type { Task } from "./engine";

/**
 * Step 2 dev scenarios — a curated set of states a developer (or reviewer) can
 * jump straight to from the sidebar, instead of hand-crafting the rules needed to
 * trigger each edge case. Each id is handled by `applyScenario` in Iteration2View,
 * which seeds the right rules / opens the right panel / injects a finished task.
 *
 * Grouped by area; the label is what shows in the sidebar scenario list.
 */
export const STEP2_SCENARIOS: { id: string; label: string; group: string }[] = [
  { id: "fan-out", label: "Fan-out preview", group: "Create rule" },
  { id: "product-id-error", label: "Product ID error", group: "Create rule" },
  { id: "rate-warning", label: "Rate out of band", group: "Create rule" },
  { id: "overlap-result", label: "Overlap", group: "Task results" },
  { id: "rejected-result", label: "Rejected (conflict)", group: "Task results" },
  { id: "processing", label: "Processing", group: "Task results" },
  { id: "selection", label: "Selection", group: "Table & bulk" },
  { id: "bulk-update", label: "Bulk update", group: "Table & bulk" },
  { id: "archive-confirm", label: "Archive confirm", group: "Table & bulk" },
  { id: "archived-row", label: "Archived rule", group: "Table & bulk" },
  { id: "empty-result", label: "Empty result", group: "Table & bulk" },
  { id: "priority-colours", label: "Priority colour reference", group: "Reference" },
];

/** A finished CREATE task that mixes a clean create with an overlap (lower priority). */
export function makeOverlapTask(rules: Step1Rule[], now: string): Task {
  const broad = rules.find((r) => r.category === null) ?? rules[0];
  return {
    id: "TASK-OVRLAP",
    kind: "CREATE",
    submittedAt: now,
    author: "demo.user@example.com",
    durationMs: 1840,
    status: "DONE",
    pendingRules: [],
    items: [
      { ruleId: "RULE-3101", scope: "FR · Smartphones · TechReborn", result: "CREATED", message: "Created successfully." },
      {
        ruleId: "RULE-3102",
        scope: "DE · Smartphones · All sellers",
        result: "OVERLAP",
        message: `Created — a broader rule (${broad.id}) already covers this scope and takes priority.`,
        relatedRuleId: broad.id,
      },
      { ruleId: "RULE-3103", scope: "GB · Laptops · All sellers", result: "CREATED", message: "Created successfully." },
    ],
  };
}

/** A finished CREATE task where one candidate is a strict conflict (not created). */
export function makeRejectedTask(rules: Step1Rule[], now: string): Task {
  const clash = rules[0];
  return {
    id: "TASK-REJECT",
    kind: "CREATE",
    submittedAt: now,
    author: "demo.user@example.com",
    durationMs: 2010,
    status: "DONE",
    pendingRules: [],
    items: [
      { ruleId: "RULE-3201", scope: "FR · Audio · All sellers", result: "CREATED", message: "Created successfully." },
      {
        ruleId: "—",
        scope: `${clash.market} · ${clash.category ?? "All categories"} · ${
          clash.seller_ids[0] ?? "All sellers"
        }`,
        result: "STRICT_CONFLICT",
        message: `Not created — an identical rule already exists (${clash.id}).`,
        relatedRuleId: clash.id,
      },
      { ruleId: "RULE-3202", scope: "ES · Tablets · All sellers", result: "CREATED", message: "Created successfully." },
    ],
  };
}

/** An in-flight CREATE task (spinner state) — left ONGOING so the state stays frozen. */
export function makeProcessingTask(_rules: Step1Rule[], now: string): Task {
  return {
    id: "TASK-PROCSS",
    kind: "CREATE",
    submittedAt: now,
    author: "demo.user@example.com",
    durationMs: 4000,
    status: "ONGOING",
    pendingRules: [],
    items: [
      { ruleId: "RULE-3301", scope: "FR · Smartphones", result: "CREATED", message: "" },
      { ruleId: "RULE-3302", scope: "DE · Smartphones", result: "CREATED", message: "" },
      { ruleId: "RULE-3303", scope: "GB · Smartphones", result: "CREATED", message: "" },
      { ruleId: "RULE-3304", scope: "ES · Smartphones", result: "CREATED", message: "" },
      { ruleId: "RULE-3305", scope: "IT · Smartphones", result: "CREATED", message: "" },
    ],
  };
}
