

The user wants admin-editable pages. Currently `about.tsx` already pulls from `settings.about_*`, but `contact.tsx`, `index.tsx` (hero/featured sections aside from slides), and other static copy are hardcoded. Let me design a flexible "Pages" CMS.

## Plan: Dynamic Pages CMS

### 1. Database — new `pages` table
```sql
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- 'about', 'contact', 'shipping', 'privacy', etc.
  title_en text not null default '',
  title_fa text not null default '',
  title_ps text not null default '',
  content_en text not null default '', -- rich HTML
  content_fa text not null default '',
  content_ps text not null default '',
  meta_description_en text,
  meta_description_fa text,
  meta_description_ps text,
  hero_image text,
  is_published boolean not null default true,
  is_system boolean not null default false,  -- 'about'/'contact' = true, can't delete
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- RLS: public SELECT where is_published, admin ALL
-- Seed: about, contact, shipping, privacy, terms (system pages)
```

### 2. Admin — new `src/routes/admin.pages.tsx`
- List view: all pages with slug, title, published toggle, edit/delete (delete disabled for `is_system`)
- "New page" button → dialog with: slug (auto from EN title, locked for system pages), title (3 langs), `RichTextEditor` for content (3 langs), hero image (`ImageUpload`), meta description (3 langs), publish toggle
- Add nav link in `admin.tsx` sidebar

### 3. Public dynamic page route — new `src/routes/p.$slug.tsx`
Generic renderer for any non-system page (shipping, privacy, terms, custom). Loader fetches by slug, 404 if missing/unpublished, renders title + hero + HTML content with `prose` styling. Uses `head()` for per-page SEO.

### 4. Migrate existing pages to be DB-driven
- **`about.tsx`**: keep route, but read from `pages` table where slug='about' instead of `settings.about_*`. Falls back to settings.about for backward compat during transition.
- **`contact.tsx`**: add an editable intro/body block from `pages` where slug='contact', kept above the existing contact form + WhatsApp/phone (those stay driven by `settings`).
- Both keep their dedicated routes (better SEO than generic `/p/contact`).

### 5. Footer — auto-list published non-system pages
In `Footer.tsx`, query published pages and render links under a "Pages" column so admin-created pages appear automatically.

### 6. i18n
Add keys: "Pages", "New page", "Page slug", "Page content", "Published", "System page", "Hero image (optional)".

### Files
- New migration: `pages` table + RLS + seed rows for about/contact/shipping/privacy/terms
- New: `src/routes/admin.pages.tsx`
- New: `src/routes/p.$slug.tsx`
- Edit: `src/routes/admin.tsx` — add Pages nav link
- Edit: `src/routes/about.tsx` — read from `pages` table
- Edit: `src/routes/contact.tsx` — render editable intro from `pages`
- Edit: `src/components/Footer.tsx` — list dynamic pages
- Edit: `src/lib/i18n.ts` — new keys

No new dependencies.

