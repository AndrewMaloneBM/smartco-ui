"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CATEGORIES,
  GRADES,
  MARKETS,
  isRateOutOfRange,
  type CommissionRule,
  type Grade,
  type Market,
  type RuleState,
  type RuleStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { RevTooltip } from "../iteration-1/RevTooltip";
import { RevPagination } from "../iteration-1/RevPagination";
import { revolveVars, REV_RADIUS, REV_SHADOW, FONTFACE_CSS, REV_CSS } from "../iteration-1/tokens";
import { priorityColor, sortRules, type Step1Rule, type SortField, type SortDir } from "../iteration-1/logic";
import {
  BRANDS,
  DEFAULT_FILTERS,
  OFFER_TYPES,
  STATUS_FILTER_OPTIONS,
  filterRules,
  offerTypeLabel,
  type Brand,
  type OfferTypeCode,
  type Step3Filters,
  type Step3Rule,
} from "../iteration-3/logic";
import { seedRules } from "../iteration-3/data";
import {
  buildArchiveTask,
  buildCreateTask,
  buildUpdateTask,
  commitTask,
  type BulkUpdateValues,
  type CreateInput,
  type Task,
  type TaskItem,
} from "../iteration-3/engine";
import { TaskPanel } from "../iteration-3/TaskPanel";
import { CreateRulePanel } from "../iteration-3/CreateRulePanel";
import { ArchiveConfirm, BulkUpdatePanel } from "../iteration-3/BulkUpdatePanel";
import { DRAWER_TRANSITION_MS, RevButton } from "../iteration-3/Drawer";
import {
  RevCheckbox,
  RevInput,
  RevLink,
  RevPill,
  RevSelect,
  RevSpinner,
  RevTag,
  type RevTagVariant,
} from "../iteration-3/revolve";
import {
  classifyCandidate,
  downloadCsv,
  exportFileName,
  importedScopeKey,
  rulesToCsv,
  taskResultsToCsv,
  type CandidateRow,
  type RowIssue,
} from "../iteration-5/csv";
import { ImportCsvDrawer, type ImportPayload } from "../iteration-5/ImportCsvDrawer";
import { IMPORT_SAMPLES, type ImportSample } from "../iteration-5/samples";

/**
 * Step 5 — CSV import/export (sub-PRD 6505926261). Same rules table as Step 3
 * (which is in development and carries the full Step 2/3 feature set) plus:
 *  - Export rules → CSV of the full filtered set (PRD filename + columns)
 *  - Import CSV → multi-step drawer (create/update, validation, conflict review)
 *  - Task results export from the Task drawer
 * The table itself is reused rather than re-derived: Step 5's PRD builds on the
 * Step 3 granularity (brand/grade/offer_type columns) being live.
 */

const AUTHOR = "demo.user@example.com";

const COL_HEAD = "px-4 py-3 text-left text-sm font-semibold whitespace-nowrap";
const CELL = "px-4 py-4 align-middle text-sm whitespace-nowrap";
const CELL_WRAP = "px-4 py-4 align-middle text-sm";

const SMALL_TAG_STYLE = { borderRadius: REV_RADIUS.xs, paddingLeft: 2, paddingRight: 2, paddingTop: 0, paddingBottom: 0 };

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
    <RevTag variant={active ? "success" : "secondary"} size="small" style={SMALL_TAG_STYLE}>
      {active ? "Active" : "Inactive"}
    </RevTag>
  );
}

const STATUS_TAG: Record<RuleStatus, { variant: RevTagVariant; label: string }> = {
  VALIDATED: { variant: "success", label: "Validated" },
  ARCHIVED: { variant: "secondary", label: "Archived" },
  DRAFT: { variant: "info", label: "Draft" },
  PAUSED: { variant: "warning", label: "Paused" },
};

function StatusBadge({ status }: { status: CommissionRule["status"] }) {
  const { variant, label } = STATUS_TAG[status];
  return (
    <RevTag variant={variant} variation="outline" size="small" style={SMALL_TAG_STYLE}>
      {label}
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

const DEFAULT_SORT: { field: SortField; dir: SortDir } = { field: "created_at", dir: "desc" };

/** A completed CSV-import demo task (create: 2 created + 1 blocked row) for the tracking scenario. */
function makeDemoImportTask(nowIso: string): Task[] {
  const items: TaskItem[] = [
    { ruleId: "RULE-6001", scope: "FR · Smartphones · Apple · EXCELLENT", result: "CREATED", message: "Row #1: created successfully.", inputRow: 1 },
    { ruleId: "RULE-6002", scope: "DE · Laptops · All brands", result: "CREATED", message: "Row #2: created successfully.", inputRow: 2 },
    { ruleId: "—", scope: "Row #3", result: "STRICT_CONFLICT", message: "commission_rate must be a number between 0 and 99.99.", inputRow: 3 },
  ];
  return [
    {
      id: "TASK-CSV01",
      kind: "CREATE",
      submittedAt: nowIso,
      author: AUTHOR,
      durationMs: 1800,
      status: "DONE",
      pendingRules: [],
      items,
    },
  ];
}

export function Iteration5View({ scenario }: { scenario?: string | null } = {}) {
  const [rules, setRules] = useState<Step3Rule[]>(() => seedRules());
  const [filters, setFilters] = useState<Step3Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  /** Sample file a dev scenario loads into the import drawer (null = start at Upload). */
  const [importSample, setImportSample] = useState<ImportSample | null>(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Dev scenario triggers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCreateOpen(false);
    setUpdateOpen(false);
    setArchiveOpen(false);
    setImportOpen(false);
    setImportSample(null);
    setTasksOpen(false);
    setFocusTaskId(null);
    setRules(seedRules());
    setFilters(DEFAULT_FILTERS);
    setSelected(new Set());
    setPage(1);
    setTasks([]);

    switch (scenario) {
      case "export-rules":
        // Land with an active Status filter so the filename token is visible.
        setFilters({ ...DEFAULT_FILTERS, status: ["VALIDATED"] });
        break;
      case "import-upload":
        setImportOpen(true);
        break;
      case "import-wrong-columns":
      case "import-clean":
      case "import-errors":
      case "import-conflicts":
        setImportSample(IMPORT_SAMPLES[scenario]);
        setImportOpen(true);
        break;
      case "import-tracking":
        setTasks(makeDemoImportTask(new Date().toISOString()));
        setTasksOpen(true);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const rows = useMemo(() => sortRules(filterRules(rules, filters), sort.field, sort.dir), [rules, filters, sort]);
  useEffect(() => setPage(1), [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, rows.length);

  const set = <K extends keyof Step3Filters>(key: K, value: Step3Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const onSort = (field: SortField) =>
    setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" }));

  const filteredIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selectedInView = filteredIds.filter((id) => selected.has(id));
  const allSelected = filteredIds.length > 0 && selectedInView.length === filteredIds.length;
  const headerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerRef.current) headerRef.current.indeterminate = !allSelected && selectedInView.length > 0;
  }, [allSelected, selectedInView.length]);

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
  const selectedCount = selected.size;
  const ongoingCount = tasks.filter((t) => t.status === "ONGOING").reduce((n, t) => n + t.items.length, 0);
  const plural = (n: number) => (n === 1 ? "" : "s");

  const runTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    const t = setTimeout(() => {
      setRules((prev) => commitTask(task, prev, new Date().toISOString()));
      setTasks((prev) => prev.map((x) => (x.id === task.id ? { ...x, status: "DONE" } : x)));
    }, task.durationMs);
    timers.current.push(t);
  };

  const goToTask = (task: Task) => {
    runTask(task);
    const t = setTimeout(() => {
      setFocusTaskId(task.id);
      setTasksOpen(true);
    }, DRAWER_TRANSITION_MS);
    timers.current.push(t);
  };

  const onCreate = (input: Omit<CreateInput, "author">) => {
    const task = buildCreateTask({ ...input, author: AUTHOR }, rules, new Date().toISOString());
    setCreateOpen(false);
    goToTask(task);
  };

  const onBulkUpdate = (values: BulkUpdateValues) => {
    const task = buildUpdateTask(selectedIds, values, rules, new Date().toISOString(), AUTHOR);
    setUpdateOpen(false);
    setSelected(new Set());
    goToTask(task);
  };

  const onArchive = () => {
    const archivable = selectedIds.filter((id) => rules.find((r) => r.id === id)?.status !== "ARCHIVED");
    const task = buildArchiveTask(archivable, rules, new Date().toISOString(), AUTHOR);
    setArchiveOpen(false);
    setSelected(new Set());
    goToTask(task);
  };

  // ── Export rules (full filtered set) ──────────────────────────────────────
  const onExport = () => {
    downloadCsv(exportFileName(filters.status), rulesToCsv(rows));
  };

  // ── Import submit → real tasks (reusing the Step 3 engine) ────────────────
  const buildImportCreateTask = (candidates: CandidateRow[], issues: RowIssue[], nowIso: string): Task => {
    const items: TaskItem[] = [];
    const pending: Step3Rule[] = [];
    let i = 0;
    let idCounter = 6000;
    const existing = [...rules];

    for (const c of candidates) {
      // Fan-out: one rule per market × category × grade × brand combination
      // (empty dimension = a single "all" rule), mirroring the create drawer.
      const markets = c.markets.length ? c.markets : ([...MARKETS] as Market[]);
      const categories = c.categories.length ? c.categories : [null];
      const grades = c.grades.length ? c.grades : [null];
      const brands = c.brands.length ? c.brands : [null];
      const offerCodes = c.offerTypes
        .map((l) => OFFER_TYPES.find((o) => o.label === l)?.code)
        .filter((x): x is OfferTypeCode => x !== undefined);
      const offerTypes = offerCodes.length ? offerCodes : [null];
      const sellers = c.sellerIds.length ? c.sellerIds : [null];
      const cls = classifyCandidate(c, rules);
      const overlapWith = cls.result === "OVERLAP" ? cls.relatedRuleId : undefined;

      for (const market of markets)
        for (const category of categories)
          for (const grade of grades)
            for (const brand of brands)
              for (const offerType of offerTypes)
                for (const seller of sellers) {
                  const id = `RULE-${idCounter++}`;
                  const rule: Step3Rule = {
                    id,
                    name: c.campaignName,
                    market,
                    category,
                    product_id: c.productIds[0] ?? null,
                    grade: (grade as Grade) ?? null,
                    battery_type: null,
                    offer_type: offerType,
                    brand: (brand as Brand) ?? null,
                    seller_targeting: seller ? "KEY_SELLERS" : "ALL",
                    seller_ids: seller ? [seller] : [],
                    commission_rate: c.rate,
                    start_date: c.startDate ?? nowIso.slice(0, 10),
                    end_date: c.endDate,
                    state: "ACTIVE",
                    status: "VALIDATED",
                    created_by: AUTHOR,
                    created_at: nowIso,
                    conflicts: [],
                    orderlines_30d: null,
                    gmv_30d: null,
                    priority: 400 + (i % 900),
                  };
                  // Blocked issues from validation keep their row out of the
                  // task; anything left gets the same per-row classification the
                  // drawer's Check step showed, so Results never contradicts it.
                  const rowIssues = issues.filter((x) => x.inputRow === c.inputRow && x.verdict === "BLOCKED");
                  const result: TaskItem["result"] = rowIssues.length
                    ? "STRICT_CONFLICT"
                    : overlapWith
                      ? "OVERLAP"
                      : "CREATED";
                  existing.push(rule);
                  if (result === "STRICT_CONFLICT") {
                    items.push({
                      ruleId: "—",
                      scope: `${market} · ${category ?? "All categories"} · ${brand ?? "All brands"}`,
                      result,
                      message: `Row #${c.inputRow}: blocked — ${rowIssues[0]?.message ?? "conflict"}.`,
                      inputRow: c.inputRow,
                    });
                  } else {
                    pending.push(rule);
                    items.push({
                      ruleId: id,
                      scope: `${market} · ${category ?? "All categories"} · ${brand ?? "All brands"}${grade ? ` · ${grade}` : ""}`,
                      result,
                      message: result === "OVERLAP" ? `Row #${c.inputRow}: created — overlaps ${overlapWith}.` : `Row #${c.inputRow}: created successfully.`,
                      relatedRuleId: overlapWith,
                      inputRow: c.inputRow,
                    });
                  }
                  i++;
                }
    }
    // Blocked-at-validation rows appear as skipped results so the export reconciles every input row.
    for (const b of issues.filter((x) => x.verdict === "BLOCKED")) {
      items.push({
        ruleId: "—",
        scope: `Row #${b.inputRow}`,
        result: "STRICT_CONFLICT",
        message: b.message,
        inputRow: b.inputRow,
      });
    }
    return {
      id: `TASK-CSV-${nowIso.slice(11, 19).replace(/:/g, "")}`,
      kind: "CREATE",
      submittedAt: nowIso,
      author: AUTHOR,
      durationMs: 1200 + items.length * 60,
      status: "ONGOING",
      pendingRules: pending,
      items,
    };
  };

  const buildImportUpdateTask = (
    values: { ruleId: string; name?: string; rate?: number; startDate?: string | null; endDate?: string | null }[],
    issues: RowIssue[],
    nowIso: string
  ): Task => {
    const items: TaskItem[] = values.map((u) => {
      const r = rules.find((x) => x.id === u.ruleId);
      const changes = [
        u.name ? `name → "${u.name}"` : "",
        u.rate !== undefined ? `rate → ${u.rate}%` : "",
        u.startDate ? `start → ${u.startDate}` : "",
        u.endDate ? `end → ${u.endDate}` : "",
      ].filter(Boolean);
      return {
        ruleId: u.ruleId,
        scope: r ? r.market + " · " + (r.category ?? "All categories") : u.ruleId,
        result: "CREATED" as const,
        message: changes.join(" · "),
      };
    });
    for (const b of issues.filter((x) => x.verdict === "BLOCKED")) {
      items.push({
        ruleId: "—",
        scope: `Row #${b.inputRow}`,
        result: "STRICT_CONFLICT",
        message: b.message,
        inputRow: b.inputRow,
      });
    }
    return {
      id: `TASK-CSVU-${nowIso.slice(11, 19).replace(/:/g, "")}`,
      kind: "UPDATE",
      submittedAt: nowIso,
      author: AUTHOR,
      durationMs: 1000 + values.length * 80,
      status: "ONGOING",
      pendingRules: [],
      update: {
        ruleIds: values.map((v) => v.ruleId),
        // Prototype simplification: commitTask applies one uniform value set per
        // task, so we apply the first row's values; per-row fidelity lands with
        // the real backend's bulk endpoint.
        values: {
          ...(values[0]?.name ? { name: values[0].name } : {}),
          ...(values[0]?.rate !== undefined ? { commission_rate: values[0].rate } : {}),
          ...(values[0]?.startDate ? { start_date: values[0].startDate } : {}),
          ...(values[0]?.endDate ? { end_date: values[0].endDate } : {}),
        } satisfies BulkUpdateValues,
      },
      items,
    };
  };

  // Demo task for the "import-tracking" scenario (module-level pure builder below).

  const onImportSubmit = (payload: ImportPayload): string => {
    const nowIso = new Date().toISOString();
    const task =
      payload.mode === "create"
        ? buildImportCreateTask(payload.createCandidates, payload.issues, nowIso)
        : buildImportUpdateTask(payload.updateValues, payload.issues, nowIso);
    // Re-import guardrail: skipped duplicates surface as SKIPPED results so
    // the task results + export reconcile every input row.
    for (const row of payload.skippedDuplicates) {
      const dup = payload.issues.find((x) => x.inputRow === row && x.verdict === "DUPLICATE");
      task.items.push({
        ruleId: "—",
        scope: `Row #${row}`,
        result: "SKIPPED",
        message: `Skipped as possible duplicate: ${dup?.message ?? "matches a previously imported rule"}.`,
        inputRow: row,
      });
    }
    // Strict conflicts found at Check: not created, reported with the rule they duplicate.
    for (const c of payload.skippedConflicts) {
      task.items.push({
        ruleId: "—",
        scope: c.scopeLabel,
        result: "STRICT_CONFLICT",
        message: `Row #${c.inputRow}: not created — an identical rule already exists (${c.relatedRuleId}).`,
        relatedRuleId: c.relatedRuleId,
        inputRow: c.inputRow,
      });
    }
    // The import drawer shows progress and results itself (its Results step), so
    // the task runs without auto-opening the Tasks panel on top of it.
    runTask(task);
    return task.id;
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportSample(null);
  };

  /** From the import drawer's Results step: swap to the Tasks panel on that task. */
  const onViewImportTask = (taskId: string) => {
    closeImport();
    const t = setTimeout(() => {
      setFocusTaskId(taskId);
      setTasksOpen(true);
    }, DRAWER_TRANSITION_MS);
    timers.current.push(t);
  };

  // Re-import guardrail: scope keys of rules created by past CSV import tasks
  // in this session, so a re-uploaded file can be flagged before submit.
  const importedScopes = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "DONE")
        .flatMap((t) =>
          t.pendingRules.map((r) => ({ scopeKey: importedScopeKey(r), ruleId: r.id }))
        ),
    [tasks]
  );

  // Export a task's results (PRD: input row + task meta + every outcome).
  const onExportTaskResults = (task: Task) => {
    downloadCsv(`smartco-task-${task.id.toLowerCase()}-results.csv`, taskResultsToCsv(task));
  };

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
            Bulk-manage commission rules via CSV import and export. Exports cover the full filtered set.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ongoingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--rev-text-mid)" }}>
              <RevSpinner size={16} />
              {ongoingCount} rule{plural(ongoingCount)} processing
            </span>
          )}
          <RevButton variant="secondary" onClick={() => setTasksOpen(true)}>
            Tasks
          </RevButton>
          <RevButton variant="secondary" onClick={onExport}>
            Export CSV
          </RevButton>
          <RevButton variant="secondary" onClick={() => setImportOpen(true)}>
            Import CSV
          </RevButton>
          <RevButton variant="primary" onClick={() => setCreateOpen(true)}>
            + New rule
          </RevButton>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-40"><RevSelect label="Market" options={[...MARKETS].sort()} selected={filters.market} onChange={(v) => set("market", v)} /></div>
        <div className="w-44"><RevSelect label="Category" options={[...CATEGORIES].sort()} selected={filters.category} onChange={(v) => set("category", v)} /></div>
        <div className="w-48"><RevInput label="Product ID" placeholder="Filter by product ID…" value={filters.product} onChange={(v) => set("product", v)} /></div>
        <div className="w-40"><RevSelect label="Grade" options={[...GRADES].sort()} selected={filters.grade} onChange={(v) => set("grade", v as Grade[])} /></div>
        <div className="w-44">
          <RevSelect
            label="Offer type"
            options={OFFER_TYPES.map((o) => o.label)}
            selected={filters.offerType.map(offerTypeLabel)}
            onChange={(labels) => {
              const codes = labels
                .map((l) => OFFER_TYPES.find((o) => o.label === l)?.code)
                .filter((c): c is OfferTypeCode => c !== undefined);
              set("offerType", codes);
            }}
          />
        </div>
        <div className="w-40"><RevSelect label="Brand" options={[...BRANDS].sort()} selected={filters.brand} onChange={(v) => set("brand", v as Brand[])} /></div>
        <div className="w-44"><RevInput label="Seller ID" placeholder="Filter by seller ID…" value={filters.seller} onChange={(v) => set("seller", v)} /></div>
        <div className="w-36"><RevSelect label="State" options={["ACTIVE", "INACTIVE"]} selected={filters.state} onChange={(v) => set("state", v)} /></div>
        <div className="w-36"><RevSelect label="Status" options={[...STATUS_FILTER_OPTIONS]} selected={filters.status} onChange={(v) => set("status", v as Step3Filters["status"])} /></div>
        <div className="w-56"><RevInput label="Search" placeholder="Rule ID or campaign name…" value={filters.search} onChange={(v) => set("search", v)} /></div>
      </div>

      {/* Count + bulk actions */}
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
              {["Market", "Category", "Product ID", "Grade", "Offer type", "Brand", "Sellers", "Commission", "State"].map((h) => (
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
              const archived = r.status === "ARCHIVED";
              return (
                <tr key={r.id} data-rev-row className="transition-colors" style={{ borderBottom: "1px solid var(--rev-border)", opacity: archived ? 0.6 : 1 }}>
                  <td className="px-4 py-4 align-middle">
                    <RevCheckbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.id}`} />
                  </td>
                  <td className={CELL}><PriorityTag rule={r} /></td>
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
                  <td className={CELL}><RevPill flag={r.market}>{r.market}</RevPill></td>
                  <td className={CELL_WRAP} style={{ color: "var(--rev-text-mid)" }}>
                    {r.category ?? <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All categories</span>}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.product_id ?? <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All products</span>}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.grade ?? <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All grades</span>}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.offer_type !== null ? (
                      offerTypeLabel(r.offer_type)
                    ) : (
                      <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All offer types</span>
                    )}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.brand ?? <span className="italic" style={{ color: "var(--rev-text-muted)" }}>All brands</span>}
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
                  <td className={CELL}><StateBadge state={r.state} /></td>
                  <td className={CELL}><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-10 text-center text-sm" style={{ color: "var(--rev-text-muted)" }}>
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
      <CreateRulePanel open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={onCreate} />
      <BulkUpdatePanel open={updateOpen} count={selectedCount} onClose={() => setUpdateOpen(false)} onSubmit={onBulkUpdate} />
      <ArchiveConfirm open={archiveOpen} count={selectedCount} onClose={() => setArchiveOpen(false)} onConfirm={onArchive} />
      <ImportCsvDrawer
        open={importOpen}
        onClose={closeImport}
        rules={rules}
        importedScopes={importedScopes}
        tasks={tasks}
        sample={importSample}
        onSubmit={onImportSubmit}
        onExportResults={onExportTaskResults}
        onViewTask={onViewImportTask}
      />
      <TaskPanel open={tasksOpen} tasks={tasks} onClose={() => setTasksOpen(false)} initialTaskId={focusTaskId} onExportResults={onExportTaskResults} />
    </div>
  );
}
