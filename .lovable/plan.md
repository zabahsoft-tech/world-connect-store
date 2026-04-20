
## Plan: Old-site → New-site CSV migration

You'll get **two things**:

### 1. A ready-to-paste Codex prompt (the main deliverable)
A single markdown file at `/mnt/documents/codex-migration-prompt.md` that you give to Codex. The prompt tells Codex exactly:

- **Input**: your old Laravel CSV exports (any columns / any names — Codex inspects them).
- **Output**: two CSVs matching this site's schema exactly:
  - `categories.csv` — columns: `slug, name_en, name_fa, name_ps, image, sort_order`
  - `products.csv` — columns: `slug, name_en, name_fa, name_ps, description_en, description_fa, description_ps, price, image_url, gallery, category_slug, featured, in_stock, video_url, attributes, sizes, variants`
- **Relations**: products link to categories by **`category_slug`** (not UUID — the importer resolves it on insert, so Codex doesn't need DB access).
- **JSONB fields** explained with examples:
  - `gallery` → JSON array of image URLs: `["https://...","https://..."]`
  - `attributes` (legacy specs) → JSON array of `{label_en,label_fa,label_ps,value_en,value_fa,value_ps}`
  - `sizes` → simple newline string (`Small | کوچک | کوچنی\nLarge | بزرگ | لوی`) that the importer converts to `attributes` automatically
  - `variants` → JSON array of `{name_en,name_fa,name_ps,sku,price,in_stock,image_url}`
- **Slug rules**: lowercase, kebab-case, ASCII-only, unique.
- **Multilingual fallback**: if old site only has one language, copy the same value into all 3 (`_en`, `_fa`, `_ps`) so nothing renders blank.
- **Price**: numeric, no currency symbol.
- **Images**: keep absolute URLs from the old site (don't try to re-upload).
- **Edge cases**: blank rows, duplicate slugs, missing categories, escaped quotes/commas, BOM, RTL text — all listed.

### 2. A simple Admin Import page
New route `/admin/import` (linked from the admin sidebar) that:
- Lets you upload `categories.csv` first, then `products.csv`.
- Shows a **dry-run preview** (row counts, errors, missing categories) before committing.
- On import: parses CSV → validates → resolves `category_slug` → upserts by `slug` (so re-running is safe).
- Uses the existing admin RLS (you must be logged in as admin).

### Files to add/touch
- **New**: `/mnt/documents/codex-migration-prompt.md` (the prompt — generated now via exec, no app code change)
- **New**: `src/routes/admin.import.tsx` (upload UI + dry-run + commit)
- **New dep**: `papaparse` (CSV parser, ~7KB, browser-safe)
- **Edit**: `src/routes/admin.tsx` — add "Import" link to admin nav
- **Edit**: `src/lib/i18n.ts` — add `import` label

### Why this shape
- Codex never touches your DB — it only reshapes CSV → CSV. Safe and offline.
- `category_slug` (text) is more forgiving than UUIDs across migrations.
- Upsert-by-slug means you can re-run the import after fixing a bad row.
- Sizes captured as plain text means non-technical users can edit the CSV in Excel.

### What I'll deliver in the implementation step
1. Write the Codex prompt file to `/mnt/documents/codex-migration-prompt.md` and surface it as a `<lov-artifact>` so you can download it.
2. Build the `/admin/import` page with dry-run + commit.
3. Add the nav link and i18n key.
