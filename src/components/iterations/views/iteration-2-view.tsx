"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORIES,
  MARKETS,
  MARKET_FLAGS,
  isRateOutOfRange,
  type CommissionRule,
  type RuleState,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { RevTooltip } from "../iteration-1/RevTooltip";
import { RevPagination } from "../iteration-1/RevPagination";
import { revolveVars, REV_RADIUS, REV_SHADOW, FONTFACE_CSS, REV_CSS } from "../iteration-1/tokens";
import {
  priorityColor,
  ruleCategories,
  type Step1Rule,
} from "../iteration-1/logic";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  STATUS_FILTER_OPTIONS,
  filterRules,
  sortRules,
  type Step2Filters,
  type SortField,
} from "../iteration-2/logic";
import { seedRules } from "../iteration-2/data";
import {
  buildArchiveTask,
  buildCreateTask,
  buildUpdateTask,
  commitTask,
  type BulkUpdateValues,
  type CreateInput,
  type Task,
} from "../iteration-2/engine";
import { CreateRulePanel, type CreateSeed } from "../iteration-2/CreateRulePanel";
import { ArchiveConfirm, BulkUpdatePanel } from "../iteration-2/BulkUpdatePanel";
import { TaskPanel } from "../iteration-2/TaskPanel";
import { RevButton } from "../iteration-2/Drawer";
import { RevCheckbox, RevInput, RevLink, RevSelect, RevTag, RevTagDot } from "../iteration-2/revolve";
import { makeOverlapTask, makeProcessingTask, makeRejectedTask } from "../iteration-2/scenarios";
import { PriorityColourReference } from "../iteration-2/PriorityColourReference";

const AUTHOR = "demo.user@example.com";

const COL_HEAD = "px-4 py-3 text-left text-sm font-semibold whitespace-nowrap";
const CELL = "px-4 py-4 align-top text-sm whitespace-nowrap";
const CELL_WRAP = "px-4 py-4 align-top text-sm";

// Priority is a number the backend computes and returns (like orderlines_30d /
// gmv_30d) — we display it, we don't derive it. Colour is a rough band, purely
// presentational, not a precise key to specific values.
function PriorityTag({ rule }: { rule: Step1Rule }) {
  const { bg, fg } = priorityColor(rule.priority);
  return (
    <RevTooltip content="Priority decides which rule applies when several overlap on an orderline. Set by the backend.">
      <RevTag size="small" style={{ background: bg, color: fg }}>
        {rule.priority}
      </RevTag>
    </RevTooltip>
  );
}

function StateBadge({ state }: { state: RuleState }) {
  const active = state === "ACTIVE";
  return (
    <RevTag variant={active ? "success" : "secondary"} size="small">
      <RevTagDot />
      {active ? "Active" : "Inactive"}
    </RevTag>
  );
}

function StatusBadge({ status }: { status: CommissionRule["status"] }) {
  const archived = status === "ARCHIVED";
  return archived ? (
    <RevTag variant="secondary" size="small">
      Archived
    </RevTag>
  ) : (
    <RevTag variant="secondary" variation="outline" size="small">
      Validated
    </RevTag>
  );
}

function SortHeader({
  label,
  field,
  active,
  dir,
  onSort,
  info,
}: {
  label: string;
  field: SortField;
  active: boolean;
  dir: "asc" | "desc";
  onSort: (f: SortField) => void;
  info?: string;
}) {
  return (
    <th className={COL_HEAD} style={{ color: "var(--rev-text-hi)" }}>
      <span className="inline-flex items-center gap-1">
        <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 hover:opacity-70" style={{ color: "inherit" }}>
          {label}
          <span style={{ opacity: active ? 1 : 0.35, fontSize: 10 }}>{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
        </button>
        {info && <InfoIcon content={info} />}
      </span>
    </th>
  );
}

/** Small info glyph that reveals a column explanation on hover (Revolve tooltip). */
function InfoIcon({ content }: { content: string }) {
  return (
    <RevTooltip content={content}>
      <span role="img" aria-label="Column info" className="inline-flex cursor-help align-middle" style={{ color: "var(--rev-text-muted)" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </span>
    </RevTooltip>
  );
}

function sellersLabel(rule: CommissionRule): string {
  if (rule.seller_targeting === "ALL" || rule.seller_ids.length === 0) return "All sellers";
  return rule.seller_ids[0];
}

const PAGE_SIZE = 25;

export function Iteration2View({ scenario }: { scenario?: string | null } = {}) {
  const [rules, setRules] = useState<Step1Rule[]>(() => seedRules());
  const [filters, setFilters] = useState<Step2Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [createInitial, setCreateInitial] = useState<CreateSeed | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Dev scenario triggers (sidebar): land the view exactly in the chosen state.
  // Every scenario starts from a clean, reseeded base so transitions are
  // deterministic regardless of what the reviewer did before.
  // Runs on scenario change. A null scenario ("Default view", or first mount)
  // falls through to the clean baseline below — closing any open drawer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCreateOpen(false);
    setUpdateOpen(false);
    setArchiveOpen(false);
    setTasksOpen(false);
    setToast(null);
    setCreateInitial(null);
    setFocusTaskId(null);

    let rulesNext = seedRules();
    let tasksNext: Task[] = [];
    let filtersNext: Step2Filters = DEFAULT_FILTERS;
    let selectedNext = new Set<string>();
    const now = new Date().toISOString();
    const visibleIds = (rs: Step1Rule[], n: number) =>
      filterRules(rs, DEFAULT_FILTERS).slice(0, n).map((r) => r.id);

    switch (scenario) {
      case "fan-out":
        setCreateInitial({ campaignName: "Summer smartphones push", markets: ["FR", "DE", "GB"], categories: ["Smartphones", "Laptops"] });
        setCreateOpen(true);
        break;
      case "product-id-error":
        setCreateInitial({ campaignName: "Pixel promo", markets: ["FR"], productRaw: "UNKNOWN-XYZ-001", productBlurred: true });
        setCreateOpen(true);
        break;
      case "rate-warning":
        setCreateInitial({ campaignName: "Clearance boost", markets: ["FR"], categories: ["Accessories"], rate: "25" });
        setCreateOpen(true);
        break;
      case "overlap-result": {
        const t = makeOverlapTask(rulesNext, now);
        tasksNext = [t];
        setFocusTaskId(t.id);
        setTasksOpen(true);
        break;
      }
      case "rejected-result": {
        const t = makeRejectedTask(rulesNext, now);
        tasksNext = [t];
        setFocusTaskId(t.id);
        setTasksOpen(true);
        break;
      }
      case "processing": {
        const t = makeProcessingTask(rulesNext, now);
        tasksNext = [t];
        setFocusTaskId(t.id);
        setTasksOpen(true);
        break;
      }
      case "selection":
        selectedNext = new Set(visibleIds(rulesNext, 3));
        break;
      case "bulk-update":
        selectedNext = new Set(visibleIds(rulesNext, 3));
        setUpdateOpen(true);
        break;
      case "archive-confirm":
        selectedNext = new Set(visibleIds(rulesNext, 2));
        setArchiveOpen(true);
        break;
      case "archived-row": {
        const ids = visibleIds(rulesNext, 2);
        rulesNext = rulesNext.map((r) =>
          ids.includes(r.id) ? { ...r, status: "ARCHIVED" as const, state: "INACTIVE" as const } : r
        );
        filtersNext = { ...DEFAULT_FILTERS, status: ["ACTIVE", "ARCHIVED"] };
        break;
      }
      case "empty-result":
        filtersNext = { ...DEFAULT_FILTERS, search: "no-such-rule-zzz" };
        break;
    }

    setRules(rulesNext);
    setTasks(tasksNext);
    setFilters(filtersNext);
    setSelected(selectedNext);
    setPage(1);
  }, [scenario]);

  const showToast = (msg: string) => {
    setToast(msg);
    const t = setTimeout(() => setToast(null), 4500);
    timers.current.push(t);
  };

  const rows = useMemo(() => sortRules(filterRules(rules, filters), sort.field, sort.dir), [rules, filters, sort]);

  useEffect(() => setPage(1), [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, rows.length);

  const set = <K extends keyof Step2Filters>(key: K, value: Step2Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const onSort = (field: SortField) =>
    setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" }));

  // ── Selection (across the full filtered set) ────────────────────────────
  const filteredIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selectedInView = filteredIds.filter((id) => selected.has(id));
  const allSelected = filteredIds.length > 0 && selectedInView.length === filteredIds.length;
  const someSelected = selectedInView.length > 0 && !allSelected;
  const headerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerRef.current) headerRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedIds = [...selected];
  const selectedCount = selectedIds.length;

  // ── Async task lifecycle: push ONGOING task, then resolve + commit ───────
  // Submit a task: queue it ONGOING and resolve (commit) after a simulated delay.
  // Does NOT open the Tasks panel — submitting just confirms via toast; the user
  // opens Tasks when they want to check progress.
  const runTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    const t = setTimeout(() => {
      setRules((prev) => commitTask(task, prev, new Date().toISOString()));
      setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: "DONE" } : x)));
    }, task.durationMs);
    timers.current.push(t);
  };

  const plural = (n: number) => (n === 1 ? "" : "s");

  const onCreate = (input: Omit<CreateInput, "author">) => {
    const task = buildCreateTask({ ...input, author: AUTHOR }, rules, new Date().toISOString());
    runTask(task);
    setCreateOpen(false);
    showToast(`Processing ${task.items.length} rule${plural(task.items.length)} — track progress in Tasks.`);
  };

  const onBulkUpdate = (values: BulkUpdateValues) => {
    const n = selectedIds.length;
    runTask(buildUpdateTask(selectedIds, values, rules, new Date().toISOString()));
    setUpdateOpen(false);
    setSelected(new Set());
    showToast(`Updating ${n} rule${plural(n)} — track progress in Tasks.`);
  };

  const onArchive = () => {
    const archivable = selectedIds.filter((id) => rules.find((r) => r.id === id)?.status !== "ARCHIVED");
    runTask(buildArchiveTask(archivable, rules, new Date().toISOString()));
    setArchiveOpen(false);
    setSelected(new Set());
    showToast(`Archiving ${archivable.length} rule${plural(archivable.length)} — track progress in Tasks.`);
  };

  const ongoingCount = tasks.filter((t) => t.status === "ONGOING").length;

  // "Priority colour reference" is a static dev-handoff doc, not a table state —
  // it replaces the whole body instead of seeding rules/tasks like the other scenarios.
  if (scenario === "priority-colours") return <PriorityColourReference />;

  return (
    <div
      style={{ ...revolveVars, background: "var(--rev-surface-hi)", color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-body)" }}
      className="rev-scope flex min-h-full flex-col gap-4 p-6"
    >
      <style dangerouslySetInnerHTML={{ __html: FONTFACE_CSS + REV_CSS }} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-heading)" }}>
            Smart Commission Rules
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--rev-text-low)" }}>
            Create, update, and archive commission rules. Submissions are processed asynchronously as tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RevButton variant="secondary" onClick={() => setTasksOpen(true)}>
            Tasks
            {ongoingCount > 0 && (
              <span
                className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold"
                style={{ borderRadius: REV_RADIUS.round, background: "var(--rev-warning-bg)", color: "var(--rev-warning)" }}
              >
                <span className="h-2.5 w-2.5 animate-spin rounded-full" style={{ border: "2px solid currentColor", borderTopColor: "transparent" }} />
                {ongoingCount} processing
              </span>
            )}
          </RevButton>
          <RevButton variant="primary" onClick={() => setCreateOpen(true)}>
            + New rule
          </RevButton>
        </div>
      </div>

      {/* Filter bar — floating-label fields directly on the page (BM Listings pattern). */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-40"><RevSelect label="Market" options={[...MARKETS]} selected={filters.market} onChange={(v) => set("market", v)} /></div>
        <div className="w-44"><RevSelect label="Category" options={[...CATEGORIES]} selected={filters.category} onChange={(v) => set("category", v)} /></div>
        <div className="w-48"><RevInput label="Product ID" placeholder="Filter by product ID…" value={filters.product} onChange={(v) => set("product", v)} /></div>
        <div className="w-44"><RevInput label="Seller ID" placeholder="Filter by seller ID…" value={filters.seller} onChange={(v) => set("seller", v)} /></div>
        <div className="w-36"><RevSelect label="State" options={["ACTIVE", "INACTIVE"]} selected={filters.state} onChange={(v) => set("state", v)} /></div>
        <div className="w-36"><RevSelect label="Status" options={[...STATUS_FILTER_OPTIONS]} selected={filters.status} onChange={(v) => set("status", v as Step2Filters["status"])} /></div>
        <div className="w-56"><RevInput label="Search" placeholder="Rule ID or campaign name…" value={filters.search} onChange={(v) => set("search", v)} /></div>
      </div>

      {/* Count + bulk actions (Listings-page pattern). Always visible; the CTAs are
          disabled until rows are selected, so ticking a box never shifts the layout
          and the bar lives at content width — the actions can't be cut off. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
          {selectedCount > 0
            ? `${selectedCount} rule${selectedCount === 1 ? "" : "s"} selected`
            : `${rows.length} rule${rows.length === 1 ? "" : "s"}`}
        </span>
        <div className="flex items-center gap-2">
          <RevLink onClick={() => setSelected(new Set())} disabled={selectedCount === 0} className="px-2">
            Clear
          </RevLink>
          <RevButton variant="secondary" onClick={() => setUpdateOpen(true)} disabled={selectedCount === 0}>
            Bulk update
          </RevButton>
          <RevButton variant="secondary" onClick={() => setArchiveOpen(true)} disabled={selectedCount === 0}>
            Archive
          </RevButton>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ background: "var(--rev-surface-low)", border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.lg, boxShadow: REV_SHADOW.short }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--rev-static-mid)", borderBottom: "1px solid var(--rev-border)" }}>
              <th className="px-4 py-3" style={{ width: 44 }}>
                <RevCheckbox ref={headerRef} checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
              <SortHeader
                label="Priority"
                field="priority"
                active={sort.field === "priority"}
                dir={sort.dir}
                onSort={onSort}
                info="Priority decides which rule applies when several overlap on an orderline. Set by the backend based on the rule's scope."
              />
              <th className={COL_HEAD} style={{ color: "var(--rev-text-hi)" }}>Campaign name</th>
              <SortHeader
                label="Created"
                field="created_at"
                active={sort.field === "created_at"}
                dir={sort.dir}
                onSort={onSort}
                info="When the rule was created. Independent of Start date — a rule with no Start date activates immediately on creation rather than on a future scheduled date."
              />
              <SortHeader label="Start date" field="start_date" active={sort.field === "start_date"} dir={sort.dir} onSort={onSort} />
              <SortHeader label="End date" field="end_date" active={sort.field === "end_date"} dir={sort.dir} onSort={onSort} />
              {["Market", "Category", "Product ID", "Sellers", "Commission", "State"].map((h) => (
                <th key={h} className={COL_HEAD} style={{ color: "var(--rev-text-hi)" }}>{h}</th>
              ))}
              <th className={COL_HEAD} style={{ color: "var(--rev-text-hi)" }}>
                <span className="inline-flex items-center gap-1">
                  Status
                  <InfoIcon content="Status is the rule's lifecycle stage, set manually. In this step a rule is Validated when created, or Archived (soft-deleted but kept for audit). Draft and Paused arrive in Step 4. Distinct from State, which is computed automatically." />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => {
              const outOfRange = isRateOutOfRange(r.commission_rate);
              const checked = selected.has(r.id);
              const archived = r.status === "ARCHIVED";
              return (
                <tr key={r.id} data-rev-row className="transition-colors" style={{ borderBottom: "1px solid var(--rev-border)", opacity: archived ? 0.6 : 1 }}>
                  <td className="px-4 py-4 align-top">
                    <RevCheckbox checked={checked} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.id}`} />
                  </td>
                  <td className={CELL}>
                    <PriorityTag rule={r} />
                  </td>
                  <td className={CELL_WRAP}>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs" style={{ color: "var(--rev-text-muted)" }}>{r.id}</div>
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>{formatDate(r.created_at)}</td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.start_date ? formatDate(r.start_date) : <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All time</span>}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.end_date ? formatDate(r.end_date) : <span className="italic" style={{ color: "var(--rev-text-muted)" }}>No expiry</span>}
                  </td>
                  <td className={CELL}>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold" style={{ background: "var(--rev-static-mid)", borderRadius: REV_RADIUS.xs }}>
                      {MARKET_FLAGS[r.market]} {r.market}
                    </span>
                  </td>
                  <td className={CELL_WRAP} style={{ color: "var(--rev-text-mid)" }}>
                    {ruleCategories(r).length ? ruleCategories(r).join(", ") : "All categories"}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.product_id ? (
                      <span className="font-mono text-xs">{r.product_id}</span>
                    ) : (
                      <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All products</span>
                    )}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>{sellersLabel(r)}</td>
                  <td className={CELL}>
                    <span className="inline-flex items-center gap-1 font-semibold" style={{ color: outOfRange ? "var(--rev-warning)" : "var(--rev-text-hi)" }}>
                      {r.commission_rate.toFixed(1)}%
                      {outOfRange && (
                        <RevTooltip content="This rate is outside the standard range (2–20%).">
                          <span role="img" aria-label="Out-of-range commission rate" className="leading-none">⚠</span>
                        </RevTooltip>
                      )}
                    </span>
                  </td>
                  <td className={CELL}>
                    <StateBadge state={r.state} />
                  </td>
                  <td className={CELL}>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-10 text-center text-sm" style={{ color: "var(--rev-text-muted)" }}>
                  No rules match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RevPagination page={page} total={totalPages} onChange={setPage} />

      <div className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
        {rows.length === 0 ? "No rules to show" : `Showing ${rangeStart}–${rangeEnd} of ${rows.length} rules`}
      </div>

      {/* Panels */}
      {/* Toast — confirms an async submission without stealing focus to the Tasks panel */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[60] flex items-center gap-4 px-4 py-3"
          style={{ background: "var(--rev-text-hi)", color: "#fff", borderRadius: REV_RADIUS.md, boxShadow: REV_SHADOW.long, maxWidth: 380 }}
          role="status"
        >
          <span className="text-sm">{toast}</span>
          <button
            type="button"
            onClick={() => {
              setTasksOpen(true);
              setToast(null);
            }}
            className="shrink-0 text-sm font-semibold underline hover:opacity-80"
          >
            View
          </button>
        </div>
      )}

      <CreateRulePanel open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={onCreate} initial={createInitial} />
      <BulkUpdatePanel open={updateOpen} count={selectedCount} onClose={() => setUpdateOpen(false)} onSubmit={onBulkUpdate} />
      <ArchiveConfirm open={archiveOpen} count={selectedCount} onClose={() => setArchiveOpen(false)} onConfirm={onArchive} />
      <TaskPanel open={tasksOpen} tasks={tasks} onClose={() => setTasksOpen(false)} initialTaskId={focusTaskId} />
    </div>
  );
}
