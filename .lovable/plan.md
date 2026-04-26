## Goal
Show the per-product **Specifications** (already editable in admin) on the public product detail page (`/products/:slug`), placed at the bottom — **below** the gallery/WhatsApp action area.

## Where it goes
In `src/routes/products.$slug.tsx`, after the existing two-column `<section>` (gallery + buy/WhatsApp panel) ends, add a new full-width `<section>` containing the Specifications table. So the order on the page becomes:

1. Gallery + title + price + qty + **Add to cart / Quick Order (WhatsApp)** (unchanged)
2. **Specifications** (new, full width below)

If a product has no specifications, the section is not rendered at all (no empty heading).

## Data
The product already has `p.specifications` (JSONB) as an array of `SpecRow` items with two kinds of entries:
- `type: "section"` → renders as a section heading row spanning the table
- `type: "row"` → renders as a normal `label | value | extras…` row, with optional `group_*` (left "category" cell that can span multiple consecutive rows when identical) and optional `value_header_*` + `extras[]` for multi-column value tables

Localization uses the same `pickLang` helper already in the file, with EN→FA→PS fallbacks (mirroring admin behavior) so legacy rows that only filled English still display.

## Implementation steps

1. **Add a small renderer component** (in the same file, kept local since it's product-page-specific) named `SpecificationsTable`:
   - Props: `specs: unknown` (raw `p.specifications`) and `lang: Lang`.
   - Normalize/parse: coerce to array, filter out fully-empty rows, and skip rendering entirely if nothing remains.
   - Build a table using existing `@/components/ui/table` primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
   - Column model:
     - If any row has a non-empty `group_*`, include a leading "Group" column that uses `rowSpan` to merge consecutive identical group cells (matching the visual grouping in admin).
     - Always: a "Label" column and a "Value" column.
     - If any row has `extras` with content, add additional columns; use the row's `value_header_*` / `extras[].header_*` for the `<TableHead>` labels (taking the first non-empty header found across rows).
   - Section rows (`type: "section"`) render as a single full-width `<TableRow>` with one `<TableCell colSpan={totalCols}>` styled as a heading (`bg-muted font-semibold`).
   - Direction: set `dir={lang === "en" ? "ltr" : "rtl"}` on the wrapping container so FA/PS render right-to-left like the description.

2. **Add an i18n heading** — already present: `tr("specifications")` exists in `src/lib/i18n.ts` (EN: "Specifications", FA: "مشخصات", PS: "ځانګړتیاوې"). Use it as the section title above the table.

3. **Wire it into `ProductPage`** in `src/routes/products.$slug.tsx`:
   - After the closing `</section>` of the existing grid, add:
     ```tsx
     <SpecificationsTable specs={p.specifications} lang={lang} />
     ```
   - Inside the component, render nothing if no usable rows; otherwise render a `<section className="container mx-auto px-4 pb-12">` with an `<h2>` using `tr("specifications")` and the table inside a rounded bordered card (`rounded-2xl border bg-card overflow-hidden`).

4. **Styling**:
   - Use existing Tailwind tokens only (`bg-muted`, `text-muted-foreground`, `border`, `rounded-2xl`) so it matches the rest of the site (no new CSS).
   - Make the table horizontally scrollable on small screens — `Table` already wraps in `overflow-auto`, so wide spec tables won't break mobile.
   - Vertical alignment `align-top` on cells so multi-line values look clean.

## Files to edit
- `src/routes/products.$slug.tsx` — add `SpecificationsTable` component + render it under the existing section.

## Files NOT changed
- No DB migration (column already exists).
- No admin changes (editor already works).
- `src/lib/i18n.ts` — `specifications` key already exists; no edit needed.

## Out of scope (ask if you want these too)
- Adding specifications to SEO JSON-LD (`additionalProperty`). I can wire that in if you want richer Google product results — say the word.
- Showing specifications inside the description tab/area instead of below it.
