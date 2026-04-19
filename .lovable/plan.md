
The user wants a working product search input in the navbar (replacing/augmenting the current Search icon that just links to /shop). It should work in all 3 languages (en/fa/ps) — the existing `tr("search")` placeholder already provides translations, and `/shop` already supports search via `?q=` query param + multi-lang ILIKE on `name_en/fa/ps`.

## Plan: Navbar product search

### 1. New component — `src/components/NavSearch.tsx`
- Controlled input with `tr("search")` placeholder, leading `Search` icon.
- On submit (Enter or icon click): `navigate({ to: "/shop", search: { q } })` — reuses existing shop filtering.
- Live suggestions dropdown:
  - Debounced 250ms query against `products` table: `select id, slug, name_en, name_fa, name_ps, image_url, price` with `.or(name_en.ilike.%q%,name_fa.ilike.%q%,name_ps.ilike.%q%)` limit 6.
  - Cached via TanStack Query, key `["nav-search", q]`, `enabled: q.length >= 2`.
  - Each result shows thumbnail + localized name (via `pickLang`) + price; click → `/products/$slug`.
  - Footer row "View all results for «q»" → `/shop?q=...`.
- Close on: outside click, Escape, route change, selecting a result.
- Keyboard: ArrowUp/Down to move highlight, Enter to open highlighted (or submit to /shop if none).
- White-on-red styling to match red navbar: `bg-white/15 text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-white focus:text-foreground` so it looks integrated when blurred and becomes a normal white field when focused. Dropdown panel uses `bg-popover text-popover-foreground` (neutral) for readability.
- RTL safe: icon uses `start-3` positioning, padding uses `ps-9`.

### 2. Integrate into Header — `src/components/Header.tsx`
- **Desktop**: Replace the standalone `Search` icon link with `<NavSearch />`. Place it between the desktop nav and the cart/user icons. Width: `w-56 lg:w-72`. Shown `hidden md:block`.
- **Mobile**: Add a second compact row inside the existing mobile dropdown menu (the `{open && ...}` panel) with `<NavSearch />` full width at the top, so mobile users can search after tapping the menu icon. Also keep a small Search icon button on mobile that focuses opens the menu (existing menu button is fine — search appears inside).

### 3. No DB / i18n changes
- `tr("search")` key already exists (used in /shop and current icon aria-label).
- Products table is publicly readable (RLS allows `Public can read products`) — no policy changes.
- No new dependencies (uses existing lucide icons, TanStack Query, supabase client).

### Files touched
- New: `src/components/NavSearch.tsx`
- Edit: `src/components/Header.tsx`
