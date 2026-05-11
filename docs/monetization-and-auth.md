# TruthLayer — Monetization & Auth Architecture

Two-sided model sharing a single identity-graph core:

1. **Consumer (B2C)** — freemium Chrome extension.
2. **Partner (B2B)** — metered REST/GraphQL API for wallets, exchanges, screeners.

Both markets feed the same identity graph. Each new self-onboarded consumer improves the graph, which increases the value of the B2B API. Each B2B integration (e.g. a wallet showing our badge on recipient addresses) drives more consumer installs.

## Tiers

### Consumer

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| Anonymous | free | 100 lookups/day (by device fingerprint + IP) | X/Twitter overlay, basic 3 metrics, A/B/C tier labels |
| Free account | free | 500 lookups/day, syncs across devices | all Anonymous + watchlists (cloud-synced) + submit community links |
| **Pro** | **$15/mo** | unlimited | all Free + custom alerts, Co-Signer rules on transactions, full B+ confidence breakdown, data export, priority support |

### Partner (API)

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| Startup | $99/mo | 10k req/day | identity lookup by handle or wallet, tier info |
| Growth | $499/mo | 100k req/day | full scoring engine, webhook alerts on tier changes |
| Enterprise | custom | SLA | dedicated instance, white-label, custom scoring models |

### Target B2B customers (phase 1 outreach)

- **Wallets:** Phantom, Rainbow, Rabby, Zerion, MetaMask Snaps
- **Exchanges:** Binance, OKX, Bybit (for recipient-address badges on withdrawal screens)
- **Screeners:** CoinGecko, DEXScreener, Birdeye, GeckoTerminal (for social layer on token pages)

## Auth architecture

Single identity service. Three access modes, same JWT issuer, different scopes.

```
                       +-----------------------+
                       |   Auth Service        |
                       |   (issues JWTs)       |
                       +-----------+-----------+
                                   |
          +----------------+-------+--------+----------------+
          |                |                |                |
    +-----v------+   +-----v------+  +------v-----+  +-------v------+
    | Anonymous  |   | Free       |  | Pro        |  | Partner      |
    | (device    |   | (X OAuth   |  | (Free +    |  | (API key,    |
    |  fingerprint)|  |  or SIWE) |  |  Stripe)   |  |  dashboard)  |
    +------------+   +------------+  +------------+  +--------------+
```

### Consumer flow

1. **Install extension -> immediately works.** Device fingerprint issued, anonymous JWT minted silently. No login wall.
2. **Prompt to create free account after first watchlist attempt**, or after hitting the 100/day limit. Offer either "Sign in with X" or "Connect wallet" (SIWE/SIWS).
3. **Upgrade to Pro** triggers Stripe Checkout. Subscription stored against the account JWT.

### Partner flow

1. Separate dashboard at `partners.truthlayer.app`.
2. Standard email/password + 2FA (this is a B2B cabinet, not a crypto product).
3. Generate API keys, see real-time usage and billing.
4. Webhooks configured per integration.

### Shared identity-graph onboarding

The **same** "connect wallet + Twitter OAuth" flow used for consumer free accounts is also the A-tier claim flow for the identity graph. One action serves both purposes:

- User gets account + synced watchlists.
- Graph gets a verified `handle -> wallet` link.

This is the viral loop. Every Pro-curious consumer contributes a graph node whether they upgrade or not.

## Data implications

New tables (sketch):

```
accounts
  id              uuid
  identity_id     uuid references identities(id)   -- nullable until linked
  email           text                             -- partner accounts only
  stripe_customer text
  plan            text   -- 'anonymous'|'free'|'pro'|'partner_startup'|'partner_growth'|'partner_enterprise'
  created_at      timestamptz

api_keys
  id              uuid
  account_id      uuid references accounts(id)
  key_hash        text
  scopes          text[]   -- e.g. ['lookup:handle','lookup:wallet','score:full']
  created_at      timestamptz
  last_used_at    timestamptz

usage_events
  account_id      uuid
  endpoint        text
  at              timestamptz
  cost_units      int
```

## Billing

- **Stripe** for both consumer subscriptions and partner metered billing.
- Metered billing via Stripe Usage Records, batched hourly from `usage_events`.
- Consumer Pro: simple fixed-price subscription.
- Partner Growth/Enterprise: fixed base + overage at published per-1k-req rate.

## Privacy & compliance

- Anonymous mode stores only a hashed device fingerprint + rate-limit counter. No PII.
- Account creation is opt-in; detaching a wallet from an account removes the corresponding graph link within 1 hour.
- API usage logs are anonymized in aggregates after 30 days for analytics; raw logs retained 90 days for fraud/billing disputes.

## Non-goals (v1)

- **No crypto token.** Paid tiers accept USD only (Stripe). Optional future: discount for Pro if paid in stablecoin via on-chain invoicing, but not on the critical path.
- **No affiliate program at launch.** Referrals come later once CAC/LTV is known.
