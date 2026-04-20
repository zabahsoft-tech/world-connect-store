# Deploy to cPanel — Static Hosting (No Node.js App)

This is the easiest way to put the site on plain shared hosting (Apache or
LiteSpeed). No Node.js Selector, no Passenger, no "Setup Node.js App",
no restart button.

---

## 1. Build the static bundle locally

Make sure your `.env` is filled in (the Supabase URL/key get baked into the
build), then run:

```bash
npm install
npm run package:cpanel-static
```

This produces a single zip:

```
/mnt/documents/cpanel-static.zip
```

It contains only static files: `index.html`, hashed JS/CSS bundles, images,
fonts, and an `.htaccess` for SPA routing.

## 2. Upload to cPanel

1. Open **File Manager** in cPanel.
2. Go to `public_html/` (or whichever folder your domain serves).
3. Click **Upload** and pick `cpanel-static.zip`.
4. Right-click the uploaded zip → **Extract** → confirm.
5. Delete the zip file when extraction is done.

Visit your domain — you're live.

## 3. Updating the site

Whenever you make changes:

```bash
npm run package:cpanel-static
```

Re-upload the new zip and extract (overwrite when prompted).

---

## What you give up vs. the Node.js build

| | Static (this guide) | Node.js App (`README-cpanel.md`) |
|---|---|---|
| cPanel setup | None — just upload | Node.js Selector + npm install + restart |
| SEO / social previews | Weaker (HTML is empty until JS runs) | Strong (real HTML per page) |
| Page refresh on deep links | Works (via `.htaccess`) | Works |
| Admin / login / cart | Works | Works |
| Live preview from edits | Re-build + re-upload | Re-build + restart |

For a content site where good link previews on Facebook, WhatsApp and
LinkedIn matter, prefer the Node.js build. For "just put it online,
the simpler the better", use this static build.

---

## Caveats

- **Environment variables are baked in at build time.** If you change
  `VITE_SUPABASE_URL` (or any `VITE_*` value), you must rebuild and
  re-upload — the host has no way to override them.
- **Edge functions still work.** They live on Lovable Cloud, not on cPanel,
  so the CSV import, contact form, etc. continue to function.
- **Admin user-listing requires the Node.js build.** Listing all signed-up
  users uses a server-only Supabase admin endpoint that needs a Node
  process. On the static build, the admin dashboard still works for
  products, categories, blog, orders, settings, etc. — only the "Users"
  page is degraded.

---

## Troubleshooting

**404 on refresh of `/products/foo`** → `.htaccess` is missing or
`mod_rewrite` is disabled. Confirm `.htaccess` exists in `public_html/`
(File Manager → Settings → "Show Hidden Files"), and ask your host to
enable `mod_rewrite` if needed.

**Blank page** → open the browser console. Most likely a Supabase URL/key
mismatch — rebuild after fixing `.env`.

**Old version still showing** → hard refresh (Ctrl+F5). Hashed asset
filenames force fresh downloads, but `index.html` may be cached for a few
minutes by your browser or CDN.
