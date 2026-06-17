# Smart Commission Management Interface

A functional web prototype — the **first UI layer** on top of Back Market's
production Smart Commission Service (FastAPI + PostgreSQL). It lets Back Makers
create, manage and monitor Smart Commission rules without backend access, with
full granularity control (Market × Category × Product × Grade × Battery Type),
built-in conflict detection and impact metrics.

> This is a UI prototype. There is **no real API connection** — it runs entirely
> on realistic mock data generated client-side.

## Features

- **Rule list** — filterable, paginated table (25/page) of 44 mock rules with
  priority, scope pills, sellers, commission rate, conflicts, state, status and
  30-day impact (orderlines + GMV).
- **Stats bar** — active rules, conflicts, "dead weight" (active rules with zero
  orders), and total GMV impacted in the last 30 days.
- **Filters** — market, category, seller targeting, state, status, conflicts,
  applied (30d), plus free-text search. Fully client-side.
- **Rule detail drawer** — slides in from the right (480px) with commission
  hero, full scope, seller targeting, impact, conflicts and metadata.
- **Create rule modal** — full validation (rate bounds, key-seller IDs, date
  order, scope minimums) and pre-submission conflict detection.
- **CSV import** — template download, upload, validation preview (errors
  highlighted), and import summary.
- **CSV export** — downloads the current filtered view.
- **Toasts** on every action (create, validate, pause, archive, delete, import).

## Tech stack

- Next.js 14 (App Router) · TypeScript
- Tailwind CSS · Inter (Google Fonts)
- Hand-rolled shadcn-style UI primitives (Button, Badge, Modal, Drawer, Toast)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build — must pass with zero errors
npm start        # serve the production build
```

## Deploy

Deployed on Vercel. To deploy your own copy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/smartco-ui)

Or from the CLI:

```bash
npm i -g vercel
vercel --prod
```

## Project structure

```
src/
  app/
    layout.tsx          # Inter font + ToastProvider
    page.tsx            # main orchestrator (state, actions)
    globals.css
  components/
    stats-bar.tsx
    filter-bar.tsx
    multi-select.tsx
    rules-table.tsx
    actions-menu.tsx
    scope-pills.tsx
    rule-drawer.tsx
    create-rule-modal.tsx
    import-csv-modal.tsx
    ui/                 # button, badge, modal, field, toast
  lib/
    types.ts            # CommissionRule data model
    mock-data.ts        # deterministic 44-rule generator
    filters.ts          # filtering + stats
    actions.ts          # state/conflict recomputation, row actions
    utils.ts            # formatters, CSV helpers
```

## Data model

See [`src/lib/types.ts`](src/lib/types.ts) for the full `CommissionRule` type.
Conflicts are computed as non-archived rules sharing an identical scope
(Market × Category × Product × Grade × Battery Type × seller targeting).
