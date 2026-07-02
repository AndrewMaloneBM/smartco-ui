"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, MARKETS, type Market } from "@/lib/types";
import { RevSelect } from "./revolve";
import { REV_RADIUS } from "../iteration-1/tokens";
import { Drawer, RevButton } from "./Drawer";
import { SELLER_POOL, isKnownProductId } from "./data";
import type { CreateInput } from "./engine";

const RATE_MIN = 2;
const RATE_MAX = 20;

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--rev-text-hi)" }}>
        {label}
        {optional && (
          <span className="text-xs font-normal" style={{ color: "var(--rev-text-muted)" }}>
            optional
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span className="text-xs" style={{ color: "var(--rev-text-muted)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--rev-surface-low)",
  border: "1px solid var(--rev-input-border)",
  borderRadius: REV_RADIUS.sm,
  color: "var(--rev-text-hi)",
};

/** Seller-targeting control: "All sellers" toggle, or search + chips from the pool. */
function SellerTargeting({
  targeting,
  sellerIds,
  onChange,
}: {
  targeting: "ALL" | "KEY_SELLERS";
  sellerIds: string[];
  onChange: (t: "ALL" | "KEY_SELLERS", ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SELLER_POOL.filter(
      (s) => !sellerIds.includes(s) && (!q || s.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, sellerIds]);

  const add = (s: string) => {
    onChange("KEY_SELLERS", [...sellerIds, s]);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("ALL", [])}
          className="flex-1 px-3 py-1.5 text-sm font-medium"
          style={{
            borderRadius: REV_RADIUS.sm,
            border: "1px solid",
            borderColor: targeting === "ALL" ? "var(--rev-text-hi)" : "var(--rev-border)",
            background: targeting === "ALL" ? "var(--rev-static-mid)" : "var(--rev-surface-low)",
            color: "var(--rev-text-hi)",
          }}
        >
          All sellers
        </button>
        <button
          type="button"
          onClick={() => onChange("KEY_SELLERS", sellerIds)}
          className="flex-1 px-3 py-1.5 text-sm font-medium"
          style={{
            borderRadius: REV_RADIUS.sm,
            border: "1px solid",
            borderColor: targeting === "KEY_SELLERS" ? "var(--rev-text-hi)" : "var(--rev-border)",
            background: targeting === "KEY_SELLERS" ? "var(--rev-static-mid)" : "var(--rev-surface-low)",
            color: "var(--rev-text-hi)",
          }}
        >
          Specific sellers
        </button>
      </div>

      {targeting === "KEY_SELLERS" && (
        <div className="relative" ref={ref}>
          {sellerIds.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {sellerIds.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
                  style={{ borderRadius: REV_RADIUS.xs, background: "var(--rev-static-hi)", color: "var(--rev-text-hi)" }}
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => onChange("KEY_SELLERS", sellerIds.filter((x) => x !== s))}
                    aria-label={`Remove ${s}`}
                    className="leading-none"
                    style={{ color: "var(--rev-text-low)" }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={query}
            placeholder="Start typing a seller trade name…"
            className="w-full px-3 py-1.5 text-sm"
            style={inputStyle}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              setOpen(v.trim().length > 0);
            }}
          />
          {open && query.trim().length > 0 && matches.length > 0 && (
            <div
              className="absolute z-30 mt-1 max-h-48 w-full overflow-auto py-1"
              style={{ background: "var(--rev-surface-low)", border: "1px solid var(--rev-border)", borderRadius: REV_RADIUS.sm }}
            >
              {matches.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:opacity-80"
                  style={{ color: "var(--rev-text-hi)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Optional prefill for the create form — used by the dev scenario triggers. */
export interface CreateSeed {
  campaignName?: string;
  targeting?: "ALL" | "KEY_SELLERS";
  sellerIds?: string[];
  markets?: string[];
  categories?: string[];
  productRaw?: string;
  productBlurred?: boolean;
  rate?: string;
  startDate?: string;
  endDate?: string;
}

export function CreateRulePanel({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<CreateInput, "author">) => void;
  initial?: CreateSeed | null;
}) {
  const [campaignName, setCampaignName] = useState("");
  const [targeting, setTargeting] = useState<"ALL" | "KEY_SELLERS">("ALL");
  const [sellerIds, setSellerIds] = useState<string[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [productRaw, setProductRaw] = useState("");
  const [productBlurred, setProductBlurred] = useState(false);
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [touched, setTouched] = useState(false);

  // Seed (or reset) the form whenever it opens or the prefill changes. `initial`
  // is a stable reference held in the parent, so this won't clobber typing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setCampaignName(initial?.campaignName ?? "");
      setTargeting(initial?.targeting ?? "ALL");
      setSellerIds(initial?.sellerIds ?? []);
      setMarkets(initial?.markets ?? []);
      setCategories(initial?.categories ?? []);
      setProductRaw(initial?.productRaw ?? "");
      setProductBlurred(initial?.productBlurred ?? false);
      setRate(initial?.rate ?? "");
      setStartDate(initial?.startDate ?? "");
      setEndDate(initial?.endDate ?? "");
      setTouched(false);
    }
  }, [open, initial]);

  const productIds = useMemo(
    () => productRaw.split(",").map((s) => s.trim()).filter(Boolean),
    [productRaw]
  );
  const unknownProducts = useMemo(
    () => productIds.filter((p) => !isKnownProductId(p)),
    [productIds]
  );

  const rateNum = rate === "" ? NaN : Number(rate);
  const rateValid = !Number.isNaN(rateNum) && rateNum >= 0 && rateNum <= 99.99;
  const rateOutOfBand = rateValid && (rateNum < RATE_MIN || rateNum > RATE_MAX);
  const datesValid = !(startDate && endDate) || new Date(endDate) >= new Date(startDate);

  // PRD: a rule can't be an all-markets/all-categories/all-products/all-sellers blanket.
  const tooBroad =
    markets.length === 0 &&
    categories.length === 0 &&
    productIds.length === 0 &&
    targeting === "ALL";

  const fanOut =
    (markets.length || MARKETS.length) *
    (categories.length || 1) *
    (productIds.length || 1) *
    (targeting === "KEY_SELLERS" ? Math.max(sellerIds.length, 1) : 1);

  const errors: string[] = [];
  if (!campaignName.trim()) errors.push("Campaign name is required.");
  if (!rateValid) errors.push("Commission rate must be a number between 0 and 99.99%.");
  if (!datesValid) errors.push("End date must be on or after the start date.");
  if (tooBroad) errors.push("Narrow the scope — specify at least one market, category, product, or seller.");
  // A specific product already belongs to one category, so requiring both on
  // the same rule is contradictory.
  if (categories.length > 0 && productIds.length > 0)
    errors.push("Category and Product ID can't both be set — a product already belongs to one category.");
  // Unknown product IDs block submission but surface inline (on blur), not in the summary.
  const canSubmit = errors.length === 0 && unknownProducts.length === 0;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      campaignName: campaignName.trim(),
      sellerTargeting: targeting,
      sellerIds,
      markets: markets as Market[],
      categories,
      productIds,
      commissionRate: Number(rateNum.toFixed(2)),
      startDate: startDate || null,
      endDate: endDate || null,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create commission rule"
      subtitle="Multi-selects fan out into one rule per combination."
      width={480}
      footer={
        <>
          <RevButton variant="secondary" onClick={onClose}>
            Cancel
          </RevButton>
          <RevButton variant="primary" onClick={submit} disabled={!canSubmit}>
            Create {fanOut > 1 ? `${fanOut} rules` : "rule"}
          </RevButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Campaign name" hint="Groups related rules under one campaign.">
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. Summer smartphones push"
            className="w-full px-3 py-2 text-sm"
            style={inputStyle}
          />
        </Field>

        <Field label="Seller targeting">
          <SellerTargeting
            targeting={targeting}
            sellerIds={sellerIds}
            onChange={(t, ids) => {
              setTargeting(t);
              setSellerIds(ids);
            }}
          />
        </Field>

        <Field label="Market" optional hint="Empty = all markets in the marketplace.">
          <RevSelect label="markets" hideLabel options={[...MARKETS]} selected={markets} onChange={setMarkets} />
        </Field>

        <Field label="Category" optional hint="Empty = all categories.">
          <RevSelect label="categories" hideLabel options={[...CATEGORIES]} selected={categories} onChange={setCategories} />
        </Field>

        <Field
          label="Product ID"
          optional
          hint="Comma-separated UUIDs, validated against the catalog. Empty = all products."
        >
          <input
            type="text"
            value={productRaw}
            onChange={(e) => {
              setProductRaw(e.target.value);
              if (productBlurred) setProductBlurred(false); // re-validate fresh on next blur
            }}
            onBlur={() => setProductBlurred(true)}
            placeholder="e.g. iPhone15Pro-256, GalaxyS23-256"
            className="w-full px-3 py-2 text-sm"
            style={{
              ...inputStyle,
              borderColor:
                productBlurred && unknownProducts.length
                  ? "var(--rev-danger)"
                  : (inputStyle.border as string),
            }}
          />
          {productBlurred && unknownProducts.length > 0 && (
            <span className="text-xs font-medium" style={{ color: "var(--rev-danger)" }}>
              {unknownProducts.length === 1
                ? `"${unknownProducts[0]}" isn't a known product ID.`
                : `These product IDs aren't recognised: ${unknownProducts.join(", ")}.`}
            </span>
          )}
        </Field>

        <Field label="Commission rate (%)" hint="Standard rate between 2-20%.">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min={0}
              max={99.99}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0.00"
              className="w-32 px-3 py-2 text-sm"
              style={{
                ...inputStyle,
                borderColor: rate !== "" && !rateValid ? "var(--rev-danger)" : (inputStyle.border as string),
              }}
            />
            {rateOutOfBand && (
              <span className="text-xs font-medium" style={{ color: "var(--rev-warning)" }}>
                ⚠ Outside the standard 2–20% band
              </span>
            )}
          </div>
        </Field>

        <div className="flex gap-3">
          <Field label="Start date" optional>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={inputStyle}
            />
          </Field>
          <Field label="End date" optional>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm"
              style={{
                ...inputStyle,
                borderColor: !datesValid ? "var(--rev-danger)" : (inputStyle.border as string),
              }}
            />
          </Field>
        </div>

        {touched && errors.length > 0 && (
          <div
            className="flex flex-col gap-1 px-3 py-2 text-xs"
            style={{ background: "var(--rev-warning-bg)", color: "var(--rev-warning)", borderRadius: REV_RADIUS.sm }}
          >
            {errors.map((e) => (
              <span key={e}>• {e}</span>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
