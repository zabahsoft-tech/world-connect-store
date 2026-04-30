# Cross-browser security hardening with cookies

Today, the auth session and cart live in `localStorage`. That breaks in Safari Private Mode, in browsers with strict tracking prevention, and exposes the auth token to any XSS. We'll move both to cookies and add site-wide security response headers.

## What changes for users

- Login keeps working in every browser, including Safari Private and locked-down enterprise browsers.
- "Remember me" on the login page controls whether your session survives closing the browser.
- The cart stays with you the same way (and now also when localStorage is blocked).
- The site tells browsers to enforce HTTPS, block clickjacking, and stop content sniffing.

## 1. Auth session → httpOnly cookies (SSR-aware)

- Switch `src/integrations/supabase/client.ts` to use `@supabase/ssr`'s `createBrowserClient`, configured with a custom cookie storage adapter (read/write `document.cookie`) instead of `localStorage`. Cookies set client-side will be `Secure`, `SameSite=Lax`, `Path=/`.
- Add a server helper `src/integrations/supabase/server-cookies.ts` that builds a `createServerClient` bound to the current TanStack request via `getCookie` / `setCookie` from `@tanstack/react-start/server`. This lets SSR loaders and server functions read the session from cookies and refresh tokens when needed.
- Update `src/integrations/supabase/auth-middleware.ts` to:
  - Read the access token from the `sb-<ref>-auth-token` cookie when no `Authorization` header is present (so SSR + same-origin calls Just Work without bearer-token plumbing).
  - Keep the existing bearer-token path as a fallback for explicit calls.
- "Remember me" handling in `src/routes/login.tsx`: when checked, set persistent cookie `Max-Age` (e.g. 30 days). When unchecked, omit `Max-Age` so the cookie is a session cookie and dies with the browser. Wire this through a tiny `setSessionPersistence(remember: boolean)` helper that the cookie storage adapter reads.
- `src/contexts/AuthContext.tsx` keeps its current API (`signIn`, `signUp`, `signOut`, `onAuthStateChange`) — only the underlying storage changes, so no component edits are needed.

## 2. Cart → signed cookie (with safe fallback)

- Replace `localStorage` usage in `src/contexts/CartContext.tsx` with a cookie-backed store:
  - Client: read/write `app_cart` cookie (`Secure`, `SameSite=Lax`, `Max-Age` ~30 days, `Path=/`).
  - SSR: hydrate initial cart from the cookie via the request, so the cart count in the header is correct on first paint (no flicker).
  - If the serialized cart would exceed ~3.5 KB (cookie size limits), fall back to keeping just IDs + quantities in the cookie and re-hydrating product details from the API on load.
- No schema changes — cart stays client-owned.

## 3. Site-wide security headers

Add headers in two layers so they apply both on Lovable hosting and the cPanel/Node deploy:

- New request middleware `src/server/security-headers.ts` registered in `src/start.ts` (create if missing) — sets headers on every SSR + server-route response:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy` (report-only first, then enforce) tailored to: self, Supabase URL, R2 image CDN, Google Fonts, inline styles needed by Tailwind/JSON-LD scripts.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
  - `Cross-Origin-Opener-Policy: same-origin`
- Mirror the same headers in `public/.htaccess` (cPanel static deploy) and in `server.mjs`'s `writeFetchResponse` so the Node host also enforces them.

## 4. Browser compatibility notes

- Cookies use `SameSite=Lax` (works in all evergreen browsers and Safari ≥13).
- `Secure` is required by modern Chrome/Safari for `SameSite=None`; we use `Lax` so it's fine on `localhost` HTTP during dev too.
- HSTS is only honored once over HTTPS — preview/published domains are already HTTPS.
- Fallback: if `document.cookie` writes fail (very locked-down embedded browsers), the auth client falls through to in-memory storage so the current tab still works.

## 5. Cleanup & verification

- One-time migration on first load: if old `app_cart` exists in `localStorage`, copy it into the cookie and delete the localStorage entry.
- Manual QA in preview:
  - Sign in, refresh, close+reopen tab → still signed in (with Remember me).
  - Sign in without Remember me, close browser, reopen → signed out.
  - Add to cart, refresh → cart preserved.
  - DevTools → Application → Cookies shows `Secure`, `HttpOnly` (where applicable), `SameSite=Lax`.
  - DevTools → Network → response headers show CSP, HSTS, X-Frame-Options.

## Technical notes

- Add dependency: `@supabase/ssr` (small, official, supports cookie-based sessions for SSR frameworks).
- The browser-side Supabase access token cookie cannot be `HttpOnly` because the JS client must read it to call PostgREST. We mitigate by: (a) setting `Secure` + `SameSite=Lax`, (b) keeping `dangerouslySetInnerHTML` sanitized via `SafeHtml` (already done), (c) adding a strict CSP. The refresh token cookie WILL be `HttpOnly` and only touched server-side via the SSR client.
- No DB migrations and no changes to RLS — purely transport/storage layer.
- Files expected to change: `src/integrations/supabase/client.ts`, `src/integrations/supabase/auth-middleware.ts`, new `src/integrations/supabase/server-cookies.ts`, `src/contexts/CartContext.tsx`, `src/routes/login.tsx`, new `src/server/security-headers.ts`, new `src/start.ts`, `server.mjs`, `public/.htaccess`.
