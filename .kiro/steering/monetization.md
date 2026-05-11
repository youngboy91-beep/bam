---
inclusion: always
---

# TruthLayer — Monetization & Auth Rules

Product is two-sided: freemium consumer extension + metered B2B API. Both share one identity service and one identity graph.

## Consumer tiers (do not ship features to the wrong tier)

- **Anonymous** (default after install, no login): 100 lookups/day, overlay only.
- **Free account** (X OAuth or SIWE): 500 lookups/day, cloud-synced watchlists.
- **Pro** ($15/mo, Stripe): unlimited, custom alerts, Co-Signer rules, full B+ breakdown, export.

## Partner tiers

- **Startup** ($99/mo, 10k req/day)
- **Growth** ($499/mo, 100k req/day, webhooks)
- **Enterprise** (custom SLA, white-label)

## Auth invariants

- One identity service, one JWT issuer. Scopes differ per tier.
- Extension must work without login. Never show a login wall before first use.
- Consumer free-account onboarding = identity-graph A-tier claim. Do not build two separate flows.
- Partner dashboard is separate (`partners.truthlayer.app`), email/password + 2FA.
- API keys are hashed at rest; scopes are explicit per key.

## Billing invariants

- Stripe is the only billing provider in v1.
- USD only. No token payments in v1.
- Metered usage batched hourly into Stripe Usage Records.
- Every usage event recorded with `(account_id, endpoint, at, cost_units)` for audit.

## Privacy invariants

- Anonymous mode stores only hashed device fingerprint + rate-limit counter, no PII.
- Wallet detach removes identity-graph link within 1 hour.
- Raw API logs retained max 90 days; aggregates anonymized after 30 days.

## Do not

- Do not introduce a project token in v1. Not on the critical path.
- Do not ship affiliate/referral program in v1.
- Do not require account creation to read the overlay. Friction kills the viral loop.
- Do not present B+ (context-match) tier in B2B API responses without the confidence score.
