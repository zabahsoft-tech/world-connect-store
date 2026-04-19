
## Plan: SPA Mode + Branded Page-Transition Loader + Speed Optimizations

The site is currently SSR (TanStack Start with Cloudflare Worker). User wants pure SPA + page-transition loader on inner navigation + max performance.

### 1. Disable SSR (make it a SPA)
TanStack Start supports SPA mode via `defineConfig({ spa: { enabled: true } })`. This:
- Pre-renders only the shell on the server
- Hydrates all routes client-side
- Eliminates server round-trips for navigation
- Keeps SEO via the pre-rendered shell + meta tags already in place

Edit `vite.config.ts`:
```ts
export default defineConfig({ spa: { enabled: true, prerender: { outputPath: "/" } } });
```

### 2. Page-transition loader (top progress bar + branded overlay)
Use the router's built-in `useRouterState({ select: s => s.isLoading })` to detect in-flight navigation. Add a new component `RouteTransition` mounted in `__root.tsx` that:
- Shows a slim top progress bar (primary color, animated) for any navigation
- Falls back to the existing `FullScreenLoader` if navigation takes >500ms (slow data)
- Auto-hides instantly when navigation resolves

This avoids ugly "blank flashes" and gives a native-app feel.

### 3. Default `pendingComponent` for routes with loaders
Add per-route `pendingComponent` (using the inline `Loader`) to data routes:
- `shop.tsx`, `categories.tsx`, `index.tsx`, `products.$slug.tsx`, `about.tsx`, `contact.tsx`
Threshold via `defaultPendingMs: 200` and `defaultPendingMinMs: 300` in router config so quick loads never flash a spinner.

### 4. Speed optimizations
- **Aggressive preloading**: set `defaultPreload: "intent"` and bump `defaultPreloadStaleTime` to 60s in `router.tsx` so hovered links pre-fetch route chunks + data.
- **Query cache tuning**: bump `staleTime` in root QueryClient from 30s → 5min for marketing data (settings, categories, slides rarely change).
- **Code splitting**: TanStack auto-splits already; ensure no route component is `export`ed (quick audit, fix any).
- **Font loading**: add `&display=swap` (already present) + preload Inter 400/600 woff2 to kill the FOUT. Drop Vazirmatn weights we don't use (keep 400/600/700 only).
- **Image hints**: add `loading="lazy"` + `decoding="async"` to non-hero images in `ProductCard`, `categories`, `shop` grids; `fetchpriority="high"` on the hero/first slide image.
- **Prefetch DNS** for Supabase + R2 image CDN in root `<head>` (`dns-prefetch` + `preconnect`).
- **Defer non-critical providers**: keep providers as-is (already lightweight) but memoize Toaster.
- **Remove unused work**: drop the JSON-LD scripts from leaf routes that duplicate root, keep only product-specific JSON-LD.

### 5. SPA fallback
Lovable hosting auto-falls-back to `index.html` for unknown paths, so SPA mode works without extra config.

### Files
- Edit `vite.config.ts` — enable SPA mode
- Edit `src/router.tsx` — `defaultPreload: "intent"`, `defaultPreloadStaleTime: 60_000`, `defaultPendingMs`, `defaultPendingComponent`
- New `src/components/RouteTransition.tsx` — top progress bar + delayed full-screen loader
- Edit `src/routes/__root.tsx` — mount `<RouteTransition />`, bump QueryClient staleTime, add Supabase/R2 preconnect, slim font weights, preload hero font
- Edit `src/routes/shop.tsx`, `categories.tsx`, `products.$slug.tsx`, `index.tsx` — add `pendingComponent`, lazy-load images, `fetchpriority` on hero
- Edit `src/components/ProductCard.tsx` — `loading="lazy"`, `decoding="async"`

No DB changes, no new dependencies.
