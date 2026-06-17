import { Stats } from "@/lib/filters";
import { formatGmv } from "@/lib/utils";

function Stat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "green" | "amber" | "gray" | "dark";
}) {
  const toneClass =
    tone === "green"
      ? "text-green-600"
      : tone === "amber"
      ? "text-amber-600"
      : tone === "gray"
      ? "text-gray-500"
      : "text-gray-900";
  return (
    <div className="flex flex-col px-5">
      <span
        className={`font-display text-2xl font-semibold leading-none ${toneClass}`}
      >
        {value}
      </span>
      <span className="mt-1 text-xs font-medium text-gray-500">{label}</span>
    </div>
  );
}

export function StatsBar({
  stats,
  onViewConflicts,
}: {
  stats: Stats;
  onViewConflicts: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-y-4 rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center gap-3 pr-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-xl">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-gray-900">
              Price Incentive Rules
            </h2>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {stats.activeRules} active
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Commission adjustments applied upfront at order time across all rules
          </p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-y-3 divide-x divide-gray-200">
        <Stat
          value={String(stats.activeRules)}
          label="Active rules"
          tone="dark"
        />
        <Stat
          value={String(stats.withConflicts)}
          label="Conflicts"
          tone={stats.withConflicts > 0 ? "amber" : "dark"}
        />
        <Stat
          value={String(stats.deadWeight)}
          label="Active, no orders"
          tone={stats.deadWeight > 0 ? "amber" : "gray"}
        />
        <Stat
          value={formatGmv(stats.totalGmv30d)}
          label="GMV impacted (30d)"
          tone="green"
        />
      </div>

      <button
        onClick={onViewConflicts}
        className="ml-5 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
      >
        View conflicts →
      </button>
    </div>
  );
}
