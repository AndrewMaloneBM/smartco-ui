"use client";

import { cn } from "@/lib/utils";
import { ITERATIONS, STATUS_LABEL, STATUS_STYLES, type ScenarioDef } from "./registry";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={direction === "right" ? "rotate-180" : undefined}
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  /** Iteration id whose scenario list is drilled into (null = default iteration list). */
  scenarioMenu: string | null;
  /** Active scenario id applied to the view (null = default/no scenario). */
  activeScenario: string | null;
  onOpenScenarios: (iterationId: string) => void;
  onCloseScenarios: () => void;
  onSelectScenario: (scenarioId: string | null) => void;
}

export function IterationSidebar({
  selected,
  onSelect,
  collapsed,
  onToggle,
  scenarioMenu,
  activeScenario,
  onOpenScenarios,
  onCloseScenarios,
  onSelectScenario,
}: Props) {
  const menuEntry = scenarioMenu
    ? ITERATIONS.find((i) => i.id === scenarioMenu)
    : undefined;
  const showScenarios = !collapsed && menuEntry?.scenarios?.length;

  return (
    <aside
      className={cn(
        // relative + high z keeps the sidebar above drawer scrims (z-50) and the
        // toast (z-60) so scenarios stay clickable while a drawer is open.
        "relative z-[70] flex h-screen shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_ANIM_CSS }} />
      {showScenarios ? (
        // `key` forces a remount on swap so the enter animation re-fires.
        <div key="scenarios" className="flex h-full min-h-0 flex-col" style={{ animation: "smartco-in-right .22s ease both" }}>
          <ScenarioMenu
            entry={menuEntry!}
            scenarios={menuEntry!.scenarios!}
            active={activeScenario}
            onBack={onCloseScenarios}
            onSelect={onSelectScenario}
          />
        </div>
      ) : (
        <div key="iterations" className="flex h-full min-h-0 flex-col" style={{ animation: scenarioMenu ? "smartco-in-left .22s ease both" : undefined }}>
          <IterationList
            selected={selected}
            onSelect={onSelect}
            collapsed={collapsed}
            onToggle={onToggle}
            onOpenScenarios={onOpenScenarios}
          />
        </div>
      )}
    </aside>
  );
}

// Scoped enter animations for the sidebar drill-in / back swap. Kept local (not in
// Adri's tailwind.config) so it never touches the read-only prototype config.
const SIDEBAR_ANIM_CSS = `
@keyframes smartco-in-right { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes smartco-in-left { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  [style*="smartco-in"] { animation: none !important; }
}`;

// ── Default view: the list of iterations ─────────────────────────────────────
function IterationList({
  selected,
  onSelect,
  collapsed,
  onToggle,
  onOpenScenarios,
}: {
  selected: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onOpenScenarios: (id: string) => void;
}) {
  return (
    <>
      {/* Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-gray-100",
          collapsed ? "justify-center px-0" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display text-sm font-semibold tracking-tight text-gray-900">
              SmartCo
            </div>
            <div className="truncate text-[11px] text-gray-400">Phased rollout</div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Chevron direction={collapsed ? "right" : "left"} />
        </button>
      </div>

      {/* Iteration list */}
      <nav
        className={cn(
          "scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto py-3",
          collapsed ? "items-center px-2" : "px-3"
        )}
      >
        {ITERATIONS.map((it) => {
          const isActive = it.id === selected;
          const name = it.step ? `${it.step}: ${it.title}` : it.title;

          if (collapsed) {
            return (
              <button
                key={it.id}
                onClick={() => onSelect(it.id)}
                title={it.status ? `${name} (${STATUS_LABEL[it.status]})` : name}
                aria-label={name}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  isActive ? "bg-brand text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {it.badge}
              </button>
            );
          }

          return (
            <div
              key={it.id}
              className={cn(
                "flex w-full flex-col gap-1 rounded-xl border px-3 py-2.5 transition-colors",
                isActive ? "border-brand/30 bg-brand/5" : "border-transparent hover:bg-gray-100"
              )}
            >
              <button
                onClick={() => onSelect(it.id)}
                aria-current={isActive ? "page" : undefined}
                className="flex w-full flex-col gap-1 text-left"
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      it.step ? "text-xs font-normal text-gray-500" : "text-sm font-bold",
                      !it.step && (isActive ? "text-brand-dark" : "text-gray-900")
                    )}
                  >
                    {it.step ?? it.title}
                  </span>
                  {it.status && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        STATUS_STYLES[it.status]
                      )}
                    >
                      {STATUS_LABEL[it.status]}
                    </span>
                  )}
                </span>
                {it.step && (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isActive ? "text-brand-dark" : "text-gray-900"
                    )}
                  >
                    {it.title}
                  </span>
                )}
                <span className="text-xs text-gray-500">{it.blurb}</span>
              </button>

              {(it.prdUrl || it.scenarios?.length) && (
                <div className="flex flex-col items-start gap-1.5">
                  {it.prdUrl && (
                    <a
                      href={it.prdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                    >
                      PRD
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 17 17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </a>
                  )}
                  {it.scenarios?.length ? (
                    <button
                      type="button"
                      onClick={() => onOpenScenarios(it.id)}
                      title="Jump to specific UI states for dev / review"
                      className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800"
                    >
                      {/* layers glyph */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
                        <path d="m3 12 9 5 9-5" />
                        <path d="m3 17 9 5 9-5" />
                      </svg>
                      Scenarios
                      <Chevron direction="right" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer note */}
      {!collapsed && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-gray-400">
            <span className="font-medium text-gray-500">Original</span> is Adri&apos;s prototype — read-only.
          </p>
        </div>
      )}
    </>
  );
}

// ── Drill-in view: dev scenario triggers for one iteration ───────────────────
function ScenarioMenu({
  entry,
  scenarios,
  active,
  onBack,
  onSelect,
}: {
  entry: (typeof ITERATIONS)[number];
  scenarios: ScenarioDef[];
  active: string | null;
  onBack: () => void;
  onSelect: (id: string | null) => void;
}) {
  // Preserve first-seen group order.
  const groups: { name: string; items: ScenarioDef[] }[] = [];
  for (const s of scenarios) {
    let g = groups.find((x) => x.name === s.group);
    if (!g) {
      g = { name: s.group, items: [] };
      groups.push(g);
    }
    g.items.push(s);
  }

  return (
    <>
      {/* Header with back to default sidebar */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-3">
        <button
          onClick={onBack}
          title="Back to iterations"
          aria-label="Back to iterations"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Chevron direction="left" />
        </button>
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold tracking-tight text-gray-900">
            {entry.step ?? entry.title} scenarios
          </div>
          <div className="truncate text-[11px] text-gray-400">Dev / review triggers</div>
        </div>
      </div>

      <nav className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {/* Default / reset */}
        <button
          onClick={() => onSelect(null)}
          aria-current={active === null ? "true" : undefined}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
            active === null
              ? "border-brand/30 bg-brand/5 text-brand-dark"
              : "border-transparent text-gray-600 hover:bg-gray-100"
          )}
        >
          Default view
          {active === null && <Dot />}
        </button>

        {groups.map((g) => (
          <div key={g.name} className="flex flex-col gap-1">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {g.name}
            </div>
            {g.items.map((s) => {
              const on = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    on
                      ? "border-brand/30 bg-brand/5 font-semibold text-brand-dark"
                      : "border-transparent text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {s.label}
                  {on && <Dot />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-gray-400">
          Each trigger jumps the prototype straight to that state. Pick{" "}
          <span className="font-medium text-gray-500">Default view</span> to clear it.
        </p>
      </div>
    </>
  );
}

function Dot() {
  return <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />;
}
