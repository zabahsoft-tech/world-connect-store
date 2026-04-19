

## Plan: Compact, responsive Contact page

Tighten the Contact page into a focused two-column layout on desktop (form + info side-by-side) that stacks cleanly on mobile. Reduce vertical bulk, smaller cards, better hierarchy.

### 1. Layout restructure — `src/routes/contact.tsx`
- Widen container from `max-w-2xl` to `max-w-5xl` so two columns fit comfortably.
- Use a `grid lg:grid-cols-5 gap-6` split:
  - **Left (lg:col-span-3)**: the message form card
  - **Right (lg:col-span-2)**: stacked compact info tiles + socials
- Page header tightened: `py-8 md:py-12`, smaller h1 (`text-3xl md:text-4xl`), short subtitle line under it.

### 2. Form card — slimmer
- Reduce padding (`p-5 md:p-6`) and spacing (`space-y-3` instead of `space-y-4`).
- Keep Name full-width; Phone + Email already in 2-col grid (good).
- Textarea rows reduced to `4`.
- Submit button: keep full-width on mobile, auto-width on desktop (`sm:w-auto sm:px-8`).

### 3. Contact info — compact tiles
- Replace large `p-5` rounded cards with smaller tiles (`p-3.5`, `gap-3`, icon box `h-9 w-9`, `rounded-lg`).
- Group WhatsApp/Phone/Email/Address/Hours into a single `space-y-2` stack inside one bordered container — gives a cleaner "info panel" look instead of 5 separate floating cards.
- Labels shrunk to `text-[11px] uppercase tracking-wide`.

### 4. Map — smaller and integrated
- Reduce iframe height from `360px` to `220px md:280px`.
- Place the map directly under the info panel on the right column (desktop), or after the form on mobile.

### 5. Socials + WhatsApp CTA
- Move social icons into a compact row inside the right column (under the map).
- Remove the redundant bottom "Send WhatsApp" button (the WhatsApp tile at the top of the info panel already covers this) — keeps the page focused.

### 6. Mobile specifics
- Single column stack order: header → form → info panel → map → socials.
- Ensure all touch targets stay ≥40px tall.
- Form card gets `mx-0` (no extra side margin) since container already pads.

### Files touched
- Edit: `src/routes/contact.tsx` (layout + sizing only — no logic, no schema, no i18n changes)

No new dependencies, no DB changes, no new keys.

