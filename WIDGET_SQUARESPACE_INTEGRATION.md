# Belysium Platform — Widget & Squarespace Integration

Deploy the chatbot widget and embed all tools on Squarespace pages.

---

## Part 1: Host the Widget

### Option A: Upload to Vercel (Recommended)

This file is ready: `apps/widget/dist/belysium-widget.iife.js` (12.21 KB)

**Steps**:
1. In any of your Vercel projects (e.g., EBITDA tool), go to **Settings** → **Storage**
2. Or upload directly to a Vercel deployment's `/public/` folder
3. Access at: `https://tools-ebitda.belysiumgroup.com/belysium-widget.iife.js`

### Option B: Upload to Squarespace Assets

1. Go to **Squarespace Admin** → **Files**
2. Upload `apps/widget/dist/belysium-widget.iife.js`
3. Copy the public URL (ends with `.js`)

### Option C: Use CDN

Upload to any CDN (AWS S3, Cloudflare, etc.) and get the public URL.

**For this guide**, we'll assume the widget is at:
```
https://tools-ebitda.belysiumgroup.com/belysium-widget.iife.js
```

---

## Part 2: Global Widget (All Pages)

Add chatbot to every page on belysiumgroup.com.

### In Squarespace

1. Go to **Settings** → **Advanced** → **Code Injection**
2. Paste into **Header** section:

```html
<!-- Belysium AI Chatbot Widget -->
<script>
  window.BelysiumWidgetConfig = {
    apiUrl: 'https://api.belysiumgroup.com',
    division: 'general',
    primaryColor: '#1a1a2e',
    accentColor: '#c9a84c',
    position: 'bottom-right'
  };
</script>
<script src="https://tools-ebitda.belysiumgroup.com/belysium-widget.iife.js" defer></script>
```

**Result**: Chatbot bubble appears bottom-right on all pages ✓

---

## Part 3: Division-Specific Widgets

Override the global config on specific pages.

### Belysium Professional Page

1. **Edit page** → **Advanced** → **Page Header Code Injection**
2. Paste:

```html
<script>
  window.BelysiumWidgetConfig = {
    apiUrl: 'https://api.belysiumgroup.com',
    division: 'professional',
    primaryColor: '#1a1a2e',
    accentColor: '#c9a84c',
    position: 'bottom-right'
  };
</script>
```

**Result**: Widget uses professional-specific system prompt and styling ✓

### Belysium Developments Page

1. **Edit page** → **Advanced** → **Page Header Code Injection**
2. Paste:

```html
<script>
  window.BelysiumWidgetConfig = {
    apiUrl: 'https://api.belysiumgroup.com',
    division: 'developments',
    primaryColor: '#1a1a2e',
    accentColor: '#c9a84c',
    position: 'bottom-right'
  };
</script>
```

**Result**: Widget uses Developments system prompt (Li'Eau property info) ✓

---

## Part 4: Embed Tools as Iframes

Add interactive tools directly on product pages.

### EBITDA Analyzer Page

1. Create/edit product page for EBITDA Analyzer
2. Add a **Code Block** (not Code Injection)
3. Paste:

```html
<iframe
  src="https://tools-ebitda.belysiumgroup.com"
  width="100%" 
  height="900"
  frameborder="0"
  loading="lazy"
  style="border-radius: 16px; max-width: 900px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"
  allow="clipboard-write"
  title="EBITDA Analyzer">
</iframe>
```

**Result**: Full tool loads inside Squarespace page ✓

### Digital Maturity Assessment Page

1. Add a **Code Block** on the Digital Maturity product page
2. Paste:

```html
<iframe
  src="https://tools-maturity.belysiumgroup.com"
  width="100%" 
  height="900"
  frameborder="0"
  loading="lazy"
  style="border-radius: 16px; max-width: 900px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"
  allow="clipboard-write"
  title="Digital Maturity Assessment">
</iframe>
```

### Property ROI Calculator Page

1. Add a **Code Block** on the Property ROI product page
2. Paste:

```html
<iframe
  src="https://tools-property.belysiumgroup.com"
  width="100%" 
  height="1000"
  frameborder="0"
  loading="lazy"
  style="border-radius: 16px; max-width: 900px; display: block; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"
  allow="clipboard-write"
  title="Belgian Property ROI Calculator">
</iframe>
```

---

## Part 5: SEO & Structured Data

Add to global header for search engines.

### In Squarespace

1. Go to **Settings** → **Advanced** → **Code Injection** → **Header**
2. Paste (keep the widget code above, add this after):

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
      },
      "telephone": "+32 (0)13 77 33 33"
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://belysiumgroup.com/belysium-professional",
      "name": "Belysium Professional",
      "description": "Strategic consulting services — EBITDA improvement, supply chain optimization, digital transformation",
      "url": "https://belysiumgroup.com/belysium-professional",
      "parentOrganization": { "@id": "https://belysiumgroup.com/#organization" }
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://belysiumgroup.com/belysium-developments",
      "name": "Belysium Developments",
      "description": "Premium residential apartment development in Belgium — Li'Eau project",
      "url": "https://belysiumgroup.com/belysium-developments",
      "parentOrganization": { "@id": "https://belysiumgroup.com/#organization" }
    }
  ]
}
</script>
```

---

## Part 6: Test Everything

### Widget Test
1. Visit belysiumgroup.com
2. Chat icon appears bottom-right ✓
3. Click → open chat panel ✓
4. Type message → gets response ✓

### Tool Tests
1. Visit `https://tools-ebitda.belysiumgroup.com` → Tool loads ✓
2. Try authenticating with test license key (from Supabase)
3. Submit form → API returns analysis ✓

### Iframe Tests
1. Visit Squarespace EBITDA product page
2. Tool iframe loads and is responsive ✓
3. Tool forms work inside iframe ✓

---

## Redeploy Widget

If you update the widget source (`apps/widget/src/index.ts`):

```bash
cd apps/widget
npm run build
# Output: dist/belysium-widget.iife.js (updated)
```

Then:
- **If using Vercel**: Commit & push → auto-deployed
- **If using Squarespace Assets**: Re-upload the file

No Squarespace changes needed — the `<script src>` URL stays the same.

---

## Troubleshooting

**Widget not appearing**:
- Check browser console (F12) for errors
- Verify URL `https://tools-ebitda.belysiumgroup.com/belysium-widget.iife.js` is accessible
- Ensure `window.BelysiumWidgetConfig` is set before the `<script>` tag

**"API error" in chat**:
- Backend not deployed yet, or `apiUrl` is wrong
- Check `https://api.belysiumgroup.com/health` works

**Iframes showing "refused to connect"**:
- CORS issue — check Railway `FRONTEND_ORIGIN` includes Squarespace domain
- Or add to Railway: `FRONTEND_ORIGIN=https://www.belysiumgroup.com,https://belysiumgroup.com`

**Tool inside iframe won't submit forms**:
- May be iframe sandbox restrictions
- Try adding `allow="same-origin"` to iframe tag

**SEO not improving**:
- Structured data doesn't affect rankings directly
- Check Google Search Console that pages are indexed
- Monitor Core Web Vitals (tools should load fast with Vercel)
