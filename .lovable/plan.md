

## Make all product & category thumbnails have a white background

Switch the thumbnail background from the muted gray to solid white everywhere products and categories are displayed, so the `object-contain` images sit on a clean white tile in both light and dark mode.

### Changes

**`src/components/ProductCard.tsx`** — product card image wrapper
- Change `bg-muted` → `bg-white` on the `<Link>` thumbnail container.

**`src/routes/categories.tsx`** — categories listing page
- Change `bg-muted` → `bg-white` on the category tile image wrapper.

**`src/routes/index.tsx`** — homepage category tiles
- Change `bg-muted` → `bg-white` on the home category tiles container. (The dark gradient overlay for the label remains, so the white shows behind the image but the label stays readable.)

**`src/routes/products.$slug.tsx`** — product detail page main image + gallery thumbnails
- Switch the main product image container and gallery thumbnail tiles from `bg-muted` → `bg-white` so the product photo sits on white there too.

**`src/routes/shop.tsx`** — uses `ProductCard`, inherits the change automatically. No edit needed.

### Notes

- White is applied as a literal `bg-white` (not a token) so it stays white in dark mode too, matching the "product photo on white" convention used by most stores.
- No layout, padding, or `object-contain` changes — only the background color.
- No DB / i18n / dependency changes.

### Files touched

- `src/components/ProductCard.tsx`
- `src/routes/categories.tsx`
- `src/routes/index.tsx`
- `src/routes/products.$slug.tsx`

