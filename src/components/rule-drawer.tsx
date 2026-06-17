"use client";

import { useEffect } from "react";
import {
  CommissionRule,
  isRateOutOfRange,
  isSellerSpecific,
} from "@/lib/types";
import { RuleAction } from "@/lib/actions";
import {
  cn,
  formatDate,
  formatDateTime,
  formatGmv,
  formatNumber,
} from "@/lib/utils";
import { Badge, StateBadge, StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 px-6 py-5">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function RuleDrawer({
  rule,
  allRules,
  onClose,
  onAction,
  onOpenRule,
}: {
  rule: CommissionRule | null;
  allRules: CommissionRule[];
  onClose: () => void;
  onAction: (rule: CommissionRule, action: RuleAction) => void;
  onOpenRule: (rule: CommissionRule) => void;
}) {
  useEffect(() => {
    if (!rule) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rule, onClose]);

  if (!rule) return null;

  const conflictRules = rule.conflicts
    .map((id) => allRules.find((r) => r.id === id))
    .filter((r): r is CommissionRule => Boolean(r));

  const deadWeight = rule.state === "ACTIVE" && !(rule.orderlines_30d ?? 0);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 flex h-full w-[480px] max-w-[92vw] flex-col bg-white shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h2 className="font-display text-xl font-semibold leading-tight text-gray-900">
              {rule.name}
            </h2>
            <p className="mt-1 text-sm text-gray-400">{rule.id}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
          <StateBadge state={rule.state} />
          <StatusBadge status={rule.status} />
          {isSellerSpecific(rule) && <Badge tone="blue">Key sellers only</Badge>}
          {rule.conflicts.length > 0 && (
            <Badge tone="amber">⚡ {rule.conflicts.length} conflict{rule.conflicts.length > 1 ? "s" : ""}</Badge>
          )}
        </div>

        <div className="mt-2 flex-1 overflow-y-auto scrollbar-thin">
          {/* Commission hero */}
          <div className="px-6 py-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-6 text-center">
              <div
                className={cn(
                  "font-display text-5xl font-semibold tracking-tight",
                  isRateOutOfRange(rule.commission_rate)
                    ? "text-amber-600"
                    : "text-gray-900"
                )}
              >
                {rule.commission_rate.toFixed(1)}%
              </div>
              <div className="mt-1 text-sm text-gray-500">Commission rate</div>
              {isRateOutOfRange(rule.commission_rate) && (
                <div className="mt-2 text-xs font-medium text-amber-600">
                  Outside typical 2–20% band
                </div>
              )}
            </div>
          </div>

          {/* Scope */}
          <Section title="Scope">
            <KV label="Market" value={rule.market} />
            <KV label="Category" value={rule.category ?? "All categories"} />
            <KV label="Product" value={rule.product_id ?? "All products"} />
            <KV label="Grade" value={rule.grade ?? "All grades"} />
            <KV
              label="Battery type"
              value={rule.battery_type ?? "All battery types"}
            />
          </Section>

          {/* Seller targeting */}
          <Section title="Seller targeting">
            {rule.seller_targeting === "ALL" ? (
              <p className="text-sm text-gray-700">All sellers</p>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {rule.seller_ids.length} key seller
                  {rule.seller_ids.length > 1 ? "s" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {rule.seller_ids.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Impact */}
          <Section title="Impact (30d)">
            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  (rule.orderlines_30d ?? 0) > 0
                    ? "border-green-100 bg-green-50"
                    : "border-gray-100 bg-gray-50"
                )}
              >
                <div className="text-xs text-gray-500">Orderlines</div>
                <div
                  className={cn(
                    "mt-1 text-2xl font-bold",
                    (rule.orderlines_30d ?? 0) > 0
                      ? "text-green-700"
                      : "text-gray-400"
                  )}
                >
                  {formatNumber(rule.orderlines_30d ?? 0)}
                </div>
              </div>
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  (rule.gmv_30d ?? 0) > 0
                    ? "border-green-100 bg-green-50"
                    : "border-gray-100 bg-gray-50"
                )}
              >
                <div className="text-xs text-gray-500">GMV</div>
                <div
                  className={cn(
                    "mt-1 text-2xl font-bold",
                    (rule.gmv_30d ?? 0) > 0 ? "text-green-700" : "text-gray-400"
                  )}
                >
                  {formatGmv(rule.gmv_30d ?? 0)}
                </div>
              </div>
            </div>
            {deadWeight && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                ⚠️ Active rule with zero orders in 30 days — consider archiving.
              </div>
            )}
          </Section>

          {/* Conflicts */}
          {conflictRules.length > 0 && (
            <Section title="Conflicts">
              <div className="space-y-2">
                {conflictRules.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onOpenRule(c)}
                    className="block w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {c.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {c.commission_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{c.id}</span>
                      <span>·</span>
                      <span>
                        {isSellerSpecific(c) ? "Seller-specific" : "All sellers"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Overlapping rules exist on the same scope. The highest-priority
                rule applies at order time — other matching rules are overridden.
              </p>
            </Section>
          )}

          {/* Metadata */}
          <Section title="Metadata">
            <KV label="Created by" value={rule.created_by} />
            <KV label="Created at" value={formatDateTime(rule.created_at)} />
            <KV label="Start date" value={formatDate(rule.start_date)} />
            <KV label="End date" value={formatDate(rule.end_date)} />
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-gray-100 px-6 py-4">
          {rule.status !== "VALIDATED" && rule.status !== "ARCHIVED" && (
            <Button variant="primary" onClick={() => onAction(rule, "validate")}>
              Validate
            </Button>
          )}
          {rule.status === "VALIDATED" && (
            <Button variant="secondary" onClick={() => onAction(rule, "pause")}>
              Pause
            </Button>
          )}
          {rule.status !== "ARCHIVED" && (
            <Button variant="secondary" onClick={() => onAction(rule, "archive")}>
              Archive
            </Button>
          )}
          <Button
            variant="danger"
            className="ml-auto"
            onClick={() => onAction(rule, "delete")}
          >
            Delete
          </Button>
        </div>
      </aside>
    </div>
  );
}
