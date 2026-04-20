# Deploying to shared cPanel hosting (Node.js Selector)

This project ships with a parallel **Node.js build** so it can run on shared
cPanel hosting that exposes the **Setup Node.js App** feature (powered by
Phusion Passenger). The original Cloudflare Workers build still works — this
is an additional deployment target, not a replacement.

---

## 1. Build the deployable zip locally

```bash
npm install
npm run package:cpanel
```

This runs `npm run build:node` and writes the artifact to:

```
/mnt/documents/cpanel-deploy.zip
```

The zip contains:

- `dist/` — compiled client assets + SSR bundle
- `server.mjs` — Node HTTP server entry (Passenger runs this)
- `package.json` + `package-lock.json` — so cPanel can install runtime deps
- `.env.example` — list of environment variables to set in cPanel
- `README-cpanel.md` — this guide

---

## 2. Prerequisites on the cPanel host

- **Node.js 24 recommended** (20+ supported) available in **cPanel → Setup
  Node.js App**. Node 24 is the current release line (LTS Oct 2026) and gives
  you the best performance + security. Node 20/22 also work; Node 18 is **not**
  supported (Tailwind v4 / Vite 7 require 20+).
- At least **512 MB RAM** allocated to the Node app.
- Outbound HTTPS allowed (the app calls Supabase). This is enabled by default
  on virtually every shared host.

---

## 3. Create the application in cPanel

1. Log into cPanel → **Setup Node.js App** → **Create Application**.
2. Fill in:
   - **Node.js version:** 24.x (or the highest available — 22, 20 also fine)
   - **Application mode:** Production
   - **Application root:** e.g. `myapp` (a folder under your home dir)
   - **Application URL:** the domain or subdomain to serve from
   - **Application startup file:** `server.mjs`
3. Click **Create**. cPanel will provision the app folder and show you the
   command to enter its virtualenv (something like
   `source /home/USER/nodevenv/myapp/20/bin/activate && cd /home/USER/myapp`).

---

## 4. Upload and install

1. Open **File Manager** → navigate to the application root you chose.
2. Upload `cpanel-deploy.zip` and **Extract** it in place.
3. Back in **Setup Node.js App**, find your app and click **Run NPM Install**.
   This installs only the runtime dependencies needed by `server.mjs` and the
   SSR bundle.

---

## 5. Configure environment variables

In the same Node.js App panel, scroll to **Environment variables** and add
each entry from `.env.example`:

| Name | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Used by SSR and server functions. |
| `SUPABASE_PUBLISHABLE_KEY` | yes | Anon/publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only — never expose. |
| `NODE_ENV` | yes | Set to `production`. |
| `PORT` | no | Passenger sets this automatically. |
| `HOST` | no | Defaults to `0.0.0.0`. |

> The `VITE_*` variables are baked into the client bundle at build time, so
> you do **not** need to re-set them on the host unless you plan to rebuild
> there.

Click **Save**, then **Restart** the application.

---

## 6. Verify

Visit the application URL you configured. You should see the home page render
server-side (view source — the HTML contains real content, not just a root
`<div>`). Navigation between routes should work without full page reloads.

---

## Updating the app

1. Re-run `npm run package:cpanel` locally.
2. Upload the new `cpanel-deploy.zip`, **Extract** it (overwrite existing files).
3. Click **Run NPM Install** only if `package.json` changed.
4. **Restart** the app from the Node.js App panel.

---

## Troubleshooting

- **`Application failed to start` / 503 from Passenger** — open
  `~/logs/passenger.log` (or the path shown in cPanel) for the real error.
- **`Missing SSR bundle at .../dist/server/server.js`** — the zip was extracted
  incorrectly or `dist/` is missing. Re-extract and verify `dist/server/server.js`
  exists.
- **`Cannot find module ...`** — click **Run NPM Install** again; the runtime
  dependency may not have installed.
- **Blank page / 500 on every request** — likely missing env vars. Double-check
  `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set, then restart.
- **Static assets 404** — make sure the upload preserved the `dist/client/`
  directory; `server.mjs` serves files from there.

---

## Limitations to be aware of

- Shared cPanel hosts often **suspend long-idle Node processes** and limit CPU
  bursts. Cold-start latency will be noticeably higher than Cloudflare/Vercel.
- If your host's Node.js Selector caps at Node 20 or 22, the app still runs —
  you just miss the perf and security improvements shipped in Node 24. Node 18
  and older are unsupported.
- The Cloudflare Workers build path (`npm run build` + `wrangler`) is
  untouched — you can keep deploying to both targets in parallel.
