"use client";

import type { ReactNode } from "react";

/** Shared empty-state for iterations that don't have a PRD / build yet. */
export function IterationPlaceholder({
  title,
  status,
  children,
}: {
  title: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white px-8 py-12 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-xl">
          🧪
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-gray-900">
          {title}
        </h2>
        <div className="mt-2">
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {status}
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
          {children}
        </p>
      </div>
    </div>
  );
}
