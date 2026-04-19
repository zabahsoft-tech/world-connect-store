
## Plan: Branded Error Pages with SiteLayout

Currently error UI is plain divs, inconsistent across the app:
- Root 404 in `__root.tsx` — bare div, no header/footer
- Default error in `router.tsx` — bare div, no layout
- Per-route in `products.$slug.tsx` — uses SiteLayout but minimal styling

I'll create a shared, branded error UI and wire it everywhere via `SiteLayout`.

### 1. New `src/components/ErrorState.tsx`
A reusable branded component with three variants:
- `<NotFoundState />` — big "404", search-off icon, "Back to home" + "Browse shop" CTAs
- `<ErrorState error reset />` — alert-triangle icon, error message, "Try again" + "Go home" CTAs (uses `router.invalidate()` + `reset()`)
- `<ForbiddenState />` — for future 403 use (admin pages)

All use the primary color, soft gradient backdrop matching FullScreenLoader, store name from settings, i18n-aware copy.

### 2. New `src/routes/404.tsx` (catch-all)
Standalone route using `SiteLayout` + `<NotFoundState />` for users hitting unknown URLs in marketing context. Actually — TanStack uses `notFoundComponent`, not a route file. Skip this; handle via root.

### 2. Update `src/routes/__root.tsx`
Replace inline `NotFoundComponent` with one that wraps `<NotFoundState />` in `SiteLayout` (so header/footer/nav still show on 404 pages).

### 3. Update `src/router.tsx`
Replace inline `DefaultErrorComponent` with one wrapping `<ErrorState />` in `SiteLayout`. Keep dev-mode error message preview.

### 4. Update `src/routes/products.$slug.tsx`
Use the new shared components instead of bare divs inside SiteLayout.

### 5. Add per-route boundaries to data routes missing them
Routes with loaders/queries that should have proper boundaries:
- `src/routes/shop.tsx` — add `errorComponent`
- `src/routes/categories.tsx` — add `errorComponent`
- `src/routes/index.tsx` — add `errorComponent`

Each uses `SiteLayout` + `<ErrorState />`.

### 6. Admin error boundary
- `src/routes/admin.tsx` — add `errorComponent` that renders inside the admin shell (NOT SiteLayout) with a simple branded error card + retry.

### Layout sketch
```text
┌─────────── Header ──────────────┐
│                                 │
│      [icon in tinted circle]    │
│                                 │
│           404                   │
│      Page not found             │
│   The page you're looking       │
│   for doesn't exist.            │
│                                 │
│   [Go home] [Browse shop]       │
│                                 │
├─────────── Footer ──────────────┤
```

### Files
- New: `src/components/ErrorState.tsx`
- Edit: `src/routes/__root.tsx` — use `NotFoundState` in `SiteLayout`
- Edit: `src/router.tsx` — use `ErrorState` in `SiteLayout` for default error
- Edit: `src/routes/products.$slug.tsx` — use shared components
- Edit: `src/routes/shop.tsx`, `src/routes/categories.tsx`, `src/routes/index.tsx` — add `errorComponent`
- Edit: `src/routes/admin.tsx` — add admin-styled `errorComponent`

No DB changes, no new dependencies (uses lucide icons, shadcn Button, existing SiteLayout).
