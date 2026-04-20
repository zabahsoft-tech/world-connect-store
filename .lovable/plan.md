

The user wants to run the site on cPanel **without** the Node.js App (Passenger) — i.e. on plain shared hosting that only serves static files (Apache/LiteSpeed, no Node process).

## What this means technically

The current build is **SSR** (server-side rendered) via TanStack Start. That requires a running Node/Workers process. To drop the Node requirement, we need to switch to a **static-only build** — either:

1. **SPA mode** (single HTML shell, JS hydrates everything client-side), or
2. **SSG mode** (pre-render every route to .html at build time).

Both produce a `dist/` folder of static files you upload to `public_html/` — no Node app, no Passenger, no "Setup Node.js App" step.

## Trade-offs

| | SPA (recommended) | SSG | Current (Node SSR) |
|---|---|---|---|
| cPanel Node app needed | No | No | Yes |
| SEO / social previews | Weaker (JS-rendered) | Strong (real HTML per page) | Strong |
| Dynamic routes (`/products/$slug`) | Works (fetches at runtime) | Needs full slug list at build time | Works |
| Admin / auth | Works | Works | Works |
| Build complexity | Lowest | Higher (must enumerate slugs) | Current |
| Initial page load | Slower (blank → JS → content) | Fastest | Fast |

Since this site has **dynamic content from the database** (products, categories, blog posts, custom pages) that changes without rebuilding, **SPA mode is the practical choice**. SSG would force a rebuild + re-upload every time you add a product.

## Plan: add a static SPA build target

### 1. New Vite build mode: `BUILD_TARGET=spa`
Extend `vite.config.ts` with a third branch (alongside the existing Cloudflare and Node branches) that:
- Disables the TanStack Start SSR plugin behavior (client-only output)
- Emits a single `index.html` that boots the router on the client
- Outputs everything to `dist/` (flat — no `dist/client` + `dist/server` split)

### 2. Apache `.htaccess` for SPA routing
Add `public/.htaccess` so deep links (e.g. `/products/foo`) don't 404 on refresh:
```
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```
Plus long-cache headers for `/assets/*` and gzip/brotli hints.

### 3. New packaging script: `scripts/package-cpanel-static.mjs`
Mirrors the existing Node packager but:
- Runs `vite build` with `BUILD_TARGET=spa`
- Zips **only** `dist/*` + `.htaccess` (no `server.mjs`, no `package.json`, no `node_modules`)
- Output: `/mnt/documents/cpanel-static.zip`

### 4. New npm scripts in `package.json`
```
"build:spa": "BUILD_TARGET=spa vite build",
"package:cpanel-static": "node scripts/package-cpanel-static.mjs"
```

### 5. New deployment guide: `README-cpanel-static.md`
Short, non-technical:
1. Run `npm run package:cpanel-static` locally
2. Upload `cpanel-static.zip` to `public_html/` in cPanel File Manager
3. Right-click → Extract
4. Done — visit your domain

No Node version selection, no env vars in cPanel, no "Run NPM Install", no restart.

### 6. Important caveats to surface to the user
- **SEO impact**: search engines and social link previews will see an empty HTML shell until JS runs. Modern Google handles this, but Facebook/Twitter/LinkedIn previews will be weaker than the current SSR build.
- **Env vars are baked at build time**: `VITE_SUPABASE_URL` etc. must be in `.env` when you run the build locally. They cannot be changed on the host.
- **Server-side admin logic** (any TanStack server functions, the `auth-middleware.ts`, the `users.functions.ts` server fns) won't run on the static host. If those are used, they need to be rewritten as direct Supabase client calls. I'll audit this during implementation and flag anything that breaks.
- **Edge functions** (e.g. `import-csv-data`) keep working — they live on Lovable Cloud, not on cPanel.

### Files to add/touch
- **Edit**: `vite.config.ts` — add `spa` branch
- **New**: `public/.htaccess`
- **New**: `scripts/package-cpanel-static.mjs`
- **New**: `README-cpanel-static.md`
- **Edit**: `package.json` — add `build:spa` and `package:cpanel-static` scripts
- **Audit**: `src/lib/users.functions.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/integrations/supabase/client.server.ts` and any route loaders using `createServerFn` — confirm they have client-side equivalents or refactor them

### What you'll do after I'm done
```
npm install
npm run package:cpanel-static
# upload /mnt/documents/cpanel-static.zip to public_html/, extract, done
```
No Node app, no Passenger, no restart button.

