---
inclusion: always
---

# TruthLayer — Overlay UX Invariants

The overlay on X/Twitter is one of the two main consumer surfaces. Its
behaviour is load-bearing for adoption: early user testing showed that a
permanent full-width overlay under every tweet is visually noisy and
gets the extension uninstalled within minutes. These rules prevent
regression to that pattern.

## Default quiet

- The overlay MUST NOT add vertical space to the tweet by default.
- Every tweet in the feed gets a single inline presence: one dot next
  to the author's `@handle`, 8px in diameter, one of four colors.
- The dot takes less than 20px of horizontal space including its
  surrounding margin. It does not reflow the tweet header.
- The dot must be focusable and keyboard-reachable.

## Progressive disclosure

- Full metric information (tier, three cells, explanation, links) is
  reached only through an explicit user action: hover, focus, click.
- Hover surfaces MUST NOT require clicking. Keyboard focus MUST also
  surface the card.
- The hover card is a single, shared, globally-positioned element. Do
  not mount one per tweet.
- The card closes with a short delay after the pointer leaves both
  the dot and the card itself, so the user can move across the gap.

## Links block

- External links are a first-class section of the hover card, not an
  afterthought.
- Links are grouped: one row per linked wallet (chain-specific
  scanners + portfolio tools), one row for the mentioned $TICKER
  (DEXScreener, GeckoTerminal, chain-specific screeners), one row for
  the author's X profile.
- All link URLs are build-time constants. They MUST NOT be fetched
  from the API. A compromised server must not be able to redirect
  users through our UI.
- Each link opens in a new tab with `rel="noopener noreferrer"`.

## Never-merge list

- Reintroducing a permanent full-width overlay under each tweet.
  Power users may opt in via settings in the future; the default is
  always the quiet dot.
- Adding numeric values rendered from raw client-side math.
- Adding links whose destination comes from the API response body.
- Mounting React roots per-tweet for the hover card. One shared host
  only. Multiple mounts create layout-thrash and double-renders during
  fast scroll.

## Accessibility

- The dot has `role="button"`, a descriptive `aria-label`, and a
  matching `title` for non-pointer users.
- The hover card is readable by screen readers in source order: tier,
  signal, metrics, explanation, links, footer.
- Color is never the only carrier of meaning. The tier label and the
  signal word (CLEAN / CAUTION / HIGH RISK / UNVERIFIED) always
  accompany the color.

## Performance

- The feed observer uses `requestAnimationFrame` debouncing and a
  per-element WeakSet to prevent re-processing.
- Score requests are deduplicated by handle+ticker+scoring_version in
  the background worker cache.
- A single scroll event does not re-mount any React root. Dot mounts
  are one-and-done per tweet.
