"use client";

import { useMemo, useState } from "react";
import { RevRadio, RevSelect } from "./revolve";
import { REV_RADIUS } from "../iteration-1/tokens";
import { BRANDS } from "./logic";

/**
 * Brand field for the Step 3 create drawer. Three-way radio:
 *   "All brands" (default) | "Include specific brands" | "Exclude specific brands"
 * Only one mode is active at a time — includedBrands and excludedBrands
 * can never both be non-empty, matching the mutually-exclusive payload
 * contract (backend spec, Flo Sep 2026). The select appears directly under
 * the active radio; count badges show how many brands are in each list.
 */

export type BrandMode = "all" | "include" | "exclude";

export interface BrandSelection {
  included: string[];
  excluded: string[];
}

export const EMPTY_BRAND_SELECTION: BrandSelection = { included: [], excluded: [] };

export function BrandFieldToggle({
  value,
  onChange,
}: {
  value: BrandSelection;
  onChange: (v: BrandSelection) => void;
}) {
  const [mode, setMode] = useState<BrandMode>(
    value.excluded.length > 0 ? "exclude" : value.included.length > 0 ? "include" : "all"
  );

  const switchMode = (next: BrandMode) => {
    if (next === mode) return;
    setMode(next);
    if (next === "all") onChange({ included: [], excluded: [] });
    else if (next === "include") onChange({ included: value.included, excluded: [] });
    else onChange({ included: [], excluded: value.excluded });
  };

  const selectOptions = useMemo(() => [...BRANDS], []);

  const radios: { value: BrandMode; label: string }[] = [
    { value: "all", label: "Include all brands" },
    { value: "include", label: "Include only specific brands" },
    { value: "exclude", label: "Exclude specific brands" },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
        Brand
        <span className="text-xs font-normal" style={{ color: "var(--rev-text-muted)" }}>
          optional
        </span>
      </label>

      <fieldset className="flex flex-col gap-1" style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className="sr-only">Brand selection mode</legend>
        {radios.map((r) => {
          const active = mode === r.value;
          return (
            <div
              key={r.value}
              className="flex flex-col gap-1.5"
              style={{
                borderRadius: REV_RADIUS.sm,
                background: active ? "var(--rev-static-mid)" : "transparent",
                padding: active ? "6px 8px" : "6px 8px",
                transition: "background 120ms ease-out",
              }}
            >
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--rev-text-hi)", cursor: "pointer" }}
              >
                <RevRadio
                  checked={active}
                  onChange={() => switchMode(r.value)}
                  name="brand-mode"
                  value={r.value}
                />
                {r.label}
              </label>

              {active && r.value !== "all" && (
                <div className="pl-7">
                  <RevSelect
                    label={r.value === "include" ? "brands" : "excluded brands"}
                    hideLabel
                    ariaLabel={r.value === "include" ? "Brands to include" : "Brands to exclude"}
                    options={selectOptions}
                    selected={r.value === "include" ? value.included : value.excluded}
                    onChange={(next) =>
                      r.value === "include"
                        ? onChange({ included: next, excluded: [] })
                        : onChange({ included: [], excluded: next })
                    }
                    searchable
                    showChips
                    placeholder={r.value === "include" ? "Select brands" : "Select brands to exclude"}
                  />
                  <span className="mt-1 block text-xs" style={{ color: "var(--rev-text-muted)" }}>
                    {r.value === "include"
                      ? "Applies only to the selected brands."
                      : "Applies to all brands except the selected ones."}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}
