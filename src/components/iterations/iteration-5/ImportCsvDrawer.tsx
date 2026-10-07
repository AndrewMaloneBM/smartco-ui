"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MARKETS, type Market } from "@/lib/types";
import { REV_RADIUS } from "../iteration-1/tokens";
import { DRAWER_TRANSITION_MS, Drawer, RevButton } from "../iteration-3/Drawer";
import { RevCheckbox, RevLink, RevSpinner, RevTag } from "../iteration-3/revolve";
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
  IconWarning,
  RevFileUpload,
  RevInfoBlock,
  RevRadioFull,
  RevStepper,
  RevTextList,
} from "./import-ui";

/**
 * Step 5 import drawer (sub-PRD 6505926261). Design: Figma "CSV import · flow v2"
 * (Homepage file, node 6097:820). North star: an editor always knows what the
 * import will do before confirming, and what it did after.
 *
 * Three steps, each mapped to the PRD's user stories:
 * 1. Upload  — pick create/update, download the template, select the file. A file
 *              with the wrong columns fails here, before any row is checked.
 * 2. Check   — validation (ready vs blocked rows) + review of overlaps and strict
 *              conflicts, all before confirming. Confirm imports the ready rows.
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

/** 🚀 Components "Tag" (size=large): 24px tall, 4px side padding, 2px radius. */
const TAG_STYLE: React.CSSProperties = { borderRadius: REV_RADIUS.xs, padding: "0 4px", lineHeight: "24px" };

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
    <h3 className="text-base font-semibold leading-6" style={{ color: "var(--rev-text-hi)" }}>
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

/** Bordered, scrollable list of the rows that will be (or were) imported. */
function RowTable({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-h-64 flex-col overflow-y-auto" style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm }}>
      {children}
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
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const clearFile = () => {
    setFileName("");
    setFileError(null);
    setIssues([]);
    setRowCount(0);
    setCandidates([]);
    setUpdateValues([]);
    setImportAnyway(new Set());
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
      Download {mode} template
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

        <p className="text-sm leading-5" style={{ color: "var(--rev-text-low)" }}>
          Bulk-create or bulk-update commission rules from a template file.
        </p>

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
            <section className="flex flex-col gap-3">
              <div className="flex flex-col">
                <span className="break-all text-base font-semibold leading-6" style={{ color: "var(--rev-text-hi)" }}>{fileName}</span>
                <Helper>
                  {mode === "create" ? "Create new rules" : "Update existing rules"} · {plural(rowCount, "row")}
                </Helper>
              </div>
              <div className="flex flex-wrap gap-2">
                <RevTag variant={importCount > 0 ? "success" : "secondary"} size="large" style={TAG_STYLE}>{importCount} ready to import</RevTag>
                {blockedRows.length > 0 && <RevTag variant="danger" size="large" style={TAG_STYLE}>{blockedRows.length} blocked</RevTag>}
                {strictConflicts.length > 0 && <RevTag variant="danger" size="large" style={TAG_STYLE}>{plural(strictConflicts.length, "strict conflict")}</RevTag>}
                {overlaps.length > 0 && <RevTag variant="warning" size="large" style={TAG_STYLE}>{plural(overlaps.length, "overlap")}</RevTag>}
                {duplicates.length > 0 && <RevTag variant="info" size="large" style={TAG_STYLE}>{plural(duplicates.length, "possible duplicate")}</RevTag>}
                {warningRows.length > 0 && <RevTag variant="warning" size="large" style={TAG_STYLE}>{plural(warningRows.length, "warning")}</RevTag>}
              </div>
            </section>

            {nothingFlagged && (
              <RevInfoBlock tone="success" title={`${importCount === 1 ? "The row is" : `All ${importCount} rows are`} ready to import`}>
                {mode === "create" ? "No blocked rows, overlaps or strict conflicts found." : "No blocked rows found."}
              </RevInfoBlock>
            )}

            {blockedRows.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionTitle>
                  {plural(blockedRows.length, "blocked row")} will be left out
                </SectionTitle>
                <RevTextList
                  items={blockedRows.map((b) => ({ key: b.inputRow, icon: <IconBlocked />, title: `Row ${b.inputRow}`, description: b.messages.join(" ") }))}
                />
                <Helper>To include {blockedRows.length === 1 ? "it" : "them"}, fix the file and upload it again.</Helper>
              </section>
            )}

            {strictConflicts.length > 0 && (
              <section className="flex flex-col gap-3">
                <RevInfoBlock
                  tone="danger"
                  title={`${plural(strictConflicts.length, "row")} ${strictConflicts.length === 1 ? "is" : "are"} in strict conflict`}
                >
                  An identical rule already exists, so {strictConflicts.length === 1 ? "this row" : "these rows"} won&apos;t be created.
                </RevInfoBlock>
                <RevTextList
                  items={strictConflicts.map(({ cand, cls }) => ({
                    key: cand.inputRow,
                    icon: <IconBlocked />,
                    title: rowLabel(cand.inputRow),
                    description: `Identical to ${cls.relatedRuleId} · ${cls.scopeLabel}`,
                  }))}
                />
              </section>
            )}

            {overlaps.length > 0 && (
              <section className="flex flex-col gap-3">
                <RevInfoBlock
                  tone="warning"
                  title={`${plural(overlaps.length, "row")} ${overlaps.length === 1 ? "overlaps" : "overlap"} an existing rule`}
                >
                  {overlaps.length === 1 ? "It" : "They"}&apos;ll still be created. Where rules overlap, the rule with the higher priority applies.
                </RevInfoBlock>
                <RevTextList
                  items={overlaps.map(({ cand, cls }) => ({
                    key: cand.inputRow,
                    icon: <IconWarning />,
                    title: rowLabel(cand.inputRow),
                    description: `Overlaps ${cls.relatedRuleId} · ${cls.scopeLabel}`,
                  }))}
                />
              </section>
            )}

            {duplicates.length > 0 && (
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
                    title: rowLabel(d.inputRow),
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
            )}

            {warningRows.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionTitle>{plural(warningRows.length, "row")} to double-check</SectionTitle>
                <RevTextList
                  items={warningRows.map((w) => ({ key: w.inputRow, icon: <IconWarning />, title: rowLabel(w.inputRow), description: w.messages.join(" ") }))}
                />
                <Helper>{warningRows.length === 1 ? "This row is" : "These rows are"} still imported.</Helper>
              </section>
            )}

            {importCount > 0 && (
              <section className="flex flex-col gap-3">
                <SectionTitle>
                  {plural(importCount, "row")} to import
                  {mode === "create" && rulesToCreate !== importCount && (
                    <span className="font-normal" style={{ color: "var(--rev-text-low)" }}> · creates {plural(rulesToCreate, "rule")}</span>
                  )}
                </SectionTitle>
                <RowTable>
                  {mode === "create"
                    ? ready.map(({ cand, cls }) => (
                        <div key={cand.inputRow} className="flex items-center justify-between gap-3 px-3 py-2" style={{ borderBottom: "1px solid var(--rev-border)" }}>
                          <div className="flex min-w-0 flex-col">
                            <span className="text-sm font-semibold leading-5" style={{ color: "var(--rev-text-hi)" }}>{cand.campaignName}</span>
                            <span className="text-xs leading-4" style={{ color: "var(--rev-text-low)" }}>Row {cand.inputRow} · {cls.scopeLabel}</span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--rev-text-mid)" }}>{cand.rate.toFixed(1)}%</span>
                        </div>
                      ))
                    : updateValues.map((u) => {
                        const r = rules.find((x) => x.id === u.ruleId);
                        return (
                          <div key={u.ruleId} className="flex flex-col px-3 py-2" style={{ borderBottom: "1px solid var(--rev-border)" }}>
                            <span className="text-sm font-semibold leading-5" style={{ color: "var(--rev-text-hi)" }}>{u.ruleId}{r ? ` — ${r.name}` : ""}</span>
                            <span className="text-xs leading-4" style={{ color: "var(--rev-text-low)" }}>{describeUpdate(u)}</span>
                          </div>
                        );
                      })}
                </RowTable>
              </section>
            )}

            <Helper>
              {importCount === 0
                ? "There's nothing to import from this file. Go back to upload a corrected one."
                : `Nothing is ${mode === "create" ? "created" : "updated"} until you import. You can still go back or cancel.`}
            </Helper>
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
                      <RevTag variant="success" size="large" style={TAG_STYLE}>{cleanRows} created</RevTag>
                      {submitted.overlaps.length > 0 && <RevTag variant="warning" size="large" style={TAG_STYLE}>{submitted.overlaps.length} created with overlap</RevTag>}
                      {skipped > 0 && <RevTag variant="danger" size="large" style={TAG_STYLE}>{skipped} skipped</RevTag>}
                    </>
                  ) : (
                    <RevTag variant="success" size="large" style={TAG_STYLE}>{submitted.importCount} updated</RevTag>
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
