"use client";

import { useMemo, useState } from "react";
import { CommissionRule } from "@/lib/types";
import { MOCK_RULES } from "@/lib/mock-data";
import {
  computeStats,
  EMPTY_FILTERS,
  filterRules,
  Filters,
} from "@/lib/filters";
import {
  applyAction,
  computeState,
  recomputeConflicts,
  RuleAction,
} from "@/lib/actions";
import { rulesToCsv, downloadCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { StatsBar } from "@/components/stats-bar";
import { FilterBar } from "@/components/filter-bar";
import { RulesTable } from "@/components/rules-table";
import { RuleDrawer } from "@/components/rule-drawer";
import {
  CreateRuleModal,
  NewRuleDraft,
} from "@/components/create-rule-modal";
import { ImportCsvModal } from "@/components/import-csv-modal";

const CURRENT_USER = "adrien.moison@backmarket.com";

const ACTION_TOAST: Record<
  RuleAction,
  { message: string; variant: "success" | "warning" | "info" }
> = {
  validate: { message: "✅ Rule validated", variant: "success" },
  pause: { message: "⏸ Rule paused", variant: "info" },
  archive: { message: "🗄 Rule archived", variant: "info" },
  delete: { message: "🗑 Rule deleted", variant: "info" },
};

export default function Home() {
  const { toast } = useToast();
  const [rules, setRules] = useState<CommissionRule[]>(() =>
    MOCK_RULES.map((r) => ({ ...r }))
  );
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<CommissionRule | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => filterRules(rules, filters), [rules, filters]);
  const stats = useMemo(() => computeStats(rules), [rules]);

  // Keep the drawer's rule reference fresh after mutations.
  const selectedLive = selected
    ? rules.find((r) => r.id === selected.id) ?? null
    : null;

  const handleAction = (rule: CommissionRule, action: RuleAction) => {
    const next = applyAction(rules, rule.id, action);
    setRules(next);
    if (action === "delete" || action === "archive") {
      if (selected?.id === rule.id) setSelected(null);
    }
    const t = ACTION_TOAST[action];
    toast(t.message, t.variant);
  };

  const handleCreate = (draft: NewRuleDraft, mode: "draft" | "validate") => {
    const maxId = rules.reduce((m, r) => {
      const n = parseInt(r.id.replace("RULE-", ""), 10);
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 1000);
    const id = `RULE-${maxId + 1}`;

    const base: CommissionRule = {
      id,
      name: draft.name,
      market: draft.market,
      category: draft.category,
      product_id: draft.product_id,
      grade: draft.grade,
      battery_type: draft.battery_type,
      seller_targeting: draft.seller_targeting,
      seller_ids: draft.seller_ids,
      commission_rate: draft.commission_rate,
      start_date: draft.start_date,
      end_date: draft.end_date,
      state: "INACTIVE",
      status: mode === "validate" ? "VALIDATED" : "DRAFT",
      created_by: CURRENT_USER,
      created_at: new Date().toISOString(),
      conflicts: [],
      orderlines_30d: null,
      gmv_30d: null,
    };
    base.state = computeState(base);

    const next = recomputeConflicts([...rules, base].map((r) => ({ ...r })));
    setRules(next);
    setCreateOpen(false);

    const created = next.find((r) => r.id === id)!;
    if (mode === "draft" && created.conflicts.length > 0) {
      toast("⚠️ Conflict detected — rule saved as Draft", "warning");
    } else if (mode === "validate") {
      toast("✅ Rule created and validated", "success");
    } else {
      toast("📝 Rule saved as draft", "info");
    }
  };

  const handleExport = () => {
    const csv = rulesToCsv(filtered);
    downloadCsv("smart-commission-rules.csv", csv);
    toast(`⬇ Exported ${filtered.length} rules to CSV`, "success");
  };

  const handleImport = (imported: number, skipped: number) => {
    toast(
      `✅ ${imported} rules imported. ${skipped} skipped due to conflicts.`,
      "success"
    );
  };

  const showConflictBanner = stats.withConflicts > 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900">
            Smart Commission Rules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage upfront commission reductions by market, scope, and seller
            targeting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            ⬆ Import CSV
          </Button>
          <Button variant="ghost" onClick={handleExport}>
            ⬇ Export CSV
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            + New Rule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6">
        <StatsBar
          stats={stats}
          onViewConflicts={() =>
            setFilters({ ...EMPTY_FILTERS, conflicts: "WITH" })
          }
        />
      </div>

      {/* Conflict banner */}
      {showConflictBanner && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>⚠️</span>
          <span>
            <strong>{stats.withConflicts} rule conflicts detected.</strong>{" "}
            Overlapping rules exist on the same scope. The highest-priority rule
            applies at order time — other matching rules are overridden.
          </span>
          <button
            onClick={() => setFilters({ ...EMPTY_FILTERS, conflicts: "WITH" })}
            className="ml-auto whitespace-nowrap font-medium text-amber-700 hover:underline"
          >
            Review conflicts →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <div className="mt-4">
        <RulesTable
          rules={filtered}
          onRowClick={setSelected}
          onAction={handleAction}
        />
      </div>

      {/* Drawer */}
      <RuleDrawer
        rule={selectedLive}
        allRules={rules}
        onClose={() => setSelected(null)}
        onAction={handleAction}
        onOpenRule={setSelected}
      />

      {/* Modals */}
      <CreateRuleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        allRules={rules}
        onCreate={handleCreate}
      />
      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </main>
  );
}
