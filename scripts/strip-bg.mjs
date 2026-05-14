#!/usr/bin/env node
// Strip backgrounds from existing avatars using infsh/birefnet.
// Reads /public/img/av-*.png, sends each to birefnet, saves the result back
// over the same path (or to a -clean.png variant — see KEEP_ORIGINAL).
//
// Input images are passed as URLs into the inference.sh hosted CDN by way of
// the same `image` field birefnet expects (URLs work for hosted apps).
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.resolve(__dirname, "..", "public", "img");
const outDir = imgDir; // overwrite in place — git diff will surface changes

function getKey() {
  if (process.env.INFSH_API_KEY) return process.env.INFSH_API_KEY;
  return execSync("op item get ybqjxeigfxrnva5ojp2xrv62oe --reveal --fields credential", {
    encoding: "utf8",
  }).trim();
}

const KEY = getKey();
const BASE = "https://api.inference.sh";

async function api(p, init = {}) {
  const res = await fetch(`${BASE}${p}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  const txt = await res.text();
  let body;
  try { body = JSON.parse(txt); } catch { body = txt; }
  if (!res.ok) throw new Error(`${res.status}: ${txt.slice(0, 400)}`);
  return body;
}

function toDataUri(localPath) {
  // Downscale large PNGs first so the data URI fits inside nginx's
  // upload limit on inference.sh (~1MB body). 1024px is plenty for
  // an avatar source — birefnet will preserve sharpness.
  const MAX = 1024;
  const buf = readFileSync(localPath);
  if (buf.length < 700_000) {
    return `data:image/png;base64,${buf.toString("base64")}`;
  }
  // Use sips for resize — comes with macOS and avoids a JS image lib dep
  const tmp = `/tmp/strip-bg-${path.basename(localPath)}`;
  execSync(`/usr/bin/sips --resampleHeightWidthMax ${MAX} ${localPath} --out ${tmp}`, { stdio: "ignore" });
  const small = readFileSync(tmp);
  return `data:image/png;base64,${small.toString("base64")}`;
}

async function runTask(input) {
  const submit = await api("/run", { method: "POST", body: JSON.stringify({ app: "infsh/birefnet", input }) });
  const id = submit?.data?.id ?? submit?.id;
  if (!id) throw new Error("no task id: " + JSON.stringify(submit).slice(0, 200));
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    const t = await api(`/tasks/${id}`);
    const data = t?.data ?? t;
    if (data?.output) return data;
    if (data?.status === 11 || data?.error) {
      throw new Error(`task ${id} failed: ${JSON.stringify(data?.error ?? data?.status_text ?? "")}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`task ${id} timed out`);
}

function pickUrl(out) {
  if (!out) return null;
  if (typeof out === "string" && out.startsWith("http")) return out;
  if (Array.isArray(out)) for (const o of out) { const u = pickUrl(o); if (u) return u; }
  if (typeof out === "object") {
    if (out.uri && typeof out.uri === "string") return out.uri;
    if (out.url && typeof out.url === "string") return out.url;
    if (out.image && typeof out.image === "string") return out.image;
    for (const k of ["images", "outputs", "result", "data"]) { if (out[k]) { const u = pickUrl(out[k]); if (u) return u; } }
    for (const v of Object.values(out)) { const u = pickUrl(v); if (u) return u; }
  }
  return null;
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}: ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

async function processOne(localPath) {
  const name = path.basename(localPath);
  console.log("→", name);
  const dataUri = toDataUri(localPath);
  const res = await runTask({ image: dataUri, fill_background: false });
  const outUrl = pickUrl(res?.output ?? res);
  if (!outUrl) {
    console.error("  no output url; res:", JSON.stringify(res).slice(0, 300));
    return false;
  }
  const dest = path.join(outDir, name);
  const size = await download(outUrl, dest);
  console.log("  ✓", dest, `(${(size / 1024).toFixed(0)}kb)`);
  return true;
}

async function main() {
  const targets = process.argv.slice(2);
  let files;
  if (targets.length > 0) {
    files = targets.map((f) => path.isAbsolute(f) ? f : path.join(imgDir, f));
  } else {
    files = readdirSync(imgDir)
      .filter((f) => /^av-.*\.png$/.test(f))
      .map((f) => path.join(imgDir, f));
  }
  console.log(`processing ${files.length} avatar(s)`);
  for (const f of files) {
    try {
      await processOne(f);
    } catch (e) {
      console.error("  ✗", path.basename(f), e.message);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
