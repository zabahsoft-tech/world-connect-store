

## Enhance the Specifications editor — spreadsheet-style with section rows

Make the Specifications field much faster to fill in by switching from the current "stacked card per row" layout into a **compact spreadsheet-style grid**, and add support for **section header rows** ("main row") and an optional **group column** ("main col") so admins can build richer spec sheets like:

```
┌─ DIMENSIONS ────────────────────────────┐  ← section row (full width)
│ Group   │ Label      │ Value             │
│ Body    │ Width      │ 80 cm             │
│ Body    │ Height     │ 120 cm            │
├─ POWER ─────────────────────────────────┤  ← section row
│ Input   │ Voltage    │ 220V              │
│ Input   │ Frequency  │ 50Hz              │
└─────────────────────────────────────────┘
```

### What changes (admin — `src/routes/admin.products.tsx`)

**New row kinds** (stored in the same `specifications` JSON, with a `type` field):

```ts
type SpecRowKind = "section" | "row";

interface SpecRow {
  type: "row";              // default — backward compatible if missing
  group_en, group_fa, group_ps: string;   // NEW optional "main column"
  label_en, label_fa, label_ps: string;
  value_en, value_fa, value_ps: string;
}
interface SpecSection {
  type: "section";          // full-width header band
  title_en, title_fa, title_ps: string;
}
```

Backward compatible — existing rows without `type` are treated as `"row"` and existing data keeps working.

**New editor UI** (replaces the current stacked cards):

- A single **table grid** with one visible row per spec, columns: `↕ | Group | Label | Value | ⋯`
- Language selector pills at the top of the block: **EN / FA / PS** — the grid shows the columns for the active language only (much less visual noise than the current 6-input-per-row layout). Switch language to edit other locales; data is preserved.
- A small "Show all languages" toggle expands a row to reveal all 3 language inputs side-by-side (for fine-tuning).
- Toolbar buttons: **+ Add row**, **+ Add section**, **+ Duplicate selected**, **Clear group column** (if no row uses Group, it auto-collapses).
- **Drag handle (↕)** on the left for reordering (uses native HTML5 drag-and-drop, no new deps). Up/Down arrow buttons remain as a fallback in the row's `⋯` menu.
- **Section rows** render as a single full-width input with a tinted background — visually obvious they're headers.
- **Group column auto-fill**: typing the same group name in 2+ rows shows a small "Apply to rows below until next section" shortcut.
- **Keyboard**: Tab moves to next cell, Enter adds a new row below, Shift+Enter inserts a section above current row.
- Empty rows/sections are stripped on save.

**Helper text** updated:
> *Build a spec sheet. Use **sections** to group rows (e.g. "Dimensions", "Power"). The optional **Group** column lets you label sub-categories within a section. Switch the EN/FA/PS pills to translate.*

### What changes (storefront — `src/routes/products.$slug.tsx`)

- Section rows render as a full-width `<TableRow>` with a single bolded `<TableCell colSpan>` and a muted background band.
- If ANY row uses the Group column, the table renders **3 columns**: Group | Label | Value (with vertical group cells merged via `rowSpan` for consecutive identical groups). If no row uses Group, falls back to the existing 2-column Label | Value layout.
- RTL preserved; English fallback preserved.
- Striped rows skip section bands.

### Database

**No schema change.** All new fields live inside the existing `specifications jsonb` column. A short migration comment is added describing the supported shape, but no DDL.

### i18n (`src/lib/i18n.ts`)

Add keys:
- `spec_section` → "Section" / "بخش" / "برخه"
- `spec_group` → "Group" / "گروه" / "ډله"
- `spec_add_row` → "Add row"
- `spec_add_section` → "Add section"
- `spec_show_all_langs` → "Show all languages"

### Files touched

- `src/routes/admin.products.tsx` — replace the specifications block with the new grid editor; update load/save mappers to handle `type`, `group_*`, and `title_*` fields; strip empties.
- `src/routes/products.$slug.tsx` — render sections as banded rows and conditionally render the Group column with `rowSpan` merging.
- `src/lib/i18n.ts` — 5 new keys.

### Out of scope

- No DB migration, no breaking change to existing specifications.
- No CSV import for specs.
- No nested sections (one level only).
- No per-row icons or images.

