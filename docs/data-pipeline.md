# TruthLayer — Data Pipeline (Public)

TruthLayer's scoring pipeline consumes information from a small number of
external domains. This document lists those domains and the principles
that govern their use. Specific providers, endpoints, cache lifetimes,
and rate-limit policies are internal.

## Domains

**On-chain activity.** Balances, token transfers, DEX trades, contract
metadata across Ethereum, Solana, Base, Arbitrum, BNB Chain, and TON.

**Prices.** Spot and historical prices with enough granularity to
compute per-call performance for quoted tokens.

**Social posts.** Reading public posts on X (later Farcaster and Lens)
that mention tickers or contract addresses.

**Identity verification.** Twitter OAuth sessions, ENS / SNS resolvers,
publicly-posted proofs.

**Token-level risk.** Honeypot checks, mint / freeze authority states,
holder distribution, bundle-launch detection.

## Boundary principles

**Adapters only.** Every external dependency lives behind an internal
adapter interface. The scoring pipeline never imports a provider SDK
directly. Replacing a provider is a change in one file.

**Ingest once, read many.** On-chain and price data are indexed into
our own stores on a cron. The scoring path reads from our store, never
from a provider's live endpoint. This means that under provider outage,
scoring continues on the last-known snapshot and stale cells surface as
"insufficient data" rather than errors.

**Return raw, render later.** Adapters return raw numbers and
timestamps. The scoring layer composes them into tier decisions and
flags. The HTTP layer renders the user-visible strings. A leak across
these layers is a review-block.

**Attribution, not URLs.** Consumer responses include the family of the
source ("etherscan", "dex_trades", "tl_graph") but never a specific
endpoint path or API host. That is an internal detail and a potential
leak about our infrastructure.

## Failure modes the user sees

- A provider is rate-limiting us: affected metric cells render
  "insufficient data". The overall verdict is still computed from
  whatever other signals are available.
- A provider is unreachable: same as above. We never claim a score we
  could not actually compute.
- All providers for an entire domain are unreachable at once: the
  overlay renders with the author's tier and identity but with
  insufficient data across the numeric cells.

## What is not in this document

Which providers we use, which rate limits they impose on us, how
frequently we re-index each domain, which cache layer stores each kind
of response, how many keys we rotate, and our cost envelope. Those are
in internal specs.
