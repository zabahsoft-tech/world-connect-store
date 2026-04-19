
The user wants admin-controlled hero slides instead of hardcoded ones in `src/routes/index.tsx`.

## Plan: Dynamic Hero Slides

### 1. Database
New `hero_slides` table:
- `id` uuid pk
- `image` text (URL)
- `title_en/fa/ps` text
- `subtitle_en/fa/ps` text
- `cta_label_en/fa/ps` text (nullable)
- `cta_link` text (nullable, e.g. `/shop`)
- `sort_order` int default 0
- `active` boolean default true
- `created_at`, `updated_at` timestamps

RLS: public SELECT (active only via app filter), admins full ALL — same pattern as `categories`/`products`.

Seed 3 rows so the homepage isn't empty on first load.

### 2. Homepage (`src/routes/index.tsx`)
- Replace the hardcoded `SLIDES` const with a `useQuery` fetching `hero_slides` where `active=true` ordered by `sort_order`.
- Use `pickLang(slide, "title", lang)` and `pickLang(slide, "subtitle", lang)` for translations.
- CTA button uses `cta_link` + localized label (fallback to "Shop now" if empty).
- Skeleton placeholder while loading; hide hero entirely if zero active slides.

### 3. Admin slides page (`src/routes/admin.slides.tsx`)
New route mirroring the categories/products admin pattern:
- Table: thumbnail, EN title, sort order, active toggle, edit/delete actions.
- Dialog form with Tabs: **General** (image URL + preview, sort_order, active, cta_link) and **Translations** (EN/FA/PS title + subtitle + cta_label).
- AlertDialog for delete confirmation.
- Reorder via sort_order number input (keep simple, no drag-and-drop).

### 4. Sidebar nav (`src/routes/admin.tsx`)
Add a "Hero slides" entry to the `NAV` array with the `Images` icon, between Categories and Orders.

### Files
- New migration: create `hero_slides` table + RLS + seed
- New: `src/routes/admin.slides.tsx`
- Edit: `src/routes/index.tsx` (fetch slides dynamically)
- Edit: `src/routes/admin.tsx` (add nav link)

No new dependencies — reuses existing shadcn Table, Dialog, Tabs, AlertDialog, Switch.
