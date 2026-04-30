/**
 * Mirrors Supabase auth tokens stored in localStorage into a cookie so that:
 *  - Sessions survive in browsers where localStorage is restricted (Safari
 *    Private Mode, strict tracking prevention, embedded webviews).
 *  - The token is available to server-side renders via the request cookie jar.
 *
 * The "Remember me" preference controls whether the cookie persists across
 * browser restarts (Max-Age set) or expires with the tab (session cookie).
 *
 * SECURITY notes:
 *  - Cookies are Secure + SameSite=Lax. They are NOT HttpOnly because the
 *    browser-side @supabase/supabase-js client must read the access token to
 *    sign PostgREST/Realtime requests. XSS is mitigated separately via CSP
 *    and DOMPurify (see SafeHtml).
 *  - We only mirror keys prefixed with "sb-" (the Supabase auth storage keys).
 */
import { deleteCookie, getCookie, setCookie } from "./cookies";

const REMEMBER_KEY = "app_session_remember";
const PERSISTENT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SUPABASE_KEY_PREFIX = "sb-";

let installed = false;

export function setSessionPersistence(remember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (remember) localStorage.setItem(REMEMBER_KEY, "1");
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // ignore
  }
  // Re-mirror existing supabase keys with the new persistence preference so
  // the cookie immediately reflects the user's choice.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SUPABASE_KEY_PREFIX)) {
        const v = localStorage.getItem(key);
        if (v != null) writeCookieFor(key, v);
      }
    }
  } catch {
    // ignore
  }
}

function shouldPersist(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCookieFor(key: string, value: string): void {
  setCookie(key, value, {
    sameSite: "Lax",
    maxAge: shouldPersist() ? PERSISTENT_MAX_AGE : undefined,
  });
}

/**
 * Install the localStorage → cookie mirror once on the client. Safe to call
 * multiple times; subsequent calls are no-ops.
 */
export function installAuthCookieMirror(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // 1. Hydrate localStorage from cookies if the cookie has a value but
  //    localStorage doesn't (covers Safari Private wipe & cross-tab restore).
  try {
    const cookieParts = document.cookie ? document.cookie.split("; ") : [];
    for (const part of cookieParts) {
      const eq = part.indexOf("=");
      if (eq <= 0) continue;
      const name = part.slice(0, eq);
      if (!name.startsWith(SUPABASE_KEY_PREFIX)) continue;
      try {
        const existing = localStorage.getItem(name);
        if (existing == null) {
          const raw = part.slice(eq + 1);
          try {
            localStorage.setItem(name, decodeURIComponent(raw));
          } catch {
            localStorage.setItem(name, raw);
          }
        }
      } catch {
        // localStorage may throw in private mode — that's OK, the JS
        // supabase client will still read the cookie via this mirror.
      }
    }
  } catch {
    // ignore
  }

  // 2. Patch localStorage so future writes/removes also touch the cookie.
  try {
    const proto = Object.getPrototypeOf(localStorage) as Storage;
    const origSet = proto.setItem.bind(localStorage);
    const origRemove = proto.removeItem.bind(localStorage);

    localStorage.setItem = function patchedSetItem(key: string, value: string) {
      origSet(key, value);
      if (typeof key === "string" && key.startsWith(SUPABASE_KEY_PREFIX)) {
        writeCookieFor(key, value);
      }
    };

    localStorage.removeItem = function patchedRemoveItem(key: string) {
      origRemove(key);
      if (typeof key === "string" && key.startsWith(SUPABASE_KEY_PREFIX)) {
        deleteCookie(key);
      }
    };
  } catch {
    // Some hardened browsers freeze localStorage. Nothing else we can do.
  }

  // 3. On any storage event from another tab, keep cookies in sync.
  try {
    window.addEventListener("storage", (e) => {
      if (!e.key || !e.key.startsWith(SUPABASE_KEY_PREFIX)) return;
      if (e.newValue == null) deleteCookie(e.key);
      else writeCookieFor(e.key, e.newValue);
    });
  } catch {
    // ignore
  }
}

/** Read the current Supabase access token from the mirrored cookie, if any. */
export function getSupabaseAuthCookieValue(): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq);
    if (name.startsWith(SUPABASE_KEY_PREFIX) && name.endsWith("-auth-token")) {
      try {
        return decodeURIComponent(part.slice(eq + 1));
      } catch {
        return part.slice(eq + 1);
      }
    }
  }
  return null;
}
