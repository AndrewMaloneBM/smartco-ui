"use client";

import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { REV_RADIUS } from "../iteration-1/tokens";

/**
 * Small React kit faithful to Revolve's `Rev*` specs (Revolve itself is Vue-only,
 * so these are spec-matched stand-ins). Token values come from the design-system
 * foundations; see RevTag.md / RevTabs.md.
 */

export type RevTagVariant =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "alternate";
type RevTagSize = "small" | "medium" | "large";

// filled: { background, text } — values per RevTag.md "Color — filled variation".
const TAG_FILLED: Record<RevTagVariant, { bg: string; fg: string }> = {
  primary: { bg: "hsl(70, 88%, 73%)", fg: "var(--rev-text-hi)" },
  secondary: { bg: "var(--rev-static-mid)", fg: "var(--rev-text-hi)" },
  info: { bg: "var(--rev-info-bg)", fg: "var(--rev-info)" },
  success: { bg: "var(--rev-success-bg)", fg: "var(--rev-success)" },
  warning: { bg: "var(--rev-warning-bg)", fg: "var(--rev-warning)" },
  danger: { bg: "var(--rev-danger-bg)", fg: "var(--rev-danger)" },
  alternate: { bg: "var(--rev-static-mid)", fg: "var(--rev-text-hi)" },
};
// outline: { border, text }.
const TAG_OUTLINE: Record<RevTagVariant, { border: string; fg: string }> = {
  primary: { border: "hsl(70, 45%, 49%)", fg: "var(--rev-text-hi)" },
  secondary: { border: "var(--rev-border-strong)", fg: "var(--rev-text-hi)" },
  info: { border: "hsl(221, 60%, 75%)", fg: "var(--rev-info)" },
  success: { border: "var(--rev-success)", fg: "var(--rev-success)" },
  warning: { border: "var(--rev-warning)", fg: "var(--rev-warning)" },
  danger: { border: "var(--rev-danger)", fg: "var(--rev-danger)" },
  alternate: { border: "var(--rev-border-strong)", fg: "var(--rev-text-hi)" },
};

const TAG_SIZE: Record<RevTagSize, string> = {
  small: "text-xs px-1.5 py-0.5",
  medium: "text-sm px-2 py-0.5",
  large: "text-base px-2.5 py-1",
};

export function RevTag({
  variant = "secondary",
  variation = "filled",
  size = "medium",
  style: styleOverride,
  children,
}: {
  variant?: RevTagVariant;
  variation?: "filled" | "outline";
  size?: RevTagSize;
  /** Overrides the variant's colours (e.g. for a continuous scale a fixed variant can't express). */
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const style: React.CSSProperties =
    variation === "filled"
      ? { background: TAG_FILLED[variant].bg, color: TAG_FILLED[variant].fg }
      : {
          background: "transparent",
          color: TAG_OUTLINE[variant].fg,
          border: `1px solid ${TAG_OUTLINE[variant].border}`,
        };
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap ${TAG_SIZE[size]}`}
      style={{ borderRadius: REV_RADIUS.sm, ...style, ...styleOverride }}
    >
      {children}
    </span>
  );
}

/** A leading status dot for tags (e.g. Active ●). Inherits the tag's text colour. */
export function RevTagDot() {
  return <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} aria-hidden />;
}

/**
 * RevLink — underlined text action (per Storybook `action-link--default`: same
 * color/weight as surrounding text, not a tinted "link blue"). Renders as a
 * button since every use here is an in-page action (back, clear), not navigation.
 */
export function RevLink({
  children,
  ...props
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`underline text-sm font-medium transition-opacity hover:opacity-70 disabled:cursor-default disabled:opacity-40 ${props.className ?? ""}`}
      style={{ color: "var(--rev-text-hi)", ...props.style }}
    >
      {children}
    </button>
  );
}

/** RevDivider — a hairline rule between sections (per Storybook `layout-divider--showcase`). */
export function RevDivider({ className }: { className?: string }) {
  return (
    <hr className={className} style={{ border: "none", borderTop: "1px solid var(--rev-border)", margin: 0 }} />
  );
}

/**
 * RevCheckbox — native checkbox tinted to the app's primary action color, sized
 * to match the row density used across Step 2's tables. No exact Storybook
 * screenshot was available (Cloudflare rate-limited the fetch) — this is a
 * best-effort match on color/size, not pixel-verified against Revolve.
 */
export const RevCheckbox = forwardRef<
  HTMLInputElement,
  { checked: boolean; onChange: () => void } & React.InputHTMLAttributes<HTMLInputElement>
>(function RevCheckbox({ checked, onChange, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      {...props}
      className={`h-4 w-4 cursor-pointer ${props.className ?? ""}`}
      style={{ accentColor: "var(--rev-primary)", ...props.style }}
    />
  );
});

/**
 * RevIconButton — icon-only action (Revolve's "Button Icon"). Ghost/low tone by
 * default: transparent background, low-contrast icon, fades in on hover.
 */
export function RevIconButton({
  children,
  "aria-label": ariaLabel,
  ...props
}: { children: ReactNode; "aria-label": string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      {...props}
      className={`flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70 ${props.className ?? ""}`}
      style={{ borderRadius: REV_RADIUS.sm, color: "var(--rev-text-low)", ...props.style }}
    >
      {children}
    </button>
  );
}

/**
 * RevInputText/Select shell — a bordered field with a floating label inside the
 * top-left and the control beneath it. Border highlights on focus-within and turns
 * danger on error (see REV_CSS rules). The control is supplied as children.
 */
export function RevField({
  label,
  error,
  className,
  children,
}: {
  label?: string;
  error?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-rev-field
      data-error={error ? "true" : undefined}
      className={`flex flex-col ${label ? "gap-0.5 pt-1.5" : "pt-2"} px-3 pb-2 ${className ?? ""}`}
      style={{
        background: "var(--rev-surface-low)",
        border: "1px solid var(--rev-input-border)",
        borderRadius: REV_RADIUS.md,
      }}
    >
      {label && (
        <span className="text-[11px] leading-none" style={{ color: "var(--rev-text-low)" }}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/** Floating-label text/number/date input (RevInputText / RevInputNumber / RevInputDate). */
export function RevInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
  step,
  min,
  max,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
  error?: boolean;
  step?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <RevField label={label} error={error} className={className}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="w-full border-0 bg-transparent p-0 text-sm outline-none"
        style={{ color: "var(--rev-text-hi)" }}
      />
    </RevField>
  );
}

/**
 * Floating-label multi-select (RevInputMultiSelect). Empty = "All {label}".
 * Closes on outside-click; options shown as a checkbox list.
 */
export function RevSelect({
  label,
  options,
  selected,
  onChange,
  hideLabel,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Suppress the floating label (when an outer field already labels it). */
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const display =
    selected.length === 0
      ? `All ${label.toLowerCase()}`
      : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left">
        <RevField label={hideLabel ? undefined : label}>
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm" style={{ color: selected.length ? "var(--rev-text-hi)" : "var(--rev-text-muted)" }}>
              {display}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="var(--rev-text-low)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </RevField>
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1 max-h-60 w-full min-w-[180px] overflow-auto py-1"
          style={{ background: "var(--rev-surface-low)", border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.md, boxShadow: "0px 4px 8px 0px rgba(0,0,0,0.08)" }}
        >
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:opacity-80"
              style={{ color: "var(--rev-text-hi)" }}
            >
              <RevCheckbox checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export interface RevTabDef {
  value: string;
  label: string;
  count?: number;
}

/**
 * Underline tab bar (RevTabs.md). Left-aligned, active tab gets a bold label and
 * a 2px bottom indicator. Optional count renders muted after the label.
 */
export function RevTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: RevTabDef[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-6" style={{ borderBottom: "1px solid var(--rev-border)" }}>
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            aria-current={on ? "true" : undefined}
            className="-mb-px flex items-center gap-1.5 pb-2.5 pt-1 text-sm transition-colors hover:opacity-80"
            style={{
              color: on ? "var(--rev-text-hi)" : "var(--rev-text-low)",
              fontWeight: on ? 600 : 400,
              borderBottom: `2px solid ${on ? "var(--rev-text-hi)" : "transparent"}`,
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span style={{ color: "var(--rev-text-muted)", fontWeight: 400 }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
