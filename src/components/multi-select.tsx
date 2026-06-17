"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
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

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const display =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-sm text-gray-800 transition-colors hover:bg-gray-50",
          selected.length ? "border-brand/50" : "border-gray-300"
        )}
      >
        <span className={selected.length ? "text-gray-900" : "text-gray-500"}>
          {display}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full min-w-[160px] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg scrollbar-thin">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
