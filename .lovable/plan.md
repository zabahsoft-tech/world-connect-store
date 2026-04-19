

## Plan: Modernize homepage with card-style hero slider

Refresh the homepage with a cleaner, more modern look. The hero slider becomes a **rounded "big card"** floating with breathing space on the sides (not edge-to-edge). Sections get tighter rhythm, softer surfaces, and more polished hover/transition states.

### 1. Hero slider — card-style
Edit `src/routes/index.tsx`:
- Wrap the slider in a `container` with side padding so it floats inside the page instead of going full-bleed.
- Apply `rounded-3xl`, `overflow-hidden`, `shadow-[var(--shadow-card)]`, and a subtle border so it reads as a single elevated card.
- Reduce height to `h-[60vh] min-h-[440px] md:h-[70vh] max-h-[640px]` for a more balanced canvas.
- Move arrows inside the card with smaller, frosted pill buttons (`h-10 w-10`, `bg-background/80 backdrop-blur-md`).
- Dots: pill-style indicator group inside a frosted bar at the bottom-center.
- Text: tighten the gradient to `from-black/60 via-black/20 to-transparent` for a softer wash; cap headline at `text-5xl lg:text-6xl` for a more refined scale.
- Add a top spacing (`pt-6 md:pt-8`) so the card has air above it.

### 2. Features strip — refined cards
- Switch to a centered icon-on-top layout with `rounded-2xl border bg-card/50 backdrop-blur` and a hover lift (`hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] transition-all`).
- Add a short description line under each feature label (in 3 languages).
- Use a subtle 1px border + slightly larger icon tile.

### 3. Categories — modern tiles
- Replace bordered boxes with image-first tiles: square image with `rounded-2xl` and an overlay gradient + name on the bottom-left of the image (no separate label box).
- Hover: image zoom + ring-2 ring-primary/30 transition.
- Keep the 6-column desktop grid; gap upgraded to `gap-5`.

### 4. Featured products — section polish
- Section header: small uppercase eyebrow ("Hand-picked") above the H2 for a more editorial feel.
- Wrap "View all" in a pill button (`variant="ghost"` with arrow icon) instead of a plain text link.
- Increase spacing: `py-16 md:py-20` between sections.

### 5. Add a soft section divider
- Subtle `bg-muted/40` band wrapping the Categories section to create visual rhythm between Hero → Features → Categories → Featured.

### 6. i18n — small additions
Add to `src/lib/i18n.ts`:
- `easyOrderingDesc`, `fastDeliveryDesc`, `whatsappSupportDesc` — the new feature subtitles in en/fa/ps.
- `handPicked` — eyebrow label for the featured section.

### Files touched
- Edit: `src/routes/index.tsx` (entire homepage layout refresh)
- Edit: `src/lib/i18n.ts` (4 new keys × 3 languages)

No new dependencies, no DB changes, no new components.

