# TruthLayer

Social-layer truth overlay for crypto. Chrome extension that renders on-chain reality checks directly under tweets on X/Twitter (phase 1), with a shared identity graph powering both consumer and B2B API tiers.

## Repo layout

```
apps/
  extension/   Chrome MV3 extension (Vite + React, Shadow DOM overlay on x.com)
  api/         Fastify stub exposing /v1/score (contract from docs/scoring.md)
packages/
  shared/      TypeScript types shared by extension and API
data/
  kol-seed.json    Hand-curated identity-graph seed (40 entries)
docs/
  identity-graph.md        How handles are linked to wallets (A/B/B+/C tiers)
  monetization-and-auth.md Freemium B2C + metered B2B pricing and auth flow
  scoring.md               Exact formulas for every number shown in the overlay
reference/
  mockup.html  Static HTML reference of the overlay on X (no dependencies)
```

## Quick start

```bash
npm install
npm run dev:api         # starts mock scoring API on :8787
npm run dev:extension   # builds the extension to apps/extension/dist (watch mode)
```

Then load `apps/extension/dist` as an unpacked extension in Chrome (`chrome://extensions` -> Developer mode -> Load unpacked) and open `https://x.com`.

## Status

MVP skeleton. Overlay renders with mock data from the local API. Real scoring, identity graph, and auth are tracked in follow-up issues.

## Steering

`.kiro/steering/*.md` contains the invariants that must hold across all future changes (identity tiers, scoring rules, monetization model, auth). Read them before contributing.
