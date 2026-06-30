"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/**
 * RevTooltip (dark variant) — a React stand-in for Revolve's Vue-only RevTooltip.
 * Matches the spec in guidelines/components/overlays/RevTooltip.md:
 *   panel  background.action.default.hi  hsl(225,21%,7%)
 *   text   text.onaction.default.hi      #fff, caption (12px/400/16px)
 *   pad    8px vertical / 12px horizontal · radius.sm (6px)
 *   offset 8px from the trigger · shadow.middle · arrow points at the trigger
 *
 * Shows on hover AND keyboard focus, links content via aria-describedby, and is
 * portalled to <body> with fixed positioning so the table's overflow container
 * can't clip it (tokens are inlined here because the portal leaves the scope).
 */
const PANEL_BG = "hsl(225, 21%, 7%)";

export function RevTooltip({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  // Anchor = the trigger's center-x and top, captured on show.
  const [anchor, setAnchor] = useState<{ top: number; cx: number } | null>(null);
  // Resolved panel placement after measuring + clamping to the viewport.
  const [layout, setLayout] = useState<{
    left: number;
    top: number;
    arrow: number;
  } | null>(null);

  const show = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.top, cx: r.left + r.width / 2 });
  };
  const hide = () => {
    setAnchor(null);
    setLayout(null);
  };

  // Once the panel is in the DOM, measure it and shift it so it never spills
  // past either viewport edge; the arrow stays pinned under the trigger.
  useLayoutEffect(() => {
    if (!anchor || !panelRef.current) return;
    const margin = 8;
    const w = panelRef.current.getBoundingClientRect().width;
    const vw = window.innerWidth;
    const left = Math.max(margin, Math.min(anchor.cx - w / 2, vw - w - margin));
    const arrow = Math.max(12, Math.min(anchor.cx - left, w - 12));
    setLayout({ left, top: anchor.top - 8, arrow });
  }, [anchor]);

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      aria-describedby={anchor ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex cursor-help outline-none"
    >
      {children}
      {anchor &&
        createPortal(
          <span
            ref={panelRef}
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              // Pre-measure pass renders centered & invisible; the layout effect
              // then clamps it into the viewport and reveals it.
              top: layout ? layout.top : anchor.top - 8,
              left: layout ? layout.left : anchor.cx,
              transform: layout ? "translateY(-100%)" : "translate(-50%, -100%)",
              visibility: layout ? "visible" : "hidden",
              zIndex: 80,
              maxWidth: 240,
              width: "max-content",
              background: PANEL_BG,
              color: "#fff",
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 400,
              fontFamily:
                "BMDupletTXT, Helvetica, ui-sans-serif, system-ui, sans-serif",
              padding: "8px 12px",
              borderRadius: 6,
              boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.08)",
              pointerEvents: "none",
            }}
          >
            {content}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "100%",
                left: layout ? layout.arrow : "50%",
                width: 8,
                height: 8,
                transform: "translate(-50%, -50%) rotate(45deg)",
                background: PANEL_BG,
              }}
            />
          </span>,
          document.body
        )}
    </span>
  );
}
