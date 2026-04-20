
## Plan: Replace product Specifications with a simple Sizes textarea

### What changes

**Admin (`src/routes/admin.products.tsx`)**
- Rename the "Specifications table" block to **"Sizes"** inside the Variations tab.
- Replace the 6-input-per-row UI with a **single `Textarea`** — one size per line.
- Per-line format: `English | فارسی | پښتو` (the `|` separator is optional — if a line has no `|`, the same value is used for all 3 languages).
- Add a short helper hint above the textarea showing the format and an example:
  ```
  Small | کوچک | کوچنی
  Medium | متوسط | منځنی
  Large | بزرگ | لوی
  ```
- On open: convert existing `attributes` rows → textarea lines using `value_en | value_fa | value_ps` (falling back across languages when one is empty). This auto-migrates legacy specs.
- On save: parse the textarea back into the existing `attributes` JSONB shape so we don't need a DB migration. Each non-empty line becomes:
  ```
  { label_en: "Size", label_fa: "اندازه", label_ps: "اندازه",
    value_en: "...", value_fa: "...", value_ps: "..." }
  ```

**Product page (`src/routes/products.$slug.tsx`)**
- Replace the Specifications `<Table>` (label/value rows) with a clean **chip/pill list of sizes** under a heading translated as "Sizes".
- Reads from the same `attributes` JSONB — picks `value_<lang>` per line.
- If a line has only one language filled in, falls back to whichever is non-empty (matches `pickLang` behaviour).

**i18n (`src/lib/i18n.ts`)**
- Add new key `sizes`: `{ en: "Sizes", fa: "اندازه‌ها", ps: "اندازې" }`.
- Keep `specifications` key (still used elsewhere if needed; harmless).

### What does NOT change
- **Database**: no schema change. We reuse the existing `attributes` JSONB column — every line is stored as one row with `label_*` set to "Size" / "اندازه" / "اندازه".
- **Variants** (sellable size options with price/stock) stay exactly as they are — this change only touches the display-only specs block.
- No new dependencies, no RLS changes.

### Edge cases handled
- Blank lines in the textarea → ignored.
- Line with no `|` → same text used for all 3 languages.
- Line with 1 or 2 segments → missing langs left blank, page falls back to whichever is filled.
- Existing products with multi-attribute specs (e.g. Material, Color) → all values merged into the sizes list on first edit; admin can prune. (User chose auto-migrate.)

### Files touched
- Edit: `src/routes/admin.products.tsx` (replace Specifications block + add parse/serialize helpers)
- Edit: `src/routes/products.$slug.tsx` (replace spec table with sizes chips)
- Edit: `src/lib/i18n.ts` (add `sizes` key)
