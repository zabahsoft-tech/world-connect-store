// Build the project as a static SPA and zip it into a single uploadable
// artifact at /mnt/documents/cpanel-static.zip.
//
// Usage:  node scripts/package-cpanel-static.mjs   (or:  npm run package:cpanel-static)
//
// The resulting zip contains ONLY static files (HTML, JS, CSS, images, fonts,
// .htaccess). Upload it to public_html/ in cPanel File Manager, right-click →
// Extract, and you're live. No Node.js App, no Passenger, no restart button.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  createWriteStream,
  readFileSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createDeflateRaw } from "node:zlib";
import { Buffer } from "node:buffer";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT_DIR = "/mnt/documents";
const OUT_ZIP = join(OUT_DIR, "cpanel-static.zip");

function log(msg) {
  console.log(`\x1b[36m[package:cpanel-static]\x1b[0m ${msg}`);
}
function fail(msg) {
  console.error(`\x1b[31m[package:cpanel-static]\x1b[0m ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Build
// ---------------------------------------------------------------------------
log("Running `vite build` with BUILD_TARGET=spa ...");
const build = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "build"],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "spa", NODE_ENV: "production" },
  },
);
if (build.status !== 0) fail("vite build failed.");

// TanStack Start's SPA prerender writes the static client bundle into
// dist/client. We zip the contents of that directory at the zip root so
// extracting straight into public_html/ "just works".
const CLIENT_DIR = join(ROOT, "dist", "client");
if (!existsSync(join(CLIENT_DIR, "index.html"))) {
  fail(
    "Build finished but dist/client/index.html is missing. " +
      "Check vite.config.ts for the BUILD_TARGET=spa branch.",
  );
}

// ---------------------------------------------------------------------------
// 2. Collect files for the zip (everything under dist/client + .htaccess)
// ---------------------------------------------------------------------------
const excludeNames = new Set([".DS_Store"]);

function walk(absPath, rel, out) {
  const s = statSync(absPath);
  if (s.isDirectory()) {
    for (const entry of readdirSync(absPath)) {
      if (excludeNames.has(entry)) continue;
      walk(join(absPath, entry), rel ? `${rel}/${entry}` : entry, out);
    }
  } else if (s.isFile()) {
    out.push({ abs: absPath, rel: rel.split(sep).join("/"), size: s.size, mtime: s.mtime });
  }
}

const files = [];
walk(CLIENT_DIR, "", files);

// Make sure .htaccess shipped through the build (Vite copies public/* into the
// client output). If not, add it from public/ as a fallback.
const hasHtaccess = files.some((f) => f.rel === ".htaccess");
if (!hasHtaccess) {
  const src = join(ROOT, "public", ".htaccess");
  if (existsSync(src)) {
    const s = statSync(src);
    files.push({ abs: src, rel: ".htaccess", size: s.size, mtime: s.mtime });
  } else {
    log("(warning) .htaccess not found — SPA deep links may 404 on refresh.");
  }
}

log(`Packaging ${files.length} files ...`);

// ---------------------------------------------------------------------------
// 3. Write a ZIP (store + deflate). Minimal in-house writer — no deps.
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function deflateRaw(buf) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    const z = createDeflateRaw({ level: 9 });
    z.on("data", (c) => chunks.push(c));
    z.on("end", () => resolve2(Buffer.concat(chunks)));
    z.on("error", reject);
    z.end(buf);
  });
}

function dosDateTime(d) {
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  return { date, time };
}

const out = createWriteStream(OUT_ZIP);
let offset = 0;
const central = [];

function writeChunk(buf) {
  return new Promise((resolve2, reject) => {
    out.write(buf, (err) => (err ? reject(err) : resolve2()));
  });
}

for (const f of files) {
  const data = readFileSync(f.abs);
  const compressed = await deflateRaw(data);
  const useDeflate = compressed.length < data.length;
  const payload = useDeflate ? compressed : data;
  const method = useDeflate ? 8 : 0;
  const crc = crc32(data);
  const { date, time } = dosDateTime(f.mtime);
  const nameBuf = Buffer.from(f.rel, "utf8");

  const lfh = Buffer.alloc(30);
  lfh.writeUInt32LE(0x04034b50, 0);
  lfh.writeUInt16LE(20, 4);
  lfh.writeUInt16LE(0x0800, 6);
  lfh.writeUInt16LE(method, 8);
  lfh.writeUInt16LE(time, 10);
  lfh.writeUInt16LE(date, 12);
  lfh.writeUInt32LE(crc, 14);
  lfh.writeUInt32LE(payload.length, 18);
  lfh.writeUInt32LE(data.length, 22);
  lfh.writeUInt16LE(nameBuf.length, 26);
  lfh.writeUInt16LE(0, 28);

  await writeChunk(lfh);
  await writeChunk(nameBuf);
  await writeChunk(payload);

  central.push({
    name: nameBuf,
    crc,
    compSize: payload.length,
    rawSize: data.length,
    method,
    date,
    time,
    offset,
  });
  offset += lfh.length + nameBuf.length + payload.length;
}

const cdStart = offset;
for (const c of central) {
  const cdh = Buffer.alloc(46);
  cdh.writeUInt32LE(0x02014b50, 0);
  cdh.writeUInt16LE(20, 4);
  cdh.writeUInt16LE(20, 6);
  cdh.writeUInt16LE(0x0800, 8);
  cdh.writeUInt16LE(c.method, 10);
  cdh.writeUInt16LE(c.time, 12);
  cdh.writeUInt16LE(c.date, 14);
  cdh.writeUInt32LE(c.crc, 16);
  cdh.writeUInt32LE(c.compSize, 20);
  cdh.writeUInt32LE(c.rawSize, 24);
  cdh.writeUInt16LE(c.name.length, 28);
  cdh.writeUInt16LE(0, 30);
  cdh.writeUInt16LE(0, 32);
  cdh.writeUInt16LE(0, 34);
  cdh.writeUInt16LE(0, 36);
  cdh.writeUInt32LE(0, 38);
  cdh.writeUInt32LE(c.offset, 42);

  await writeChunk(cdh);
  await writeChunk(c.name);
  offset += cdh.length + c.name.length;
}
const cdSize = offset - cdStart;

const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(central.length, 8);
eocd.writeUInt16LE(central.length, 10);
eocd.writeUInt32LE(cdSize, 12);
eocd.writeUInt32LE(cdStart, 16);
eocd.writeUInt16LE(0, 20);
await writeChunk(eocd);

await new Promise((res) => out.end(res));

const zipSize = statSync(OUT_ZIP).size;
log(`Done. Wrote ${OUT_ZIP} (${(zipSize / 1024 / 1024).toFixed(2)} MB).`);
log("Upload this zip to public_html/ in cPanel File Manager, right-click → Extract.");
log("No Node.js App needed. Just visit your domain.");
