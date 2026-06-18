"use client";

// The "Original" iteration. This renders Adri's prototype EXACTLY as he built it
// by importing his page component. It must never copy, fork, or modify his code —
// see CLAUDE.md, Rule #1. If his prototype needs to change, that's Adri's call.
import Home from "@/app/page";

export function OriginalView() {
  return <Home />;
}
