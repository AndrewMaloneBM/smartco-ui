# SmartCo — project rules

`smartco-ui` is a Back Market prototype. The base prototype was built by
**Adrien Moison (Adri)**. **Andrew Malone** is iterating on top of it without
changing Adri's work.

## 🔒 Rule #1 — Never touch Adri's prototype (HARD RULE)

Adri's original prototype is **read-only**. Do **not** edit, refactor, rename,
move, reformat, or delete any file Adri authored. His work must stay
byte-for-byte identical. This is not negotiable — it is the core constraint of
this project.

**Adri's files (DO NOT MODIFY):**

- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- everything under `src/components/` **except** `src/components/iterations/`
- everything under `src/lib/`
- root config: `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`,
  `postcss.config.mjs`, `package.json`, `package-lock.json`, `.eslintrc.json`,
  `vercel.json`, `README.md`

The **"Original"** iteration shows his prototype by **importing** his page
component (`@/app/page`) — never by copying or editing it.

**Reuse by import is fine** (e.g. importing his `Button`, `cn`, or types).
**Editing his files is not.** If a change seems to require editing one of Adri's
files — or any shared config above (e.g. adding a dependency) — **STOP and ask
Andrew first.**

## Andrew's work lives here (safe to edit)

- `src/app/iterations/` — the `/iterations` route (the iteration explorer)
- `src/components/iterations/` — sidebar, shell, and each iteration's views
- `CLAUDE.md` — this file

These sit inside `src/app` / `src/components` on purpose, so Tailwind's existing
`content` globs compile their classes **without** editing `tailwind.config.ts`.

## How the iteration explorer works

Open **`/iterations`**. A left sidebar switches between:

- **Original** — Adri's prototype, rendered untouched (`live`).
- **Iteration 1** — build when Andrew shares its PRD (`awaiting-prd`).
- **Iteration 2** — PRD expected the following week (`planned`).

Adri's plain prototype also stays available, untouched, at **`/`**.

To add a future iteration, append an entry to
`src/components/iterations/registry.tsx` and add its view under
`src/components/iterations/views/`.

## Workflow

- Work on a branch (currently `andrew/iteration-selector`); open a PR for review.
- Andrew has `WRITE` access — branches + PRs, not direct pushes to `main`.

## Deploy note

The repo is wired for **Vercel**, but Vercel is **not compliant at Back Market**.
Confirm the deploy target with Andrew / Adri before relying on it.
