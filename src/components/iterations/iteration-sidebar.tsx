"use client";

import { cn } from "@/lib/utils";
import { ITERATIONS, STATUS_LABEL, STATUS_STYLES } from "./registry";

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
}

export function IterationSidebar({
  selected,
  onSelect,
  collapsed,
  onToggle,
}: Props) {
  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
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
            <div className="truncate text-[11px] text-gray-400">
              Phased rollout
            </div>
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
                title={
                  it.status ? `${name} (${STATUS_LABEL[it.status]})` : name
                }
                aria-label={name}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                isActive
                  ? "border-brand/30 bg-brand/5"
                  : "border-transparent hover:bg-gray-100"
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
              {it.prdUrl && (
                <a
                  href={it.prdUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-brand hover:underline"
                >
                  PRD
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer note */}
      {!collapsed && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-[11px] leading-relaxed text-gray-400">
            <span className="font-medium text-gray-500">Original</span> is Adri&apos;s
            prototype — read-only.
          </p>
        </div>
      )}
    </aside>
  );
}
