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

export function Step4View() {
  return (
    <IterationPlaceholder title="Step #4 — Status workflow" status="Planned">
      Full status workflow (DRAFT / VALIDATED / PAUSED / ARCHIVED) and surfacing
      conflicts before they hit production.
    </IterationPlaceholder>
  );
}
