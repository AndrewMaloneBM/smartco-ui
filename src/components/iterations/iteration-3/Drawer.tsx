"use client";

import { useEffect, useRef, useState } from "react";
import { revolveVars, REV_RADIUS, REV_SHADOW, FONTFACE_CSS, REV_CSS } from "../iteration-1/tokens";
import { RevDivider, RevIconButton } from "./revolve";

/** How long the slide/fade takes — exported so callers can sequence a close-then-open. */
export const DRAWER_TRANSITION_MS = 220;

/**
 * Right-side slide-over used by the create / bulk-update / task panels. Renders inside
 * the iteration root (not a portal) so it inherits the `.rev-scope` Revolve tokens; it
 * re-injects FONTFACE/REV_CSS defensively in case it's mounted standalone. Closes
 * on Escape and on scrim click.
 *
 * Slides in from the right on open and back out on close: stays mounted for
 * `DRAWER_TRANSITION_MS` after `open` flips false so the close animation can play
 * before unmounting, instead of vanishing instantly.
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
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setRendered(false), DRAWER_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // RevDrawer a11y: focus the panel on open, trap Tab inside it while open,
  // and restore focus to the trigger on close.
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!rendered) return null;

  return (
    <div
      className="rev-scope fixed inset-0 z-50 flex justify-end"
      style={{ ...revolveVars, fontFamily: "var(--rev-font-body)" }}
    >
      <style dangerouslySetInnerHTML={{ __html: FONTFACE_CSS + REV_CSS }} />
      <div
        className="absolute inset-0 transition-opacity ease-out"
        style={{ background: "rgba(13,15,23,0.32)", opacity: visible ? 1 : 0, transitionDuration: `${DRAWER_TRANSITION_MS}ms` }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className="relative flex h-full flex-col transition-transform ease-out"
        style={{
          width,
          maxWidth: "100vw",
          background: "var(--rev-surface-low)",
          boxShadow: REV_SHADOW.long,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transitionDuration: `${DRAWER_TRANSITION_MS}ms`,
        }}
      >
        {/* Header — RevDrawer skeleton (Figma 65213-2243): fixed 68px header, centered
            title only, padding 24/72/20, 1px bottom hairline, flex-none + self-stretch,
            lowest z in its own stacking context (subtitle now leads the body). */}
        <div
          className="relative flex flex-none flex-col items-center gap-2 self-stretch"
          style={{
            height: 68,
            padding: "24px 72px 20px",
            borderBottom: "1px solid var(--rev-border)",
            isolation: "isolate",
            zIndex: 0,
          }}
        >
          <h2
            id="drawer-title"
            className="text-center text-lg font-semibold leading-6"
            style={{ color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-display)" }}
          >
            {title}
          </h2>
          <RevIconButton onClick={onClose} aria-label="Close" className="absolute right-6" style={{ top: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </RevIconButton>
        </div>

        {/* Body — subtitle leads here; the 68px header is title-only per the RevDrawer spec. */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {subtitle && (
            <p
              className="text-center text-sm"
              style={{ color: "var(--rev-text-low)", padding: "0 48px", marginBottom: 20 }}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>

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
