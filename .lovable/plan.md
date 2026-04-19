
The current admin dashboard (`src/routes/admin.index.tsx`) has basic stat cards and two preview lists (recent orders, out of stock). I'll enhance it visually and informationally without restructuring the sidebar (which is already solid).

## Plan: Polish Admin Dashboard

### 1. Hero greeting strip
Replace the plain "Overview" heading with a richer header:
- Time-based greeting ("Good morning/afternoon/evening, {email}")
- Today's date
- Quick action buttons on the right: "New product", "View orders"

### 2. Upgraded stat cards
Make the 4 stat cards more informative:
- Add a colored icon tile (rounded square w/ tinted bg) instead of bare icon
- Show a sub-metric below the number (e.g. Orders → "X this week", Products → "X featured", Categories → "X with products", Pending → "needs attention" warning tint)
- Subtle gradient/border accent per card
- Skeleton loaders while data loads

### 3. New row: Revenue + Orders chart
Add a 7-day revenue trend using shadcn `Chart` (Recharts):
- Query orders from last 7 days, group by day, sum totals
- Area chart with primary color
- Show total revenue + order count for the period in the card header

### 4. Reorganize preview cards
Keep Recent Orders and Out of Stock but improve them:
- Recent orders: add order # (short id), better status colors, hover row, click to navigate
- Out of stock: show price, "Mark in stock" quick action button
- Add a third card: "Top categories" (count of products per category, top 5)

### 5. Layout grid
```text
┌─────────────────────────────────────────────┐
│  Greeting + quick actions                   │
├──────┬──────┬──────┬──────────────────────┬─┤
│ Stat │ Stat │ Stat │ Stat                 │ │
├──────┴──────┴──────┴──────────────────────┴─┤
│  Revenue chart (7 days) — full width        │
├──────────────────┬──────────────────────────┤
│  Recent orders   │  Out of stock            │
├──────────────────┴──────────────────────────┤
│  Top categories                             │
└─────────────────────────────────────────────┘
```

### Files
- Edit: `src/routes/admin.index.tsx` — full rewrite of the dashboard component
- Uses existing shadcn components: `Card`, `Badge`, `Button`, `Skeleton`, `Chart` (recharts already installed)

No DB schema changes, no new dependencies, no sidebar changes.
