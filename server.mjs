// Node.js production server for shared cPanel hosting (Node.js Selector / Passenger).
//
// cPanel's "Setup Node.js App" runs this file as the application entry point.
// It boots a standard Node HTTP server, serves the prebuilt static client assets
// from ./dist/client, and forwards all other requests to the TanStack Start SSR
// handler from ./dist/server.
//
// Recommended runtime: Node.js 24 (current release line, LTS Oct 2026).
// Minimum supported:   Node.js 20 (required for global fetch + Web Streams).
//
// Build first with:  npm run build:node
// Start with:        npm start   (or let Passenger run "node server.mjs")

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Soft runtime version check — warn (don't fail) if running on an old Node.
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (Number.isFinite(nodeMajor) && nodeMajor < 20) {
  console.warn(
    `[server] Detected Node.js ${process.versions.node}. ` +
      `This app requires Node 20+ and is optimised for Node 24. ` +
      `Please upgrade in your cPanel Node.js Selector.`,
  );
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLIENT_DIR = resolve(__dirname, "dist", "client");
const SERVER_ENTRY = resolve(__dirname, "dist", "server", "server.js");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

if (!existsSync(SERVER_ENTRY)) {
  console.error(
    `[server] Missing SSR bundle at ${SERVER_ENTRY}.\n` +
      `         Run "npm run build:node" before starting the server.`,
  );
  process.exit(1);
}

// Lazy-load the SSR handler so import errors surface with a clear message.
const ssrModule = await import(pathToFileURL(SERVER_ENTRY).href);
const ssrHandler = ssrModule.default ?? ssrModule;
if (!ssrHandler || typeof ssrHandler.fetch !== "function") {
  console.error(
    "[server] SSR bundle does not export a default { fetch } handler. " +
      "Check that vite built with BUILD_TARGET=node.",
  );
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const SUPABASE_HOST = "https://kqfdaqggrxflrticxisu.supabase.co";
const R2_HOST = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev";
const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
  "cross-origin-opener-policy": "same-origin",
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `img-src 'self' data: blob: https: ${R2_HOST} ${SUPABASE_HOST}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${SUPABASE_HOST} wss://kqfdaqggrxflrticxisu.supabase.co ${R2_HOST} https://api.lovable.dev`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

function applySecurityHeaders(headers) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers[k] && !headers[k.toLowerCase()]) headers[k] = v;
  }
  return headers;
}

function safeJoin(root, urlPath) {
  // Strip query/hash and decode safely.
  const cleaned = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const joined = normalize(join(root, cleaned));
  if (!joined.startsWith(root + sep) && joined !== root) return null;
  return joined;
}

async function tryServeStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const filePath = safeJoin(CLIENT_DIR, req.url || "/");
  if (!filePath) return false;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return false;
    const ext = extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    // Hashed Vite assets live under /assets/* — long cache. Everything else, no-store-ish.
    const isHashed = (req.url || "").startsWith("/assets/");
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": s.size,
      "Cache-Control": isHashed
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
    });
    if (req.method === "HEAD") return res.end(), true;
    res.end(await readFile(filePath));
    return true;
  } catch {
    return false;
  }
}

function nodeReqToFetch(req) {
  const proto =
    req.headers["x-forwarded-proto"] ||
    (req.socket && req.socket.encrypted ? "https" : "http");
  const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url || "/", `${proto}://${host}`);

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
    else if (v != null) headers.set(k, String(v));
  }

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = new ReadableStream({
      start(controller) {
        req.on("data", (chunk) => controller.enqueue(chunk));
        req.on("end", () => controller.close());
        req.on("error", (e) => controller.error(e));
      },
    });
    init.duplex = "half";
  }
  return new Request(url.toString(), init);
}

async function writeFetchResponse(res, fetchRes) {
  const headers = {};
  fetchRes.headers.forEach((value, key) => {
    headers[key] = value;
  });
  // Defense-in-depth: ensure cross-browser security headers are always set
  // even if the SSR pipeline forgot them. The TanStack middleware sets these
  // first; we only fill in any missing ones here.
  applySecurityHeaders(headers);
  res.writeHead(fetchRes.status, fetchRes.statusText || undefined, headers);
  if (!fetchRes.body) return res.end();
  const reader = fetchRes.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

const server = createServer(async (req, res) => {
  try {
    if (await tryServeStatic(req, res)) return;
    const fetchReq = nodeReqToFetch(req);
    const fetchRes = await ssrHandler.fetch(fetchReq);
    await writeFetchResponse(res, fetchRes);
  } catch (err) {
    console.error("[server] Request error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[server] Listening on http://${HOST}:${PORT}`);
});
