# TruthLayer — Scalability (Public)

This document describes the principles TruthLayer applies to scale reliably as the user base grows. It does not publish the concrete infrastructure thresholds, provider choices, or cost envelopes at each tier. Those are in internal specs.

## Scaling principles

**Read the answer, not the question.** The overlay is a read-heavy product: the vast majority of requests ask the same few questions (popular handles, popular tokens) over and over. We compute answers in the background and serve them pre-packaged. On-demand computation is a fallback, not the critical path.

**Cache at the edge of value.** Each answer has a versioned cache key that includes the scoring version. When the scoring version changes, all stale answers everywhere invalidate without a migration. Clients, the API, and the background workers all agree on what "current" means without talking to each other.

**Stateless application layer.** Every service instance can be replaced, restarted, or scaled horizontally without coordination. Session state lives in dedicated stores; application servers hold no durable state beyond in-memory caches.

**Queue the heavy work.** Operations that are CPU-bound (signature verification, batch price recomputation, embedding updates) do not block user-facing HTTP responses. They run on worker pools sized independently from the web tier.

**Offload external rate-limits.** On-chain data providers and social platform APIs rate-limit aggressively. We maintain our own indexes seeded from provider responses, so our lookup pressure on them is bounded and predictable regardless of user traffic.

**Separate read paths from write paths.** Onboarding writes, usage-metering writes, and community submissions go to a primary store. Read-mostly overlay traffic reads from caches and precomputed aggregates. A traffic spike on reads does not slow writes; a spike on writes does not slow reads.

**Degrade gracefully, never silently.** If a data provider, a cache, or a worker pool is unavailable, the API returns "insufficient data" rather than a stale or invented answer. The client renders this as-is. There is no quiet fallback to a possibly-wrong number.

## Growth stages

We plan three distinct stages. We do not pre-build for a stage we have not reached; we build for the current stage with clean seams toward the next.

**Stage 1 — Launch.** Small traffic, single primary store, single application instance, external providers queried on a cron and cached. Optimized for iteration speed and zero recurring cost beyond baseline.

**Stage 2 — Mass adoption.** Measured in hundreds of thousands of monthly users. Horizontal application tier, dedicated cache tier, read replica for analytics, background indexers running continuously against on-chain data. Cost envelope is intentionally modest; the product does not require a funding round to operate at this stage.

**Stage 3 — Platform.** Measured in low millions of monthly users. Sharded primary store, dedicated time-series store for on-chain activity, streaming pipelines for real-time signals, dedicated relationships with data providers. This stage justifies enterprise-grade infrastructure because the B2B API at that point is itself an enterprise product.

Transitions between stages happen when a pre-declared internal metric crosses a threshold, not on a calendar. The product does not re-platform on anticipation.

## Observability

Every request carries a correlation ID end-to-end. Every HTTP error emits a structured event to the error-tracking system. Every background job emits start/complete/failure events. Latency percentiles, cache hit ratios, and external-provider error rates are the top-level health indicators.

Users of the extension can report issues in one click. The client attaches a minimal diagnostic bundle (current scoring version, last few overlay responses, anonymized session ID) so that reproducing the issue does not require conversation. Personally identifying information is never in the bundle.

## Bug triage and SLA

Four priority levels, each with a response SLA:

- **P0 — Security or data integrity.** Anything that could expose a wallet or handle incorrectly, accept an invalid signature as valid, or tier a user they did not authorize. Response within one business day; public postmortem after resolution.
- **P1 — Scoring visibly wrong on high-traffic content.** A well-known handle tiered incorrectly on a widely-shared post. Response within a few business days.
- **P2 — UI glitch or non-data-bearing bug.** Fixed in the next scheduled release.
- **P3 — Nice to have.** Backlogged.

Postmortems for P0 are public and blameless. Trust is built by showing what went wrong and what was done about it. Internal root-cause analysis that would disclose defensive heuristics is redacted.

## What is not in this document

Deliberately absent: per-stage request-per-second budgets, specific provider choices, cache TTLs, worker pool sizes, database instance shapes, and cost breakdowns. Those are in internal specs. They change as the product grows and as the market for infrastructure changes.
