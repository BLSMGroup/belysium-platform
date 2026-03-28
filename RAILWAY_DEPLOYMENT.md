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

Railway should auto-detect from `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/api && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd apps/api && cp ../.env dist/.env && node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

If not auto-detected, set manually in **Settings > Build**:
- **Build Command**: `cd apps/api && npm install && npm run build`
- **Start Command**: `cd apps/api && cp ../.env dist/.env && node dist/index.js`

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

**Build fails**: Check Railway build logs. Usually missing env vars or incorrect start command.

**"Module not found" errors**: Ensure `buildCommand` includes `cd apps/api` prefix.

**Crash on start**: Verify all `SUPABASE_*` and `ANTHROPIC_API_KEY` are set.

**CORS errors from tools**: Ensure `FRONTEND_ORIGIN` includes both `belysiumgroup.com` and Vercel tool URLs.
