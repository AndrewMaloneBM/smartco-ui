"use client";

import { priorityColor } from "../iteration-1/logic";
import { revolveVars, REV_RADIUS, FONTFACE_CSS, REV_CSS } from "../iteration-1/tokens";
import { RevTag } from "./revolve";

/**
 * Dev handoff reference for the Priority column's colour scale — same content as
 * the Figma table shared with devs. Each row's Component cell renders through the
 * real `priorityColor` bands, so this page can't drift out of sync with the live tags.
 */
const ROWS: { range: string; bgToken: string; fgToken: string; sample: number }[] = [
  { range: "≥ 1250", bgToken: "--rev-danger-bg (bg/static-danger-mid)", fgToken: "--rev-danger (text/static-danger-hi)", sample: 1350 },
  { range: "1000–1249", bgToken: "--rev-danger-bg-low (bg/static-danger-low)", fgToken: "--rev-danger (text/static-danger-hi)", sample: 1100 },
  { range: "750–999", bgToken: "--rev-warning-bg (bg/static-warning-mid)", fgToken: "--rev-warning (text/static-warning-hi)", sample: 850 },
  { range: "500–749", bgToken: "--rev-warning-bg-low (bg/static-warning-low)", fgToken: "--rev-warning (text/static-warning-hi)", sample: 600 },
  { range: "250–499", bgToken: "--rev-info-bg (bg/static-info-mid)", fgToken: "--rev-info (text/static-info-hi)", sample: 350 },
  { range: "0–249", bgToken: "--rev-info-bg-low (bg/static-info-low)", fgToken: "--rev-info (text/static-info-hi)", sample: 100 },
];

const COL_HEAD = "px-4 py-3 text-left text-sm font-semibold whitespace-nowrap";
const CELL = "px-4 py-4 align-top text-sm";

export function PriorityColourReference() {
  return (
    <div
      style={{ ...revolveVars, background: "var(--rev-surface-hi)", color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-body)" }}
      className="rev-scope flex min-h-full flex-col gap-4 p-6"
    >
      <style dangerouslySetInnerHTML={{ __html: FONTFACE_CSS + REV_CSS }} />

      <div>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--rev-text-hi)", fontFamily: "var(--rev-font-heading)" }}>
          Priority column — tag colour reference
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--rev-text-low)" }}>
          Dev handoff: which Revolve token backs each colour band, and what the tag looks like with it applied.
        </p>
      </div>

      <div
        className="overflow-hidden"
        style={{ background: "var(--rev-surface-low)", border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.lg }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--rev-surface-hi)" }}>
              <th className={COL_HEAD}>Priority range</th>
              <th className={COL_HEAD}>Background token</th>
              <th className={COL_HEAD}>Text token</th>
              <th className={COL_HEAD}>Component</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const { bg, fg } = priorityColor(row.sample);
              return (
                <tr key={row.range} style={{ borderTop: "1px solid var(--rev-border)" }}>
                  <td className={CELL} style={{ color: "var(--rev-text-hi)" }}>
                    {row.range}
                  </td>
                  <td className={CELL}>
                    <div className="font-semibold" style={{ color: "var(--rev-text-hi)" }}>
                      {row.bgToken}
                    </div>
                  </td>
                  <td className={CELL}>
                    <div className="font-semibold" style={{ color: "var(--rev-text-hi)" }}>
                      {row.fgToken}
                    </div>
                  </td>
                  <td className={CELL}>
                    <RevTag size="small" style={{ background: bg, color: fg }}>
                      {row.sample}
                    </RevTag>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
