---
inclusion: always
---

# TruthLayer — Abuse-Resistance Invariants (Internal-Safe Summary)

Concrete detection rules, thresholds, and network-topology heuristics live in
`.kiro/internal/abuse-defenses.md`. This file lists only the invariants that
must be respected by any code that touches claims, scoring, or the identity
graph.

## Defense in depth

- Every attack family must be countered by at least two independent signals.
  A code change that collapses two signals into one, or that removes an
  independent layer, is rejected in review.
- No single heuristic is load-bearing. If one rule is bypassed, at least one
  other rule must still block.

## Determinism where the attacker sees, non-determinism where they cannot

- The mapping from evidence to tier is deterministic and versioned.
- The cadence of re-checks, cohort recomputation, and decay is not fixed. Do
  not hard-code verification timestamps or jobs that run on predictable
  minutes. Use jittered schedulers.

## Rank, not raw

- Publicly-displayed confidence is always a cohort-relative rank label
  ("top quintile"), never a percentage or decimal. Partner endpoints may
  expose raw values under contract only.

## Decay over punish

- Compromise and suspected gaming are handled by score decay, not by bans.
- No code path emits an error message that identifies which rule triggered
  a decay. Error strings are category-level, not rule-level.

## Cooldowns on structural mutations

- Detaching and re-attaching wallets, changing primary wallet, changing
  labels, and similar actions take effect after a bounded internal delay.
  The delay value is internal; code must read it from config, not hard-code.

## Refuse over approximate

- If any defense layer reports low confidence, the system returns
  `insufficient data`. It does not return a best-effort number with a caveat.

## Claim flow invariants

- A-tier promotion from a fresh claim requires at least one out-of-band
  confirmation in addition to the signature. The channel and trigger are
  internal.
- Claims for smart-contract wallets must be re-verified at a later block
  height before producing a public-facing badge.
- Rate limits on the claim endpoint are enforced at the IP and fingerprint
  level and are read from config.

## Public-doc rule

- `docs/abuse-resistance.md` describes *what* the product defends against and
  the principles. It must not describe any specific rule, threshold, or
  channel. Review rejects PRs that leak specifics into it.
