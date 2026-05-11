# TruthLayer — Testing Guide

Everything you need to poke the product end-to-end on your machine. The
workflow is intentionally boring: one-liner to start, three surfaces to
test, a short feedback loop.

---

## 1. One-time setup

```bash
git checkout feat/identity-auth-scaffold   # or main once PR #6 is merged
npm install
```

Node 20+ required. Everything else is a workspace dep.

---

## 2. Start everything

```bash
npm run dev:all
```

That spins up three processes in one terminal:

- **api** on `http://localhost:8787` (Fastify, hot-reload via `tsx watch`)
- **ext** building `apps/extension/dist/` on file change (dev manifest)
- **claim** on `http://localhost:5173` (Vite dev server)

If you'd rather run them separately in different terminals:

```bash
npm run dev:api           # terminal 1
npm run dev:extension     # terminal 2 (just watches and rebuilds)
npm run dev:claim-web     # terminal 3
```

---

## 3. Three surfaces to test

### 3.1 Extension on X — inline dot + hover card

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. **Load unpacked** -> select `apps/extension/dist/`.
4. Pin it in the toolbar so you can see the popup.
5. Go to `https://x.com` and scroll the home feed.

**What should happen (new UX)**

- Next to every tweet author's `@handle` there is a **small colored dot**.
  No more full overlay under the tweet — the feed stays visually quiet.
- Dot colors map to tier signal:
  - **green** — verified (A-tier) with no caution flags
  - **yellow** — caution
  - **red** — high risk
  - **gray** — unverified / unknown
- **Hover** the dot (or focus it via keyboard, or click) -> a floating
  card appears near the dot with:
  - tier label
  - three metric cells
  - a one-line human explanation
  - a block of **external links** grouped by "Wallet on chain X",
    "$TICKER", and "Author" -> Etherscan, DeBank, Arkham, Zapper,
    Solscan, Birdeye, RugCheck, DEXScreener, GeckoTerminal, X profile
  - a "Full report >" link (future profile page)
- Move the pointer into the card without closing it — the card stays.
- Move the pointer away from both dot and card — the card fades out
  after a short delay.
- Click any external link — opens in a new tab.

**What to file as a bug**

- Dot not appearing next to the handle on some tweet shape (quote
  tweet, reply card, thread lead, Grok "read more" layout).
- Dot misaligned, overlapping verified checkmark, jumping when the
  feed re-renders.
- Hover card clipped by viewport edge or covered by X's own dialogs.
- Hover card stays open after the pointer has left — or closes while
  pointer is inside the card.
- Any numeric value rendered that looks "computed client-side" (there
  shouldn't be any — if you spot one, tell me).
- Any external link that goes to the wrong page / wrong chain scanner.

### 3.2 `/claim` self-onboarding flow

Open `http://localhost:5173`.

**What should happen**

1. Enter your X handle (form input; Twitter OAuth plugs in later).
2. Click "Connect Ethereum wallet" -> MetaMask / Rabby / etc pops up ->
   account approved.
3. Click "Continue". The next screen shows an EXACT message from the
   server.
4. Click "Sign and claim" -> wallet signs -> green "A-tier verified"
   card appears.
5. You can click "Claim another wallet" and repeat with Solana
   (requires Phantom / Backpack).

**What to file as a bug**

- Wallet connect rejected but no clear toast.
- Any way to submit a claim where the signed text differs from the
  server-sent text.
- Success card appearing with a failed API response.
- Refresh mid-flow should keep you on the last completed step, not
  reset.

### 3.3 Offline overlay preview (no X, no login)

Open `reference/mockup.html` in your browser directly.

That file is a static 1:1 replica of the overlay on X. Use it to eyeball
the **visual** without dealing with X's DOM changes. If we ever break
the overlay visually under X but not in the mockup, we know the
breakage is X-specific, not ours.

---

## 4. Smoke tests (cheap, fast)

```bash
npm run dev:api &   # or have dev:all running
npm run smoke
```

Runs two end-to-end scripts:

1. `test-e2e-session.mjs` — anonymous session + snapshot + bearer
   enforcement.
2. `test-e2e-claim.mjs` — real EVM keypair -> nonce -> sign -> submit
   -> A-tier recorded. Also verifies replay rejection and tampered
   message rejection.

Both must pass before any PR merges. CI runs them on every push.

---

## 5. Reporting style

When you find something broken:

- Tell me **which surface**: extension overlay / popup / claim-web /
  API smoke.
- Tell me **which tweet** (paste a URL or screenshot).
- Paste **what you expected**, even if it feels obvious.
- Paste **what you got**. Screenshots beat descriptions.

I'll land fixes on feature branches, one issue per branch, and open a
PR so you can see the diff before it merges. If it's a one-liner typo
I'll fix-forward on `main` and tell you.

Don't hold back. The fastest way to reach a good overlay is to get a
lot of "that looks wrong" feedback early.

---

## 6. What is knowingly incomplete right now

Declared so you don't file them:

- **Twitter OAuth** — `/claim` takes the handle from a form input,
  server trusts it. Real OAuth is a separate milestone.
- **Postgres** — everything is in-memory. Restart the API and all
  anonymous sessions / claims disappear.
- **Real scoring** — `/v1/score` returns fixtures for three known
  handles and a generic "unknown" verdict for everyone else. The
  pipeline that consumes real on-chain data is stubbed behind adapter
  interfaces.
- **Popup "Report issue" button** opens a placeholder URL.
- **Pro checkout** — no Stripe wiring yet.

If you hit one of these, the bug to file is **"this should say
something clearer about being unfinished"**, not the missing feature
itself.
