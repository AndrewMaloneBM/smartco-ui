import { CommissionRule } from "./types";

/** Tiny classnames helper (clsx-lite). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatGmv(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}k`;
  return `€${value.toFixed(0)}`;
}

export function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The scope dimensions of a rule, in granularity order, for display + conflict matching. */
export function scopeKey(rule: {
  market: string;
  category: string | null;
  product_id: string | null;
  grade: string | null;
  battery_type: string | null;
  seller_targeting: string;
}): string {
  return [
    rule.market,
    rule.category ?? "*",
    rule.product_id ?? "*",
    rule.grade ?? "*",
    rule.battery_type ?? "*",
    rule.seller_targeting,
  ].join("|");
}

const CSV_COLUMNS: Array<keyof CommissionRule> = [
  "id",
  "name",
  "market",
  "category",
  "product_id",
  "grade",
  "battery_type",
  "seller_targeting",
  "seller_ids",
  "commission_rate",
  "start_date",
  "end_date",
  "state",
  "status",
  "created_by",
  "created_at",
  "orderlines_30d",
  "gmv_30d",
];

function csvEscape(value: unknown): string {
  let s: string;
  if (value === null || value === undefined) s = "";
  else if (Array.isArray(value)) s = value.join(";");
  else s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rulesToCsv(rules: CommissionRule[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = rules.map((r) =>
    CSV_COLUMNS.map((col) => csvEscape(r[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
