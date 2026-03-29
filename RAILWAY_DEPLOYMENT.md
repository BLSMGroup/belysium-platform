# Belysium Platform — Railway Deployment Guide

## Prerequisites
- Railway account created at [railway.app](https://railway.app)
- GitHub account with access to `BLSMGroup/belysium-platform`
- Environment variables ready (see below)

## Step 1: Create Railway Project

1. **Log in to Railway** → Go to **Dashboard**
2. Click **→ New Project** → **Deploy from GitHub repo**
3. **Authorize GitHub** (if not already done)
4. Search for and select `belysium-platform`
5. Railway will auto-detect `railway.json` in the root

## Step 2: Configure Build Settings

Railway will auto-detect from the repository's build configuration files:

- **`railway.json`** — Root-level config that Railway reads automatically
- **`Nixpacks.toml`** — Explicit build instructions (optional, but included in this repo)

No manual configuration needed if auto-detected. If Railway asks you to configure:

**Build Settings**:
- Build Command: `npm install --prefix apps/api && npm run build --prefix apps/api`
- Start Command: `node apps/api/dist/index.js`

## Step 3: Set Environment Variables

In Railway **Variables** tab, add all from `apps/api/.env`:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (from console.anthropic.com) |
| `SUPABASE_URL` | `https://[project].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` |
| `JWT_SECRET` | `60c6b99388dba...` (32-char hex string) |
| `SQUARESPACE_WEBHOOK_KEY` | Squarespace > Commerce > Webhooks |
| `RESEND_API_KEY` | `re_...` (from resend.com) |
| `FRONTEND_ORIGIN` | `https://belysiumgroup.com` |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `NOTIFY_EMAIL` | `Thomas@BelysiumGroup.com` |

## Step 4: Add Custom Domain

1. In Railway, go to **Settings** → **Deployment**
2. Under **Domains**, click **+ New Domain**
3. Enter: `api.belysiumgroup.com`
4. Railway generates a CNAME target

## Step 5: Configure DNS

Contact your DNS provider (likely Squarespace) and add:

```
CNAME: api.belysiumgroup.com
Points to: [Railway CNAME target from step 4]
```

## Step 6: Deploy

Railway auto-deploys on every `git push origin main`. To manually trigger:

1. Go to **Deployments** tab
2. Click the three dots on latest deployment
3. Select **Redeploy**

## Step 7: Verify

Once deployed:

```bash
curl https://api.belysiumgroup.com/health
```

Should return:
```json
{"ok":true,"ts":"2026-03-28T..."}
```

## Troubleshooting

**Build fails with "error deploying from source"**: 
- Check Railway **Deployments** tab → click deployment → scroll down to see build logs
- Common causes:
  - Ensure all environment variables are set (especially `SUPABASE_URL` and `ANTHROPIC_API_KEY`)
  - Build command might be failing — check TypeScript compilation errors
  - Try triggering a **Redeploy** after fixing any env vars

**"Module not found" errors during build**:
- Ensure `buildCommand` properly references `apps/api` subfolder
- Repository uses monorepo structure — paths must include `apps/api` prefix
- Current setup: `npm install --prefix apps/api && npm run build --prefix apps/api`

**Crash on start with "supabaseUrl is required"**:
- Missing or incorrect `SUPABASE_URL` in Railway environment variables
- Copy exact value from Supabase project settings
- Format: `https://[project-ref].supabase.co`

**"Cannot find module" after _successful_ build**:
- Start command might be wrong — should be `node apps/api/dist/index.js`
- NOT `node dist/index.js` (that won't find the compiled output)
- Check Railway **Settings > Deployment > Start Command**

**CORS errors from tools**:
- Update `FRONTEND_ORIGIN` to include all domains:
  - `https://belysiumgroup.com` (main site)
  - `https://www.belysiumgroup.com` (www variant)
  - `https://tools-*.belysiumgroup.com` (all tool subdomains)
