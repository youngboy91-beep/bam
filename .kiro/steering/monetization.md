---
inclusion: always
---

# TruthLayer — Monetization & Auth Rules (Internal-Safe Summary)

Concrete per-plan numeric ceilings (daily query budgets, overage rates,
billing cadences) live in `.kiro/internal/monetization.md`. Code reads from
config populated from that spec; it does not hard-code per-plan numbers.

## Consumer plans

- **Anonymous** (default after install, no login): overlay only, bounded
  daily query limit.
- **Free account** (X OAuth or wallet signature): higher daily limit, cloud
  preferences, ability to submit community links.
- **Pro** ($15/mo via Stripe): unlimited queries, custom alerts, transaction
  co-signer rules, priority support, data export.

## Partner plans

- **Startup** ($99/mo): bounded daily request volume.
- **Growth** ($499/mo): higher volume, webhook alerts, richer surfaces.
- **Enterprise** (custom): SLA, white-label, access to raw signal values
  under NDA.

## Auth invariants

- Single identity service; one JWT issuer; scopes differ per tier.
- Extension must work without login. No login wall before first overlay
  render.
- Consumer free-account creation IS the A-tier claim flow. Do not build two
  separate flows.
- Partner dashboard is separate; email and password with mandatory 2FA.
- API keys are hashed at rest; scopes are explicit per key; keys rotate on
  the internal cadence.

## Billing invariants

- Stripe is the only billing provider in v1. USD only.
- Metered usage batches into Stripe Usage Records on the internal cadence.
- `usage_events` table is append-only. Rate-limit and billing are derived
  from it.

## Privacy invariants

- Anonymous mode stores hashed device fingerprint and rate-limit counters
  only. No PII.
- Wallet detach removes the identity-graph link within the bounded internal
  window.
- Raw API logs are retained for the internal retention period. Aggregates
  are anonymized earlier.

## Public-doc rule

- `docs/monetization-and-auth.md` lists prices but not per-plan query
  ceilings, rate-limit windows, or overage rates. Those are in the internal
  spec.

## Do not

- Do not introduce a project token in v1.
- Do not ship an affiliate program in v1.
- Do not require account creation to read the overlay.
- Do not publish the anti-abuse rate-limit values in any form.
