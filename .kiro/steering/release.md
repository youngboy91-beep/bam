---
inclusion: always
---

# TruthLayer — Release and Distribution Invariants

Rules Kiro must respect when changing build, packaging, distribution, or
auth code.

## Server-side policy, client-side render

- The browser extension MUST NOT apply scoring thresholds, decay windows,
  rank computation, or any numeric policy locally.
- Every user-facing string in the overlay is pre-rendered server-side and
  returned as `display` / `display_sub` fields in `ScoreResponse`.
- If a scoring decision needs to be made and the server has not encoded it
  as a flag or display string, the feature is incomplete. Do not patch
  around it in the client.

## Public API response surface

- The consumer `/v1/score` endpoint NEVER returns raw numeric signal values
  for inferred tiers. No `confidence`, no component weights, no raw feature
  scores.
- The consumer endpoint returns: `identity_tier`, `identity_rank_label`
  (pre-rendered string), `ui_flag` enums, pre-rendered `display` strings,
  a human `explanation`, and source attribution.
- Partner API is a separate surface, gated by contract, living in a
  separate types package that is NOT imported by the extension workspace.

## Dev vs prod builds

- The extension ships with two manifests: `manifest.json` (dev) and
  `manifest.prod.json` (prod). The build script chooses based on
  `--env=prod`.
- Production builds:
  - MUST NOT include `http://localhost:*` in `host_permissions`.
  - MUST NOT include "(dev)" or any other dev-origin marker in the name.
  - MUST be minified.
  - MUST NOT include source maps in the packaged zip.
- Development builds:
  - MAY point at `http://localhost:8787`.
  - MUST carry a visible "dev" marker so the user cannot confuse them with
    a production install.

## Build-time secrets and constants

- `API_BASE` is injected at build time via `__API_BASE__` / `__BUILD_ENV__`
  defines. The client NEVER hot-swaps the API base from a server response.
- Community links, support URLs, brand names are build-time constants.
  They are not fetched from the API, because fetching them would give a
  compromised API the ability to redirect the user elsewhere.
- Any new build-time constant is added to `apps/extension/src/background/config.ts`
  (single source of truth) and also defined in `vite.config.ts` and in
  `scripts/build-background.mjs` so that both bundlers see it.

## Distribution

- Phase 1 (private beta): unpacked-extension distribution only. Build uses
  the dev manifest. Recipients are tracked out-of-band.
- Phase 2 (public): Chrome Web Store is the canonical channel. The store
  build uses the prod manifest. We do not distribute `.crx` directly in
  Phase 2 except for a documented fallback for users whose region cannot
  access the Chrome Web Store.
- Phase 3 (partners): a separate artifact (partner SDK) is published
  independently of the consumer extension. No shared version numbers.

## Anti-piracy posture (documented so Kiro does not re-invent weak schemes)

- We do NOT attempt to prevent copy-and-paste of the extension bundle.
  A Chrome extension is inherently copyable; defense at the client layer
  is security theater.
- The real defense is server-side: the API requires a session credential
  and rate-limits per credential. A pirated client with no credential
  retrieves no scores.
- Adding invite-only distribution to the consumer extension is a
  never-merge: it kills the viral loop the product depends on. Any PR
  proposing this is rejected at review.
- Founder personal brand ("community link in popup") is the bonding layer
  between the product and the user. It does not replace server-side auth.

## Session credential

- The extension obtains an anonymous credential on first run without user
  action. The credential is stored in `chrome.storage.local` under
  `tl_session`.
- Every outbound API request from the background worker carries
  `Authorization: Bearer <session>`.
- Upgrading to a free account or Pro replaces the anonymous credential
  with an authenticated one via the same storage key.
- The content script NEVER reads the session credential. All network
  traffic is routed through the background worker.

## Public-doc rule

- `docs/release-strategy.md` lists phases and their purposes, not numeric
  targets. Any PR that adds per-phase DAU, MAU, revenue, or conversion
  numbers to the public doc is rejected.
