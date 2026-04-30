import { createMiddleware } from "@tanstack/react-start";

/**
 * Cross-browser security response headers, applied to every SSR + server-route
 * response. Mirrored in server.mjs (Node host) and public/.htaccess (cPanel
 * static host) so the same protections apply on every deploy target.
 *
 * CSP notes:
 *  - 'unsafe-inline' is needed for Tailwind's runtime style injection during
 *    SSR hydration and the JSON-LD <script> tags in __root.tsx.
 *  - We allow the Supabase project, the R2 image CDN, and Google Fonts.
 *  - frame-ancestors 'none' is the modern equivalent of X-Frame-Options DENY.
 */
const SUPABASE_HOST = "https://kqfdaqggrxflrticxisu.supabase.co";
const R2_HOST = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev";

const CSP = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `img-src 'self' data: blob: https: ${R2_HOST} ${SUPABASE_HOST}`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `script-src 'self' 'unsafe-inline'`,
  `connect-src 'self' ${SUPABASE_HOST} wss://kqfdaqggrxflrticxisu.supabase.co ${R2_HOST} https://api.lovable.dev`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": CSP,
};

export const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  // result.response is a Web Response; mutate its headers when present.
  const response = (result as { response?: Response }).response;
  if (response && response.headers) {
    for (const [k, v] of Object.entries(HEADERS)) {
      if (!response.headers.has(k)) response.headers.set(k, v);
    }
  }
  return result;
});
