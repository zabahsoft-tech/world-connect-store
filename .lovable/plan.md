
The user wants the website's main navigation bar (Header) to be red. Looking at `src/components/Header.tsx`, the header uses `bg-background/95` with a `backdrop-blur`. I'll switch it to a red background with appropriate contrast for text/icons.

I'll use the existing `--primary` token (already a red — `oklch(0.58 0.22 27)`) so it stays on-brand and dark-mode safe, rather than hardcoding `bg-red-600`.

## Plan: Red navigation bar

### 1. Header background — `src/components/Header.tsx`
- Change root `<header>` from `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80` to `bg-primary text-primary-foreground` (solid red, white text).
- Remove `border-b` (or change to `border-primary/30`) since a colored bar reads cleaner without a hairline border.

### 2. Contrast adjustments
- **Store name**: inherits `text-primary-foreground` (white) — no change needed.
- **Logo fallback square**: switch from `bg-primary text-primary-foreground` to `bg-white/15 text-primary-foreground` so it doesn't disappear into the red background.
- **Desktop nav links**: change `text-muted-foreground hover:bg-accent hover:text-accent-foreground` → `text-primary-foreground/80 hover:bg-white/15 hover:text-primary-foreground`. Active state: `bg-white/20 text-primary-foreground`.
- **Icon buttons** (cart, menu, avatar trigger, login): add `hover:bg-white/15 hover:text-primary-foreground` so the default ghost hover (which uses `accent`) reads well on red.
- **Cart badge**: switch from default (primary on primary = invisible) to `bg-white text-primary` for high contrast.
- **Avatar fallback**: change from `bg-primary text-primary-foreground` to `bg-white/20 text-primary-foreground`.

### 3. Mobile menu panel
- The dropdown panel below the header (`border-t bg-background`) stays neutral so menu items remain readable — only the top bar itself turns red. Links inside use the existing muted styling.
- Update the mobile menu toggle icon hover to match the white-on-red treatment.

### 4. RTL & dark mode
- All changes use semantic tokens (`primary`, `primary-foreground`) which already have dark-mode variants defined in `styles.css` — no extra dark overrides needed.
- No directional classes change.

### Files touched
- Edit only: `src/components/Header.tsx`

No new dependencies, no DB changes, no i18n changes.
