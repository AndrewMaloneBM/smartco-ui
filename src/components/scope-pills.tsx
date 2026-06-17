import { CommissionRule, MARKET_FLAGS } from "@/lib/types";

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "market";
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium " +
        (tone === "market"
          ? "bg-gray-100 text-gray-700"
          : "bg-gray-100 text-gray-600")
      }
    >
      {children}
    </span>
  );
}

export function ScopePills({ rule }: { rule: CommissionRule }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Pill tone="market">
        <span>{MARKET_FLAGS[rule.market]}</span>
        {rule.market}
      </Pill>
      {rule.category && <Pill>{rule.category}</Pill>}
      {rule.product_id && <Pill>{rule.product_id}</Pill>}
      {rule.grade && <Pill>{rule.grade}</Pill>}
      {rule.battery_type && <Pill>{rule.battery_type}</Pill>}
    </div>
  );
}
