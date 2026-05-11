# TruthLayer — Scoring Overview (Public)

This document describes **what** TruthLayer scores, **why** it is scored, and **what invariants** the product preserves. It intentionally does not publish exact formulas, weights, thresholds, time windows, model names, or component breakdowns. Those live in internal specs and are treated as product IP.

If you are a bad actor reading this to reverse-engineer the scoring, there is nothing here that will help you. Findings from scoring are periodically rotated and cross-checked against independent signals; short-term gaming of any single input does not translate to a durable change in output.

---

## 1. What the overlay says

Every score rendered under a tweet reduces to three user-facing questions:

1. **Who is speaking?** The author's identity is classified into one of four trust tiers (A, B, B+, C). A is strongest. Higher tiers require stronger proof of the link between a social handle and on-chain wallets.
2. **Do they act as they speak?** For a given token mentioned in the post, we surface whether the author holds it, when they entered, how often they talk about tokens, and how their prior calls have played out.
3. **Is the token itself safe to touch?** Token-level risk signals (age, liquidity posture, holder distribution, authority status, association with past rugs) are rolled into the verdict independently of the author.

A single verdict — `clean`, `caution`, `risk`, or `unknown` — summarizes those three axes. The verdict is deterministic for a given set of inputs and a given scoring version, so two users looking at the same post at the same moment see the same label.

## 2. Trust tiers

The tier is always shown. Lower-tier conclusions are de-emphasized. A lower-tier link is never silently presented as a higher-tier one.

- **A — verified.** Strongest tier. Established through a user action that cryptographically binds a wallet to a social handle, or an equivalent public identity proof controlled by the user.
- **B — public proof.** The handle has itself published evidence linking a specific wallet to itself in public and that evidence is still live.
- **B+ — likely.** Inferred by combining multiple independent signals against a large reference population. Always displayed with a relative confidence indicator so the reader can weigh it accordingly.
- **C — unverified.** Community-submitted or stale. Never used as a basis for quantitative metrics. Kept only to let community activity accumulate toward a better tier over time.

## 3. How confidence is presented

For inferred tiers we do not expose raw numbers. We show a **relative rank within a cohort** (for example, *top quintile among trader handles*) rather than a bare percentage. This has two properties:

- It is more meaningful to the reader than a decimal. A reader does not need to know whether 0.67 is "high" — they see "top 18%".
- It rotates naturally. Cohorts change as new users join and old ones go inactive, so ranks move even when raw signals stay still.

## 4. Freshness and rotation

Scoring is time-aware. Recent evidence outweighs old evidence; very old evidence effectively disappears. Ranks are recomputed on a regular cadence, so yesterday's rank is not tomorrow's rank. A handle that stops participating eventually decays into an "insufficient recent activity" state and is shown as such. This is by design:

- A handle cannot coast on a single reputation event forever.
- A handle cannot be permanently punished for a single bad event after enough time and contrary evidence.
- Manipulation that relies on a one-time burst of clean activity does not produce a durable score change.

The exact cadences and decay behaviors are internal.

## 5. When we refuse to answer

Showing a fabricated or low-confidence number is worse than showing nothing. The overlay therefore declines to quantify a metric when the supporting data is weak. Common cases that trigger an "insufficient data" rendering:

- The author has no wallet linked at an actionable tier.
- The author account or the token itself is too new for statistics to stabilize.
- Price or on-chain data providers are unreachable or returning incomplete history.
- The reference population used to infer a tier is too small to be representative.

In these cases the corresponding metric cell renders as "insufficient data" rather than a guess.

## 6. Rollup (deterministic)

The overall `overlay_signal` is the server-side rollup of all component flags. Clients never compute their own rollup. A single red component promotes the verdict to `risk`; a yellow component to `caution`; a handle with no basis for quantification to `unknown`; otherwise `clean`. The rollup rule itself is deterministic and stable across scoring versions.

## 7. Versioning

Every scoring response carries a semantic scoring version. Changes to component weights, thresholds, or the shape of the rollup increment the version. Clients cache by that version, so a bump invalidates stale answers everywhere without manual intervention.

## 8. What is not in this document

Deliberately absent:

- The exact components that enter the B+ inference and their weights.
- The time windows for freshness and rotation.
- The thresholds that separate green / yellow / red cells or the tier cutoffs.
- The specific machine-learning models, regular expressions, or feature names used in extraction.
- The anti-abuse heuristics that defend against the attacks described in `docs/abuse-resistance.md`.

These are tracked in internal specs and change more often than this public document. That is intentional. Attackers who tune against any single published number are therefore chasing a moving target they cannot see.

## 9. Public API response shape

The extension and B2B partners consume the same response shape. It is intentionally coarse: it exposes UI flags and human-readable explanations, not raw signal values.

```
GET /v1/score?handle={handle}&ticker={ticker}&tweet_id={id}

{
  "handle": string,
  "identity_tier": "A" | "B" | "B+" | "C",
  "identity_rank_label": string | null,          // e.g. "top quintile, trader cohort"
  "wallets": [
    { "chain": string, "address": string, "tier": string }
  ],
  "overlay_signal": "clean" | "caution" | "risk" | "unknown",
  "metrics": {
    "holds":         { "ui_flag": UiFlag, "display": string },
    "shill_history": { "ui_flag": UiFlag, "display": string },
    "pnl":           { "ui_flag": UiFlag, "display": string }
  },
  "token_signals":   { "ui_flag": UiFlag, "display": string },
  "explanation":     string,
  "sources":         string[],
  "computed_at":     ISO8601,
  "insufficient_data_fields": string[],
  "scoring_version": string
}
```

Partners that need richer access (for enterprise risk-engines) go through a separate contract with access to raw component values under NDA. Those richer values are never exposed on the public `/v1/score` endpoint.
