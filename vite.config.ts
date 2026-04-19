// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// When BUILD_TARGET=node, we produce a Node.js SSR bundle for shared cPanel
// hosting (Node.js Selector / Passenger) instead of a Cloudflare Worker bundle.
// The default build (no env var) keeps the Cloudflare Workers target intact.
const isNodeBuild = process.env.BUILD_TARGET === "node";

export default defineConfig(
  isNodeBuild
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
            target: "node20",
          },
        },
      }
    : undefined,
);
