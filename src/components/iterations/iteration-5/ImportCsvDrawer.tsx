"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MARKETS, type Market } from "@/lib/types";
import { REV_RADIUS } from "../iteration-1/tokens";
import { DRAWER_TRANSITION_MS, Drawer, RevButton } from "../iteration-3/Drawer";
import { RevCheckbox, RevDivider, RevLink, RevSpinner, RevTag } from "../iteration-3/revolve";
import { RevPagination } from "../iteration-1/RevPagination";
import type { Step3Rule } from "../iteration-3/logic";
import type { Task } from "../iteration-3/engine";
import {
  CREATE_TEMPLATE_COLUMNS,
  CREATE_TEMPLATE_CSV,
  UPDATE_TEMPLATE_COLUMNS,
  UPDATE_TEMPLATE_CSV,
  classifyCandidate,
  downloadCsv,
  flagReImports,
  parseCsv,
  readCsv,
  validateCreateRows,
  validateUpdateRows,
  type CandidateRow,
  type CsvMode,
  type RowIssue,
} from "./csv";
import type { ImportSample } from "./samples";
import {
  IconBlocked,
  IconCheckInCircle,
  IconSpreadsheet,
  IconWarning,
  RevFileUpload,
  RevInfoBlock,
  RevRadioFull,
  RevStepper,
  RevTable,
  RevTextList,
  type RevTableColumn,
} from "./import-ui";

/**
 * Step 5 import drawer (sub-PRD 6505926261). Design: Figma "CSV import · flow v2"
 * (Homepage file, node 6097:820); the Check step follows "CSV import · 2 Check ·
 * redesign · verdict first" (node 6202:1553). North star: an editor always knows
 * what the import will do before confirming, and what it did after.
 *
 * Three steps, each mapped to the PRD's user stories:
 * 1. Upload  — pick create/update, download the template, select the file. A file
 *              with the wrong columns fails here, before any row is checked.
 * 2. Check   — CSV formatting validation only (blocked rows, warnings, possible
 *              re-import duplicates), per the PRD: no conflict checking
 *              pre-submit. Conflicts are detected during processing and surface
 *              as skipped rows in Results. Confirm imports the ready rows.
 * 3. Results — progress while the task runs, then the outcome per affected row,
 *              with links to export the results and to the task in Tasks.
 */

type Step = "upload" | "check" | "results";
const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "check", label: "Check" },
  { id: "results", label: "Results" },
];

type UpdateValue = { ruleId: string; name?: string; rate?: number; startDate?: string | null; endDate?: string | null };
type Classified = { cand: CandidateRow; cls: ReturnType<typeof classifyCandidate> };

/** What the drawer hands to the view on confirm. */
export interface ImportPayload {
  mode: CsvMode;
  /** Rows to create — strict conflicts and skipped duplicates are already left out. */
  createCandidates: CandidateRow[];
  skippedDuplicates: number[];
  /** Rows not created because an identical rule exists (shown as skipped in the task results). */
  skippedConflicts: { inputRow: number; relatedRuleId?: string; scopeLabel: string }[];
  updateValues: UpdateValue[];
  issues: RowIssue[];
}

/** Frozen copy of what was confirmed, so Results doesn't change if the rules table does. */
interface Submitted {
  taskId: string;
  mode: CsvMode;
  fileName: string;
  importCount: number;
  overlaps: Classified[];
  strict: Classified[];
  skippedDuplicates: RowIssue[];
  blockedCount: number;
  updates: UpdateValue[];
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** 🚀 Components "Tag" (size=small): 16px tall, 2px side padding, 2px radius (RevTag.md small spec). */
const TAG_STYLE: React.CSSProperties = { borderRadius: REV_RADIUS.xs, padding: "0 2px", lineHeight: "16px" };

/** Rows-per-page of the Check step tables (RevPagination, same as the rules table). */
const LIST_PAGE_SIZE = 5;

/**
 * PRD (sub-PRD 6505926261, per Lluc): before submit the backend validates CSV
 * formatting only. Identical rules and overlaps are detected during processing
 * and surface in Results. Keep this `false` to match the PRD. Set it to `true`
 * to preview the design proposal that also shows them on Check (third drawer of
 * the Figma redesign): a "will be skipped" table, an overlap warning, and the
 * overlapping rows listed first.
 */
const SHOW_CONFLICTS_ON_CHECK = false;

const REASON_COLUMNS: RevTableColumn[] = [
  { key: "row", header: "Row", width: 72 },
  { key: "reason", header: "Reason" },
];
const IMPORT_COLUMNS: RevTableColumn[] = [
  { key: "row", header: "Row", width: 72 },
  { key: "campaign", header: "Campaign" },
  { key: "commission", header: "Commission", width: 136, type: "number" },
];
const UPDATE_COLUMNS: RevTableColumn[] = [
  { key: "rule", header: "Rule" },
  { key: "change", header: "Change" },
];

/** Labels arrive " · "-separated (classifyCandidate, describeUpdate); the Check step reads them as a comma list. */
const commaList = (label: string) => label.split(" · ").join(", ");

function pageOf<T>(items: T[], page: number): T[] {
  return items.slice((page - 1) * LIST_PAGE_SIZE, page * LIST_PAGE_SIZE);
}

/** Keeps a page valid when its list shrinks (e.g. after ticking a duplicate's "import anyway"). */
function clampPage(page: number, total: number): number {
  return Math.min(page, Math.max(1, Math.ceil(total / LIST_PAGE_SIZE)));
}

/** Number of rules one CSV row fans out to (one per market × category × grade × brand × offer type × seller). */
function ruleCount(c: CandidateRow): number {
  return (
    (c.markets.length || MARKETS.length) *
    (c.categories.length || 1) *
    (c.grades.length || 1) *
    (c.brands.length || 1) *
    (c.offerTypes.length || 1) *
    (c.sellerIds.length || 1)
  );
}

function describeUpdate(u: UpdateValue): string {
  return [
    u.name ? `name → "${u.name}"` : "",
    u.rate !== undefined ? `rate → ${u.rate}%` : "",
    u.startDate ? `start → ${u.startDate}` : "",
    u.endDate ? `end → ${u.endDate}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold leading-5" style={{ color: "var(--rev-text-hi)" }}>
      {children}
    </h3>
  );
}

function Helper({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
      {children}
    </p>
  );
}

/** One block of the Check step: 20/28 display title, optional 14/20 description, 16px to its content. */
function CheckSection({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-xl font-semibold leading-7" style={{ color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-display)" }}>
          {title}
        </h4>
        {description && <Helper>{description}</Helper>}
      </div>
      {children}
    </section>
  );
}

/** Row count on the left, RevPagination on the right. Renders nothing while the table fits on one page. */
function TablePager({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(total / LIST_PAGE_SIZE);
  if (pages <= 1) return null;
  const from = (page - 1) * LIST_PAGE_SIZE + 1;
  const to = Math.min(total, page * LIST_PAGE_SIZE);
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
        {from === to ? from : `${from} to ${to}`} of {plural(total, "row")}
      </span>
      <RevPagination page={page} total={pages} onChange={onChange} />
    </div>
  );
}

export function ImportCsvDrawer({
  open,
  onClose,
  rules,
  importedScopes,
  tasks,
  sample,
  onSubmit,
  onExportResults,
  onViewTask,
}: {
  open: boolean;
  onClose: () => void;
  rules: Step3Rule[];
  /** Scope keys + rule ids created by past CSV imports in this session (re-import guardrail). */
  importedScopes: { scopeKey: string; ruleId: string }[];
  /** The view's task list — Results reads the submitted task's status from here. */
  tasks: Task[];
  /** Dev scenarios: a sample file to load straight into the Check step when the drawer opens. */
  sample?: ImportSample | null;
  /** Called on confirm — the view builds + runs the async task and returns its id. */
  onSubmit: (payload: ImportPayload) => string;
  onExportResults: (task: Task) => void;
  /** Close this drawer and open the task in the Tasks panel. */
  onViewTask: (taskId: string) => void;
}) {
  const [mode, setMode] = useState<CsvMode>("create");
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<{ message: string; missing: string[] } | null>(null);
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [updateValues, setUpdateValues] = useState<UpdateValue[]>([]);
  /** Row numbers the editor chose to import despite a DUPLICATE flag (default: skip). */
  const [importAnyway, setImportAnyway] = useState<Set<number>>(new Set());
  /** Pages of the Check step tables (LIST_PAGE_SIZE rows per page). */
  const [listPage, setListPage] = useState(1);
  const [blockedPage, setBlockedPage] = useState(1);
  const [skippedPage, setSkippedPage] = useState(1);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const clearFile = () => {
    setFileName("");
    setFileError(null);
    setIssues([]);
    setRowCount(0);
    setCandidates([]);
    setUpdateValues([]);
    setImportAnyway(new Set());
    setListPage(1);
    setBlockedPage(1);
    setSkippedPage(1);
  };

  const reset = () => {
    setMode("create");
    setStep("upload");
    clearFile();
    setSubmitted(null);
  };

  /** Parse + validate a file's text. Returns true when the file can go on to Check. */
  const ingest = (name: string, text: string, forMode: CsvMode): boolean => {
    clearFile();
    setFileName(name);
    const parsed = readCsv(text, forMode);
    if (parsed.headerError) {
      const expected: readonly string[] = forMode === "create" ? CREATE_TEMPLATE_COLUMNS : UPDATE_TEMPLATE_COLUMNS;
      const header = (parseCsv(text)[0] ?? []).map((h) => h.trim());
      const missing = header.length ? expected.filter((c) => !header.includes(c)) : [];
      setFileError({
        message: missing.length ? `The columns don't match the ${forMode} template.` : "This file is empty.",
        missing,
      });
      return false;
    }
    if (parsed.rows.length === 0) {
      setFileError({ message: "This file has column headers but no rows.", missing: [] });
      return false;
    }
    setRowCount(parsed.rows.length);
    if (forMode === "create") {
      const validation = validateCreateRows(parsed.rows);
      setIssues(flagReImports(parsed.rows, validation, importedScopes));
      const blocked = new Set(validation.filter((i) => i.verdict === "BLOCKED").map((i) => i.inputRow));
      const split = (v: string) => (!v || v.toUpperCase() === "ALL" ? [] : v.split(";").map((s) => s.trim()).filter(Boolean));
      setCandidates(
        parsed.rows
          .filter((r) => !blocked.has(r.inputRow))
          .map((r) => ({
            inputRow: r.inputRow,
            markets: split(r.cells.market) as Market[],
            categories: split(r.cells.category),
            productIds: split(r.cells.product_id),
            grades: split(r.cells.grade),
            brands: split(r.cells.brand),
            offerTypes: split(r.cells.offer_type),
            sellerIds: split(r.cells.seller_id),
            campaignName: r.cells.campaign_name,
            rate: Number(r.cells.commission_rate),
            startDate: r.cells.start_date || null,
            endDate: r.cells.end_date || null,
          }))
      );
    } else {
      const validation = validateUpdateRows(parsed.rows, rules);
      setIssues(validation);
      const blocked = new Set(validation.filter((i) => i.verdict === "BLOCKED").map((i) => i.inputRow));
      setUpdateValues(
        parsed.rows
          .filter((r) => !blocked.has(r.inputRow))
          .map((r) => ({
            ruleId: r.cells.rule_id,
            ...(r.cells.campaign_name ? { name: r.cells.campaign_name } : {}),
            ...(r.cells.commission_rate ? { rate: Number(r.cells.commission_rate) } : {}),
            ...(r.cells.start_date ? { startDate: r.cells.start_date } : {}),
            ...(r.cells.end_date ? { endDate: r.cells.end_date } : {}),
          }))
      );
    }
    return true;
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => ingest(file.name, String(reader.result ?? ""), mode);
    reader.readAsText(file);
  };

  // A new file, mode or step re-starts the Check tables at page 1.
  useEffect(() => {
    setListPage(1);
    setBlockedPage(1);
    setSkippedPage(1);
  }, [step, fileName, mode]);

  // Opening with a scenario sample loads it and jumps to Check; closing resets the
  // drawer once the slide-out has finished, so the content doesn't flash on the way out.
  useEffect(() => {
    if (open) {
      if (sample) {
        setSubmitted(null);
        setMode(sample.mode);
        setStep(ingest(sample.fileName, sample.text, sample.mode) ? "check" : "upload");
      }
      return;
    }
    const t = setTimeout(reset, DRAWER_TRANSITION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sample]);

  // ── Derived check results ─────────────────────────────────────────────────
  // A row can carry several issues; counts are per row, not per issue.
  const groupByRow = (verdict: RowIssue["verdict"]) => {
    const byRow = new Map<number, string[]>();
    for (const i of issues) if (i.verdict === verdict) byRow.set(i.inputRow, [...(byRow.get(i.inputRow) ?? []), i.message]);
    return [...byRow.entries()].map(([inputRow, messages]) => ({ inputRow, messages }));
  };
  const blockedRows = groupByRow("BLOCKED");
  const blockedSet = new Set(blockedRows.map((b) => b.inputRow));
  const warningRows = groupByRow("WARNING").filter((w) => !blockedSet.has(w.inputRow));
  const duplicates = issues.filter((i) => i.verdict === "DUPLICATE");
  const skippedDuplicates = duplicates.filter((d) => !importAnyway.has(d.inputRow));
  const skippedDuplicateRows = new Set(skippedDuplicates.map((d) => d.inputRow));

  // Overlaps and strict conflicts against the existing rules (create mode only —
  // an update changes rate / dates / name, never a rule's scope).
  const classified: Classified[] = useMemo(() => {
    if (mode !== "create") return [];
    return candidates.filter((c) => !skippedDuplicateRows.has(c.inputRow)).map((c) => ({ cand: c, cls: classifyCandidate(c, rules) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, mode, rules, importAnyway, issues]);
  const strictConflicts = classified.filter((c) => c.cls.result === "STRICT_CONFLICT");
  const overlaps = classified.filter((c) => c.cls.result === "OVERLAP");
  const ready = classified.filter((c) => c.cls.result !== "STRICT_CONFLICT");

  const importCount = mode === "create" ? ready.length : updateValues.length;
  const rulesToCreate = ready.reduce((n, c) => n + ruleCount(c.cand), 0);
  const nothingFlagged =
    blockedRows.length === 0 && strictConflicts.length === 0 && overlaps.length === 0 && duplicates.length === 0 && warningRows.length === 0;
  const campaignOf = (inputRow: number) => candidates.find((c) => c.inputRow === inputRow)?.campaignName;
  const rowLabel = (inputRow: number) => {
    const name = campaignOf(inputRow);
    return name ? `Row ${inputRow} · ${name}` : `Row ${inputRow}`;
  };

  const confirm = () => {
    const taskId = onSubmit({
      mode,
      createCandidates: ready.map((c) => c.cand),
      skippedDuplicates: skippedDuplicates.map((d) => d.inputRow),
      skippedConflicts: strictConflicts.map(({ cand, cls }) => ({
        inputRow: cand.inputRow,
        relatedRuleId: cls.relatedRuleId,
        scopeLabel: cls.scopeLabel,
      })),
      updateValues,
      issues,
    });
    setSubmitted({
      taskId,
      mode,
      fileName,
      importCount,
      overlaps,
      strict: strictConflicts,
      skippedDuplicates,
      blockedCount: blockedRows.length,
      updates: updateValues,
    });
    setStep("results");
  };

  const task = submitted ? tasks.find((t) => t.id === submitted.taskId) : undefined;
  const importing = step === "results" && task?.status === "ONGOING";

  // ── Check step display ────────────────────────────────────────────────────
  const showConflicts = SHOW_CONFLICTS_ON_CHECK && mode === "create";
  const done = mode === "create" ? "imported" : "updated";
  const verdict =
    importCount === 0
      ? `No rows will be ${done}`
      : importCount === rowCount
        ? rowCount === 1
          ? `The row will be ${done}`
          : `All ${rowCount} rows will be ${done}`
        : `${importCount} of ${plural(rowCount, "row")} will be ${done}`;
  const allClear = nothingFlagged && importCount > 0;
  const warningSet = new Set(warningRows.map((w) => w.inputRow));
  const overlapSet = new Set(showConflicts ? overlaps.map((o) => o.cand.inputRow) : []);
  const flagRank = (inputRow: number) => (warningSet.has(inputRow) ? 0 : overlapSet.has(inputRow) ? 1 : 2);
  // Flagged rows lead the table. Display only: `ready` keeps file order for confirm().
  const readySorted = [...ready].sort(
    (a, b) => flagRank(a.cand.inputRow) - flagRank(b.cand.inputRow) || a.cand.inputRow - b.cand.inputRow
  );
  const listTotal = mode === "create" ? readySorted.length : updateValues.length;
  const pageSafe = clampPage(listPage, listTotal);
  const blockedPageSafe = clampPage(blockedPage, blockedRows.length);
  const skippedPageSafe = clampPage(skippedPage, strictConflicts.length);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = (() => {
    if (step === "upload")
      return (
        <>
          <RevButton variant="secondary" onClick={onClose}>Cancel</RevButton>
          <RevButton variant="primary" onClick={() => setStep("check")} disabled={!fileName || !!fileError}>
            Check file
          </RevButton>
        </>
      );
    if (step === "check")
      return (
        <>
          <p className="mr-auto min-w-0 text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
            {importCount === 0
              ? "There's nothing to import from this file. Go back to upload a corrected one."
              : `Nothing is ${mode === "create" ? "created" : "updated"} until you import.`}
          </p>
          <RevButton variant="secondary" onClick={() => setStep("upload")}>Back</RevButton>
          <RevButton variant="primary" onClick={confirm} disabled={importCount === 0}>
            Import {plural(importCount, "row")}
          </RevButton>
        </>
      );
    if (importing)
      return (
        <>
          <RevButton variant="secondary" onClick={() => submitted && onViewTask(submitted.taskId)}>View in Tasks</RevButton>
          <RevButton variant="primary" onClick={onClose}>Close</RevButton>
        </>
      );
    return (
      <>
        {task && <RevButton variant="secondary" onClick={() => onExportResults(task)}>Export results</RevButton>}
        <RevButton variant="primary" onClick={onClose}>Done</RevButton>
      </>
    );
  })();

  const templateLink = (
    <RevLink
      className="font-semibold"
      onClick={() =>
        downloadCsv(
          mode === "create" ? "smartco-import-create-template.csv" : "smartco-import-update-template.csv",
          mode === "create" ? CREATE_TEMPLATE_CSV : UPDATE_TEMPLATE_CSV
        )
      }
    >
      Download template
    </RevLink>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Import rules from CSV"
      width={640}
      footer={footer}
    >
      <div className="flex flex-col gap-6">
        <RevStepper
          steps={STEPS.map((s) => s.label)}
          current={STEPS.findIndex((s) => s.id === step)}
          // Going back is only possible before the import is confirmed.
          onStepClick={step === "check" ? (i) => setStep(STEPS[i].id) : undefined}
        />

        {step !== "check" && (
          <p className="text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
            Bulk-create or bulk-update commission rules from a template file.
          </p>
        )}

        {/* ── 1. Upload ─────────────────────────────────────────────────── */}
        {step === "upload" && (
          <>
            <section className="flex flex-col gap-3" role="radiogroup" aria-label="What do you want to do?">
              <div className="flex items-center justify-between">
                <SectionTitle>What do you want to do?</SectionTitle>
                {templateLink}
              </div>
              <RevRadioFull
                name="import-mode"
                checked={mode === "create"}
                onChange={() => { setMode("create"); clearFile(); }}
                label="Create new rules"
                description="One row per rule. Scope columns accept ALL or ;-separated values."
              />
              <RevRadioFull
                name="import-mode"
                checked={mode === "update"}
                onChange={() => { setMode("update"); clearFile(); }}
                label="Update existing rules"
                description="Change rate, dates or campaign name. Start from an export so every row has its rule_id."
              />
            </section>

            <section className="flex flex-col gap-3">
              <SectionTitle>CSV file</SectionTitle>
              <RevFileUpload
                label="Select CSV file"
                filledLabel="Select another file"
                accept=".csv,text/csv"
                fileName={fileName}
                helper={fileName ? undefined : "Use the template so the column headers match exactly."}
                error={fileError?.message}
                onFile={onFile}
                onRemove={clearFile}
              />
              {fileError && fileError.missing.length > 0 && (
                <RevInfoBlock tone="danger" title={`${plural(fileError.missing.length, "column")} ${fileError.missing.length === 1 ? "is" : "are"} missing`}>
                  {fileError.missing.join(", ")}. Nothing was imported.
                </RevInfoBlock>
              )}
            </section>
          </>
        )}

        {/* ── 2. Check ──────────────────────────────────────────────────── */}
        {step === "check" && (
          <>
            {/* Verdict first: the outcome, the file it applies to, then only the exceptions as tags. */}
            <div className="flex flex-col" role="status">
              <h3
                className="text-[28px] font-semibold leading-10"
                style={{ color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-display)" }}
              >
                {verdict}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <IconSpreadsheet style={{ color: "var(--rev-success)" }} />
                <p className="min-w-0 text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
                  <span className="break-all font-semibold" style={{ color: "var(--rev-text-hi)" }}>{fileName}</span>{" "}
                  <span className="ml-1">
                    {mode === "create" ? "Create new rules" : "Update existing rules"}, {plural(rowCount, "row")}
                  </span>
                </p>
              </div>
              {(allClear || blockedRows.length > 0 || duplicates.length > 0 || warningRows.length > 0 || (showConflicts && (strictConflicts.length > 0 || overlaps.length > 0))) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allClear && <RevTag variant="success" size="small" style={TAG_STYLE}>No issues found</RevTag>}
                  {blockedRows.length > 0 && <RevTag variant="danger" size="small" style={TAG_STYLE}>{blockedRows.length} left out</RevTag>}
                  {showConflicts && strictConflicts.length > 0 && <RevTag variant="danger" size="small" style={TAG_STYLE}>{strictConflicts.length} skipped</RevTag>}
                  {duplicates.length > 0 && <RevTag variant="info" size="small" style={TAG_STYLE}>{plural(duplicates.length, "possible duplicate")}</RevTag>}
                  {warningRows.length > 0 && <RevTag variant="warning" size="small" style={TAG_STYLE}>{warningRows.length} to double-check</RevTag>}
                  {showConflicts && overlaps.length > 0 && <RevTag variant="warning" size="small" style={TAG_STYLE}>{plural(overlaps.length, "overlap")}</RevTag>}
                </div>
              )}
            </div>

            {blockedRows.length > 0 && (
              <>
                <RevDivider />
                <CheckSection
                  title={`${plural(blockedRows.length, "row")} will be left out`}
                  description={`To include ${blockedRows.length === 1 ? "it" : "them"}, fix the file and upload it again.`}
                >
                  <RevTable
                    caption="Rows left out"
                    columns={REASON_COLUMNS}
                    rows={pageOf(blockedRows, blockedPageSafe).map((b) => ({
                      key: b.inputRow,
                      cells: { row: { text: b.inputRow }, reason: { text: b.messages.join(" ") } },
                    }))}
                  />
                  <TablePager page={blockedPageSafe} total={blockedRows.length} onChange={setBlockedPage} />
                </CheckSection>
              </>
            )}

            {/* Conflicts (identical rules / overlaps) are NOT checked here per the PRD:
                the backend validates CSV formatting only, and conflict detection
                happens during processing. They surface in the Results step. The
                blocks behind `showConflicts` are the design proposal, off by default
                (see SHOW_CONFLICTS_ON_CHECK). */}
            {showConflicts && strictConflicts.length > 0 && (
              <>
                <RevDivider />
                <CheckSection
                  title={`${plural(strictConflicts.length, "row")} will be skipped`}
                  description={`An identical rule already exists, so ${strictConflicts.length === 1 ? "this row" : "these rows"} won't be imported.`}
                >
                  <RevTable
                    caption="Rows skipped"
                    columns={REASON_COLUMNS}
                    rows={pageOf(strictConflicts, skippedPageSafe).map(({ cand, cls }) => ({
                      key: cand.inputRow,
                      cells: {
                        row: { text: cand.inputRow },
                        reason: { text: `Identical to ${cls.relatedRuleId ?? "an existing rule"}`, description: cand.campaignName },
                      },
                    }))}
                  />
                  <TablePager page={skippedPageSafe} total={strictConflicts.length} onChange={setSkippedPage} />
                </CheckSection>
              </>
            )}

            {duplicates.length > 0 && (
              <>
                <RevDivider />
                <section className="flex flex-col gap-3">
                  <RevInfoBlock
                    tone="info"
                    title={`${plural(duplicates.length, "row")} ${duplicates.length === 1 ? "looks" : "look"} already imported`}
                  >
                    Skipped unless you tick {duplicates.length === 1 ? "it" : "them"}.
                  </RevInfoBlock>
                  <RevTextList
                    items={duplicates.map((d) => ({
                      key: d.inputRow,
                      icon: <IconWarning />,
                      title: commaList(rowLabel(d.inputRow)),
                      description: `Matches ${d.relatedRuleId ?? "a rule"} from a previous import.`,
                      trailing: (
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm leading-6" style={{ color: "var(--rev-text-hi)" }}>
                          <RevCheckbox
                            checked={importAnyway.has(d.inputRow)}
                            onChange={() =>
                              setImportAnyway((prev) => {
                                const next = new Set(prev);
                                if (next.has(d.inputRow)) next.delete(d.inputRow);
                                else next.add(d.inputRow);
                                return next;
                              })
                            }
                          />
                          Import anyway
                        </label>
                      ),
                    }))}
                  />
                </section>
              </>
            )}

            {importCount > 0 && (
              <>
                <RevDivider />
                <CheckSection
                  title={`${plural(importCount, "row")} to ${mode === "create" ? "import" : "update"}`}
                  description={mode === "create" && rulesToCreate !== importCount ? `Creates ${plural(rulesToCreate, "rule")}.` : undefined}
                >
                  {warningRows.length === 1 && (
                    <RevInfoBlock tone="warning" title={`Row ${warningRows[0].inputRow} to double-check`}>
                      {warningRows[0].messages.join(" ")} This row will still be {done}.
                    </RevInfoBlock>
                  )}
                  {warningRows.length > 1 && (
                    <RevInfoBlock tone="warning" title={`${warningRows.length} rows to double-check`}>
                      <ul className="flex flex-col gap-1">
                        {warningRows.map((w) => (
                          <li key={w.inputRow}>Row {w.inputRow}: {w.messages.join(" ")}</li>
                        ))}
                      </ul>
                      <p className="mt-3">These rows will still be {done}.</p>
                    </RevInfoBlock>
                  )}
                  {showConflicts && overlaps.length > 0 && (
                    <RevInfoBlock
                      tone="warning"
                      title={overlaps.length === 1 ? `Row ${overlaps[0].cand.inputRow} overlaps an existing rule` : `${overlaps.length} rows overlap an existing rule`}
                    >
                      {overlaps.length === 1 ? "It" : "They"} will still be imported. Where rules overlap, the rule with the higher priority applies.
                    </RevInfoBlock>
                  )}
                  {mode === "create" ? (
                    <RevTable
                      caption="Rows to import"
                      columns={IMPORT_COLUMNS}
                      rows={pageOf(readySorted, pageSafe).map(({ cand, cls }) => ({
                        key: cand.inputRow,
                        cells: {
                          row: { text: cand.inputRow },
                          campaign: {
                            text: cand.campaignName,
                            description: `${overlapSet.has(cand.inputRow) && cls.relatedRuleId ? `Overlaps ${cls.relatedRuleId}. ` : ""}${commaList(cls.scopeLabel)}`,
                          },
                          commission: { text: `${cand.rate.toFixed(1)}%` },
                        },
                      }))}
                    />
                  ) : (
                    <RevTable
                      caption="Rules to update"
                      columns={UPDATE_COLUMNS}
                      rows={pageOf(updateValues, pageSafe).map((u) => ({
                        key: u.ruleId,
                        cells: {
                          rule: { text: u.ruleId, description: rules.find((x) => x.id === u.ruleId)?.name },
                          change: { text: commaList(describeUpdate(u)).replace(/ → /g, " to ") },
                        },
                      }))}
                    />
                  )}
                  <TablePager page={pageSafe} total={listTotal} onChange={setListPage} />
                </CheckSection>
              </>
            )}
          </>
        )}

        {/* ── 3. Results ────────────────────────────────────────────────── */}
        {step === "results" && submitted && importing && (
          <>
            <div className="flex flex-col items-center gap-3 pb-6 pt-12 text-center">
              <RevSpinner size={48} />
              <SectionTitle>Importing {plural(submitted.importCount, "row")}…</SectionTitle>
              <Helper>
                {submitted.fileName} · {submitted.mode === "create" ? "checking each row against existing rules" : "applying the changes"}
              </Helper>
            </div>
            <RevInfoBlock tone="info" title="You can close this panel">
              The import keeps running. Find it any time under Tasks on the rules page.
            </RevInfoBlock>
          </>
        )}

        {step === "results" && submitted && !importing && (() => {
          const createdIds = (inputRow: number) =>
            (task?.items ?? []).filter((it) => it.inputRow === inputRow && it.ruleId !== "—").map((it) => it.ruleId);
          const createdAs = (inputRow: number) => {
            const ids = createdIds(inputRow);
            if (ids.length === 0) return "Created.";
            return `Created as ${ids[0]}${ids.length > 1 ? ` and ${ids.length - 1} more` : ""}.`;
          };
          const isCreate = submitted.mode === "create";
          const skipped = submitted.strict.length + submitted.skippedDuplicates.length;
          const cleanRows = submitted.importCount - submitted.overlaps.length;
          const rulesCreated = (task?.items ?? []).filter((it) => it.ruleId !== "—").length;
          return (
            <>
              <section className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <SectionTitle>Import finished</SectionTitle>
                  <Helper>
                    <span className="break-all">{submitted.fileName}</span> · {plural(submitted.importCount + skipped, "row")} processed
                    {isCreate && rulesCreated !== submitted.importCount && ` · ${plural(rulesCreated, "rule")} created`}
                  </Helper>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isCreate ? (
                    <>
                      <RevTag variant="success" size="small" style={TAG_STYLE}>{cleanRows} created</RevTag>
                      {submitted.overlaps.length > 0 && <RevTag variant="warning" size="small" style={TAG_STYLE}>{submitted.overlaps.length} created with overlap</RevTag>}
                      {skipped > 0 && <RevTag variant="danger" size="small" style={TAG_STYLE}>{skipped} skipped</RevTag>}
                    </>
                  ) : (
                    <RevTag variant="success" size="small" style={TAG_STYLE}>{submitted.importCount} updated</RevTag>
                  )}
                </div>
              </section>

              {submitted.overlaps.length === 0 && skipped === 0 && (
                <RevInfoBlock
                  tone="success"
                  title={`${submitted.importCount === 1 ? "The row was" : `All ${submitted.importCount} rows were`} ${isCreate ? "imported" : "updated"}`}
                >
                  {isCreate ? "The new rules are in the table now." : "The changes are in the table now."}
                </RevInfoBlock>
              )}

              {submitted.overlaps.length > 0 && (
                <section className="flex flex-col gap-3">
                  <RevInfoBlock
                    tone="warning"
                    title={`${plural(submitted.overlaps.length, "new rule")} ${submitted.overlaps.length === 1 ? "overlaps" : "overlap"} an existing rule`}
                  >
                    {submitted.overlaps.length === 1 ? "It was" : "They were"} created. Where rules overlap, the rule with the higher priority applies.
                  </RevInfoBlock>
                  <RevTextList
                    items={submitted.overlaps.map(({ cand, cls }) => ({
                      key: cand.inputRow,
                      icon: <IconWarning />,
                      title: `Row ${cand.inputRow} · ${cand.campaignName}`,
                      description: `${createdAs(cand.inputRow)} Overlaps ${cls.relatedRuleId}.`,
                    }))}
                  />
                </section>
              )}

              {skipped > 0 && (
                <section className="flex flex-col gap-3">
                  <RevInfoBlock tone="danger" title={`${plural(skipped, "row")} ${skipped === 1 ? "was" : "were"} skipped`}>
                    Nothing was created for {skipped === 1 ? "this row" : "these rows"}.
                  </RevInfoBlock>
                  <RevTextList
                    items={[
                      ...submitted.strict.map(({ cand, cls }) => ({
                        key: `s-${cand.inputRow}`,
                        icon: <IconBlocked />,
                        title: `Row ${cand.inputRow} · ${cand.campaignName}`,
                        description: `Identical to ${cls.relatedRuleId}.`,
                      })),
                      ...submitted.skippedDuplicates.map((d) => ({
                        key: `d-${d.inputRow}`,
                        icon: <IconBlocked />,
                        title: rowLabel(d.inputRow),
                        description: `Already imported as ${d.relatedRuleId ?? "an existing rule"}.`,
                      })),
                    ]}
                  />
                </section>
              )}

              {!isCreate && submitted.updates.length > 0 && (
                <section className="flex flex-col gap-3">
                  <SectionTitle>{plural(submitted.updates.length, "rule")} updated</SectionTitle>
                  <RevTextList
                    items={submitted.updates.map((u) => ({ key: u.ruleId, icon: <IconCheckInCircle />, title: u.ruleId, description: describeUpdate(u) }))}
                  />
                </section>
              )}

              {submitted.blockedCount > 0 && (
                <Helper>
                  {plural(submitted.blockedCount, "blocked row")} {submitted.blockedCount === 1 ? "was" : "were"} left out. Export the results to see every row.
                </Helper>
              )}

              <RevLink className="self-start font-semibold" onClick={() => onViewTask(submitted.taskId)}>
                View this import in Tasks
              </RevLink>
            </>
          );
        })()}
      </div>
    </Drawer>
  );
}
