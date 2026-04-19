

## Multilingual E-commerce (EN / FA / PS) — WhatsApp Orders

A modern red & white storefront with full trilingual content, RTL support for Persian/Pashto, an admin dashboard, and orders sent via WhatsApp.

### Design
- **Palette**: red primary (#DC2626), white background, dark gray text, soft red accents
- **Type**: Inter (EN) + Vazirmatn (FA/PS) for proper Arabic-script rendering
- **Style**: modern, generous whitespace, rounded cards, subtle shadows, smooth hover states
- **Layout direction**: auto-switches LTR ↔ RTL based on language

### Languages
- Language switcher in header (EN / فارسی / پښتو)
- Persisted in localStorage + URL
- All product/category data has `name_en`, `name_fa`, `name_ps`, `description_en`, `description_fa`, `description_ps` columns — UI picks the right column based on active language
- Static UI strings stored in a translation file

### Public pages (separate routes)
- **/** — Home: hero, featured products, category highlights, CTA
- **/shop** — All products with search, category filter, sort
- **/categories** — Browse all categories
- **/products/$slug** — Product detail with image gallery, price, description, quantity, "Add to cart" + "Quick order on WhatsApp"
- **/cart** — Cart items with quantity controls
- **/checkout** — Form (name, phone, address, notes) → saves order → opens WhatsApp with pre-filled message
- **/about** — About the store
- **/contact** — Contact info + form

### Cart & WhatsApp flow
- Cart stored in localStorage
- Two flows:
  - **Quick order**: per-product button → opens WhatsApp with that one item
  - **Full checkout**: cart + customer form → saves order to DB → opens WhatsApp with full itemized message including order ID
- WhatsApp number configurable in admin settings

### Admin dashboard (`/admin`, login-protected)
- Email/password login (Lovable Cloud)
- **Products**: list, create, edit, delete (all 3 language fields, price, image, category, stock toggle)
- **Categories**: CRUD with 3 language fields
- **Orders**: list with status (pending/contacted/completed/cancelled), customer details, items, total
- **Settings**: WhatsApp number, store name (3 langs), contact info
- Role-based access via separate `user_roles` table (secure pattern)

### Data (Lovable Cloud)
- `categories` — id, slug, name_en/fa/ps, image, sort_order
- `products` — id, slug, name_en/fa/ps, description_en/fa/ps, price, image_url, gallery, category_id, in_stock, featured
- `orders` — id, customer_name, phone, address, notes, items (jsonb), total, status, language, created_at
- `settings` — singleton row for WhatsApp number, store info
- `user_roles` — admin role assignments
- RLS: public read for products/categories/settings; admin-only writes; orders insertable by anyone, readable only by admins

### Key behaviors
- RTL layout automatically applied for FA/PS (mirrored nav, alignment, icons)
- All form inputs validated with zod
- Toast notifications for cart/order actions
- Mobile-responsive throughout
- SEO meta per route in 3 languages

### First admin
After implementation you'll sign up with your email at `/admin/login`, then I'll grant you the admin role via a quick DB insert.

