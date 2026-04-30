/**
 * Tiny cross-browser cookie helpers used by both auth-storage mirror and cart.
 * Cookies are written client-side only — server reads via TanStack request utils.
 */

export interface CookieOptions {
  maxAge?: number; // seconds; omit for session cookie
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

const DEFAULT_OPTS: Required<Pick<CookieOptions, "path" | "sameSite">> = {
  path: "/",
  sameSite: "Lax",
};

function isHttps(): boolean {
  if (typeof window === "undefined") return true;
  return window.location.protocol === "https:";
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = `${name}=`;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    if (part.startsWith(target)) {
      try {
        return decodeURIComponent(part.slice(target.length));
      } catch {
        return part.slice(target.length);
      }
    }
  }
  return null;
}

export function setCookie(name: string, value: string, opts: CookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const path = opts.path ?? DEFAULT_OPTS.path;
  const sameSite = opts.sameSite ?? DEFAULT_OPTS.sameSite;
  const secure = opts.secure ?? isHttps();
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (typeof opts.maxAge === "number") cookie += `; Max-Age=${Math.floor(opts.maxAge)}`;
  if (secure) cookie += "; Secure";
  try {
    document.cookie = cookie;
  } catch {
    // Locked-down browsers (e.g. some embedded webviews) — silently ignore.
  }
}

export function deleteCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${isHttps() ? "; Secure" : ""}`;
  } catch {
    // ignore
  }
}
