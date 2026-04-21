

## Enhance Contact Page Layout & Map Wireframe

Polish the `/contact` page into a more premium, visually balanced layout, and upgrade the map wireframe placeholder so it looks intentional rather than empty.

### What changes (visual)

**Page header**
- Add a soft gradient hero band behind the title (using existing `--primary-soft` token), with an icon chip, breadcrumb-style eyebrow ("Get in touch"), larger title, and a one-line description.
- Center the header on mobile, left-align on desktop.

**Layout grid**
- Keep the 5-column grid on `lg`, but tighten spacing and align card heights.
- On mobile, info tiles appear FIRST (so phone/WhatsApp are tappable immediately), form second, map third. On desktop, form left / info+map right (current order).

**Contact form card**
- Add a subtle top border accent (2px primary gradient) and a small "We reply within X hours" helper above the submit button (uses `business_hours` if set, else generic copy).
- Inputs get slightly larger touch targets (h-11) and focus rings using `--ring`.
- Submit button becomes full-width on mobile, auto on desktop, with an arrow icon shift on hover.

**Info tiles**
- Convert the single stacked list into a 2-column grid of "info chips" on `sm+` (WhatsApp, Phone, Email, Address, Hours each in its own rounded card).
- Each tile: icon chip top-left, label, value, and a tiny chevron on hover for actionable ones (tel/mailto/wa.me).
- Address & Hours tiles span 2 columns (longer text).

**Map wireframe (the highlight)**
Upgrade the current grid placeholder into a more "map-like" mock:
- Same grid background, but add 2–3 faint curved "road" SVG paths in muted foreground.
- A larger central pin with a pulsing ring animation (CSS `@keyframes` already supported via Tailwind `animate-ping`).
- Floating mini-card overlay in the bottom-left showing the business name (from `settings.site_name`) + address (from `settings.address`) + a "Get directions" button that opens `https://www.google.com/maps/search/?api=1&query=<encoded address>` in a new tab.
- Top-right corner badge: "Preview" so it's clear this is a placeholder when no embed URL is set.
- When a real embed URL IS set, keep the current iframe but wrap it in the same rounded border + add a "Get directions" floating button overlay (bottom-right) using the address.

**Socials card**
- Title becomes "Follow us" with a small icon, social buttons get a subtle hover lift (`hover:-translate-y-0.5`) and brand-tinted hover backgrounds.

**Empty/loading states**
- While `settings` query loads, show skeleton placeholders for info tiles and map (uses existing `Skeleton` component).

### Technical notes

- File touched: `src/routes/contact.tsx` only.
- No new dependencies. All styling via existing Tailwind tokens (`primary`, `primary-soft`, `muted`, `border`, `ring`, `--shadow-soft`).
- The "Get directions" link is built as: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}` — only rendered when `s.address` exists.
- The decorative SVG roads are inline, ~30 lines, no external asset.
- Pulse ring uses Tailwind `animate-ping` on an absolute-positioned sibling of the pin dot.
- RTL is preserved — no hard-coded `left/right`, uses logical spacing classes already in use elsewhere.
- Mobile order swap done with `order-1 / order-2` utility classes on the grid children.

### Out of scope

- No schema changes, no new settings fields.
- No actual Google Maps API integration (still iframe embed when URL is configured).
- No changes to the form submission logic or validation.

