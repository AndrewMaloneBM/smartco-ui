"use client";

import { useMemo, useState } from "react";
import {
  BATTERY_TYPES,
  BatteryType,
  CATEGORIES,
  CommissionRule,
  Grade,
  GRADES,
  isRateOutOfRange,
  Market,
  MARKETS,
} from "@/lib/types";
import { findScopeConflicts } from "@/lib/actions";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Field, Input, Select } from "./ui/field";

export type NewRuleDraft = {
  name: string;
  market: Market;
  category: string | null;
  product_id: string | null;
  grade: Grade | null;
  battery_type: BatteryType | null;
  seller_targeting: "ALL" | "KEY_SELLERS";
  seller_ids: string[];
  commission_rate: number;
  start_date: string | null;
  end_date: string | null;
};

type Errors = Partial<Record<string, string>>;

export function CreateRuleModal({
  open,
  onClose,
  allRules,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  allRules: CommissionRule[];
  onCreate: (draft: NewRuleDraft, mode: "draft" | "validate") => void;
}) {
  const [name, setName] = useState("");
  const [market, setMarket] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [productId, setProductId] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [battery, setBattery] = useState<string>("");
  const [targeting, setTargeting] = useState<"ALL" | "KEY_SELLERS">("ALL");
  const [sellerIds, setSellerIds] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const reset = () => {
    setName("");
    setMarket("");
    setCategory("");
    setProductId("");
    setGrade("");
    setBattery("");
    setTargeting("ALL");
    setSellerIds("");
    setRate("");
    setStartDate("");
    setEndDate("");
    setErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const parsedSellerIds = useMemo(
    () =>
      sellerIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [sellerIds]
  );

  const rateNum = parseFloat(rate);

  // Live conflict check: any non-archived rule with an identical scope.
  const scopeConflicts = useMemo(() => {
    if (!market) return [];
    return findScopeConflicts(allRules, {
      market,
      category: category || null,
      product_id: productId.trim() || null,
      grade: grade || null,
      battery_type: battery || null,
      seller_targeting: targeting,
    });
  }, [market, category, productId, grade, battery, targeting, allRules]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Rule name is required.";
    if (!market) e.market = "Market is required.";
    if (!rate.trim()) e.rate = "Commission rate is required.";
    else if (Number.isNaN(rateNum) || rateNum <= 0 || rateNum > 99.99)
      e.rate = "Rate must be > 0 and ≤ 99.99.";
    else if (!/^\d+(\.\d{1,2})?$/.test(rate.trim()))
      e.rate = "Max 2 decimal places.";
    if (targeting === "KEY_SELLERS" && parsedSellerIds.length === 0)
      e.sellerIds = "At least one seller ID is required for key sellers.";
    if (startDate && endDate && endDate <= startDate)
      e.endDate = "End date must be after start date.";
    // At least one scope dimension beyond market alone
    if (!category && !productId.trim() && !grade && !battery)
      e.scope =
        "Specify at least one scope dimension beyond market (category, product, grade or battery).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildDraft = (): NewRuleDraft => ({
    name: name.trim(),
    market: market as Market,
    category: category || null,
    product_id: productId.trim() || null,
    grade: (grade || null) as Grade | null,
    battery_type: (battery || null) as BatteryType | null,
    seller_targeting: targeting,
    seller_ids: targeting === "KEY_SELLERS" ? parsedSellerIds : [],
    commission_rate: rateNum,
    start_date: startDate || null,
    end_date: endDate || null,
  });

  const submit = (mode: "draft" | "validate") => {
    if (!validate()) return;
    // If activating into a conflicting scope, force draft.
    const effectiveMode =
      mode === "validate" && scopeConflicts.length > 0 ? "draft" : mode;
    onCreate(buildDraft(), effectiveMode);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create Commission Rule"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => submit("draft")}>
            Save as draft
          </Button>
          <Button variant="primary" onClick={() => submit("validate")}>
            Create &amp; validate
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Rule name" required error={errors.name}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. iPhone FR - All Sellers - Q2 2026"
          />
        </Field>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Scope
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Market" required error={errors.market}>
              <Select value={market} onChange={(e) => setMarket(e.target.value)}>
                <option value="">Select market…</option>
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field
              label="Product ID"
              hint="BMID — leave blank to apply to the full category"
            >
              <Input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="e.g. iPhone15Pro, 703981…"
              />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Grade">
              <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">All grades</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Battery type">
              <Select
                value={battery}
                onChange={(e) => setBattery(e.target.value)}
              >
                <option value="">All battery types</option>
                {BATTERY_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {errors.scope && (
            <p className="mt-2 text-xs text-red-600">{errors.scope}</p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Seller targeting
          </h4>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="targeting"
                checked={targeting === "ALL"}
                onChange={() => setTargeting("ALL")}
                className="h-4 w-4 text-brand focus:ring-brand"
              />
              All sellers
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="targeting"
                checked={targeting === "KEY_SELLERS"}
                onChange={() => setTargeting("KEY_SELLERS")}
                className="h-4 w-4 text-brand focus:ring-brand"
              />
              Key sellers only
            </label>
          </div>
          {targeting === "KEY_SELLERS" && (
            <div className="mt-3">
              <Field
                label="Seller IDs"
                required
                hint="Comma-separated, e.g. 1042EU, 2219EU"
                error={errors.sellerIds}
              >
                <Input
                  value={sellerIds}
                  onChange={(e) => setSellerIds(e.target.value)}
                  placeholder="1042EU, 2219EU"
                />
              </Field>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Commission adjustment
          </h4>
          <Field
            label="Commission rate (%)"
            required
            error={errors.rate}
            hint="Standard rate is 7–15%. Values outside 2–20% are flagged."
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              max="99.99"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 8.5"
            />
          </Field>
          {rate && !errors.rate && isRateOutOfRange(rateNum) && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⚠️ {rateNum}% is outside the typical 2–20% band. Double-check this rate.
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Start date">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="End date" error={errors.endDate}>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {scopeConflicts.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">⚠️ Conflict detected</p>
            <p className="mt-1 text-xs">
              A rule for this scope already exists (
              {scopeConflicts
                .map((c) => `${c.id}, ${c.commission_rate}%`)
                .join("; ")}
              ). It will be saved as a <strong>Draft</strong> so you can resolve
              the conflict before activating.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
