

## Add multiple value columns to Specifications

Currently each row has one Label + one Value. The user wants multiple columns per row — i.e. true table-like behavior where you can compare several attributes side-by-side, e.g.:

```
┌────────── DIMENSIONS ──────────────────────────────┐
│ Group │ Label   │ Small  │ Medium │ Large │ XL    │
│ Body  │ Width   │ 60 cm  │ 80 cm  │ 100   │ 120   │
│ Body  │ Height  │ 90 cm  │ 120 cm │ 150   │ 180   │
└────────────────────────────────────────────────────┘
```

### Data model (backward compatible)

The `specifications` JSON keeps `type`, `group_*`, `label_*`, `value_*` exactly as today — but each row gains an optional `extras` array of additional value cells:

```ts
interface SpecValueExtra {
  // header for this column (shown above the column)
  header_en?: string; header_fa?: string; header_ps?: string;
  // value for this row in this column
  value_en?: string; value_fa?: string; value_ps?: string;
}

interface SpecRow {
  type?: "row" | "section";
  title_en?, title_fa?, title_ps?: string;   // section
  group_en?, group_fa?, group_ps?: string;   // optional Group col
  label_en, label_fa, label_ps: string;      // Label col
  value_en, value_fa, value_ps: string;      // first Value col
  extras?: SpecValueExtra[];                 // NEW — extra Value cols
}
```

The first value column has no header by default (column header is implicit "Value"). When extras are present, both the first and extra value columns get a header input. Old data with no `extras` continues to render as the existing 2-column layout.

### Admin (`src/routes/admin.products.tsx`)

- New toolbar button: **+ Add column** — appends an empty extra to every existing `row` (and seeds new rows with the same shape).
- New toolbar button: **Remove last column** — shown only when extras > 0.
- Above the data rows, a **column-header row** appears whenever extras > 0 with editable headers for the first Value column and each extra. Headers use the same EN/FA/PS pill + "All langs" toggle.
- Each data row renders one input per column (Group | Label | Value | Extra1 | Extra2 …).
- Section rows still span all data columns.
- Drag/reorder/duplicate/delete unchanged.
- "Add column" is disabled if there are zero rows (asks user to add a row first).
- Empty trailing columns are stripped on save (a column is dropped only if it's empty across every row AND its header is empty).

### Storefront (`src/routes/products.$slug.tsx`)

- If any row has `extras`, render the spec table with `(hasGroup ? 1 : 0) + 1 (label) + 1 (value) + extras.length` columns, plus a `<TableHeader>` row showing column headers (Label / Value / extra headers, in active language with EN fallback). Group column header stays empty.
- Without extras → unchanged 2-col (or 3-col with Group) layout, no `<TableHeader>` (matches today).
- Section rows use `colSpan` over all data columns.
- Group `rowSpan` merging continues to work.

### i18n (`src/lib/i18n.ts`)

Add:
- `spec_add_column` → "Add column" / "افزودن ستون" / "ستن زیات کړئ"
- `spec_remove_column` → "Remove last column" / "حذف ستون آخر" / "وروستی ستن لرې کړئ"
- `spec_column` → "Column" / "ستون" / "ستن"

### Files touched

- `src/routes/admin.products.tsx` — extend `SpecRow` with `extras`, add column toolbar, add column-header row, render extras inputs, add column add/remove helpers, update save/load mappers to clean & preserve extras.
- `src/routes/products.$slug.tsx` — extend `SpecRow` type with `extras`, render extra columns + header row when present.
- `src/lib/i18n.ts` — 3 new keys.

### Out of scope

- No per-column drag reordering of extras (add to end / remove last only).
- No CSV import for specs.
- No nested sections.

