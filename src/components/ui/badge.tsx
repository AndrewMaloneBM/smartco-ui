import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RuleState, RuleStatus } from "@/lib/types";

type Tone =
  | "green"
  | "gray"
  | "yellow"
  | "orange"
  | "amber"
  | "blue"
  | "red";

const tones: Record<Tone, string> = {
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-600",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-red-100 text-red-700",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<RuleStatus, Tone> = {
  DRAFT: "yellow",
  VALIDATED: "green",
  PAUSED: "orange",
  ARCHIVED: "gray",
};

export function StatusBadge({ status }: { status: RuleStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{status}</Badge>;
}

export function StateBadge({ state }: { state: RuleState }) {
  return (
    <Badge tone={state === "ACTIVE" ? "green" : "gray"}>{state}</Badge>
  );
}
