
## Plan: Multilingual SEO Targeted at Afghanistan

The site has rich multilingual content (EN/FA/PS) but weak SEO: only `__root.tsx` has hardcoded English meta, no per-route head, no structured data, no sitemap, no hreflang, no geo targeting. I'll fix all of this with a focus on Afghanistan + Dari/Pashto markets.

### 1. New `src/lib/seo.ts` helper
Central module with:
- `BASE_URL` (from window origin / hardcoded production URL)
- Per-language SEO dictionaries (titles, descriptions, keywords for each page in EN/FA/PS) — Afghanistan-specific keywords like "Kabul", "Afghanistan", "آنلاین خرید افغانستان", "آنلاین پلورنځی افغانستان"
- `buildMeta({ title, description, image, url, lang, type })` — returns the full `meta[]` array including OG, Twitter, geo tags (`geo.region=AF`, `geo.placename=Kabul`, `geo.position`, `ICBM`)
- `buildHreflangLinks(path)` — returns hreflang `link[]` for `en-AF`, `fa-AF`, `ps-AF`, `x-default`
- `buildJsonLd(type, data)` — Organization, Website, Product, BreadcrumbList, LocalBusiness schema generators

### 2. Update `src/routes/__root.tsx`
- Replace hardcoded English meta with Afghanistan-aware defaults
- Add `geo.region=AF`, `geo.placename`, `ICBM` meta
- Add `og:locale` (defaults to `fa_AF` since most users are Afghan), `og:locale:alternate` for `en_US` and `ps_AF`
- Add canonical link, theme-color, robots
- Add Organization + WebSite JSON-LD with `SearchAction`
- Add hreflang `<link>` tags for the homepage

### 3. Per-route `head()` for all marketing routes
Add `head()` (and where data-driven, derive from loader) to:
- `src/routes/index.tsx` — homepage SEO trio per language + Organization JSON-LD
- `src/routes/shop.tsx` — uses `head: ({ search })` to vary by category/query
- `src/routes/categories.tsx` — categories listing
- `src/routes/about.tsx` — derives from `about_*` settings
- `src/routes/contact.tsx` — LocalBusiness JSON-LD with phone, address, geo
- `src/routes/products.$slug.tsx` — convert to use `loader` so `head()` can read product name/description/image and emit Product JSON-LD with `priceCurrency: AFN`, availability, brand

Each `head()` returns three-language-aware tags using a fallback chain (current lang → settings store name → defaults). Since SSR doesn't know the user's lang preference (it's stored in localStorage), we render **all three languages** in the `<head>`:
- Primary `<title>` and `<meta name="description">` in English (international default)
- `<meta property="og:title:fa">`, `<meta property="og:title:ps">` for alternates
- Full hreflang link set so search engines route users to the right language version

### 4. Sitemap and robots
- `src/routes/sitemap[.]xml.tsx` — server route generating XML sitemap with all static routes + dynamic products/categories from Supabase, with `<xhtml:link rel="alternate" hreflang="...">` entries per URL
- `public/robots.txt` — allow all, point to sitemap, disallow `/admin/*`, `/checkout`, `/cart`, `/login`, `/signup`

### 5. Sync `<html lang>` and meta description from settings
- `LangContext` already syncs `document.documentElement.lang` — extend it to also update `document.dir` and write a meta tag `content-language`
- When `settings.meta_description_*` exists, it overrides defaults via the seo helper

### 6. Afghanistan-specific touches
- Geo meta: `geo.region=AF`, `geo.placename=Kabul, Afghanistan`, `geo.position=34.5553;69.2075`, `ICBM=34.5553, 69.2075`
- Currency hints in Product JSON-LD: `priceCurrency: "AFN"` (configurable via settings later)
- Locale tags: `fa_AF` (Dari) and `ps_AF` (Pashto), not generic `fa_IR`
- LocalBusiness schema with `addressCountry: AF`
- Keywords mention major Afghan cities: Kabul, Herat, Mazar-i-Sharif, Kandahar, Jalalabad

### 7. PWA basics for share quality
- Add `<link rel="canonical">` per route
- Add `<meta name="format-detection" content="telephone=yes">` (helps Afghan users tap phone numbers)
- `<meta name="theme-color">` from settings primary_color

### Files
- New: `src/lib/seo.ts`
- New: `src/routes/sitemap[.]xml.tsx`
- New: `public/robots.txt`
- Edit: `src/routes/__root.tsx` — Afghanistan-aware defaults + JSON-LD + hreflang
- Edit: `src/routes/index.tsx`, `shop.tsx`, `categories.tsx`, `about.tsx`, `contact.tsx` — add `head()`
- Edit: `src/routes/products.$slug.tsx` — add `loader` + dynamic `head()` with Product JSON-LD
- Edit: `src/contexts/LangContext.tsx` — write `content-language` meta tag

No DB changes, no new dependencies.
