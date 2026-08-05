// Iteration explorer registry — Andrew's work (does not touch Adri's prototype).
//
// Each entry is one selectable UI in the left sidebar. "Original" renders Adri's
// untouched prototype by importing it; the others are Andrew's iterations.
import type { ComponentType } from "react";
import { OriginalView } from "./views/original-view";
import { Iteration1View } from "./views/iteration-1-view";
import { Iteration2View } from "./views/iteration-2-view";
import { Iteration3View } from "./views/iteration-3-view";
import { Step4View, Step5View } from "./views/step-placeholders";
import { STEP2_SCENARIOS } from "./iteration-2/scenarios";
import { STEP3_SCENARIOS } from "./iteration-3/scenarios";

/** Props every iteration view may receive. Views that ignore it stay prop-less. */
export interface IterationViewProps {
  /** Active dev scenario id (Steps 2 and 3 use this today). */
  scenario?: string | null;
}

/** A dev scenario trigger shown in the sidebar's drill-in scenarios view. */
export interface ScenarioDef {
  id: string;
  label: string;
  group: string;
}

export type IterationStatus =
  | "live"
  | "in-development"
  | "queued-for-dev"
  | "in-progress"
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
  /** Dev scenario triggers — when present, the sidebar shows a "Scenarios" drill-in. */
  scenarios?: ScenarioDef[];
  Component: ComponentType<IterationViewProps>;
}

// Phased rollout of the SmartCo "Smart Commission Management" PRD. Labels and
// blurbs mirror the PRD's "What does success look like?" steps. "Original" is
// Adri's untouched full-vision prototype, kept as the baseline reference.
export const ITERATIONS: IterationDef[] = [
  {
    id: "original",
    title: "Original",
    blurb: "Early concept inspiration",
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
    status: "live",
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
    status: "in-development",
    prdUrl:
      "https://backmarket.atlassian.net/wiki/spaces/sxp/pages/6503008637/sub-prd+Step+2+-+Create+update+archive+-+SmartCo",
    scenarios: STEP2_SCENARIOS,
    Component: Iteration2View,
  },
  {
    id: "step-3",
    step: "Step #3",
    title: "Grade × Battery Type",
    blurb: "Add Grade + Offer type + Brand targeting",
    badge: "3",
    status: "queued-for-dev",
    prdUrl:
      "https://backmarket.atlassian.net/wiki/spaces/sxp/pages/6505959304/sub-prd+Step+3+-+Granularity+upgrade+for+SmartCo",
    scenarios: STEP3_SCENARIOS,
    Component: Iteration3View,
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
  "in-development": "In development",
  "queued-for-dev": "Queued for dev",
  "in-progress": "Work in progress",
  "ready-for-dev": "Ready for dev",
  "awaiting-prd": "Awaiting PRD",
  planned: "Planned",
};

export const STATUS_STYLES: Record<IterationStatus, string> = {
  live: "bg-emerald-100 text-emerald-700",
  "in-development": "bg-yellow-100 text-yellow-700",
  "queued-for-dev": "bg-blue-100 text-blue-700",
  "in-progress": "bg-violet-100 text-violet-700",
  "ready-for-dev": "bg-blue-100 text-blue-700",
  "awaiting-prd": "bg-amber-100 text-amber-700",
  planned: "bg-gray-100 text-gray-500",
};
