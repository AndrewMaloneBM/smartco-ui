import type { Task } from "./engine";

/**
 * Step 3 dev scenarios — states a developer or reviewer can jump straight to
 * from the sidebar, scoped to *this step's* PRD (Grade / Offer type / Brand).
 * Not a port of Step 2's scenario list — Step 2's Create/Task/table scenarios
 * (fan-out, product ID, overlap, bulk update, etc.) already live in Step 2 and
 * aren't repeated here.
 */
export const STEP3_SCENARIOS: { id: string; label: string; group: string }[] = [
  { id: "grade-create", label: "Create with Grade", group: "Create rule" },
  { id: "offer-type-create", label: "Create with Offer type", group: "Create rule" },
  { id: "brand-create", label: "Create with Brand", group: "Create rule" },
  { id: "grade-filter", label: "Grade filter", group: "Filters" },
  { id: "offer-type-filter", label: "Offer type filter", group: "Filters" },
  { id: "brand-filter", label: "Brand filter", group: "Filters" },
  { id: "tasks-pagination", label: "Tasks pagination", group: "Task results" },
  { id: "task-failed", label: "Task failed", group: "Task results" },
];

/**
 * A task history so the Tasks drawer demonstrates pagination. 15 tasks at
 * 3 per page = 5 pages.
 */
export function makePaginationTasks(now: string): Task[] {
  const tasks: Task[] = [];
  const kinds: Task["kind"][] = ["CREATE", "UPDATE", "ARCHIVE"];
  const authors = ["demo.user@example.com", "ops.lead@example.com", "seller.ops@example.com"];
  const scopes = ["FR · Smartphones", "DE · Laptops", "GB · Tablets", "ES · Audio", "IT · Smartphones"];
  const created = (n: number) =>
    Array.from({ length: n }, (_, k) => ({
      ruleId: `RULE-${(4000 + k).toString()}`,
      scope: scopes[k % scopes.length],
      result: "CREATED" as const,
      message: "Created successfully.",
    }));

  for (let i = 1; i <= 15; i++) {
    const id = `TASK-${String(i).padStart(4, "0")}`;
    const kind = kinds[i % 3];
    const ongoing = i % 17 === 0;
    const errored = !ongoing && i % 13 === 0;
    const submittedAt = new Date(new Date(now).getTime() - i * 86_400_000).toISOString();

    let items: Task["items"];
    if (kind === "CREATE") {
      items = ongoing
        ? created(3).map((it, k) => ({ ...it, ruleId: k === 0 ? "—" : it.ruleId }))
        : errored
          ? [
              created(1)[0],
              { ruleId: "—", scope: "FR · Audio · All sellers", result: "STRICT_CONFLICT", message: "Not created — an identical rule already exists." },
            ]
          : [...created(1 + (i % 3)), ...(i % 5 === 0 ? [{ ruleId: "—", scope: "GB · Audio", result: "OVERLAP" as const, message: "Created — a broader rule already covers this scope." }] : [])];
    } else if (kind === "UPDATE") {
      items = Array.from({ length: 1 + (i % 3) }, (_, k) => ({
        ruleId: `RULE-${(5000 + k).toString()}`,
        scope: scopes[(i + k) % scopes.length],
        result: "CREATED" as const,
        message: "Updated successfully.",
      }));
    } else {
      items = Array.from({ length: 1 + (i % 2) }, (_, k) => ({
        ruleId: `RULE-${(6000 + k).toString()}`,
        scope: scopes[(i + k) % scopes.length],
        result: "CREATED" as const,
        message: "Archived (soft delete) — preserved for audit.",
      }));
    }

    tasks.push({
      id,
      kind,
      submittedAt,
      author: authors[i % authors.length],
      durationMs: (1500 + (i % 8) * 500),
      status: ongoing ? "ONGOING" : "DONE",
      pendingRules: [],
      items,
    });
  }
  return tasks;
}
