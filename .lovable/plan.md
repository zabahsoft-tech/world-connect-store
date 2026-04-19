
## Plan: Enhanced Footer with developer credit

Refresh the footer with better visual hierarchy, a newsletter/CTA accent, and a "Developed by zabashoft.com" credit in the bottom bar.

### 1. Visual refresh — `src/components/Footer.tsx`

**Top decorative band**
- Add a subtle top border accent: a thin gradient line (`bg-gradient-to-r from-transparent via-primary/40 to-transparent`) above the footer.
- Switch background to a slightly richer surface: `bg-gradient-to-b from-muted/30 to-muted/60`.

**Brand column (col 1)**
- Slightly larger logo (h-10 w-10), bolder store name.
- Tagline kept but trimmed to 2 lines max with `line-clamp-2`.
- Social icons get a hover lift: `hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground` with smooth transition.

**Link columns (Shop / About)**
- Section heading with a small accent dot (`•` in primary color) before the title.
- Links get a subtle left-arrow reveal on hover (`group` + translating chevron) for polish — kept minimal.

**Contact column**
- Icons next to each contact item (Mail, Phone, MapPin, Clock from lucide-react) for scanability.
- Email and phone become proper `mailto:` / `tel:` links.

**New: trust strip (above bottom bar)**
- Small horizontal row showing 3 quick value props using existing i18n keys: `easyOrdering`, `fastDelivery`, `whatsappSupport` with their lucide icons. Compact, single-line on desktop, wraps on mobile. Reinforces brand without adding new strings.

**Bottom bar — credit line**
- Two-row layout on mobile, single row on desktop:
  - Left: `© {year} {storeName}. All rights reserved.`
  - Right: `Developed by <a href="https://zabashoft.com" target="_blank" rel="noopener noreferrer">zabashoft.com</a>` — link styled with `font-semibold text-primary hover:underline`.
- Use `flex flex-col md:flex-row md:justify-between` with `gap-2`.

### 2. Mobile responsiveness
- Grid stays `grid-cols-2 md:grid-cols-4`; on mobile the brand column spans both (`col-span-2 md:col-span-1`).
- Trust strip wraps to 2 columns on mobile.
- Bottom bar stacks vertically with center alignment on mobile.

### 3. RTL safety
- All directional spacing uses `start-*` / `end-*` (already the project convention).
- Social icon row uses `gap-2` (direction-agnostic).
- Bottom-bar order doesn't depend on visual side — handled by flex.

### Files touched
- Edit only: `src/components/Footer.tsx`

No new dependencies, no DB changes, no i18n additions (reuses existing keys).
