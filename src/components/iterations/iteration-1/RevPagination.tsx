"use client";

import { cn } from "@/lib/utils";

/**
 * RevPagination — React stand-in for Revolve's Vue-only RevPagination, styled to
 * Back Market's production pager: a filled dark current page, plain-text page
 * numbers, ellipses for collapsed ranges, and circular prev/next chevrons.
 * Tokens: current = background.action.default.hi; numbers = text.action.default.hi;
 * ellipsis = text.static.default.low; body-2 (current = body-2-bold); radius.sm/full.
 */
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    set.add(2);
    set.add(3);
  }
  if (current >= total - 2) {
    set.add(total - 1);
    set.add(total - 2);
  }
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dir === "next" ? "rotate-180" : undefined}
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function RevPagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  const go = (p: number) => {
    const next = Math.min(total, Math.max(1, p));
    if (next !== page) onChange(next);
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-40"
        style={{
          background: "var(--rev-static-mid)",
          color: "var(--rev-text-hi)",
        }}
      >
        <Chevron dir="prev" />
      </button>

      {pageList(page, total).map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`e${i}`}
            aria-hidden
            className="flex h-10 min-w-10 select-none items-center justify-center px-1 text-sm"
            style={{ color: "var(--rev-text-low)" }}
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            onClick={() => go(item)}
            className={cn(
              "flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm transition-colors",
              item === page ? "font-semibold" : "hover:bg-[var(--rev-static-mid)]"
            )}
            style={
              item === page
                ? { background: "var(--rev-primary)", color: "#fff" }
                : { color: "var(--rev-text-hi)" }
            }
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= total}
        onClick={() => go(page + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-40"
        style={{
          background: "var(--rev-static-mid)",
          color: "var(--rev-text-hi)",
        }}
      >
        <Chevron dir="next" />
      </button>
    </nav>
  );
}
