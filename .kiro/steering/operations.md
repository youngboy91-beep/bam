---
inclusion: always
---

# TruthLayer — Operations and Bug Triage (Internal-Safe Summary)

## Logging and correlation

- Every request carries a correlation ID end-to-end (`request_id`, propagated
  in headers and logs).
- Logs are structured JSON. Free-text log lines are rejected in review.
- No PII in logs. Wallet addresses are allowed; email, device identifiers,
  and raw signatures are not.

## Error tracking

- Any unhandled error, server 5xx, or failed Shadow DOM render emits a
  structured event with correlation ID, scoring version, and a minimal
  diagnostic bundle.
- Error messages visible to users are category-level. They do not identify
  which defense layer fired or which source failed.

## User-reported bugs

- The extension popup exposes a one-click "Report issue" action.
- The report bundle contains: recent overlay responses (last few), current
  scoring version, user agent, anonymized session ID.
- The bundle never contains: wallet private-key material, full session
  tokens, real name, email unless the user explicitly provides it.

## Triage SLAs

- **P0** — security or data integrity issue (wrong tier, accepted invalid
  signature, authorized mutation without consent): one business day.
  Public blameless postmortem after resolution, with internal defense
  specifics redacted.
- **P1** — scoring visibly wrong on high-traffic content: a few business
  days.
- **P2** — UI glitch or non-data-bearing bug: next scheduled release.
- **P3** — nice to have: backlog.

## Graceful degradation

- Upstream data provider unavailable, cache miss, or worker pool exhausted:
  the API returns `insufficient data` for the affected metric. It never
  returns an invented value or a stale value labelled as fresh.

## Deployment

- Extension releases are versioned. Scoring responses carry the scoring
  version separately from the release version. Clients key caches by the
  scoring version.
- Database migrations are forward-only. Rollback is done by forward-migrate
  with a compensating change, never by restoring an old binary to a new
  schema.

## Observability minimums

- Latency percentiles (p50, p95, p99) per endpoint.
- Cache hit ratio per endpoint.
- External provider error rate per provider.
- Claim success / failure counts, broken down by failure category.
- Alert thresholds are defined in `.kiro/internal/operations.md` and are not
  published.
