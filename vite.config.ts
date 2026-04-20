// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Three build targets:
//   (default)         → Cloudflare Worker SSR bundle (Lovable hosting)
//   BUILD_TARGET=node → Node.js SSR bundle for cPanel "Setup Node.js App"
//   BUILD_TARGET=spa  → Pure static SPA bundle for plain shared hosting
//                       (Apache/LiteSpeed, no Node process required)
const target = process.env.BUILD_TARGET;
const isNodeBuild = target === "node";
const isSpaBuild = target === "spa";

export default defineConfig(
  isSpaBuild
    ? {
        // Disable Cloudflare plugin — we want a static client bundle, no Worker.
        cloudflare: false,
        // Enable TanStack Start's built-in SPA mode: emits a single shell HTML
        // and prerenders only "/" so all client-side routes resolve via the
        // shell. Combined with the .htaccess SPA fallback in public/, deep
        // links work on Apache/LiteSpeed without any server runtime.
        tanstackStart: {
          spa: {
            enabled: true,
            // Emit the shell as index.html (default would be _shell.html).
            prerender: { outputPath: "/index" },
          },
        },
      }
    : isNodeBuild
      ? {
          // Disable the Cloudflare Vite plugin so the SSR build emits a plain
          // Node-compatible bundle that `server.mjs` can import.
          cloudflare: false,
          vite: {
            ssr: {
              target: "node",
            },
            build: {
              // Emit standard Node ESM output to dist/server (client goes to dist/client).
              // Targeting Node 24 (current release line) — esbuild can emit modern
              // syntax (e.g. newer ES features) without unnecessary down-leveling.
              target: "node24",
            },
          },
        }
      : undefined,
);
