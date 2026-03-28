# Quick Deployment Checklist

Use this checklist to deploy Belysium Platform to production.

## Phase 0: Pre-Deployment ✓
- [x] API backend built and tested locally
- [x] All 3 tool apps built successfully
- [x] Widget compiled to IIFE (12.21 KB)
- [x] Code committed and pushed to GitHub

## Phase 1: Deploy Backend API

**Platform**: Railway.app

See: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

- [ ] Create Railway project from GitHub
- [ ] Select: `belysium-platform` repo
- [ ] Root directory auto-detected or set to: `apps/api`
- [ ] Add environment variables (9 total):
  - [ ] `ANTHROPIC_API_KEY` = sk-ant-...
  - [ ] `SUPABASE_URL` = https://[project].supabase.co
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` = sb_secret_...
  - [ ] `JWT_SECRET` = [32-char hex]
  - [ ] `SQUARESPACE_WEBHOOK_KEY` = [from Squarespace]
  - [ ] `RESEND_API_KEY` = re_...
  - [ ] `FRONTEND_ORIGIN` = https://belysiumgroup.com
  - [ ] `PORT` = 3001
  - [ ] `NODE_ENV` = production
  - [ ] `NOTIFY_EMAIL` = Thomas@BelysiumGroup.com
- [ ] Deploy (auto or click **Redeploy**)
- [ ] Get Railway deployment URL
- [ ] Add custom domain: `api.belysiumgroup.com`
- [ ] Add CNAME to DNS (Squarespace)
- [ ] Test: `curl https://api.belysiumgroup.com/health`

**Status**: ☐ NOT STARTED | ⚙ IN PROGRESS | ✓ DONE

---

## Phase 2: Deploy Tool Apps to Vercel

**Platform**: Vercel.com

See: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### EBITDA Analyzer
- [ ] New Vercel project → Import `belysium-platform` repo
- [ ] Root: `apps/tools/ebitda-analyzer`
- [ ] Env: `NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com`
- [ ] Deploy
- [ ] Domain: `tools-ebitda.belysiumgroup.com`
- [ ] Add CNAME to DNS
- [ ] Test: `https://tools-ebitda.belysiumgroup.com` loads

**Status**: ☐ | ⚙ | ✓

### Digital Maturity Assessment
- [ ] New Vercel project → Import `belysium-platform` repo
- [ ] Root: `apps/tools/digital-maturity`
- [ ] Env: `NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com`
- [ ] Deploy
- [ ] Domain: `tools-maturity.belysiumgroup.com`
- [ ] Add CNAME to DNS
- [ ] Test: `https://tools-maturity.belysiumgroup.com` loads

**Status**: ☐ | ⚙ | ✓

### Property ROI Calculator
- [ ] New Vercel project → Import `belysium-platform` repo
- [ ] Root: `apps/tools/property-roi`
- [ ] Env: `NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com`
- [ ] Deploy
- [ ] Domain: `tools-property.belysiumgroup.com`
- [ ] Add CNAME to DNS
- [ ] Test: `https://tools-property.belysiumgroup.com` loads

**Status**: ☐ | ⚙ | ✓

---

## Phase 3: Widget & Squarespace Integration

**Platform**: Squarespace (Code Injection)

See: [WIDGET_SQUARESPACE_INTEGRATION.md](WIDGET_SQUARESPACE_INTEGRATION.md)

### Host Widget
- [ ] Widget built: `apps/widget/dist/belysium-widget.iife.js` (12.21 KB)
- [ ] Option A (Recommended): Upload to Vercel `/public/`
  - [ ] Access at: `https://tools-ebitda.belysiumgroup.com/belysium-widget.iife.js`
- [ ] Option B: Upload to Squarespace Files
- [ ] Option C: Upload to CDN

### Global Widget
- [ ] Squarespace → **Settings** → **Advanced** → **Code Injection** → **Header**
- [ ] Add widget config + script tag
- [ ] Verify: Chat bubble appears on all pages

### Division-Specific Widgets
- [ ] **Belysium Professional page**: Override division to `professional`
- [ ] **Belysium Developments page**: Override division to `developments`

### Embed Tools
- [ ] **EBITDA page**: Add iframe `src="https://tools-ebitda.belysiumgroup.com"`
- [ ] **Digital Maturity page**: Add iframe `src="https://tools-maturity.belysiumgroup.com"`
- [ ] **Property ROI page**: Add iframe `src="https://tools-property.belysiumgroup.com"`

### SEO
- [ ] Add structured data (JSON-LD) to **Code Injection** → **Header**

**Status**: ☐ | ⚙ | ✓

---

## Phase 4: Testing & Verification

### Backend API
- [ ] Health check: `curl https://api.belysiumgroup.com/health` → `{"ok":true}`
- [ ] Auth endpoint: POST `/auth/tool-login` with test email + license key
- [ ] Tool route: POST `/tools/ebitda/analyze` with valid data + token

### Tools (Vercel)
- [ ] EBITDA loads at `https://tools-ebitda.belysiumgroup.com`
- [ ] Maturity loads at `https://tools-maturity.belysiumgroup.com`
- [ ] Property loads at `https://tools-property.belysiumgroup.com`
- [ ] All connect to API successfully

### Widget (Squarespace)
- [ ] Chat bubble visible on belysiumgroup.com
- [ ] Can type message and get response
- [ ] Professional page uses `professional` division
- [ ] Developments page uses `developments` division

### Iframes (Squarespace)
- [ ] All 3 tools load inside product pages
- [ ] Forms are responsive and usable
- [ ] Tool submissions work correctly

**Status**: ☐ | ⚙ | ✓

---

## Phase 5: Post-Launch

- [ ] Monitor Railway logs for errors
- [ ] Monitor Vercel analytics for tool usage
- [ ] Test Squarespace order webhook → license creation
- [ ] Test email notifications (leads + licenses)
- [ ] Create test licenses in Supabase
- [ ] Announce tools on website
- [ ] Set up monitoring/alerts

**Status**: ☐ | ⚙ | ✓

---

## Environment Variables Needed

Keep these ready for Phase 1 (Railway):

```
ANTHROPIC_API_KEY=sk-ant-[YOUR-KEY-FROM-ANTHROPIC]
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[YOUR-SERVICE-ROLE-KEY]
JWT_SECRET=[32-char-hex-random-string]
SQUARESPACE_WEBHOOK_KEY=[get from Squarespace Commerce]
RESEND_API_KEY=re_[YOUR-RESEND-KEY]
FRONTEND_ORIGIN=https://belysiumgroup.com
PORT=3001
NODE_ENV=production
NOTIFY_EMAIL=Thomas@BelysiumGroup.com
```

---

## Support & Help

| Phase | Document | Details |
|-------|----------|---------|
| Backend | [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) | How to deploy API to Railway |
| Tools | [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | How to deploy 3 tools to Vercel |
| Widget | [WIDGET_SQUARESPACE_INTEGRATION.md](WIDGET_SQUARESPACE_INTEGRATION.md) | Widget hosting + Squarespace embeds |
| Original | [DEPLOYMENT.md](DEPLOYMENT.md) | High-level overview of full platform |

---

**Current Status**: Ready for Phase 1 Deployment ✓

**Last Updated**: March 28, 2026
