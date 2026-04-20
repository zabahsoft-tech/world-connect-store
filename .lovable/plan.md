
The user wants the cPanel Node.js build/package pipeline to target Node 24 (the latest LTS-track release) instead of Node 20. Looking at the current files:

- `vite.config.ts` sets `build.target: "node20"`
- `server.mjs` uses APIs all available in Node 24 (no changes needed beyond a version note)
- `README-cpanel.md` instructs users to pick Node 20 in cPanel
- `.env.example` doesn't pin a version
- `package.json` has no `engines` field (need to verify)

## Plan: Target Node.js 24

### 1. `vite.config.ts`
- Change SSR build target from `node20` → `node24`. This lets Vite/esbuild emit syntax that uses newer V8 features (top-level await is already fine, but newer ES features pass through untranspiled).

### 2. `package.json`
- Add an `"engines": { "node": ">=20.0.0 <25" }` field declaring Node 20–24 supported (keeps backward compat for hosts still on 20, but signals 24 is preferred).
- No script changes — `build:node`, `start`, `package:cpanel` work unchanged.

### 3. `server.mjs`
- Add a runtime check at the top: warn (not fail) if `process.versions.node` major < 20, recommend 24.
- Optionally use `import { styleText } from "node:util"` for nicer logs — skip to keep zero churn. Just bump the comment header to mention Node 24.

### 4. `README-cpanel.md`
- Update prerequisites: "Node.js 24+ recommended (20+ supported)".
- Update step 3 instructions: pick Node 24.x in cPanel's Node.js Selector.
- Add a short note in Troubleshooting: if cPanel only offers ≤22, the app still runs but you miss the perf/security improvements in 24.

### 5. `.env.example`
- No change needed (no version pinning there).

### 6. `scripts/package-cpanel.mjs`
- No functional change. Bundles same files. (Optionally bump the `[package:cpanel]` log to mention "Node 24-ready bundle" — cosmetic only.)

### Files touched
- Edit: `vite.config.ts`, `package.json`, `server.mjs`, `README-cpanel.md`

### Notes
- No new deps. No DB / i18n changes. Cloudflare Workers build path is untouched.
- Node 24 is the current "Current" release line (Oct 2025 → LTS Oct 2026). Many shared cPanel hosts lag — that's why we keep `>=20` as the floor.
