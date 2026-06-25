// Iteration explorer registry — Andrew's work (does not touch Adri's prototype).
//
// Each entry is one selectable UI in the left sidebar. "Original" renders Adri's
// untouched prototype by importing it; the others are Andrew's iterations.
import type { ComponentType } from "react";
import { OriginalView } from "./views/original-view";
import { Iteration1View } from "./views/iteration-1-view";
import {
  Step2View,
  Step3View,
  Step4View,
  Step5View,
} from "./views/step-placeholders";

export type IterationStatus =
  | "live"
  | "ready-for-dev"
  | "awaiting-prd"
  | "planned";

export interface IterationDef {
  /** Stable id, also used for localStorage persistence. */
  id: string;
  /** Step number shown bold in the sidebar (e.g. "Step #1"). Omit for entries with no step (e.g. Original). */
  step?: string;
  /** Step title shown under the step number (e.g. "View rules"). */
  title: string;
  /** One-line description under the label. */
  blurb: string;
  /** Short glyph shown in the collapsed rail. */
  badge: string;
  /** Rollout status chip. Omit to show no chip (e.g. the Original prototype). */
  status?: IterationStatus;
  /** Confluence PRD this entry maps to (shown as a reference link). Omit when no PRD exists yet. */
  prdUrl?: string;
  Component: ComponentType;
}

// Phased rollout of the SmartCo "Smart Commission Management" PRD. Labels and
// blurbs mirror the PRD's "What does success look like?" steps. "Original" is
// Adri's untouched full-vision prototype, kept as the baseline reference.
export const ITERATIONS: IterationDef[] = [
  {
    id: "original",
    title: "Original",
    blurb: "Adri's full prototype",
    badge: "O",
    prdUrl:
      "https://backmarket.atlassian.net/wiki/spaces/sxp/pages/6504120985/prd+Smart+Commission+Management+interface+v1",
    Component: OriginalView,
  },
  {
    id: "step-1",
    step: "Step #1",
    title: "View rules",
    blurb: "Read-only rules dashboard",
    badge: "1",
    status: "ready-for-dev",
    prdUrl:
      "https://backmarket.atlassian.net/wiki/spaces/sxp/pages/6460410942/sub-prd+Step+1+-+View+rules+-+SmartCo",
    Component: Iteration1View,
  },
  {
    id: "step-2",
    step: "Step #2",
    title: "Create, update, archive",
    blurb: "Create & manage rules (+ Product ID)",
    badge: "2",
    status: "planned",
    prdUrl:
      "https://backmarket.atlassian.net/wiki/spaces/sxp/pages/6503008637/sub-prd+Step+2+-+Create+update+archive+-+SmartCo",
    Component: Step2View,
  },
  {
    id: "step-3",
    step: "Step #3",
    title: "Grade × Battery Type",
    blurb: "Full granularity (OMS dependency)",
    badge: "3",
    status: "planned",
    Component: Step3View,
  },
  {
    id: "step-4",
    step: "Step #4",
    title: "Status workflow",
    blurb: "Draft / Validated / Paused / Archived",
    badge: "4",
    status: "planned",
    Component: Step4View,
  },
  {
    id: "step-5",
    step: "Step #5",
    title: "CSV import / export",
    blurb: "Bulk import & export via CSV",
    badge: "5",
    status: "planned",
    Component: Step5View,
  },
];

export const DEFAULT_ITERATION = ITERATIONS[0].id;

export const STATUS_LABEL: Record<IterationStatus, string> = {
  live: "Live",
  "ready-for-dev": "Ready for dev",
  "awaiting-prd": "Awaiting PRD",
  planned: "Planned",
};

export const STATUS_STYLES: Record<IterationStatus, string> = {
  live: "bg-emerald-100 text-emerald-700",
  "ready-for-dev": "bg-blue-100 text-blue-700",
  "awaiting-prd": "bg-amber-100 text-amber-700",
  planned: "bg-gray-100 text-gray-500",
};
