"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { REV_RADIUS } from "../iteration-1/tokens";
import { Drawer } from "./Drawer";
import { RevTabs, RevTag } from "./revolve";
import { RESULT_META, type RuleResult, type Task, type TaskItem } from "./engine";

const TONE: Record<"success" | "warning" | "danger", { bg: string; fg: string }> = {
  success: { bg: "var(--rev-success-bg)", fg: "var(--rev-success)" },
  warning: { bg: "var(--rev-warning-bg)", fg: "var(--rev-warning)" },
  danger: { bg: "var(--rev-danger-bg)", fg: "var(--rev-danger)" },
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} · ${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function fmtDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function StatusPill({ status }: { status: Task["status"] }) {
  const ongoing = status === "ONGOING";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold"
      style={{
        borderRadius: REV_RADIUS.xs,
        background: ongoing ? "var(--rev-warning-bg)" : "var(--rev-success-bg)",
        color: ongoing ? "var(--rev-warning)" : "var(--rev-success)",
      }}
    >
      {ongoing ? (
        <span
          className="h-3 w-3 animate-spin rounded-full"
          style={{ border: "2px solid currentColor", borderTopColor: "transparent" }}
        />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      )}
      {ongoing ? "Ongoing" : "Done"}
    </span>
  );
}

const KIND_LABEL: Record<Task["kind"], string> = {
  CREATE: "Create rules",
  UPDATE: "Bulk update",
  ARCHIVE: "Archive",
};

type TaskTab = "ALL" | "COMPLETED" | "OVERLAPPED" | "ERRORED";
type TaskCategory = "PROCESSING" | "COMPLETED" | "OVERLAPPED" | "ERRORED";

/**
 * Bucket a task by its most severe outcome so it lands in exactly one tab:
 * any rejected/error → Errored; else any overlap → Overlapped; else Completed.
 * In-progress tasks have no outcome yet and only appear under All.
 */
function taskCategory(t: Task): TaskCategory {
  if (t.status === "ONGOING") return "PROCESSING";
  if (t.kind === "CREATE") {
    const has = (r: RuleResult) => t.items.some((i) => i.result === r);
    if (has("STRICT_CONFLICT") || has("SYSTEM_ERROR")) return "ERRORED";
    if (has("OVERLAP")) return "OVERLAPPED";
  }
  return "COMPLETED";
}

const TAB_LABEL: Record<TaskTab, string> = {
  ALL: "All",
  COMPLETED: "Completed",
  OVERLAPPED: "Overlapped",
  ERRORED: "Errored",
};

/** One-glance outcome chips for a finished task (create → created/overlap/rejected). */
function taskOutcome(t: Task): { label: string; tone: "success" | "warning" | "danger" }[] {
  if (t.kind !== "CREATE") {
    const verb = t.kind === "UPDATE" ? "updated" : "archived";
    return [{ label: `${t.items.length} ${verb}`, tone: "success" }];
  }
  const count = (r: RuleResult) => t.items.filter((i) => i.result === r).length;
  const out: { label: string; tone: "success" | "warning" | "danger" }[] = [];
  if (count("CREATED")) out.push({ label: `${count("CREATED")} created`, tone: "success" });
  if (count("OVERLAP")) out.push({ label: `${count("OVERLAP")} overlap`, tone: "warning" });
  if (count("STRICT_CONFLICT")) out.push({ label: `${count("STRICT_CONFLICT")} rejected`, tone: "danger" });
  if (count("SYSTEM_ERROR")) out.push({ label: `${count("SYSTEM_ERROR")} error`, tone: "danger" });
  return out;
}

function ResultRow({ item }: { item: TaskItem }) {
  const meta = RESULT_META[item.result];
  return (
    <div
      className="flex flex-col gap-0.5 px-3 py-2"
      style={{ borderBottom: "1px solid var(--rev-border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
          {item.ruleId !== "—" ? item.ruleId : item.scope}
        </span>
        <RevTag variant={meta.tone} size="small">
          {meta.label}
        </RevTag>
      </div>
      {item.ruleId !== "—" && (
        <span className="text-xs" style={{ color: "var(--rev-text-low)" }}>
          {item.scope}
        </span>
      )}
      <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
        {item.message}
      </span>
    </div>
  );
}

function TaskDetail({ task }: { task: Task }) {
  if (task.status === "ONGOING") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-sm" style={{ color: "var(--rev-text-low)" }}>
        <span
          className="h-6 w-6 animate-spin rounded-full"
          style={{ border: "3px solid var(--rev-static-hi)", borderTopColor: "var(--rev-text-hi)" }}
        />
        Processing {task.items.length} rule{task.items.length === 1 ? "" : "s"}…
      </div>
    );
  }

  // CREATE → group into the PRD's three result sections; UPDATE/ARCHIVE → flat list.
  if (task.kind === "CREATE") {
    const groups: { result: RuleResult; items: TaskItem[] }[] = (
      ["CREATED", "OVERLAP", "STRICT_CONFLICT", "SYSTEM_ERROR"] as RuleResult[]
    )
      .map((result) => ({ result, items: task.items.filter((it) => it.result === result) }))
      .filter((g) => g.items.length);

    return (
      <div className="flex flex-col gap-4">
        {groups.map((g) => {
          const meta = RESULT_META[g.result];
          const tone = TONE[meta.tone];
          return (
            <div key={g.result}>
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone.fg }} />
                <span className="text-sm font-semibold" style={{ color: "var(--rev-text-hi)" }}>
                  {meta.label}
                </span>
                <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
                  {g.items.length}
                </span>
              </div>
              <div style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm, overflow: "hidden" }}>
                {g.items.map((it, idx) => (
                  <ResultRow key={`${it.ruleId}-${idx}`} item={it} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm, overflow: "hidden" }}>
      {task.items.map((it, idx) => (
        <ResultRow key={`${it.ruleId}-${idx}`} item={it} />
      ))}
    </div>
  );
}

export function TaskPanel({
  open,
  tasks,
  onClose,
  initialTaskId,
}: {
  open: boolean;
  tasks: Task[];
  onClose: () => void;
  /** Deep-link straight to a task's detail on open (used by dev scenarios). */
  initialTaskId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TaskTab>("ALL");

  // Open to the all-tasks list by default, or deep-link to a task when asked.
  // Clearing selection + tab on close means a fresh open starts at the list.
  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setTab("ALL");
    } else if (initialTaskId) {
      setSelectedId(initialTaskId);
    }
  }, [open, initialTaskId]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={selected ? `Task ${selected.id}` : "Tasks"}
      subtitle={
        selected
          ? `${KIND_LABEL[selected.kind]} · submitted ${fmtTime(selected.submittedAt)}`
          : "Asynchronous create / update / archive submissions."
      }
      width={520}
    >
      {selected && (
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-4 text-sm font-medium hover:opacity-70"
          style={{ color: "var(--rev-text-low)" }}
        >
          ← All tasks
        </button>
      )}

      {!selected && tasks.length === 0 && (
        <p className="py-10 text-center text-sm" style={{ color: "var(--rev-text-muted)" }}>
          No tasks yet. Create, update, or archive rules to see them here.
        </p>
      )}

      {!selected && tasks.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Outcome tabs — underline (RevTabs). Counts sum to All (each task buckets once). */}
          <RevTabs
            value={tab}
            onChange={(v) => setTab(v as TaskTab)}
            tabs={(["ALL", "COMPLETED", "OVERLAPPED", "ERRORED"] as TaskTab[]).map((tb) => ({
              value: tb,
              label: TAB_LABEL[tb],
              count: tb === "ALL" ? tasks.length : tasks.filter((t) => taskCategory(t) === tb).length,
            }))}
          />

          <div className="flex flex-col gap-2">
          {(tab === "ALL" ? tasks : tasks.filter((t) => taskCategory(t) === tab)).length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--rev-text-muted)" }}>
              No {TAB_LABEL[tab].toLowerCase()} tasks.
            </p>
          )}
          {(tab === "ALL" ? tasks : tasks.filter((t) => taskCategory(t) === tab)).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className="flex flex-col gap-1.5 px-3 py-3 text-left transition-colors hover:opacity-90"
              style={{ border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm, background: "var(--rev-surface-low)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold" style={{ color: "var(--rev-text-hi)" }}>
                  {t.id}
                </span>
                <StatusPill status={t.status} />
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--rev-text-low)" }}>
                <span>{KIND_LABEL[t.kind]}</span>
                <span>·</span>
                <span>{t.items.length} rule{t.items.length === 1 ? "" : "s"}</span>
                <span>·</span>
                <span>{t.status === "DONE" ? fmtDuration(t.durationMs) : "—"}</span>
              </div>
              {t.status === "DONE" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {taskOutcome(t).map((o) => (
                    <RevTag key={o.label} variant={o.tone} size="small">
                      {o.label}
                    </RevTag>
                  ))}
                </div>
              )}
              <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
                {fmtTime(t.submittedAt)}
              </span>
            </button>
          ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs" style={{ color: "var(--rev-text-low)" }}>
            <span>
              Status <StatusPill status={selected.status} />
            </span>
            <span>
              Duration{" "}
              <strong style={{ color: "var(--rev-text-hi)" }}>
                {selected.status === "DONE" ? fmtDuration(selected.durationMs) : "in progress"}
              </strong>
            </span>
            <span>
              Rules <strong style={{ color: "var(--rev-text-hi)" }}>{selected.items.length}</strong>
            </span>
          </div>
          <TaskDetail task={selected} />
        </div>
      )}
    </Drawer>
  );
}
