"use client";

import { useMemo, useRef, useState } from "react";
import { REV_RADIUS } from "../iteration-1/tokens";
import { Drawer, RevButton } from "../iteration-3/Drawer";
import { RevLink, RevTag } from "../iteration-3/revolve";
import type { Market } from "@/lib/types";
import type { Step3Rule } from "../iteration-3/logic";
import {
  CREATE_TEMPLATE_CSV,
  UPDATE_TEMPLATE_CSV,
  classifyCandidate,
  downloadCsv,
  flagReImports,
  readCsv,
  validateCreateRows,
  validateUpdateRows,
  type CandidateRow,
  type CsvMode,
  type RowIssue,
} from "./csv";

/**
 * Step 5 import drawer (sub-PRD 6505926261). Four steps in one drawer:
 * 1. Mode + upload (download template, pick file)
 * 2. Validation results (valid vs blocked rows, PRD's split)
 * 3. Review overlaps/strict conflicts before confirming
 * 4. Confirm → builds a real CREATE/UPDATE task via the existing async flow
 */

type Step = "upload" | "validation" | "review" | "done";

function StepHeader({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-5 w-5 items-center justify-center text-xs font-semibold"
        style={{
          borderRadius: 9999,
          background: active ? "var(--rev-text-hi)" : done ? "var(--rev-success-bg)" : "var(--rev-static-mid)",
          color: active ? "#fff" : done ? "var(--rev-success)" : "var(--rev-text-muted)",
        }}
      >
        {done ? "✓" : n}
      </span>
      <span
        className="text-sm"
        style={{ color: active ? "var(--rev-text-hi)" : "var(--rev-text-muted)", fontWeight: active ? 600 : 400 }}
      >
        {label}
      </span>
    </div>
  );
}

function TemplateLink({ label, csv, filename }: { label: string; csv: string; filename: string }) {
  return <RevLink onClick={() => downloadCsv(filename, csv)}>{label}</RevLink>;
}

export function ImportCsvDrawer({
  open,
  onClose,
  rules,
  importedScopes,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  rules: Step3Rule[];
  /** Scope keys + rule ids created by past CSV imports in this session (re-import guardrail). */
  importedScopes: { scopeKey: string; ruleId: string }[];
  /** Called on confirm — the view builds + runs the async task. */
  onSubmit: (payload: {
    mode: CsvMode;
    createCandidates: CandidateRow[];
    skippedDuplicates: number[];
    updateValues: { ruleId: string; name?: string; rate?: number; startDate?: string | null; endDate?: string | null }[];
    issues: RowIssue[];
  }) => void;
}) {
  const [mode, setMode] = useState<CsvMode>("create");
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  /** Row numbers the reviewer chose to import despite a DUPLICATE flag (default: skip). */
  const [importAnyway, setImportAnyway] = useState<Set<number>>(new Set());
  const [updateValues, setUpdateValues] = useState<
    { ruleId: string; name?: string; rate?: number; startDate?: string | null; endDate?: string | null }[]
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode("create");
    setStep("upload");
    setFileName("");
    setIssues([]);
    setRowCount(0);
    setCandidates([]);
    setImportAnyway(new Set());
    setUpdateValues([]);
  };

  const close = () => { onClose(); reset(); };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = readCsv(text, mode);
      setFileName(file.name);
      if (parsed.headerError) {
        setIssues([{ inputRow: 0, verdict: "BLOCKED", message: parsed.headerError }]);
        setRowCount(0);
        setCandidates([]);
        setUpdateValues([]);
        setStep("validation");
        return;
      }
      setRowCount(parsed.rows.length);
      setImportAnyway(new Set());
      if (mode === "create") {
        setIssues(flagReImports(parsed.rows, validateCreateRows(parsed.rows), importedScopes));
        const blocked = new Set(validateCreateRows(parsed.rows).filter((i) => i.verdict === "BLOCKED").map((i) => i.inputRow));
        setCandidates(
          parsed.rows
            .filter((r) => !blocked.has(r.inputRow))
            .map((r) => {
              const split = (v: string) => (!v || v.toUpperCase() === "ALL" ? [] : v.split(";").map((s) => s.trim()).filter(Boolean));
              return {
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
              };
            })
        );
      } else {
        const iss = validateUpdateRows(parsed.rows, rules);
        setIssues(iss);
        const blocked = new Set(iss.filter((i) => i.verdict === "BLOCKED").map((i) => i.inputRow));
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
      setStep("validation");
    };
    reader.readAsText(file);
  };

  const blocked = issues.filter((i) => i.verdict === "BLOCKED");
  const warnings = issues.filter((i) => i.verdict === "WARNING");
  const duplicates = issues.filter((i) => i.verdict === "DUPLICATE");
  // Duplicates the reviewer chose to import anyway are NOT skipped.
  const skippedDuplicates = duplicates.filter((d) => !importAnyway.has(d.inputRow)).map((d) => d.inputRow);
  const importableCount = rowCount - blocked.length - skippedDuplicates.length;

  // Conflict review (create mode only — update mode has no scope conflicts).
  const conflicts = useMemo(() => {
    if (mode !== "create") return [];
    return candidates
      .filter((c) => !skippedDuplicates.includes(c.inputRow))
      .map((c) => ({ cand: c, cls: classifyCandidate(c, rules) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, mode, rules, importAnyway]);
  const strictConflicts = conflicts.filter((c) => c.cls.result === "STRICT_CONFLICT");
  const overlaps = conflicts.filter((c) => c.cls.result === "OVERLAP");

  const canConfirm = blocked.length === 0 && (mode === "update" || strictConflicts.length === 0);

  const confirm = () => {
    onSubmit({
      mode,
      createCandidates: candidates.filter((c) => !skippedDuplicates.includes(c.inputRow)),
      skippedDuplicates,
      updateValues,
      issues,
    });
    setStep("done");
  };

  const footer = (() => {
    if (step === "upload")
      return (
        <>
          <RevButton variant="secondary" onClick={close}>Cancel</RevButton>
          <RevButton variant="primary" onClick={() => fileRef.current?.click()}>Select CSV file</RevButton>
        </>
      );
    if (step === "validation")
      return (
        <>
          <RevButton variant="secondary" onClick={() => setStep("upload")}>Back</RevButton>
          <RevButton
            variant="primary"
            onClick={() => setStep("review")}
            aria-disabled={importableCount === 0}
            style={importableCount === 0 ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            Review {importableCount} row{importableCount === 1 ? "" : "s"}
          </RevButton>
        </>
      );
    if (step === "review")
      return (
        <>
          <RevButton variant="secondary" onClick={() => setStep("validation")}>Back</RevButton>
          <RevButton
            variant="primary"
            onClick={confirm}
            aria-disabled={!canConfirm}
            style={!canConfirm ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            Import {mode === "create" ? conflicts.filter((c) => c.cls.result !== "STRICT_CONFLICT").length : updateValues.length} row{mode === "create" ? (conflicts.filter((c) => c.cls.result !== "STRICT_CONFLICT").length === 1 ? "" : "s") : updateValues.length === 1 ? "" : "s"}
          </RevButton>
        </>
      );
    return (
      <RevButton variant="primary" onClick={close}>View task</RevButton>
    );
  })();

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Import rules from CSV"
      subtitle="Bulk-create or bulk-update commission rules from a template file."
      width={520}
      footer={footer}
    >
      <div className="flex flex-col gap-5">
        {/* Step rail */}
        <div className="flex flex-col gap-2">
          <StepHeader n={1} label={mode === "create" ? "Upload create file" : "Upload update file"} active={step === "upload"} done={step !== "upload"} />
          <StepHeader n={2} label="Validation" active={step === "validation"} done={step === "review" || step === "done"} />
          <StepHeader n={3} label="Review & confirm" active={step === "review"} done={step === "done"} />
        </div>

        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>Import mode</span>
              <div className="flex gap-2">
                {(["create", "update"] as CsvMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setStep("upload"); setFileName(""); setIssues([]); }}
                    className="flex-1 px-3 py-1.5 text-sm font-medium"
                    style={{
                      borderRadius: REV_RADIUS.sm,
                      border: "1px solid",
                      borderColor: mode === m ? "var(--rev-text-hi)" : "var(--rev-border)",
                      background: mode === m ? "var(--rev-static-mid)" : "var(--rev-surface-low)",
                      color: "var(--rev-text-hi)",
                    }}
                  >
                    {m === "create" ? "Create rules" : "Update rules"}
                  </button>
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
                {mode === "create"
                  ? "One row per new rule. Scope columns accept ALL or ;-separated values (fan-out like the create form)."
                  : "One row per existing rule (rule_id required). Only campaign name, commission rate, start date and end date can be updated."}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <TemplateLink
                label={`Download ${mode} template`}
                csv={mode === "create" ? CREATE_TEMPLATE_CSV : UPDATE_TEMPLATE_CSV}
                filename={mode === "create" ? "smartco-import-create-template.csv" : "smartco-import-update-template.csv"}
              />
              <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
                The template lists the exact supported columns and formats.
              </span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
            />
          </div>
        )}

        {step === "validation" && (
          <div className="flex flex-col gap-4">
            {fileName && (
              <div className="text-sm" style={{ color: "var(--rev-text-mid)" }}>
                <span className="font-semibold">{fileName}</span> — {rowCount} data row{rowCount === 1 ? "" : "s"}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <RevTag variant="success" size="medium">{importableCount} valid</RevTag>
              <RevTag variant="danger" size="medium">{blocked.length} blocked</RevTag>
              {warnings.length > 0 && <RevTag variant="warning" size="medium">{warnings.length} warning{warnings.length === 1 ? "" : "s"}</RevTag>}
              {duplicates.length > 0 && <RevTag variant="info" size="medium">{duplicates.length} possible duplicate{duplicates.length === 1 ? "" : "s"}</RevTag>}
            </div>

            {(blocked.length > 0 || warnings.length > 0 || duplicates.length > 0) && (
              <div className="flex max-h-72 flex-col overflow-y-auto" style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm }}>
                {[...blocked, ...warnings, ...duplicates].map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2 px-3 py-2 text-sm" style={{ borderBottom: "1px solid var(--rev-border)" }}>
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          i.verdict === "BLOCKED"
                            ? "var(--rev-danger)"
                            : i.verdict === "DUPLICATE"
                              ? "var(--rev-info)"
                              : "var(--rev-warning)",
                        minWidth: 32,
                      }}
                    >
                      {i.inputRow === 0 ? "—" : `#${i.inputRow}`}
                    </span>
                    <span style={{ color: "var(--rev-text-mid)" }}>{i.message}</span>
                  </div>
                ))}
              </div>
            )}

            {blocked.length > 0 && (
              <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
                Blocked rows won&apos;t be imported. Fix them in the file and re-upload, or continue with the valid rows only.
              </span>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-4">
            {mode === "create" ? (
              <>
                {duplicates.length > 0 && (
                  <div className="flex flex-col gap-1.5 px-3 py-2 text-xs" style={{ background: "var(--rev-info-bg)", color: "var(--rev-info)", borderRadius: REV_RADIUS.sm }}>
                    <span className="font-semibold">
                      {duplicates.length} possible duplicate{duplicates.length === 1 ? "" : "s"} — skipped by default. Tick one to import it anyway.
                    </span>
                    {duplicates.map((d) => (
                      <label key={d.inputRow} className="flex items-center gap-2" style={{ color: "var(--rev-text-mid)" }}>
                        <input
                          type="checkbox"
                          checked={importAnyway.has(d.inputRow)}
                          onChange={() =>
                            setImportAnyway((prev) => {
                              const next = new Set(prev);
                              if (next.has(d.inputRow)) next.delete(d.inputRow);
                              else next.add(d.inputRow);
                              return next;
                            })
                          }
                          className="h-4 w-4 cursor-pointer"
                          style={{ accentColor: "var(--rev-primary)" }}
                        />
                        #{d.inputRow} — {d.message}
                      </label>
                    ))}
                  </div>
                )}
                {strictConflicts.length > 0 && (
                  <div className="flex flex-col gap-1.5 px-3 py-2 text-xs" style={{ background: "var(--rev-danger-bg)", color: "var(--rev-danger)", borderRadius: REV_RADIUS.sm }}>
                    <span className="font-semibold">{strictConflicts.length} strict conflict{strictConflicts.length === 1 ? "" : "s"} — these rows won&apos;t be processed.</span>
                    {strictConflicts.map(({ cand, cls }) => (
                      <span key={cand.inputRow}>#{cand.inputRow} duplicates {cls.relatedRuleId} ({cls.scopeLabel})</span>
                    ))}
                  </div>
                )}
                {overlaps.length > 0 && (
                  <div className="flex flex-col gap-1.5 px-3 py-2 text-xs" style={{ background: "var(--rev-warning-bg)", color: "var(--rev-warning)", borderRadius: REV_RADIUS.sm }}>
                    <span className="font-semibold">{overlaps.length} overlap{overlaps.length === 1 ? "" : "s"} — created, but a broader rule already covers the scope and takes priority.</span>
                    {overlaps.slice(0, 5).map(({ cand, cls }) => (
                      <span key={cand.inputRow}>#{cand.inputRow} overlaps {cls.relatedRuleId}</span>
                    ))}
                    {overlaps.length > 5 && <span>… and {overlaps.length - 5} more</span>}
                  </div>
                )}
                <div className="flex max-h-64 flex-col overflow-y-auto" style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm }}>
                  {conflicts.filter((c) => c.cls.result !== "STRICT_CONFLICT").map(({ cand, cls }) => (
                    <div key={cand.inputRow} className="flex items-center justify-between gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--rev-border)" }}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>{cand.campaignName}</span>
                        <span className="text-xs" style={{ color: "var(--rev-text-low)" }}>{cls.scopeLabel}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: "var(--rev-text-mid)" }}>{cand.rate.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex max-h-64 flex-col overflow-y-auto" style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm }}>
                {updateValues.map((u) => {
                  const r = rules.find((x) => x.id === u.ruleId);
                  const changes = [
                    u.name ? `name → "${u.name}"` : "",
                    u.rate !== undefined ? `rate → ${u.rate}%` : "",
                    u.startDate ? `start → ${u.startDate}` : "",
                    u.endDate ? `end → ${u.endDate}` : "",
                  ].filter(Boolean);
                  return (
                    <div key={u.ruleId} className="flex flex-col gap-0.5 px-3 py-2" style={{ borderBottom: "1px solid var(--rev-border)" }}>
                      <span className="text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>{u.ruleId}{r ? ` — ${r.name}` : ""}</span>
                      <span className="text-xs" style={{ color: "var(--rev-text-mid)" }}>{changes.join(" · ")}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {mode === "create" && strictConflicts.length > 0 && (
              <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
                Remove the conflicting rows from the file to import them, or confirm to process the rest.
              </span>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-2 py-8 text-sm" style={{ color: "var(--rev-text-hi)" }}>
            <span className="text-2xl" role="img" aria-label="Submitted">✅</span>
            Import submitted — tracking it in Tasks.
          </div>
        )}
      </div>
    </Drawer>
  );
}
