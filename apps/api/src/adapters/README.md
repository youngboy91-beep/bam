# API Adapters (stage 2)

This directory is the seam between TruthLayer's scoring pipeline and the
outside world. Each adapter hides one third-party API behind a narrow,
testable interface so the rest of the server never imports provider SDKs.

## Layout (intended, stubbed)

```
adapters/
  chain/
    evm.ts       Ethereum / Base / Arbitrum / BNB via Alchemy (or equiv)
    solana.ts    Solana via Helius (or equiv)
    ton.ts       TON via Toncenter (or equiv)
  prices/
    price-feed.ts    CoinGecko / GeckoTerminal for historical + spot
  social/
    twitter.ts       Twitter API v2 (read + OAuth)
  risk/
    honeypot.ts      Honeypot.is / GoPlus token-level risk
```

## What each adapter owns

- Authentication to its upstream.
- Rate-limit and backoff. No other module is allowed to care about
  provider-specific 429 semantics.
- Normalization to the TruthLayer shape (addresses lowercased for EVM,
  decimals normalized, timestamps in ISO 8601).
- Caching. Upstream responses are cached in Redis; every cache entry
  carries the scoring version so bumps invalidate.

## Swap path from mock

1. `mock-store.ts` stays until adapters cover every field. It is the
   contract fixture, not production code.
2. A new module `scoring/` composes adapter outputs into a
   `ScoreResponse`. It applies the internal formulas from
   `.kiro/internal/scoring.md` (not in git).
3. The Fastify `/v1/score` route dispatches to `scoring/`. `mock-store`
   is deleted in the same PR that introduces the real pipeline.

## Non-negotiables

- Adapters never return strings rendered for the UI. That's the scoring
  layer's job. Adapters return raw data types.
- The `/v1/score` response shape stays identical. The client contract
  does not care whether fixtures or real signals back the response.
- No adapter leaks provider names into consumer responses beyond what
  is already in `sources`. A `sources: ["alchemy"]` string is acceptable
  attribution; a `sources: ["alchemy://eth-mainnet.g.alchemy.com/v2/abc"]`
  string is a leak.
