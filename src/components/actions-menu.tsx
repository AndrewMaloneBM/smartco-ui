"use client";

import { useEffect, useRef, useState } from "react";
import { CommissionRule } from "@/lib/types";
import { RuleAction } from "@/lib/actions";

const LABELS: Record<RuleAction, string> = {
  validate: "Validate",
  pause: "Pause",
  archive: "Archive",
  delete: "Delete",
};

function availableActions(rule: CommissionRule): RuleAction[] {
  switch (rule.status) {
    case "DRAFT":
      return ["validate", "archive", "delete"];
    case "VALIDATED":
      return ["pause", "archive", "delete"];
    case "PAUSED":
      return ["validate", "archive", "delete"];
    case "ARCHIVED":
      return ["delete"];
    default:
      return ["delete"];
  }
}

export function ActionsMenu({
  rule,
  onAction,
}: {
  rule: CommissionRule;
  onAction: (action: RuleAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions = availableActions(rule);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Row actions"
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => {
                setOpen(false);
                onAction(a);
              }}
              className={
                "block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 " +
                (a === "delete" ? "text-red-600" : "text-gray-700")
              }
            >
              {LABELS[a]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
