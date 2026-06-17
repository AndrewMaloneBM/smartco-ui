"use client";

import { CATEGORIES, MARKETS } from "@/lib/types";
import { activeFilterCount, EMPTY_FILTERS, Filters } from "@/lib/filters";
import { MultiSelect } from "./multi-select";
import { Select } from "./ui/field";

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  const count = activeFilterCount(filters);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <Labeled label="Market">
          <MultiSelect
            label="markets"
            options={[...MARKETS]}
            selected={filters.markets}
            onChange={(v) => set("markets", v)}
          />
        </Labeled>
        <Labeled label="Category">
          <MultiSelect
            label="categories"
            options={[...CATEGORIES]}
            selected={filters.categories}
            onChange={(v) => set("categories", v)}
          />
        </Labeled>
        <Labeled label="Seller targeting">
          <Select
            value={filters.sellerTargeting}
            onChange={(e) =>
              set("sellerTargeting", e.target.value as Filters["sellerTargeting"])
            }
          >
            <option value="ANY">All</option>
            <option value="ALL">All sellers</option>
            <option value="KEY_SELLERS">Key sellers only</option>
          </Select>
        </Labeled>
        <Labeled label="State">
          <Select
            value={filters.state}
            onChange={(e) => set("state", e.target.value as Filters["state"])}
          >
            <option value="ANY">Any state</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </Labeled>
        <Labeled label="Status">
          <Select
            value={filters.status}
            onChange={(e) => set("status", e.target.value as Filters["status"])}
          >
            <option value="ANY">Any status</option>
            <option value="DRAFT">Draft</option>
            <option value="VALIDATED">Validated</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Labeled>
        <Labeled label="Conflicts">
          <Select
            value={filters.conflicts}
            onChange={(e) =>
              set("conflicts", e.target.value as Filters["conflicts"])
            }
          >
            <option value="ANY">All rules</option>
            <option value="WITH">With conflicts</option>
            <option value="WITHOUT">No conflicts</option>
          </Select>
        </Labeled>
        <Labeled label="Applied (30d)">
          <Select
            value={filters.applied}
            onChange={(e) =>
              set("applied", e.target.value as Filters["applied"])
            }
          >
            <option value="ANY">All</option>
            <option value="HAS_ORDERS">Has orders</option>
            <option value="NO_ORDERS">No orders</option>
          </Select>
        </Labeled>

        <div className="ml-auto flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Search
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Search rule name or ID…"
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {count > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {count} active filter{count > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs font-medium text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
