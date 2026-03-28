# Belysium Platform — Vercel Deployment Guide (3 Tool Apps)

Deploy three separate Next.js apps to Vercel. Each will have its own domain.

## Prerequisites
- Vercel account at [vercel.com](https://vercel.com)
- GitHub connected to Vercel
- Backend API already deployed to Railway at `https://api.belysiumgroup.com`

---

## Tool 1: EBITDA Analyzer

### Create Vercel Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. **Import Git Repository** → search `belysium-platform`
4. **Select Repository** → click **Import**

### Configure

**Root Directory**: `apps/tools/ebitda-analyzer`

**Build & Development Settings** (auto-detected):
- Framework Preset: `Next.js`
- Build Command: `npm run build` ✓
- Output Directory: `.next` ✓

**Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com
```

### Deploy

Click **Deploy**. Vercel builds and deploys automatically.

### Add Custom Domain

1. In **Vercel Project Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `tools-ebitda.belysiumgroup.com`
4. Note the CNAME target

### DNS Configuration

Add to your DNS provider:
```
CNAME: tools-ebitda.belysiumgroup.com
Points to: cname.vercel-dns.com
```

**Check**: `https://tools-ebitda.belysiumgroup.com` loads EBITDA tool ✓

---

## Tool 2: Digital Maturity Assessment

### Create Vercel Project

1. **Add New Project** (same as above)
2. Select `belysium-platform` repo

### Configure

**Root Directory**: `apps/tools/digital-maturity`

**Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com
```

### Deploy & Domain

1. Click **Deploy**
2. Go to **Domains** → **Add Domain**
3. Enter: `tools-maturity.belysiumgroup.com`
4. Add CNAME to DNS (same Vercel CNAME target as above)

**Check**: `https://tools-maturity.belysiumgroup.com` loads Digital Maturity tool ✓

---

## Tool 3: Property ROI Calculator

### Create Vercel Project

1. **Add New Project** → `belysium-platform` repo

### Configure

**Root Directory**: `apps/tools/property-roi`

**Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com
```

### Deploy & Domain

1. Click **Deploy**
2. Go to **Domains** → **Add Domain**
3. Enter: `tools-property.belysiumgroup.com`
4. Add CNAME to DNS (same Vercel CNAME)

**Check**: `https://tools-property.belysiumgroup.com` loads Property ROI ✓

---

## Verify All Tools

Test each tool's API connectivity:

```bash
# EBITDA
curl -X POST https://api.belysiumgroup.com/auth/tool-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@belysiumgroup.com","licenseKey":"BEL-TEST123"}'

# Should return: {"token":"eyJ...","expiresIn":3600} or {"error":"Invalid..."}
```

---

## Auto-Deployment

All three projects now auto-deploy on `git push origin main`:
- Changes to `apps/tools/ebitda-analyzer/*` → redeploy EBITDA tool
- Changes to `apps/tools/digital-maturity/*` → redeploy Maturity tool
- Changes to `apps/tools/property-roi/*` → redeploy Property ROI tool

---

## Troubleshooting

**Build fails**: 
- Check Vercel **Deployments** tab for build logs
- Ensure `NEXT_PUBLIC_API_URL` is set
- Verify `Root Directory` matches above

**Tool loads but shows "API error"**:
- Backend may not be deployed yet
- Check `https://api.belysiumgroup.com/health` returns `{"ok":true}`
- Verify `FRONTEND_ORIGIN` in Railway includes tool URLs

**"Module not found" during build**:
- Ensure all `package.json` dependencies are listed
- Run `npm install` locally to verify package.json

**Custom domain not working**:
- DNS propagation takes 5-48 hours
- Verify CNAME is set correctly with: `nslookup tools-ebitda.belysiumgroup.com`
