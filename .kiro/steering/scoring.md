---
inclusion: always
---

# TruthLayer — Scoring Invariants (Internal-Safe Summary)

Rules below are non-negotiable. Any scoring code must satisfy all of them. The
numeric values that underlie these rules live in `.kiro/internal/scoring.md`
(not committed to the public repository). Team members open that file locally;
Kiro is instructed to respect it when present and to refuse to copy its
contents into public documentation, commit messages, or PR descriptions.

## Numbers have provenance or they do not ship

- Every metric rendered in the overlay has a deterministic formula in the
  internal scoring spec. Code must reference the spec and not redefine
  thresholds inline.
- If inputs are insufficient, return `insufficient data`. Never a fabricated
  number, never a silent zero, never a stale cached value past its version.
- The public API never exposes raw component values for inferred tiers.
  It exposes the tier label and a cohort-relative rank label only.
  Raw values are returned only on partner endpoints gated by contract.

## Tier rules

- A-tier requires fresh wallet signature tied to an active social session, or
  an equivalent name-service proof as specified internally.
- B-tier requires a live public proof. A proof that disappears demotes the
  tier on the schedule defined in the internal spec. The schedule is not
  documented publicly.
- B+ tier is inferred only when all required conditions defined in the
  internal spec are simultaneously satisfied. Relaxation of those conditions
  requires a scoring version bump.
- C-tier is never used as a basis for quantitative metrics.

## Overlay metrics

- Insufficient-data rules are memorized in the internal spec. Add new triggers
  to the spec first, then to code. Never to code first.
- Every metric cell has a stable set of UI flags: green, neutral, yellow, red,
  insufficient. Code paths that produce any other flag must be rejected in
  review.

## Rollup

Server-side only. Clients never compute their own rollup. The deterministic
rule is:

- any red  -> risk
- any yellow -> caution
- tier C or all metrics insufficient -> unknown
- otherwise -> clean

## Versioning

- All scoring responses carry `scoring_version` (semver).
- Threshold or weight change -> minor bump.
- Formula change or new/removed metric -> major bump.
- Cache keys include the version; a bump invalidates all caches without a
  migration step.

## Public-doc rule

- `docs/` files do not contain thresholds, windows, weights, model names, or
  heuristic descriptions. When in doubt, keep it internal.
- Any PR that adds a concrete number or formula to `docs/` is rejected.
