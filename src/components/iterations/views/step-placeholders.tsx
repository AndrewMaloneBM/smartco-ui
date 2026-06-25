"use client";

import { IterationPlaceholder } from "./placeholder";

// Planned phases of the SmartCo rollout. Copy mirrors the PRD's
// "What does success look like?" table. Each is reserved in the explorer until
// its sub-PRD is built.

export function Step2View() {
  return (
    <IterationPlaceholder title="Step #2 — Create, update, archive" status="Planned">
      Allow authorized users to create and manage Smart Commission rules without
      backend access. Extends the granularity model with Product ID
      (Marketplace × Market × Category × Seller × Product ID).
    </IterationPlaceholder>
  );
}

export function Step3View() {
  return (
    <IterationPlaceholder title="Step #3 — Grade × Battery Type" status="Planned">
      Supports the full granularity model (Marketplace × Market × Category ×
      Product ID × Seller × Grade × Battery Type). Depends on OMS.
    </IterationPlaceholder>
  );
}

export function Step4View() {
  return (
    <IterationPlaceholder title="Step #4 — Status workflow" status="Planned">
      Full status workflow (DRAFT / VALIDATED / PAUSED / ARCHIVED) and surfacing
      conflicts before they hit production.
    </IterationPlaceholder>
  );
}

export function Step5View() {
  return (
    <IterationPlaceholder title="Step #5 — CSV import / export" status="Planned">
      Bulk import and export of Smart Commission rules via CSV.
    </IterationPlaceholder>
  );
}
