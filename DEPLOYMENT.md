# Belysium Platform — Deployment Guide

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Squarespace admin access (Business plan or higher for Code Injection)
- [ ] Anthropic API key from console.anthropic.com
- [ ] GitHub account + repo created: `github.com/belysiumgroup/belysium-platform`
- [ ] Supabase project created at supabase.com (choose **Frankfurt EU** region)
- [ ] Railway account at railway.app (connected to GitHub)
- [ ] Vercel account at vercel.com (connected to GitHub)
- [ ] Resend account at resend.com (verify domain: belysiumgroup.com)
- [ ] DNS access to add subdomains

---

## Step 1 — Supabase Setup

1. Create project at supabase.com → choose **eu-central-1 (Frankfurt)**
2. Go to SQL Editor → paste and run `supabase/schema.sql`
3. Copy from Project Settings > API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)

---

## Step 2 — Deploy Backend API to Railway

1. Push code to GitHub: `git push origin main`
2. Railway → New Project → Deploy from GitHub → select `belysium-platform`
3. Set root directory: `apps/api`
4. Add all environment variables from `apps/api/.env.example`:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=[generate: openssl rand -hex 32]
SQUARESPACE_WEBHOOK_KEY=[from Squarespace Commerce settings]
RESEND_API_KEY=re_...
FRONTEND_ORIGIN=https://belysiumgroup.com
PORT=3001
NODE_ENV=production
NOTIFY_EMAIL=Thomas@BelysiumGroup.com
```

5. Railway will auto-deploy. Copy the Railway URL (e.g., `https://belysium-api-xxxx.railway.app`)
6. Add a custom domain: `api.belysiumgroup.com` → add CNAME in your DNS

---

## Step 3 — Deploy Tool Apps to Vercel

### EBITDA Analyzer
1. Vercel → New Project → import `belysium-platform`
2. Root directory: `apps/tools/ebitda-analyzer`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://api.belysiumgroup.com
   ```
4. Deploy. Set custom domain: `tools-ebitda.belysiumgroup.com`

### Digital Maturity Assessment
- Same process, root: `apps/tools/digital-maturity`
- Domain: `tools-maturity.belysiumgroup.com`

### Property ROI Calculator
- Same process, root: `apps/tools/property-roi`
- Domain: `tools-property.belysiumgroup.com`

---

## Step 4 — Build and Host the Chatbot Widget

```bash
cd apps/widget
yarn install
yarn build
# Output: dist/belysium-widget.iife.js (~15KB)
```

Upload `dist/belysium-widget.iife.js` to:
- Squarespace Assets (via Files menu), OR
- A CDN (e.g., upload to Vercel alongside a tool, serve from `/public/`)
- The file URL will be: `https://[your-vercel-app].vercel.app/belysium-widget.iife.js`

---

## Step 5 — Squarespace Code Injection

### 5a. Global chatbot (all pages)
Go to: **Settings > Advanced > Code Injection > Header**

Paste this code, replacing `YOUR_API_URL` and choosing the right division per page group:

```html
<!-- Belysium AI Widget -->
<script>
  window.BelysiumWidgetConfig = {
    apiUrl: 'https://api.belysiumgroup.com',
    division: 'general',
    primaryColor: '#1a1a2e',
    accentColor: '#c9a84c',
    position: 'bottom-right'
  };
</script>
<script src="https://[your-cdn]/belysium-widget.iife.js" defer></script>
```

### 5b. Division-specific pages
For the Belysium Professional page, use a **Page Header** (Edit page > Advanced > Page Header Code Injection):
```html
<script>window.BelysiumWidgetConfig = { apiUrl: 'https://api.belysiumgroup.com', division: 'professional' };</script>
```

For the Belysium Developments page:
```html
<script>window.BelysiumWidgetConfig = { apiUrl: 'https://api.belysiumgroup.com', division: 'developments' };</script>
```

### 5c. Tool iframes (embed tools on tool pages)
On each tool product page in Squarespace, add a **Code Block** (insert block > Code):

**EBITDA Analyzer:**
```html
<iframe
  src="https://tools-ebitda.belysiumgroup.com"
  width="100%" height="900"
  frameborder="0"
  style="border-radius: 16px; max-width: 900px; display: block; margin: 0 auto;"
  allow="clipboard-write"
  title="EBITDA Analyzer">
</iframe>
```

**Digital Maturity Assessment:**
```html
<iframe
  src="https://tools-maturity.belysiumgroup.com"
  width="100%" height="900"
  frameborder="0"
  style="border-radius: 16px; max-width: 900px; display: block; margin: 0 auto;"
  allow="clipboard-write"
  title="Digital Maturity Assessment">
</iframe>
```

**Property ROI Calculator:**
```html
<iframe
  src="https://tools-property.belysiumgroup.com"
  width="100%" height="1000"
  frameborder="0"
  style="border-radius: 16px; max-width: 900px; display: block; margin: 0 auto;"
  allow="clipboard-write"
  title="Belgian Property ROI Calculator">
</iframe>
```

### 5d. SEO structured data (global header)
Add to Settings > Advanced > Code Injection > Header:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://belysiumgroup.com/#organization",
      "name": "Belysium Group",
      "url": "https://belysiumgroup.com",
      "logo": "https://belysiumgroup.com/logo.png",
      "email": "Info@BelysiumGroup.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Hulshoekstraat 87",
        "addressLocality": "Linkhout",
        "postalCode": "3560",
        "addressCountry": "BE"
      }
    },
    {
      "@type": "LocalBusiness",
      "name": "Belysium Professional",
      "description": "Strategic consulting services — EBITDA improvement, supply chain optimization, digital transformation",
      "url": "https://belysiumgroup.com/belysium-professional",
      "parentOrganization": { "@id": "https://belysiumgroup.com/#organization" }
    },
    {
      "@type": "RealEstateAgent",
      "name": "Belysium Developments",
      "description": "Premium residential apartment development in Belgium",
      "url": "https://belysiumgroup.com/belysium-developments",
      "parentOrganization": { "@id": "https://belysiumgroup.com/#organization" }
    }
  ]
}
</script>
```

---

## Step 6 — Squarespace Commerce Product Setup

Create these products in **Commerce > Products**:

| Product name | SKU | Price | Type |
|---|---|---|---|
| EBITDA Analyzer — Starter | `ebitda-analyzer` | €49 | Digital download (no file needed) |
| Digital Maturity Assessment — Starter | `digital-maturity` | €49 | Digital download |
| Property ROI Calculator — Starter | `property-roi` | €29 | Digital download |
| Professional Bundle (all tools) | `professional-bundle` | €199/month | Subscription |
| Real Estate Bundle | `realestate-bundle` | €29 | Digital download |

**Set up the webhook:**
Commerce > Settings > Webhooks > Add webhook:
- URL: `https://api.belysiumgroup.com/webhooks/squarespace-order`
- Events: `ORDER_FULFILLED`
- Copy the webhook secret → set as `SQUARESPACE_WEBHOOK_KEY` in Railway

---

## Step 7 — DNS Records Summary

Add these DNS records at your registrar/Cloudflare:

| Type | Name | Value |
|---|---|---|
| CNAME | `api` | `[Railway domain].railway.app` |
| CNAME | `tools-ebitda` | `cname.vercel-dns.com` |
| CNAME | `tools-maturity` | `cname.vercel-dns.com` |
| CNAME | `tools-property` | `cname.vercel-dns.com` |
| TXT | `_dmarc` | (from Resend email verification) |
| TXT | `@` | SPF record (from Resend) |

---

## Step 8 — Verification Checklist

- [ ] `https://api.belysiumgroup.com/health` returns `{ "ok": true }`
- [ ] Widget appears on belysiumgroup.com — chat opens and responds
- [ ] Lead captured in Supabase `leads` table after conversation
- [ ] Email notification received at Thomas@BelysiumGroup.com
- [ ] Tool URL loads and shows auth form
- [ ] Purchase a test product → webhook fires → license appears in Supabase
- [ ] Welcome email received with license key
- [ ] Enter license key in tool → unlocks → analysis generates
- [ ] Print/PDF button triggers browser print dialog

---

## Monthly Cost Estimate

| Service | Cost |
|---|---|
| Railway (API backend) | ~€8/month |
| Vercel (3 tool apps) | €0 free tier initially |
| Supabase | €0 free tier (25GB DB) |
| Resend | €0 free (3,000 emails/month) |
| Anthropic Claude API | €50–200/month (scales with usage) |
| **Total** | **~€60–210/month** |

---

## Support & Questions

Email: Info@BelysiumGroup.com | Thomas@BelysiumGroup.com
