"use client";

import { useEffect, useState } from "react";
import {
  CommissionRule,
  isRateOutOfRange,
  isSellerSpecific,
} from "@/lib/types";
import { RuleAction } from "@/lib/actions";
import { cn, formatDate, formatGmv, formatNumber } from "@/lib/utils";
import { StateBadge, StatusBadge } from "./ui/badge";
import { ScopePills } from "./scope-pills";
import { ActionsMenu } from "./actions-menu";

const PAGE_SIZE = 25;

function PriorityPill({ rule }: { rule: CommissionRule }) {
  const seller = isSellerSpecific(rule);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        seller ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
      )}
    >
      {seller ? "Seller-specific" : "All sellers"}
    </span>
  );
}

function Sellers({ rule }: { rule: CommissionRule }) {
  if (rule.seller_targeting === "ALL") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-gray-600">
        <span className="h-2 w-2 rounded-full bg-gray-400" /> All sellers
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1.5 text-sm font-medium text-purple-700"
      title={rule.seller_ids.join(", ")}
    >
      <span className="h-2 w-2 rounded-full bg-purple-500" />
      {rule.seller_ids.length} key seller
      {rule.seller_ids.length > 1 ? "s" : ""}
    </span>
  );
}

function Impact({ rule }: { rule: CommissionRule }) {
  if ((rule.orderlines_30d ?? 0) > 0) {
    return (
      <div className="text-sm">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
        </span>
        <div className="mt-1 text-gray-900">
          {formatNumber(rule.orderlines_30d)} orders
        </div>
        <div className="text-xs text-gray-500">{formatGmv(rule.gmv_30d)}</div>
      </div>
    );
  }
  return <span className="text-sm font-medium text-amber-600">No orders</span>;
}

export function RulesTable({
  rules,
  onRowClick,
  onAction,
}: {
  rules: CommissionRule[];
  onRowClick: (rule: CommissionRule) => void;
  onAction: (rule: CommissionRule, action: RuleAction) => void;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rules.length / PAGE_SIZE));

  // Reset to first page when the filtered set shrinks below current page.
  useEffect(() => {
    if (page > pageCount - 1) setPage(0);
  }, [page, pageCount]);

  const start = page * PAGE_SIZE;
  const visible = rules.slice(start, start + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Sellers</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Conflicts</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Impact (30d)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map((rule) => {
              const hasConflict = rule.conflicts.length > 0;
              const archived = rule.status === "ARCHIVED";
              return (
                <tr
                  key={rule.id}
                  onClick={() => onRowClick(rule)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-gray-50",
                    hasConflict && "border-l-4 border-l-amber-400",
                    archived && "opacity-60"
                  )}
                >
                  <td className="px-4 py-3 align-top">
                    <PriorityPill rule={rule} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-xs text-gray-400">
                      {rule.id} · {formatDate(rule.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-gray-600">
                    <div>{formatDate(rule.start_date)}</div>
                    <div className="text-xs text-gray-400">
                      {rule.end_date ? `→ ${formatDate(rule.end_date)}` : "No end date"}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <ScopePills rule={rule} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Sellers rule={rule} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isRateOutOfRange(rule.commission_rate)
                          ? "text-amber-600"
                          : "text-gray-900"
                      )}
                      title={
                        isRateOutOfRange(rule.commission_rate)
                          ? "Rate is outside the typical 2–20% band"
                          : undefined
                      }
                    >
                      {rule.commission_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {hasConflict ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        ⚡ {rule.conflicts.length} conflict
                        {rule.conflicts.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-green-600">
                        ✓ No conflict
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StateBadge state={rule.state} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={rule.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Impact rule={rule} />
                  </td>
                  <td
                    className="px-4 py-3 align-top text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ActionsMenu
                      rule={rule}
                      onAction={(a) => onAction(rule, a)}
                    />
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-16 text-center text-sm text-gray-400"
                >
                  No rules match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
        <span>
          {rules.length === 0
            ? "0 rules"
            : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, rules.length)} of ${rules.length} rules`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs">
            Page {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
