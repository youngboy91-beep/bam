# TruthLayer — Scoring Specification

This document defines exactly how every number shown in the overlay is computed. It covers:

1. Identity-graph tier assignment (A / B / B+ / C).
2. The three overlay metrics (Holds token, Shill history, Avg PnL after call).
3. Token-level risk signals (for the RED scenario).
4. Insufficient-data rules (when to refuse to compute).
5. Anti-gaming invariants.

If it's in the overlay, it's defined here. If it's not defined here, it does not ship.

---

## 1. Identity-graph tier assignment

### A — verified

A handle-wallet link is A-tier iff **both** conditions hold:

- **Wallet proof:** an EIP-4361 (SIWE) or SIWS signature of the canonical message
  `TruthLayer claim: I am @{handle} on platform x. Address {addr}. Nonce {n}. Issued at {iso8601}.`
  The signature recovers to `{addr}` and the message is less than 10 minutes old at submission.

- **Handle proof:** an active Twitter OAuth session for `{handle}` at the same moment.

OR, as a shortcut:

- **ENS/SNS auto-proof:** the handle's current X bio contains an ENS/SNS name `{name}.eth` or `{name}.sol`, AND the reverse record of `{name}` resolves to `{addr}`, AND `{name}` is a close match to the handle (Levenshtein ≤ 2 or contained as substring). In this case we accept the link without a fresh signature, because impersonation would require compromising the ENS/SNS itself.

A-tier links never expire, but are revocable by the user within 1 hour (per privacy rule).

### B — public proof

A link is B-tier iff at least one of:

- The handle posted a tweet containing a link to a tx whose `from` or `to` equals `{addr}`, AND that post is still live (not deleted), AND the wallet's tx history makes that tx identifiable as "self" (not a random user tagged).
- The handle has linked a public portfolio page (Debank, Zapper, Zerion) in their bio or pinned tweet, whose URL includes `{addr}`.
- (Phase 2+) OCR of a pinned image shows `{addr}` in a wallet UI screenshot posted by the handle.

We re-verify B-tier links weekly. If the proof disappears, tier drops to C.

### B+ — context-match (likely)

B+ is inferred, not proven. A handle-wallet candidate pair `(H, W)` gets a confidence score:

```
confidence = 0.5 * T + 0.3 * S + 0.2 * C
```

Where:

- **T — temporal correlation ∈ [0,1].** Over the last 90 days, let `P` = set of H's posts that bullishly mention a ticker, and `B` = set of W's DEX buys. For each post in `P`, check whether `W` bought the same token within ±6h of the post timestamp. `T = |matched posts| / |P|`, floor at 0, cap at 1. Require `|P| ≥ 5` or else `T` is undefined and we skip B+.

- **S — semantic similarity ∈ [0,1].** Compute the mean embedding of H's posts (text-embedding-3-small or bge-small-en-v1.5). Compare to the cluster centroids of A-tier handles that own tokens W has touched. `S = max cosine similarity` over those centroids. Require `|A-tier handles in comparison pool| ≥ 20` or S is undefined.

- **C — on-chain co-activity ∈ [0,1].** Let `N(W)` = set of wallets W has transacted with in the last 180 days. Let `A_W` = set of A-tier wallets that share at least one tx counterparty with W. `C = |A_W| / threshold`, where `threshold = 10` (saturates at C=1 when 10+ A-tier wallets are in the neighborhood).

A candidate pair becomes a B+ link iff **all** of:

- `confidence ≥ 0.6`
- `T ≥ 0.4` (temporal is load-bearing — no temporal signal means no link)
- At least one of `S ≥ 0.5` or `C ≥ 0.5` (secondary evidence required)

The confidence percentage is always shown in UI (e.g. "likely · 72%"). Never rounded up, always rounded down to the nearest integer percent (73.9% → 73%).

B+ links are recomputed weekly. If confidence drops below 0.55 (hysteresis band), the link is demoted to C.

### C — unverified

Community-submitted or stale. Always shown de-emphasized. Never used as basis for the "holds token" or "avg PnL" metrics — only for counting community votes.

---

## 2. The three overlay metrics

Each metric requires the author of the tweet to have at least one B+ or higher wallet link. If not: show "No verified wallet for this author" with a CTA to claim, and suppress all three metric cells.

### Metric 1 — Holds $TICKER

**Inputs:** author's linked wallets (tier ≥ B+), the ticker parsed from the tweet, the tweet timestamp `t_tweet`.

**Computation:**

- For each linked wallet `W`, query current balance of the token. Sum USD value at current price = `amount_usd`.
- `holds = amount_usd ≥ $100` (below this we treat as "dust" — no).
- If holds: find the earliest buy tx in the current continuous holding streak. Call its time `t_entry`.
- `time_to_tweet = t_tweet − t_entry` (can be negative if entry was after tweet — rare, flag separately).

**UI rules:**

- `holds = false` → green cell "No — not holding"
- `holds = true AND time_to_tweet ≥ 30d` → green cell "Yes · ${amount_usd}, held {N}d"
- `holds = true AND 24h ≤ time_to_tweet < 30d` → neutral cell "Yes · ${amount_usd}, entered {N}d ago"
- `holds = true AND time_to_tweet < 24h` → **yellow** cell "Yes · ${amount_usd}, **entered {N}h before tweet**"
- `holds = true AND time_to_tweet < 2h` → **red** cell — typical front-run shill pattern.

**Insufficient data:** if the token is less than 24h old, or the wallet's history cannot be reconstructed (archive RPC failed), show "insufficient data" instead of a number.

### Metric 2 — Shill history

**Inputs:** the handle's last 30 days of posts.

**Computation:**

- Extract all `$TICKER` mentions (regex plus ticker whitelist — minimum $2M market cap to count, otherwise it's noise).
- Sentiment-classify each mention as bullish / bearish / neutral (small classifier, we use a fine-tuned DistilBERT on 2k labeled crypto tweets).
- `calls_30d` = count of bullish mentions. Each `$TICKER` counted at most once per 24h window (deduplicate spam-posting the same ticker).
- `unique_tickers_30d` = distinct tickers.
- `serial_caller = calls_30d ≥ 10`.

**UI rules:**

- `calls_30d = 0` → "Not a shiller" (green)
- `1 ≤ calls_30d ≤ 4` → "{N} calls / 30d" (neutral)
- `5 ≤ calls_30d ≤ 9` → "{N} calls / 30d" (neutral, no flag)
- `calls_30d ≥ 10` → "{N} calls / 30d" **yellow**, sublabel "Serial caller"

**Insufficient data:** if handle's account is < 30 days old, show "new account" instead. If Twitter API rate-limit hit, show "data fetching" and retry.

### Metric 3 — Avg 7d PnL after call

**Inputs:** every bullish call from Metric 2's lookup, extended to 90d for statistical power.

**Computation for each call:**

- Let `t_post` be the post timestamp and `X` the ticker.
- `P0` = VWAP of $X over the 1h window centered on `t_post`.
- `P7` = VWAP of $X over the 1h window 7 days after `t_post`.
- `call_pnl = (P7 − P0) / P0`.

**Aggregate:**

- Only include calls where both `P0` and `P7` are available and `P0 ≥ $0.000001` (avoid division by dust).
- `avg_pnl = mean(call_pnl)` — **median** is also computed and shown on hover (outliers can skew mean).
- `calls_that_worked = count(call_pnl > 0)`.

**UI rules:**

- Require `valid_calls ≥ 5` or display "insufficient data — need ≥ 5 completed calls".
- Format as percentage with sign: "+34%" or "−38%".
- Sublabel "Calls that worked: {W}/{N}".

**Insufficient data:** if too few calls or price history missing for > 30% of calls, refuse to display a number.

---

## 3. Token-level risk signals (RED scenario)

Shown on the overlay when the tweet mentions a ticker whose on-chain record triggers any of the below. These are AND-ed with the author signals above, not replaced by them.

### Token age

- < 1h — label "Brand new (<1h)" red.
- 1h–24h — label "Fresh launch ({N}h)" yellow.
- ≥ 24h — no badge unless other signals fire.

### Holder concentration

- `top10_pct = sum(balance of top 10 holders) / total_supply`, excluding LP contracts and known CEX wallets.
- `top10_pct > 0.6` → "Top 10 holders: {N}%" red.
- `0.4 < top10_pct ≤ 0.6` → yellow.

### Bundle-launch detection

Query the first 10 transactions after LP creation. If ≥ 60% of them originate from wallets funded by the same funder wallet within the prior 24h → "Bundle pattern detected" red.

### LP / mint / freeze authority

- EVM: LP tokens not burned AND not locked in a recognized locker (Unicrypt, Team Finance) → "LP unlocked" yellow.
- Solana: `mint_authority` not null OR `freeze_authority` not null → "Mint/freeze authority retained" red.

### Author-wallet rug history

- Any wallet linked (B+ or higher) to the author, if it interacted (deploy, seed LP, large initial buy) with a contract later classified as rug by TruthLayer's rug-db → "Linked to {N} rugs in last 90d" red.

The rug-db is seeded from public rug-trackers (RugCheck, GoPlus) and grown by our own post-mortem pipeline (any token that lost > 95% within 7d of launch with LP removed = rug).

---

## 4. Insufficient-data rules (global)

Display "insufficient data" — never a fabricated number — when:

- Handle has zero linked wallets of tier B+ or higher → suppress Metrics 1 and 3.
- Handle account < 30d old → suppress Metric 2.
- Token < 24h old → suppress Metric 3 (PnL is meaningless, noise dominates).
- Token has < $100k liquidity — PnL computation unreliable, suppress Metric 3.
- RPC or price-feed outage — show "data fetching" with retry, not stale numbers.
- A-tier handle base < 200 → suppress B+ inference entirely (not enough signal to infer).

---

## 5. Anti-gaming invariants

If we don't defend these, the scoring will be attacked by the very KOLs it evaluates.

### Wallet rotation

A KOL could use an unlinked wallet to front-run their own shills, then link a clean wallet. Defense:

- "Holds $X" aggregates across **all** linked wallets, including historically linked but later-detached ones (we keep soft-deleted links and flag "author detached wallet W after tweet").
- Graph scan: if a linked wallet has received funds from an unlinked wallet within 7d of a post, and that unlinked wallet bought the same token, treat the unlinked wallet as "suspected linked" and surface a soft warning.

### Call laundering

A KOL could post neutral-sounding tweets that are actually shills in disguise. Defense:

- Sentiment classifier trained on crypto-specific phrasing including hedged-bullish ("ngmi if you're not in", "quiet accumulation").
- Any post that mentions a ticker within 2h of a matching wallet buy is counted as a call regardless of text sentiment.

### Embedding drift

B+ context-match model could be gamed by copy-pasting A-tier handles' posts. Defense:

- Exact-duplicate and near-duplicate filter: if H's post has cosine ≥ 0.95 to an existing A-tier post, it's excluded from H's embedding profile.
- Temporal bias: posts after a known A-tier post on the same ticker within 24h are down-weighted by 0.3.

### Proof decay

A B-tier public proof could be deleted after claiming. Defense:

- B-tier proofs re-checked weekly. Deleted proofs trigger tier drop to C within 7 days.
- We cache the proof's screenshot at claim time (archive.org-style) and note "proof was live at {date}" in the link record — not used for verification, only for transparency if the handle disputes the tier drop.

---

## 6. Public API: scoring response shape (B2B)

```
GET /v1/score?handle=alpha_caller_x&ticker=PEPU&tweet_id=12345

{
  "handle": "alpha_caller_x",
  "identity_tier": "B+",
  "identity_confidence": 0.72,
  "wallets": [
    {"chain": "ethereum", "address": "0x...", "tier": "B+", "confidence": 0.72}
  ],
  "overlay_signal": "caution",        // clean | caution | risk | unknown
  "metrics": {
    "holds": {
      "status": "yes",
      "amount_usd": 12400,
      "time_to_tweet_hours": 6,
      "ui_flag": "yellow"
    },
    "shill_history": {
      "calls_30d": 14,
      "unique_tickers_30d": 11,
      "serial_caller": true,
      "ui_flag": "yellow"
    },
    "pnl": {
      "avg_pnl_7d": -0.38,
      "median_pnl_7d": -0.52,
      "calls_that_worked": 3,
      "total_calls": 14,
      "ui_flag": "red"
    }
  },
  "token_signals": {
    "age_hours": 72,
    "top10_pct": 0.31,
    "lp_status": "locked",
    "mint_authority": null
  },
  "explanation": "Author entered the position hours before promoting it, and historical calls underperform. Typical short-term pump setup.",
  "sources": ["etherscan", "dex_trades", "twitter_api"],
  "computed_at": "2026-05-11T12:34:56Z",
  "insufficient_data_fields": []
}
```

`overlay_signal` rule (deterministic):

- Any `ui_flag = red` → `risk`.
- Else any `ui_flag = yellow` → `caution`.
- Else if `identity_tier = C` or all metrics insufficient → `unknown`.
- Else → `clean`.

The rollup is computed server-side so all consumers (extension + partners) see the same verdict.

---

## 7. Versioning

Scoring is versioned. Every API response carries `"scoring_version": "1.0.0"`. Breaking changes to thresholds or weights bump the major version; tunings bump the minor. The extension caches responses by `(handle, ticker, scoring_version)` so version bumps invalidate cache automatically.
