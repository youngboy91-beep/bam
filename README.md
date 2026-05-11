<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/Fastify-API-000000?style=for-the-badge&logo=fastify&logoColor=white" />
  <img src="https://img.shields.io/badge/Postgres-Persistent-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/SIWE-Crypto%20Auth-7B3FE4?style=for-the-badge&logo=ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

<h1 align="center">TruthLayer</h1>

<p align="center">
  <strong>On-chain reality checks for Crypto Twitter.</strong><br/>
  A Chrome extension that shows who really holds what they shill — directly in your X feed.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deploy">Deploy</a> •
  <a href="#features">Features</a> •
  <a href="#docs">Docs</a>
</p>

---

## The Problem

Every day on Crypto Twitter:
- KOLs shill tokens they **bought minutes before the tweet** and dump on followers
- Serial callers post "100x guaranteed" with a **-70% historical PnL**
- New accounts promote rug-pulls as "based dev, LFG"

You can't tell who's real and who's not. Until now.

## The Solution

TruthLayer injects a **single colored dot** next to every handle on X. Hover it — and see the truth:

```
🟢 Green  = Verified holder, clean history
🟡 Yellow = Caution — entered position before tweet, serial caller
🔴 Red    = High risk — linked to rug-pulls, concentrated supply
⚪ Gray   = Unverified — no wallet claimed yet
```

No noise. No full-width banners. Just a quiet dot that speaks volumes when you ask it.

---

## How It Works

### 1. Inline Dot (always visible, zero noise)

A tiny colored indicator next to the `@handle` — takes 8px of space. Your feed stays clean.

### 2. Hover Card (on demand)

Hover the dot → floating card with:
- **Identity tier** (A / B / B+ / C) with verification level
- **Three metrics**: holds token? shill history? avg PnL after calls?
- **External links**: Etherscan, DeBank, Arkham, Solscan, DEXScreener, Birdeye — one click away
- **Human explanation**: "Author entered position 6h before promoting. Historical calls underperform."

### 3. Claim Flow (30 seconds to verify)

Any crypto user can prove they are who they say they are:
1. Enter X handle
2. Connect wallet (MetaMask, Phantom, Rabby, Backpack)
3. Sign one message
4. Get A-tier verified badge — visible to everyone with the extension

---

## Features

| Feature | Status |
|---------|--------|
| Inline dot overlay on X/Twitter | ✅ Live |
| Hover card with 3 metrics + explanation | ✅ Live |
| External links (Etherscan, DEXScreener, Arkham, etc.) | ✅ Live |
| Self-onboarding claim flow (SIWE + SIWS) | ✅ Live |
| Multi-chain support (ETH, SOL, Base, Arbitrum, BNB) | ✅ Live |
| Anonymous session (no login wall) | ✅ Live |
| Postgres persistent identity graph | ✅ Live |
| Server-side scoring (no client-side thresholds) | ✅ Live |
| Anti-replay (single-use nonces, 10-min TTL) | ✅ Live |
| Production Dockerfile | ✅ Ready |
| Real on-chain data adapters | 🔨 Next |
| Twitter OAuth | 🔨 Next |
| Chrome Web Store listing | 🔨 Next |
| Pro tier + Stripe billing | 📋 Planned |
| B2B API for wallets/exchanges | 📋 Planned |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                       │
│  content script (dot + hover) → background (session/cache)│
└────────────────────────┬────────────────────────────────┘
                         │ Bearer JWT
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     Fastify API                           │
│  /v1/score  /v1/session  /v1/claim/nonce  /v1/claim      │
├─────────────────────────────────────────────────────────┤
│  Auth: HS256 JWT │ SIWE (secp256k1) │ SIWS (Ed25519)    │
├─────────────────────────────────────────────────────────┤
│  Stores: Postgres (prod) │ In-memory (dev)               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Postgres                               │
│  identities │ wallets │ links │ sessions │ nonces        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/youngboy91-beep/bam.git
cd bam

# Install
npm install

# Start everything (API + Extension build + Claim web)
npm run dev:all
```

Then:
1. `chrome://extensions` → Developer mode → Load unpacked → `apps/extension/dist/`
2. Open `https://x.com` — dots appear next to handles
3. Open `http://localhost:5173` — claim your wallet

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome MV3, React, Shadow DOM, Vite + esbuild |
| API | Fastify, TypeScript, zero-dep JWT, `ethereum-cryptography` |
| Database | PostgreSQL (Supabase free tier) |
| Crypto Auth | EIP-4361 SIWE, Ed25519 SIWS |
| Hosting | Railway (API), Vercel (claim-web), Chrome Web Store |
| Monorepo | npm workspaces, shared types package |

---

## Deploy (Free, 15 minutes, one-click)

<p>
  <a href="https://railway.app/new/template?repo=https://github.com/youngboy91-beep/bam" target="_blank">
    <img src="https://railway.app/button.svg" alt="Deploy on Railway" />
  </a>
  &nbsp;
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/youngboy91-beep/bam&root-directory=apps/claim-web&env=TL_API_BASE&envDescription=Your%20Railway%20API%20URL" target="_blank">
    <img src="https://vercel.com/button" alt="Deploy to Vercel" />
  </a>
  &nbsp;
  <a href="https://supabase.com/dashboard/new" target="_blank">
    <img src="https://img.shields.io/badge/Supabase-Create%20Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Create Supabase DB" />
  </a>
</p>

**The 3-button path:**

1. Click **Supabase** → create project → copy `DATABASE_URL` from Settings → Database
2. Click **Railway** → deploy this repo → set env vars (`DATABASE_URL`, `TL_JWT_SECRET`, `TL_CORS_ORIGINS`)
3. Click **Vercel** → deploy `apps/claim-web` → set `TL_API_BASE` to your Railway URL

That's it. See [DEPLOY.md](./DEPLOY.md) for the detailed walkthrough, env-variable reference, and troubleshooting.

**Monthly cost: $0** on free tiers (handles 1000+ MAU).

### Alternative: pull pre-built Docker image

Every push to `main` publishes an image to GitHub Container Registry:

```bash
docker pull ghcr.io/youngboy91-beep/bam/api:latest
docker run -p 8787:8787 \
  -e DATABASE_URL=postgres://... \
  -e TL_JWT_SECRET=$(openssl rand -hex 32) \
  ghcr.io/youngboy91-beep/bam/api:latest
```

---

## Project Structure

```
bam/
├── apps/
│   ├── api/              Fastify API (auth, scoring, identity graph)
│   ├── extension/        Chrome MV3 (dot overlay + hover card + popup)
│   └── claim-web/        Self-onboarding page (vanilla TS + Vite)
├── packages/
│   └── shared/           TypeScript contracts (ScoreResponse, claim types)
├── data/
│   └── kol-seed.json     40 hand-curated KOL entries for bootstrap
├── docs/                 Public specs (principles only, no thresholds)
├── reference/            Static HTML mockups for visual testing
├── .kiro/steering/       AI-agent invariants (auto-loaded in Kiro sessions)
└── .kiro/internal/       Private thresholds (.gitignore'd)
```

---

## Docs

| Document | What it covers |
|----------|---------------|
| [Identity Graph](docs/identity-graph.md) | How handles link to wallets (A/B/B+/C tiers) |
| [Scoring](docs/scoring.md) | What the overlay measures and why |
| [Abuse Resistance](docs/abuse-resistance.md) | 9 attack families and defense principles |
| [Monetization](docs/monetization-and-auth.md) | Freemium B2C + metered B2B API |
| [Scalability](docs/scalability.md) | Growth stages and graceful degradation |
| [Release Strategy](docs/release-strategy.md) | Phase 1 → 2 → 3 rollout plan |
| [Data Pipeline](docs/data-pipeline.md) | External data domains consumed |
| [Deploy Guide](DEPLOY.md) | Step-by-step production setup |
| [Testing Guide](TESTING.md) | How to run and report bugs |

---

## Security Model

- **Server-side policy**: the extension is a pure renderer — no thresholds, no formulas, no signal weights in the client bundle
- **No raw signals exposed**: consumer API returns only pre-rendered display strings and tier labels
- **Build-time URLs**: external links are constants, not fetched from API (anti-phishing)
- **Timing-safe JWT**: HS256 with `timingSafeEqual`, no library dependencies
- **Category-level errors**: attackers get "rejected", never which check failed

---

## Contributing

This is a private repository. Access is granted individually. If you're reading this — you're in.

Before contributing:
1. Read `.kiro/steering/*.md` — these are the invariants that must hold
2. Read `TESTING.md` — how to verify your changes work
3. Never commit numbers, thresholds, or formulas to `docs/` — those are internal

---

## License

Proprietary. All rights reserved.

---

<p align="center">
  <strong>Built for crypto holders who are tired of getting rugged by influencers.</strong>
</p>
