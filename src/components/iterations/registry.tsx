// Iteration explorer registry — Andrew's work (does not touch Adri's prototype).
//
// Each entry is one selectable UI in the left sidebar. "Original" renders Adri's
// untouched prototype by importing it; the others are Andrew's iterations.
import type { ComponentType } from "react";
import { OriginalView } from "./views/original-view";
import { Iteration1View } from "./views/iteration-1-view";
import { Iteration2View } from "./views/iteration-2-view";

export type IterationStatus = "live" | "awaiting-prd" | "planned";

export interface IterationDef {
  /** Stable id, also used for localStorage persistence. */
  id: string;
  /** Sidebar label. */
  label: string;
  /** One-line description under the label. */
  blurb: string;
  /** Short glyph shown in the collapsed rail. */
  badge: string;
  status: IterationStatus;
  Component: ComponentType;
}

export const ITERATIONS: IterationDef[] = [
  {
    id: "original",
    label: "Original",
    blurb: "Adri's prototype",
    badge: "O",
    status: "live",
    Component: OriginalView,
  },
  {
    id: "iteration-1",
    label: "Iteration 1",
    blurb: "Awaiting PRD",
    badge: "1",
    status: "awaiting-prd",
    Component: Iteration1View,
  },
  {
    id: "iteration-2",
    label: "Iteration 2",
    blurb: "PRD next week",
    badge: "2",
    status: "planned",
    Component: Iteration2View,
  },
];

export const DEFAULT_ITERATION = ITERATIONS[0].id;

export const STATUS_LABEL: Record<IterationStatus, string> = {
  live: "Live",
  "awaiting-prd": "Awaiting PRD",
  planned: "Planned",
};

export const STATUS_STYLES: Record<IterationStatus, string> = {
  live: "bg-emerald-100 text-emerald-700",
  "awaiting-prd": "bg-amber-100 text-amber-700",
  planned: "bg-gray-100 text-gray-500",
};
