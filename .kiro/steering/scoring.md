---
inclusion: always
---

# TruthLayer — Scoring Invariants

Rules below are non-negotiable. Any scoring code must satisfy all of them.

## Numbers have provenance or they don't ship

- Every metric shown in the overlay has a deterministic formula in `docs/scoring.md`.
- If inputs are insufficient, return "insufficient data" — never a fabricated number, never a default-zero.
- Confidence percentages (B+) are always displayed alongside the tier, rounded DOWN to nearest integer.

## Tier rules

- A-tier requires wallet signature + Twitter OAuth in the same session, OR verified ENS/SNS match.
- B-tier requires a live public proof; dead proofs drop the tier to C within 7 days.
- B+ requires `confidence >= 0.6 AND T >= 0.4 AND (S >= 0.5 OR C >= 0.5)`. Any relaxation requires a scoring version bump.
- C-tier is never used as basis for metrics 1 or 3.

## Overlay metrics

- **Metric 1 (holds):** dust threshold is $100. Entry time is the start of the current continuous holding streak.
- **Metric 2 (shill history):** ticker whitelist minimum is $2M market cap. Same ticker counted at most once per 24h.
- **Metric 3 (PnL):** requires >= 5 valid completed calls over 90d, price feed coverage >= 70%.

## Insufficient-data triggers (memorize)

- Handle has no B+ or higher wallet link.
- Handle account < 30d old.
- Token < 24h old.
- Token liquidity < $100k.
- A-tier reference pool < 200 handles.
- RPC or price-feed unreachable.

In all these cases: the corresponding metric cell renders as "insufficient data", not a number.

## Aggregate overlay signal

Deterministic rollup (server-side):

- any red -> risk
- any yellow -> caution
- tier C or all insufficient -> unknown
- otherwise -> clean

Clients (extension, partners) must not compute their own rollup. Display only what the API returns.

## Anti-gaming rules that must stay on

- "Holds" aggregates across all currently and historically linked wallets.
- Near-duplicate post filter (cosine >= 0.95) excludes copy-pasted content from embedding profiles.
- Post-after-A-tier temporal penalty (24h window, weight 0.3).
- B-tier proofs rechecked weekly.

## Versioning

- All scoring responses include `scoring_version` (semver).
- Threshold or weight change -> minor bump.
- Formula change or new/removed metric -> major bump.
- Extension cache is keyed by `(handle, ticker, scoring_version)`.
