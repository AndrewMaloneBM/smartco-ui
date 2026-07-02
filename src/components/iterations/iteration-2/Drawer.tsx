"use client";

import { useEffect } from "react";
import { revolveVars, REV_RADIUS, REV_SHADOW, FONTFACE_CSS, REV_CSS } from "../iteration-1/tokens";
import { RevDivider, RevIconButton } from "./revolve";

/**
 * Right-side slide-over used by the create / bulk-update panels. Renders inside the
 * iteration root (not a portal) so it inherits the `.rev-scope` Revolve tokens; it
 * re-injects FONTFACE/REV_CSS defensively in case it's mounted standalone. Closes
 * on Escape and on scrim click.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 460,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="rev-scope fixed inset-0 z-50 flex justify-end"
      style={{ ...revolveVars, fontFamily: "var(--rev-font-body)" }}
    >
      <style dangerouslySetInnerHTML={{ __html: FONTFACE_CSS + REV_CSS }} />
      <div
        className="absolute inset-0"
        style={{ background: "rgba(13,15,23,0.32)" }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full flex-col"
        style={{
          width,
          maxWidth: "100vw",
          background: "var(--rev-surface-low)",
          boxShadow: REV_SHADOW.long,
        }}
      >
        {/* Header — DS Drawer skeleton: mid-tint header band, low-tint body below. */}
        <div
          className="flex items-start justify-between gap-4 px-6 py-5"
          style={{ background: "var(--rev-surface-mid)" }}
        >
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-display)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm" style={{ color: "var(--rev-text-low)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <RevIconButton onClick={onClose} aria-label="Close" className="-mr-2 -mt-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </RevIconButton>
        </div>
        <RevDivider />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <>
            <RevDivider />
            <div className="flex items-center justify-end gap-3 px-6 py-4">{footer}</div>
          </>
        )}
      </aside>
    </div>
  );
}

/** Shared primary/secondary button matching the Revolve action tokens in REV_CSS. */
export function RevButton({
  variant = "primary",
  children,
  ...props
}: {
  variant?: "primary" | "secondary" | "ghost";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      data-rev-btn={variant}
      className={
        "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors " +
        (props.className ?? "")
      }
      style={{ borderRadius: REV_RADIUS.sm, ...props.style }}
    >
      {children}
    </button>
  );
}
