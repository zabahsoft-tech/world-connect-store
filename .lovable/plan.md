
The user wants to enhance the admin dashboard with a proper shadcn sidebar and improve the products section (table + form). Currently the admin uses a custom hand-rolled aside, and products use a basic HTML table + dialog form.

## Plan: Enhance Admin Dashboard

### 1. Replace custom sidebar with shadcn Sidebar
In `src/routes/admin.tsx`:
- Use `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarHeader`, `SidebarFooter`, `SidebarTrigger`, `SidebarInset`
- Collapsible to icon mode (`collapsible="icon"`) so it stays usable when collapsed
- Top header bar with always-visible `SidebarTrigger`, page title, and sign-out
- Active route highlighting via TanStack Router `activeProps`
- Mobile responsive (sidebar becomes off-canvas drawer on small screens automatically)

### 2. Enhance Products section
In `src/routes/admin.products.tsx`:

**Table improvements** (use shadcn `Table` components):
- Replace raw `<table>` with `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`
- Add search input (filter by name across all 3 langs)
- Add category filter dropdown
- Add stock status filter (all / in stock / out of stock)
- Add featured filter
- Show category badge per row
- Show price formatted with currency
- Better empty state with icon + CTA
- Loading skeleton rows while fetching
- Confirm delete via `AlertDialog` instead of native `confirm()`

**Form improvements** (keep `Dialog`, restructure with `Tabs`):
- Tabs: "General" | "Translations" | "Media" | "Settings"
  - General: slug, price, category
  - Translations: 3 tabs/columns for EN/FA/PS (name + description)
  - Media: image URL + live preview
  - Settings: in_stock, featured switches
- Auto-generate slug from EN name if blank
- Better field labels and helper text
- Form validation feedback
- Loading state on save button

### 3. Dashboard page polish
In `src/routes/admin.index.tsx`:
- Keep stat cards but add subtle improvements (better spacing, trend hint, link to section)
- Add a "Recent orders" preview card (last 5 orders) below stats
- Add a "Low stock / out of stock" preview card

### Files to edit
- `src/routes/admin.tsx` — replace layout with shadcn Sidebar
- `src/routes/admin.products.tsx` — new Table + Tabs form + filters + AlertDialog
- `src/routes/admin.index.tsx` — add recent orders + out-of-stock cards

No DB schema changes, no new dependencies (shadcn sidebar, table, tabs, alert-dialog already exist in `src/components/ui/`).
