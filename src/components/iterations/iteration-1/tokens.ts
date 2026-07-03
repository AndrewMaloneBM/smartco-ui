import type { CSSProperties } from "react";

/**
 * Back Market Revolve design tokens, scoped to the Iteration 1 subtree via inline
 * CSS custom properties. This never touches Adri's `tailwind.config.ts` or globals —
 * apply `style={revolveVars}` on the iteration root and reference `var(--rev-*)` below it.
 * Values are the real Revolve token set (raw.grey scale + semantic + functional).
 */
export const revolveVars = {
  // surfaces
  "--rev-surface-hi": "hsl(228, 24%, 96%)",
  "--rev-surface-mid": "hsl(225, 40%, 98%)",
  "--rev-surface-low": "hsl(0, 0%, 100%)",
  "--rev-static-mid": "hsl(220, 19%, 94%)",
  "--rev-static-hi": "hsl(225, 15%, 89%)",
  // text
  "--rev-text-hi": "hsl(225, 21%, 7%)",
  "--rev-text-mid": "hsl(223, 7%, 20%)",
  "--rev-text-low": "hsl(223, 4%, 37%)",
  "--rev-text-muted": "hsl(223, 3%, 52%)",
  // borders — divider/container border is grey.90; input/control border is the
  // more visible grey.55 (border.action.default.low), per RevInputText.
  "--rev-border": "hsl(225, 15%, 89%)",
  "--rev-border-strong": "hsl(223, 4%, 68%)",
  "--rev-input-border": "hsl(223, 3%, 52%)",
  // functional — text/bg pairs match the real Revolve "Colors · Semantic" (Moods)
  // library: text/static-{mood}-hi + bg/static-{mood}-mid, one pair per mood.
  "--rev-success": "hsl(156, 100%, 21%)",
  "--rev-success-bg": "hsl(145, 83%, 77%)",
  "--rev-warning": "hsl(42, 75%, 27%)",
  "--rev-warning-bg": "hsl(38, 90%, 84%)",
  // bg/static-warning-low — lighter tier of the same mood, for scales needing
  // two steps of a hue (e.g. the Priority column's low/high bands).
  "--rev-warning-bg-low": "hsl(36, 95%, 92%)",
  "--rev-danger": "hsl(351, 84%, 39%)",
  "--rev-danger-bg": "hsl(3, 100%, 92%)",
  // bg/static-danger-low
  "--rev-danger-bg-low": "hsl(6, 100%, 96%)",
  "--rev-info": "hsl(219, 27%, 40%)",
  "--rev-info-bg": "hsl(221, 86%, 92%)",
  // bg/static-info-low
  "--rev-info-bg-low": "hsl(227, 90%, 96%)",
  // Exact text colour from the 🚀 Components "Tag" spec (tone=neutral) — a hair
  // darker than --rev-text-hi; kept separate so we don't touch that broader token.
  "--rev-tag-neutral-text": "hsl(260, 16%, 7%)",
  // Outline-tag border colours (🚀 Components "Tag", level=low). Lighter tint of
  // each mood than the solid text colour, used only for the outline border.
  "--rev-success-border": "hsl(151, 56%, 49%)",
  "--rev-info-border": "hsl(219, 43%, 72%)",
  "--rev-warning-border": "hsl(39, 51%, 58%)",
  // Flag hairline border (🚀 Components "Pill", flag prefix) — neutral text
  // colour at 40% opacity. Only flags with white/grey in them need it, to keep
  // that area from blending into the pill's own light grey background.
  "--rev-flag-border": "hsla(260, 16%, 7%, 0.4)",
  // focus (functional.focus.50) — used for focus-visible rings
  "--rev-focus": "hsl(225, 100%, 60%)",
  "--rev-focus-low": "hsl(225, 7%, 78%)",
  // typography (real Revolve fonts, loaded via FONTFACE_CSS below)
  // headingPrimary = IvarSoft serif (page H1s / punchlines); headingSecondary =
  // BMDupletDSP display sans (section headers); body = BMDupletTXT.
  "--rev-font-body":
    "BMDupletTXT, Helvetica, ui-sans-serif, system-ui, sans-serif",
  "--rev-font-heading": "IvarSoft, Georgia, 'Times New Roman', serif",
  "--rev-font-display":
    "BMDupletDSP, Helvetica, ui-sans-serif, system-ui, sans-serif",
  // brand / action — real Revolve primary action is near-black (not purple)
  "--rev-primary": "hsl(225, 21%, 7%)",
  "--rev-accent": "hsl(225, 21%, 7%)",
  "--rev-action-hover": "hsl(231, 7%, 21%)",
} as CSSProperties;

/**
 * Real Revolve @font-face rules — fonts served from Back Market's public CDN
 * (extracted from @backmarket/design-tokens). Inject once near the iteration root.
 */
export const FONTFACE_CSS = `
@font-face{font-family:BMDupletDSP;src:url('https://static-ds.backmarket.com/fonts/latest/BMDupletDSP-Semibold.woff2');font-weight:600;font-style:normal;font-display:swap;}
@font-face{font-family:BMDupletTXT;src:url('https://static-ds.backmarket.com/fonts/latest/BMDupletTXT-Regular.woff2');font-weight:400;font-style:normal;font-display:swap;}
@font-face{font-family:BMDupletTXT;src:url('https://static-ds.backmarket.com/fonts/latest/BMDupletTXT-Semibold.woff2');font-weight:600;font-style:normal;font-display:swap;}
@font-face{font-family:IvarSoft;src:url('https://static-ds.backmarket.com/fonts/latest/IvarSoft-SemiBold.woff2');font-weight:600;font-style:normal;font-display:swap;}
`;

/** Revolve border radii (radius.xs / sm / md / lg / round). */
export const REV_RADIUS = {
  xs: "2px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  round: "9999px",
} as const;

/** Revolve elevation tokens (shadows.json: short / middle / long). */
export const REV_SHADOW = {
  short: "0px 2px 4px 0px rgba(0, 0, 0, 0.05)",
  middle: "0px 4px 8px 0px rgba(0, 0, 0, 0.08)",
  long: "0px 8px 16px 0px rgba(0, 0, 0, 0.12)",
} as const;

/**
 * Revolve runtime CSS — focus rings, button state colours, table row hover, and
 * input states. Encodes the per-state tokens (hover/pressed/disabled) that
 * inline styles can't express. Scoped under `.rev-scope` so it never leaks into
 * Adri's prototype. Inject once per scope root (page + each portalled drawer).
 *
 * - Focus: focus.default-hi (focus.50, offset 2px) on actions; focus.default-low
 *   (grey.80, offset 0) on inputs.
 * - RevButton: primary = action.default.hi (grey.5 → grey.21 hover); secondary =
 *   outlined, transparent → alpha.black.6 hover; ghost/tertiary = transparent.
 * - RevTable: row hover = background.static.default.low hover (grey.94).
 */
export const REV_CSS = `
.rev-scope :is(button, a, [role="button"]):focus-visible{outline:2px solid var(--rev-focus);outline-offset:2px;border-radius:6px;}
.rev-scope :is(input, select, textarea):focus-visible{outline:2px solid var(--rev-focus-low);outline-offset:0;border-color:var(--rev-text-hi);}
.rev-scope :is(input, select, textarea):focus{border-color:var(--rev-text-hi);}
.rev-scope [data-rev-btn="primary"]{background:var(--rev-primary);color:#fff;}
.rev-scope [data-rev-btn="primary"]:hover:not(:disabled){background:var(--rev-action-hover);}
.rev-scope [data-rev-btn="secondary"]{background:transparent;color:var(--rev-text-hi);border:1px solid var(--rev-text-mid);}
.rev-scope [data-rev-btn="secondary"]:hover:not(:disabled){background:hsla(225,21%,7%,0.06);}
.rev-scope [data-rev-btn="ghost"]{background:transparent;color:var(--rev-text-hi);}
.rev-scope [data-rev-btn="ghost"]:hover:not(:disabled){background:hsla(225,21%,7%,0.06);}
.rev-scope [data-rev-btn]:disabled{opacity:.4;cursor:default;}
.rev-scope tbody tr[data-rev-row]:hover{background:var(--rev-static-mid);}
.rev-scope [data-rev-field]:focus-within{border-color:var(--rev-text-hi);}
.rev-scope [data-rev-field][data-error="true"]{border-color:var(--rev-danger);}
`;
