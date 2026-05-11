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

### 3.1 Extension overlay on X

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. **Load unpacked** -> select `apps/extension/dist/`.
4. Pin it in the toolbar so you can see the popup.
5. Go to `https://x.com` and scroll the home feed.

**What should happen**

- Under every tweet, a TruthLayer overlay appears.
- Tweets from `@VitalikButerin`, `@alpha_caller_x`, `@moondegen_sol` show
  canonical CLEAN / CAUTION / RISK verdicts.
- Every other tweet shows `UNVERIFIED` with "Claim to get a badge".
- Click the extension icon: the popup shows `Anonymous` plan, `0/100`
  usage, and a big "Claim my badge" button.

**What to file as a bug**

- Overlay not appearing under some tweet shape (quote-tweet, reply, ad
  slot, grok thread, media-heavy tweet).
- Overlay misaligned or breaking page layout.
- Any numeric value rendered that looks "computed client-side" (there
  shouldn't be any — if you spot one, tell me).

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
