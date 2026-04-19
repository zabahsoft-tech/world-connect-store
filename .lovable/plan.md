

## Plan: Build for shared cPanel hosting (Node.js Selector)

The current build target is Cloudflare Workers (via `wrangler.jsonc` and `@cloudflare/vite-plugin` registered in `@lovable.dev/vite-tanstack-config`). cPanel's Node.js Selector runs a **standard Node.js process** behind Passenger — it cannot execute a Worker bundle. We need a parallel Node.js server build that cPanel can run with `npm start`, plus a packaging script that produces a clean `.zip` to upload.

### What we'll add

**1. Node.js server entry — `server.mjs` (project root)**
- Tiny Express-free Node HTTP server using `node:http` + the TanStack Start Node handler from `@tanstack/react-start/server-entry-node`.
- Serves SSR + server functions + static assets from `dist/client`.
- Reads `PORT` from env (cPanel sets this automatically via Passenger).
- Sets `process.env.NODE_ENV = "production"`.

**2. Vite config update — `vite.config.ts`**
- Pass `vite: { build: { ssr: true }, ssr: { target: "node", noExternal: [...] } }` overrides via the existing `defineConfig` from `@lovable.dev/vite-tanstack-config` so the SSR bundle is Node-targeted (instead of Worker).
- We won't remove the Cloudflare plugin; the lovable config gates it to build-only and Workers deployment will still work. But we add a separate `build:node` script that produces the cPanel artifact in `dist/`.

**3. New scripts in `package.json`**
- `"build:node": "BUILD_TARGET=node vite build"` — produces `dist/client` + `dist/server`.
- `"start": "node server.mjs"` — what cPanel's "Application startup file" points to.
- `"package:cpanel": "node scripts/package-cpanel.mjs"` — runs the build, then zips the deployable bundle.

**4. Packaging script — `scripts/package-cpanel.mjs`**
- Runs `build:node`.
- Creates `/mnt/documents/cpanel-deploy.zip` containing:
  - `dist/` (built client + server)
  - `server.mjs`
  - `package.json` + `package-lock.json` (so cPanel's "Run NPM Install" works)
  - `.env.example` with the required vars (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_*` mirrors)
  - `README-cpanel.md` with step-by-step deploy instructions
- Excludes `node_modules`, `.git`, source `src/`, lockfile from non-prod tools.

**5. cPanel deployment guide — `README-cpanel.md`**
- Prerequisites: Node 20+ available in cPanel's Node.js Selector, at least 512 MB RAM.
- Steps:
  1. cPanel → Setup Node.js App → Create Application (Node 20, mode: Production, root: `myapp`, startup file: `server.mjs`).
  2. Upload + extract `cpanel-deploy.zip` into the app root via File Manager.
  3. In the Node.js App panel → "Run NPM Install".
  4. Add environment variables (copy from `.env.example`, fill real values).
  5. Restart the app. Visit the assigned domain.
- Troubleshooting section: Passenger logs location, common port/permission errors, how to update (re-upload zip + restart).

### Limitations to flag for the user

- Shared cPanel hosts often **kill long-running Node processes** under load — performance won't match Cloudflare/Vercel.
- Some cPanel plans don't allow Node 20 (only 18 or older). If the host caps at Node 18, the build still works but Tailwind v4 + Vite 7 prefer 20+.
- Server functions that rely on Cloudflare-specific APIs (none currently in this codebase — verified) would need rewriting; this codebase is clean.
- Outbound HTTPS to Supabase must be allowed by the host (almost always is, but worth noting).

### Files touched

- New: `server.mjs`
- New: `scripts/package-cpanel.mjs`
- New: `README-cpanel.md`
- New: `.env.example`
- Edit: `package.json` (3 new scripts)
- Edit: `vite.config.ts` (Node SSR target override when `BUILD_TARGET=node`)

### Output

After running the new flow, you'll get `cpanel-deploy.zip` as a downloadable artifact ready to upload to your cPanel host. The existing Lovable Cloud / Cloudflare build path stays untouched — you can keep deploying to both targets.

