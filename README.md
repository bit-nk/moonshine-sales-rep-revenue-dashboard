# Moonshine Dashboard

A Sales Lead CRM dashboard for Moonshine Enterprise. Built with React + Vite + TypeScript + Tailwind + shadcn-ui. All data is **local stub data** - no backend, no API keys, no network calls. Runs locally or as a fully-static GitHub Pages site.

## Pages

- **Overview** (`/`) - executive KPIs, connector tile grid, revenue attribution
- **Source Performance** (`/#/digital-zone`) - channel performance, spend, CPL, ROAS
- **Leads and Agents** (`/#/agent-zone`) - lead pipeline funnel, sales rep activity, ad-lead assignment
- **Revenue Funnel** (`/#/sales-zone`) - SQL → demo → closed-won funnel, top closers, deals by program
- **Settings** (`/#/settings`) - connector toggles, alert thresholds, sales rep management, theme

From the Overview page, the connector tiles (HubSpot, Meta Ads, Stripe, Dialer, NetSweep) drill into their own focused views in-place.

## Running locally

```sh
npm install
npm run dev
```

Open `http://localhost:8080/`. Sign in with `admin` / `admin`.

## Building

```sh
npm run build       # outputs ./dist
npm run preview     # serves ./dist locally for a sanity-check
```

## Deploying to GitHub Pages

The repo ships with a GitHub Actions workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml). On every push to `main` it builds the site and deploys it to GitHub Pages.

To enable the first time:

1. Repo **Settings → Pages → Source** = "GitHub Actions"
2. Push to `main`; the workflow runs and publishes to `https://<owner>.github.io/<repo>/`

The Vite config uses `base: "./"` so asset URLs are relative (works under any repo subpath), and the app uses `HashRouter` so deep links (`/#/sales-zone`, etc.) resolve without server-side rewrites.

## Connectors (stub)

The dashboard is shaped around five connectors per the project's SoW:

| Connector | What it surfaces |
|---|---|
| HubSpot | Lead pipeline, stages, sales rep assignment |
| Meta Marketing | Paid social ad spend, lead sourcing, CPL, attributed revenue |
| Dialer | Outbound & inbound call activity (REST + webhook events) |
| NetSweep | Financial qualification signals (income band, credit tier, score) |
| Stripe | Payments, revenue attribution, webhook events |

All five are deterministically stubbed in [src/data/stubData.ts](src/data/stubData.ts) using a seeded RNG anchored to `new Date()`, so the demo always shows recent-looking activity regardless of when you run it.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn-ui (Radix primitives)
- Recharts for charts, Framer Motion for animation
- TanStack React Query (every query reads from local stub data)
- React Router v6 (HashRouter)
