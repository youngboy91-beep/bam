# TruthLayer — Deploy to Production

From prototype to live in 15 minutes. Total cost: $0 (free tiers).

---

## 1. Postgres (Supabase — free)

1. [supabase.com](https://supabase.com) → New Project → pick region
2. Settings → Database → copy **Connection string (URI)**
3. That's your `DATABASE_URL`

Migrations run automatically on API startup.

---

## 2. API (Railway — free hobby tier)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → `youngboy91-beep/bam`
2. Service Settings:
   - **Root Directory:** leave empty (monorepo root)
   - **Dockerfile Path:** `apps/api/Dockerfile`
3. Environment Variables:
   ```
   DATABASE_URL=postgres://...    (from step 1)
   TL_JWT_SECRET=<openssl rand -hex 32>
   PORT=8787
   TL_CORS_ORIGINS=https://truthlayer.app,https://x.com,https://twitter.com
   ```
4. Deploy → get URL like `truthlayer-api.up.railway.app`
5. Verify: `curl https://YOUR-URL/health` → `{"ok":true}`

---

## 3. Claim web (Vercel — free)

1. [vercel.com](https://vercel.com) → Import → `youngboy91-beep/bam`
2. Framework: Vite · Root: `apps/claim-web`
3. Env: `TL_API_BASE=https://YOUR-RAILWAY-URL`
4. Deploy → custom domain `truthlayer.app` (optional)

---

## 4. Extension (Chrome Web Store — $5 one-time)

```bash
# Build prod
TL_API_BASE=https://YOUR-RAILWAY-URL node apps/extension/scripts/build-background.mjs --env=prod
TL_API_BASE=https://YOUR-RAILWAY-URL npx vite build --mode production -c apps/extension/vite.config.ts

# Zip
cd apps/extension/dist && zip -r ../truthlayer.zip . && cd -
```

Upload `truthlayer.zip` to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole). Review takes 1-7 days.

---

## 5. Verify end-to-end

1. Install extension → dots appear on x.com
2. Open claim page → claim handle → sign → A-tier
3. Friend installs extension → sees your green dot
4. ✓ Shared persistent state works

---

## After launch

| Users | What to upgrade |
|-------|----------------|
| <1000 | Nothing, free tiers hold |
| 1-10K | Supabase Pro ($25/mo), Railway Pro ($5/mo) |
| 10K+ | Add Redis cache, read replica |
