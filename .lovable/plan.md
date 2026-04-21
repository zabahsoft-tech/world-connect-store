

## Add a dedicated "Specifications" table field to Products

A new structured **Specifications** table will be added to product editing, completely separate from the rich-text Description. Admins fill in rows of `Label → Value` per language. On the storefront product page, those rows render as a clean two-column spec table under the Description.

### What changes (admin)

`src/routes/admin.products.tsx` — Edit Product dialog → "Translations" tab:

```
┌─ Description ────────────────────────────┐
│  [ Rich text editor (unchanged) ]        │
└──────────────────────────────────────────┘
┌─ Specifications ────────────── + Add row ┐
│ # │ Label (en) │ Value (en) │ ✕ │       │
│ # │ Label (fa) │ Value (fa) │ ✕ │       │
│ # │ Label (ps) │ Value (ps) │ ✕ │       │
└──────────────────────────────────────────┘
```

- A single shared specifications block (not per-language tab) — each row holds 6 inputs: `label_en, label_fa, label_ps, value_en, value_fa, value_ps`.
- Up/Down arrows to reorder rows, ✕ to delete, "+ Add row" at the bottom.
- Empty rows are stripped on save. Empty specifications save as `[]`.
- Helper text: *"Build a side-by-side spec table (e.g. Material, Weight, Warranty). Leave a language blank to fall back to English."*

### What changes (storefront)

`src/routes/products.$slug.tsx`:

- New section under the Description, above the existing "Sizes" pills, titled **"Specifications"** (translated).
- Renders as a real `<table>` (using existing `@/components/ui/table`) with two columns: **Label** | **Value**, picked in the active language with English fallback.
- Hidden when no specifications exist.
- Striped rows, RTL-aware.

### Database

New column on `products`:

```sql
ALTER TABLE public.products
  ADD COLUMN specifications jsonb NOT NULL DEFAULT '[]'::jsonb;
```

JSON shape:
```json
[
  { "label_en": "Material", "label_fa": "جنس", "label_ps": "توکی",
    "value_en": "Cotton",   "value_fa": "پنبه", "value_ps": "پنبه" }
]
```

No RLS change needed — inherits the existing `products` policies. Existing `attributes` (legacy sizes) is **untouched** to avoid breaking any product currently using it.

### i18n

Add three keys in `src/lib/i18n.ts`:
- `specifications` → "Specifications" / "مشخصات" / "ځانګړتیاوې"
- `spec_label` → "Label" / "عنوان" / "سرلیک"
- `spec_value` → "Value" / "مقدار" / "ارزښت"

### Files touched

- `supabase/migrations/<new>.sql` — add `specifications` column
- `src/routes/admin.products.tsx` — form state, UI block, save mapper, load mapper
- `src/routes/products.$slug.tsx` — render spec table
- `src/lib/i18n.ts` — 3 new keys

### Out of scope

- Description rich editor itself stays unchanged (no built-in table tool added).
- `attributes` / sizes / variants are not migrated or removed.
- No CSV import column added for specifications in this pass.

