
The user wants an enhanced site settings area where the admin can manage all website-wide data (contact details, social links, branding, footer content) plus a separate user management section for granting/revoking admin access.

## Plan: Enhanced Settings + User Management

### 1. Extend `settings` table (migration)
Add columns for contact + branding + social + footer:
- `phone`, `whatsapp_number_2`, `business_hours`
- `facebook_url`, `instagram_url`, `twitter_url`, `youtube_url`, `telegram_url`
- `logo_url`, `favicon_url`, `primary_color`
- `footer_text_en/fa/ps`
- `meta_description_en/fa/ps`

### 2. Rebuild `src/routes/admin.settings.tsx` with tabs
Restructure the flat form into a tabbed interface:
- **General** — store names (EN/FA/PS), logo URL + preview, favicon
- **Contact** — WhatsApp (primary + secondary), phone, email, address, business hours
- **Social** — Facebook, Instagram, Twitter, YouTube, Telegram URLs
- **About** — about text in 3 languages
- **Footer & SEO** — footer text per language, meta description per language

Single Save button persists all tabs. Loading skeleton + toast feedback.

### 3. New User Management page (`src/routes/admin.users.tsx`)
A new admin section to view all signed-up users and manage admin roles. Since we can't query `auth.users` from the client, we'll need a server function with the admin client.

- Server function `listUsers` (uses `supabaseAdmin.auth.admin.listUsers()`) + protected by `requireSupabaseAuth` + admin role check
- Server function `setAdminRole({ userId, isAdmin })` to insert/delete row in `user_roles`
- UI: table of users (email, signup date, admin badge, toggle switch to grant/revoke admin)
- AlertDialog confirmation when revoking your own admin role
- Search by email

### 4. Wire updates into the site
- **Footer.tsx** — read settings (logo, store name, social links, footer text) and render dynamically; replace hardcoded "Store" + "S" badge
- **Contact page** — display new fields (phone, secondary WhatsApp, business hours, social links)
- **Header.tsx** — use store name + logo from settings (light touch)

### 5. Sidebar nav (`src/routes/admin.tsx`)
Add "Users" entry with `Users` icon between Orders and Settings.

### Files
- New migration: extend `settings` table with new columns
- Edit: `src/routes/admin.settings.tsx` — tabbed UI with all new fields
- New: `src/routes/admin.users.tsx` — user list + admin toggle
- New: server functions for user listing/role management (uses existing `supabaseAdmin` + `requireSupabaseAuth`)
- Edit: `src/routes/admin.tsx` — add Users nav entry
- Edit: `src/components/Footer.tsx` — render from settings
- Edit: `src/routes/contact.tsx` — show new contact fields + socials
- Edit: `src/components/Header.tsx` — show store name/logo from settings

No new dependencies — reuses existing shadcn Tabs, Table, Switch, AlertDialog, Dialog.
