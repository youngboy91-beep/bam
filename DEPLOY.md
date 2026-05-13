# TruthLayer — Deploy to Production

**From zero to live in 15 minutes. Total monthly cost: $0.**

All services below have free tiers that comfortably handle 1000+ MAU.

---

## Prerequisites

- GitHub account (you have it)
- Node.js 20+ installed locally (for building the extension)

---

## Step 1: Database — Supabase (free)

> Supabase gives you a managed Postgres with 500MB storage free.

1. Go to **[supabase.com](https://supabase.com)** → Sign up / Log in
2. Click **"New Project"**
3. Name: `truthlayer` · Region: closest to your users · Password: generate and **save it**
4. Wait ~2 minutes for provisioning
5. Go to **Settings → Database → Connection string → URI**
6. Copy the URI. It looks like:
   ```
   postgres://postgres.[ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. **That's your `DATABASE_URL`.** Save it somewhere safe.

> You don't need to run any SQL manually. The API applies migrations automatically on first boot.

---

## Step 2: API Server — Railway (free hobby plan)

> Railway deploys Docker containers from GitHub with zero config.

1. Go to **[railway.app](https://railway.app)** → Sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select `youngboy91-beep/bam`
4. Railway auto-detects the Dockerfile. If it doesn't, go to Settings:
   - **Dockerfile Path:** `apps/api/Dockerfile`
5. Go to **Variables** tab and add:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgres://...` (from Step 1) |
   | `TL_JWT_SECRET` | Run `openssl rand -hex 32` in terminal, paste result |
   | `PORT` | `8787` |
   | `TL_CORS_ORIGINS` | `https://your-vercel-domain.vercel.app,https://x.com,https://twitter.com` |

6. Click **Deploy**
7. Once green, go to **Settings → Networking → Generate Domain**
8. Copy your domain: `truthlayer-api-production-XXXX.up.railway.app`
9. Verify:
   ```bash
   curl https://YOUR-DOMAIN/health
   # Should return: {"ok":true}
   ```

---

## Step 3: Claim Web App — Vercel (free)

> Vercel deploys Vite apps from GitHub with automatic HTTPS and CDN.

1. Go to **[vercel.com](https://vercel.com)** → Sign up with GitHub
2. Click **"Add New → Project"** → Import `youngboy91-beep/bam`
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/claim-web`
4. **Environment Variables:**

   | Variable | Value |
   |----------|-------|
   | `TL_API_BASE` | `https://YOUR-RAILWAY-DOMAIN` (from Step 2) |

5. Click **Deploy**
6. Vercel gives you a URL like `bam-claim-web.vercel.app`
7. (Optional) Add custom domain `truthlayer.app` in Vercel Settings → Domains

> **Important:** Go back to Railway and update `TL_CORS_ORIGINS` to include your Vercel URL.

---

## Step 4: Chrome Extension — Chrome Web Store ($5 one-time)

### Build the production package

On your Mac, in the `bam` folder:

```bash
# Install deps if not already
npm install

# Build with your production API URL
TL_API_BASE=https://YOUR-RAILWAY-DOMAIN node apps/extension/scripts/build-background.mjs --env=prod
TL_API_BASE=https://YOUR-RAILWAY-DOMAIN npx vite build --mode production -c apps/extension/vite.config.ts

# Verify no localhost in the bundle
grep -c "localhost" apps/extension/dist/background.js
# Should output: 0

# Create zip for Chrome Web Store
cd apps/extension/dist
zip -r ../truthlayer-extension.zip .
cd ../../..
```

### Submit to Chrome Web Store

1. Go to **[Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)**
2. Pay the one-time **$5** registration fee (if first time)
3. Click **"New Item"** → Upload `apps/extension/truthlayer-extension.zip`
4. Fill in:
   - **Name:** `TruthLayer — Crypto Twitter Truth Checker`
   - **Summary:** `See who really holds what they shill. On-chain verification for every tweet.`
   - **Category:** Developer Tools
   - **Language:** English
5. Upload screenshots (take from `reference/dot-hover.html` opened in browser)
6. **Submit for review** — takes 1-7 business days

---

## Step 5: Verify Everything Works Together

Once all services are deployed:

| # | Action | Expected |
|---|--------|----------|
| 1 | `curl https://YOUR-API/health` | `{"ok":true}` |
| 2 | Open your Vercel URL | Claim page loads, "Prove you are @you" |
| 3 | Claim your handle + sign with wallet | "A-tier verified" success |
| 4 | `curl https://YOUR-API/v1/score?handle=YOUR_HANDLE` | `identity_tier: "A"` |
| 5 | Install extension in Chrome | Dots appear on x.com |
| 6 | Find your tweet on X | **Green dot** next to your handle |
| 7 | Have a friend install | They also see your green dot |

If step 7 works → **you have a live product with shared persistent state**.

---

## Cost Breakdown

| Service | Free Tier Includes | When to Upgrade |
|---------|-------------------|-----------------|
| **Supabase** | 500MB storage, 2 GB transfer | >5000 active users |
| **Railway** | $5 credit/mo (enough for ~720h) | Heavy traffic |
| **Vercel** | 100GB bandwidth, auto-SSL | Never for this use case |
| **Chrome Web Store** | $5 one-time, unlimited users | Never |

**Total: $5 one-time, $0/month** until you hit thousands of daily users.

---

## After Launch Checklist

- [ ] `TL_JWT_SECRET` is a random 64-char hex (not the dev default)
- [ ] `DATABASE_URL` uses SSL (Supabase provides this by default)
- [ ] `TL_CORS_ORIGINS` does NOT include `localhost`
- [ ] Extension prod build has 0 occurrences of "localhost"
- [ ] You can claim your own handle and see green dot on X
- [ ] A second person can install and see your green dot

---

## Scaling (when needed)

| Users | Action | Cost |
|-------|--------|------|
| 0-1K | Do nothing | $0/mo |
| 1-10K | Supabase Pro, Railway Pro | ~$30/mo |
| 10-50K | Add Redis cache, read replica | ~$100/mo |
| 50K+ | Dedicated infra, see `docs/scalability.md` | ~$300/mo |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension shows all gray dots | API unreachable. Check Railway logs + CORS origins |
| Claim page says "API error" | Wrong `TL_API_BASE` in Vercel. Redeploy with correct URL |
| Railway deploy fails on Docker | Check `apps/api/Dockerfile` path is set in Railway settings |
| Claims disappear after Railway restart | `TL_JWT_SECRET` regenerated. Set it explicitly in env vars |
| "Cannot connect to database" | Check Supabase URI is the **pooler** URI (port 6543), not direct (5432) |
