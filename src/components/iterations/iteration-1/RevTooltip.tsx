"use client";

import { useId, useRef, useState, type ReactNode } from "react";
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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );

  const show = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.top, left: r.left + r.width / 2 });
  };
  const hide = () => setCoords(null);

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      aria-describedby={coords ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      className="inline-flex cursor-help outline-none"
    >
      {children}
      {coords &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top - 8,
              left: coords.left,
              transform: "translate(-50%, -100%)",
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
                left: "50%",
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
