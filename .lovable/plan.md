

## Plan: Multi-image gallery, video, and variations system

### 1. Database migration
Add to `products` table:
- `video_url text` — uploaded file URL OR external link (YouTube/Vimeo/mp4)
- `attributes jsonb default '[]'` — spec table rows: `[{ label_en, label_fa, label_ps, value_en, value_fa, value_ps }]`
- `variants jsonb default '[]'` — selectable variants: `[{ id, name_en, name_fa, name_ps, sku, price, in_stock, image_url }]`

`gallery jsonb` already exists — keep using it for images. `image_url` stays as the **thumbnail** (auto-set to first gallery image when admin saves).

### 2. Storage
Reuse existing `site-assets` bucket. New folders: `products/images/`, `products/videos/`. Bump `ImageUpload` to also support video — or add a sibling `MediaUpload` component that accepts both image and video MIME types with a 50MB cap for video.

### 3. Admin: `src/routes/admin.products.tsx`
Expand the dialog tabs to: **General | Translations | Media | Variations | Settings**.

**Media tab** (rebuilt):
- "Gallery images" — multi-upload list, drag-to-reorder, remove. The first item becomes the thumbnail automatically.
- Live thumbnail preview labeled "This is the thumbnail customers see in listings."
- "Product video" — toggle "Upload file" / "Paste URL". Upload uses `MediaUpload` (mp4/webm, max 50MB). URL field accepts YouTube, Vimeo, or direct mp4 links (basic regex validation).
- Drop the legacy single `image_url` input — it becomes derived from gallery[0].

**Variations tab** (new):
- **Specifications table** (admin-friendly editor): rows of (Label EN/FA/PS, Value EN/FA/PS) with Add row / Remove. Renders as a simple table on the public page.
- **Sellable variants** (below): rows of (Name EN/FA/PS, SKU, price override, in-stock switch, optional image picker from gallery). Add / Remove / Reorder. Empty list = product has no variants (current behavior).

### 4. Public: `src/routes/products.$slug.tsx`
- Gallery: keep existing thumbnail strip; add video as the **last gallery item** with a play icon overlay. Clicking it shows the player (HTML5 `<video>` for files / mp4, iframe for YouTube/Vimeo). Helper `getVideoEmbed(url)` parses provider.
- Below price + description: render **Specifications** table if `attributes.length > 0` (uses shadcn `Table`, RTL-aware).
- If `variants.length > 0`: render variant chips — selecting one updates displayed price (override or base) and disables Add-to-cart when that variant is out of stock. Selected variant info travels into cart item + WhatsApp message.

### 5. Cart + WhatsApp
- `CartContext`: extend cart item with optional `variantId`, `variantName_*`, effective `price`. Two of the same product with different variants stay as separate lines.
- `whatsapp.ts buildQuickOrderMessage`: append variant name when present.

### 6. ProductCard / listings
No change needed — they already use `image_url` (which now mirrors gallery[0]).

### Files
- New migration: add `video_url`, `attributes`, `variants` columns
- New: `src/components/MediaUpload.tsx` (image + video) and `src/components/GalleryUpload.tsx` (multi-image with reorder)
- Edit: `src/routes/admin.products.tsx` — Variations tab, rebuilt Media tab
- Edit: `src/routes/products.$slug.tsx` — video in gallery, spec table, variant picker
- Edit: `src/contexts/CartContext.tsx` — variant fields on cart items
- Edit: `src/lib/whatsapp.ts` — include variant in message
- Edit: `src/lib/i18n.ts` — translations for "Specifications", "Variant", "Select variant", "Watch video"

No new dependencies.

