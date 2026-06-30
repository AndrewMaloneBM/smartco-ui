"use client";

import { useEffect, useState } from "react";
import { ITERATIONS, DEFAULT_ITERATION } from "./registry";
import { IterationSidebar } from "./iteration-sidebar";

const STORAGE_KEY = "smartco.iteration";

/**
 * Shell for the iteration explorer: a left sidebar to switch between the
 * Original prototype and Andrew's iterations, plus the active view on the right.
 * Lives entirely outside Adri's prototype files (see CLAUDE.md).
 */
export function IterationExplorer() {
  const [selected, setSelected] = useState<string>(DEFAULT_ITERATION);
  const [collapsed, setCollapsed] = useState(false);
  // The active dev scenario applied to the view, and which iteration's scenario
  // list is currently drilled into in the sidebar (null = default iteration list).
  const [scenario, setScenario] = useState<string | null>(null);
  const [scenarioMenu, setScenarioMenu] = useState<string | null>(null);

  // Restore the last-viewed iteration after mount (kept out of the initial
  // render to avoid an SSR/client hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ITERATIONS.some((i) => i.id === saved)) setSelected(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selected);
  }, [selected]);

  const active = ITERATIONS.find((i) => i.id === selected) ?? ITERATIONS[0];
  const ActiveView = active.Component;

  // Switching iterations clears any active scenario and closes the scenario menu.
  const selectIteration = (id: string) => {
    setSelected(id);
    setScenario(null);
    setScenarioMenu(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <IterationSidebar
        selected={selected}
        onSelect={selectIteration}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        scenarioMenu={scenarioMenu}
        activeScenario={scenario}
        onOpenScenarios={(id) => {
          setSelected(id);
          setScenarioMenu(id);
        }}
        onCloseScenarios={() => setScenarioMenu(null)}
        onSelectScenario={setScenario}
      />
      {/* Not a <main>: the Original view renders Adri's own <main>. */}
      <div className="scrollbar-thin flex-1 overflow-auto">
        <ActiveView scenario={scenario} />
      </div>
    </div>
  );
}
