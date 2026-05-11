# TruthLayer — Monetization & Auth (Public)

Two-sided product sharing one identity-graph core:

1. **Consumer (B2C)** — freemium Chrome extension.
2. **Partner (B2B)** — metered API for wallets, exchanges, screeners.

Each side feeds the other. New self-onboarded consumers enrich the graph, which makes the B2B API more valuable. Each B2B integration (for example, a wallet showing our verification badge on recipient addresses) drives consumer awareness and installs.

## Consumer plans

| Plan | Price | What the user gets |
|------|-------|-------------------|
| Anonymous | free | Overlay on X/Twitter, basic three-metric view, tier labels. Daily query limit, internally set. |
| Free account | free | Everything in Anonymous, plus cross-device preferences and the ability to submit community links. Higher daily query limit. |
| **Pro** | **$15/mo** | Unlimited queries, custom alerts, transaction co-signing rules, priority support, data export. |

The exact per-plan query ceilings are set internally and may be adjusted in response to traffic patterns. They are enforced server-side; clients that exceed them receive a standardized "rate limit reached" response. Publishing the exact ceilings would turn them into a target, so we do not.

## Partner plans

| Plan | Price | What the partner gets |
|------|-------|----------------------|
| Startup | $99/mo | Identity lookups and tier information within a daily volume suitable for growing integrations. |
| Growth | $499/mo | Higher volume, webhook alerts on tier changes, richer metric surfaces. |
| Enterprise | custom | SLA, white-label, dedicated instance, access to raw signal values under NDA. |

Partner agreements that need access to internal signal values (not just UI flags) go through a separate onboarding and contract. That data is never on the public API.

### Target partners

- **Wallets.** For badging recipient addresses during a send flow.
- **Exchanges.** For badging destination addresses during a withdrawal flow.
- **Screeners and analytics tools.** For a social and identity layer on top of token pages.

## Auth architecture

A single identity service issues session credentials. Tiers differ by scope, not by provider.

```
                       +-----------------------+
                       |   Auth Service        |
                       +-----------+-----------+
                                   |
          +----------------+-------+--------+----------------+
          |                |                |                |
    +-----v------+   +-----v------+  +------v-----+  +-------v------+
    | Anonymous  |   | Free       |  | Pro        |  | Partner      |
    | (device    |   | (X OAuth   |  | (Free +    |  | (API key,    |
    |  hash)     |   |  and/or    |  |  Stripe)   |  |  dashboard)  |
    |            |   |  wallet)   |  |            |  |              |
    +------------+   +------------+  +------------+  +--------------+
```

### Consumer flow

1. Install extension. The overlay starts working immediately under an anonymous credential. No login wall.
2. Creating a free account uses either "Sign in with X" or "Connect wallet". The same flow serves as the A-tier claim in the identity graph. One user action, two outcomes.
3. Upgrading to Pro is a standard Stripe Checkout.

### Partner flow

1. Separate dashboard at a distinct subdomain.
2. Email and password with mandatory second-factor authentication.
3. Generate API keys with explicit scopes, view usage, manage billing, configure webhooks.

## Shared identity-graph onboarding

The same "connect wallet and sign in" flow is the account creation flow *and* the A-tier claim flow. Every Pro-curious user contributes a verified node to the graph whether they upgrade or not. This is the product's viral loop.

## Data model (stubbed)

```
accounts
  id, identity_id?, email?, stripe_customer?, plan, created_at

api_keys
  id, account_id, key_hash, scopes[], created_at, last_used_at

usage_events
  account_id, endpoint, at, cost_units
```

`usage_events` is append-only. Rate-limit and billing are derived from it; it is not mutated after insert.

## Billing

- Stripe for both consumer subscriptions and partner metered usage.
- Metered usage batches into Stripe Usage Records on a bounded cadence.
- USD only in v1.

## Privacy

- Anonymous sessions store a hashed device fingerprint plus rate-limit counters. No PII.
- Creating an account is fully opt-in.
- Detaching a wallet from an account removes the corresponding graph link within a short bounded window.
- Raw API logs are retained for a bounded period for fraud and billing disputes; aggregates are anonymized sooner for analytics.

## Non-goals (v1)

- **No project token.** Paid tiers are USD only.
- **No affiliate program at launch.** Referrals are considered after CAC/LTV is measured.
- **No login wall before first use.** The extension must deliver value under an anonymous credential.
