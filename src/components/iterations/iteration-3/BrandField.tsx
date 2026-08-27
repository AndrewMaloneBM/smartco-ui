"use client";

import { useMemo, useState } from "react";
import { RevCheckbox, RevSelect } from "./revolve";
import { BRANDS } from "./logic";

/**
 * Brand field for the Step 3 create drawer (Aug 24 2026 meeting, Confluence
 * 6472991505). A multiselect for brands to target (empty = all brands), plus
 * a checkbox that reveals a second multiselect for brands to exclude from
 * the "all" set. Both selects sit inside one grouped block with a left accent
 * stripe so they read as one field with two parts. A brand can't sit in both
 * lists — each select's options hide whatever the other already holds.
 */

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
  const [excludeOn, setExcludeOn] = useState(value.excluded.length > 0);

  const includeOptions = useMemo(
    () => BRANDS.filter((b) => !value.excluded.includes(b)),
    [value.excluded]
  );
  const excludeOptions = useMemo(
    () => BRANDS.filter((b) => !value.included.includes(b)),
    [value.included]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
        Brand
        <span className="text-xs font-normal" style={{ color: "var(--rev-text-muted)" }}>
          optional
        </span>
      </label>

      <div
        className="flex flex-col gap-2.5 pl-3"
        style={{ borderLeft: `2px solid var(--rev-border)` }}
      >
        <RevSelect
          label="brands"
          hideLabel
          ariaLabel="Brands to include"
          options={[...includeOptions]}
          selected={value.included}
          onChange={(next) =>
            onChange({
              included: next,
              excluded: value.excluded.filter((b) => !next.includes(b)),
            })
          }
          searchable
          showChips
        />
        <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
          Empty = all brands.
        </span>

        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--rev-text-hi)" }}>
          <RevCheckbox
            checked={excludeOn}
            onChange={() => {
              const next = !excludeOn;
              setExcludeOn(next);
              if (!next) onChange({ ...value, excluded: [] });
            }}
          />
          Exclude brands
        </label>
        <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
          Turn on to exclude specific brands.
        </span>

        {excludeOn && (
          <RevSelect
            label="excluded brands"
            hideLabel
            ariaLabel="Brands to exclude"
            options={[...excludeOptions]}
            selected={value.excluded}
            onChange={(next) =>
              onChange({
                included: value.included.filter((b) => !next.includes(b)),
                excluded: next,
              })
            }
            searchable
            showChips
            placeholder="Select brands to exclude"
          />
        )}
      </div>
    </div>
  );
}
