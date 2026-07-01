"use client";

import { useEffect, useMemo, useState } from "react";
import { STEP1_RULES } from "../iteration-1/mock-rules";
import {
  CATEGORIES,
  MARKETS,
  MARKET_FLAGS,
  isRateOutOfRange,
  isSellerSpecific,
  type CommissionRule,
  type RuleState,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { MultiSelect } from "@/components/multi-select";
import { RevTooltip } from "../iteration-1/RevTooltip";
import { RevPagination } from "../iteration-1/RevPagination";
import {
  revolveVars,
  REV_RADIUS,
  REV_SHADOW,
  FONTFACE_CSS,
  REV_CSS,
} from "../iteration-1/tokens";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  filterRules,
  ruleCategories,
  sortRules,
  type IterationFilters,
  type SortField,
} from "../iteration-1/logic";

// PRD scope — "Step #1 - View rules" is read-only: see, filter, sort. Create /
// import / export / Product ID / row actions are Step 2+ and intentionally absent.

// RevTable header: body-2-bold (14px/600), sentence case, near-black text on a
// grey.94 filled header row. No uppercase / letter-spacing (not in Revolve).
const COL_HEAD = "px-4 py-3 text-left text-sm font-semibold whitespace-nowrap";
const CELL = "px-4 py-4 align-top text-sm whitespace-nowrap";
// Wide text columns (campaign name, categories) may wrap so the table fits the
// width without horizontal scroll — pagination handles row count.
const CELL_WRAP = "px-4 py-4 align-top text-sm";

// Priority (PRD): a rule is either "Seller-specific" or "All sellers", and
// seller-specific always takes precedence when rules overlap on an orderline.
// Rendered as a tag — seller-specific reads stronger (darker chip) so it visibly
// outranks all-sellers.
function PriorityTag({ rule }: { rule: CommissionRule }) {
  const sellerSpecific = isSellerSpecific(rule);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-semibold"
      style={{
        borderRadius: REV_RADIUS.xs,
        background: sellerSpecific
          ? "var(--rev-static-hi)"
          : "var(--rev-static-mid)",
        color: sellerSpecific ? "var(--rev-text-hi)" : "var(--rev-text-low)",
      }}
    >
      {sellerSpecific ? "Seller-specific" : "All sellers"}
    </span>
  );
}

function selectStyle(): React.CSSProperties {
  return {
    background: "var(--rev-surface-low)",
    border: "1px solid var(--rev-input-border)",
    borderRadius: REV_RADIUS.sm,
    color: "var(--rev-text-hi)",
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function SortHeader({
  label,
  field,
  active,
  dir,
  onSort,
  hint,
}: {
  label: string;
  field: SortField;
  active: boolean;
  dir: "asc" | "desc";
  onSort: (f: SortField) => void;
  hint?: string;
}) {
  return (
    <th className={COL_HEAD} style={{ color: "var(--rev-text-hi)" }} title={hint}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:opacity-70"
        style={{ color: "inherit" }}
      >
        {label}
        {hint && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ opacity: 0.45 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        )}
        <span style={{ opacity: active ? 1 : 0.35, fontSize: 10 }}>
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function StateBadge({ state }: { state: RuleState }) {
  const active = state === "ACTIVE";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold"
      style={{
        borderRadius: REV_RADIUS.xs,
        background: active ? "var(--rev-success-bg)" : "var(--rev-static-mid)",
        color: active ? "var(--rev-success)" : "var(--rev-text-mid)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: active ? "var(--rev-success)" : "var(--rev-text-muted)",
        }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function sellersLabel(rule: CommissionRule): string {
  if (rule.seller_targeting === "ALL" || rule.seller_ids.length === 0)
    return "All sellers";
  return rule.seller_ids[0];
}

const PAGE_SIZE = 25;

export function Iteration1View() {
  const rules = STEP1_RULES;
  const [filters, setFilters] = useState<IterationFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const filtered = filterRules(rules, filters);
    return sortRules(filtered, sort.field, sort.dir);
  }, [rules, filters, sort]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => setPage(1), [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, rows.length);

  const set = <K extends keyof IterationFilters>(
    key: K,
    value: IterationFilters[K]
  ) => setFilters((f) => ({ ...f, [key]: value }));

  const onSort = (field: SortField) =>
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );

  const onlyActive = filters.state.length === 1 && filters.state[0] === "ACTIVE";

  return (
    <div
      style={{
        ...revolveVars,
        background: "var(--rev-surface-hi)",
        color: "var(--rev-text-hi)",
        fontFamily: "var(--rev-font-body)",
      }}
      className="rev-scope flex min-h-full flex-col gap-4 p-6"
    >
      <style dangerouslySetInnerHTML={{ __html: FONTFACE_CSS + REV_CSS }} />

      {/* Header — read-only view (Step #1) */}
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{
            color: "var(--rev-text-hi)",
            fontFamily: "var(--rev-font-display)",
          }}
        >
          Smart Commission Rules
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--rev-text-low)" }}>
          View the Smart Commission rules currently applied across markets,
          categories, and sellers
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="flex flex-wrap items-end gap-3 p-3"
        style={{
          background: "var(--rev-surface-low)",
          border: "1px solid var(--rev-border)",
          borderRadius: REV_RADIUS.lg,
          boxShadow: REV_SHADOW.short,
        }}
      >
        <Field label="Market">
          <MultiSelect
            label="markets"
            options={[...MARKETS]}
            selected={filters.market}
            onChange={(v) => set("market", v)}
          />
        </Field>
        <Field label="Category">
          <MultiSelect
            label="categories"
            options={[...CATEGORIES]}
            selected={filters.category}
            onChange={(v) => set("category", v)}
          />
        </Field>
        <Field label="Seller ID">
          <input
            type="text"
            placeholder="Filter by seller ID…"
            className="px-3 py-1.5 text-sm"
            style={selectStyle()}
            value={filters.seller}
            onChange={(e) => set("seller", e.target.value)}
          />
        </Field>
        <Field label="State">
          <MultiSelect
            label="states"
            options={["ACTIVE", "INACTIVE"]}
            selected={filters.state}
            onChange={(v) => set("state", v)}
          />
        </Field>
        <Field label="Search">
          <input
            type="text"
            placeholder="Rule ID or campaign name..."
            className="px-3 py-1.5 text-sm"
            style={selectStyle()}
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </Field>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden"
        style={{
          background: "var(--rev-surface-low)",
          border: "1px solid var(--rev-border)",
          borderRadius: REV_RADIUS.lg,
          boxShadow: REV_SHADOW.short,
        }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr
              style={{
                background: "var(--rev-static-mid)",
                borderBottom: "1px solid var(--rev-border)",
              }}
            >
              <SortHeader
                label="Priority"
                field="priority"
                active={sort.field === "priority"}
                dir={sort.dir}
                onSort={onSort}
                hint="From the scope of each rule a priority is set. The priority is used to choose what rule will be associated to an orderline. Seller-specific always takes precedence over all sellers."
              />
              <th className={COL_HEAD} style={{ color: "var(--rev-text-hi)" }}>
                Campaign name
              </th>
              <SortHeader
                label="Created"
                field="created_at"
                active={sort.field === "created_at"}
                dir={sort.dir}
                onSort={onSort}
              />
              <SortHeader
                label="Start date"
                field="start_date"
                active={sort.field === "start_date"}
                dir={sort.dir}
                onSort={onSort}
              />
              <SortHeader
                label="End date"
                field="end_date"
                active={sort.field === "end_date"}
                dir={sort.dir}
                onSort={onSort}
              />
              {["Market", "Category ID", "Sellers", "Commission", "State"].map(
                (h) => (
                  <th
                    key={h}
                    className={COL_HEAD}
                    style={{ color: "var(--rev-text-hi)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => {
              const outOfRange = isRateOutOfRange(r.commission_rate);
              return (
                <tr
                  key={r.id}
                  data-rev-row
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--rev-border)" }}
                >
                  <td className={CELL}>
                    <PriorityTag rule={r} />
                  </td>
                  <td className={CELL_WRAP}>
                    <div className="font-medium">{r.name}</div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--rev-text-muted)" }}
                    >
                      {r.id}
                    </div>
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {formatDate(r.created_at)}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.start_date ? (
                      formatDate(r.start_date)
                    ) : (
                      <span className="italic" style={{ color: "var(--rev-text-muted)" }}>
                        All time
                      </span>
                    )}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {r.end_date ? (
                      formatDate(r.end_date)
                    ) : (
                      <span className="italic" style={{ color: "var(--rev-text-muted)" }}>
                        No expiry
                      </span>
                    )}
                  </td>
                  <td className={CELL}>
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold"
                      style={{
                        background: "var(--rev-static-mid)",
                        borderRadius: REV_RADIUS.xs,
                      }}
                    >
                      {MARKET_FLAGS[r.market]} {r.market}
                    </span>
                  </td>
                  <td className={CELL_WRAP} style={{ color: "var(--rev-text-mid)" }}>
                    {ruleCategories(r).length ? ruleCategories(r).join(", ") : "All categories"}
                  </td>
                  <td className={CELL} style={{ color: "var(--rev-text-mid)" }}>
                    {sellersLabel(r)}
                  </td>
                  <td className={CELL}>
                    <span
                      className="inline-flex items-center gap-1 font-semibold"
                      style={{
                        color: outOfRange
                          ? "var(--rev-warning)"
                          : "var(--rev-text-hi)",
                      }}
                    >
                      {r.commission_rate.toFixed(1)}%
                      {outOfRange && (
                        <RevTooltip content="This rate is outside the standard range (2–20%).">
                          <span role="img" aria-label="Out-of-range commission rate" className="leading-none">
                            ⚠
                          </span>
                        </RevTooltip>
                      )}
                    </span>
                  </td>
                  <td className={CELL}>
                    <StateBadge state={r.state} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-10 text-center text-sm"
                  style={{ color: "var(--rev-text-muted)" }}
                >
                  No rules match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <RevPagination page={page} total={totalPages} onChange={setPage} />

      {/* Footer */}
      <div className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
        {rows.length === 0
          ? "No rules to show"
          : `Showing ${rangeStart}–${rangeEnd} of ${rows.length} rules`}
        {onlyActive && " · filtered to active only"}
      </div>
    </div>
  );
}
