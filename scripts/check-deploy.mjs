#!/usr/bin/env node
// Verify a freshly deployed URL: fetch the page, extract every <script src> /
// <link href> reference, confirm each returns 200. Useful immediately after
// `vercel deploy` to catch the brief edge propagation window where HTML and
// asset hashes can diverge.
//
//   node scripts/check-deploy.mjs https://turntable-fm.vercel.app
//   node scripts/check-deploy.mjs https://turntable-fm.vercel.app --retries 3
const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http"));
const retriesIdx = args.indexOf("--retries");
const maxRetries = retriesIdx >= 0 ? Number(args[retriesIdx + 1]) || 0 : 0;

if (!url) {
  console.error("usage: node scripts/check-deploy.mjs <url> [--retries N]");
  process.exit(2);
}

const ASSET_RE = /(?:src|href)="([^"]+\.(?:js|mjs|css))"/g;

async function checkOnce() {
  const r = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!r.ok) throw new Error(`root ${r.status} ${r.statusText}`);
  const html = await r.text();
  const assets = new Set();
  for (const m of html.matchAll(ASSET_RE)) {
    const path = m[1];
    if (path.startsWith("/")) assets.add(new URL(path, url).toString());
    else if (path.startsWith("http")) assets.add(path);
    else if (path.startsWith("//")) assets.add(`https:${path}`);
  }
  console.log(`root: 200 (${html.length} bytes) — ${assets.size} asset(s)`);

  const results = await Promise.all(
    [...assets].map(async (a) => {
      try {
        const ar = await fetch(a, { method: "HEAD" });
        return { url: a, code: ar.status };
      } catch (e) {
        return { url: a, code: 0, error: String(e?.message ?? e) };
      }
    })
  );

  const broken = results.filter((r) => r.code !== 200);
  for (const r of results.sort((a, b) => a.code - b.code)) {
    console.log(`  ${r.code || "ERR"}  ${r.url}${r.error ? "  " + r.error : ""}`);
  }
  return { broken, total: results.length };
}

async function main() {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(2000 * 2 ** (attempt - 1), 10_000);
      console.log(`\nretry ${attempt}/${maxRetries} in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const { broken, total } = await checkOnce();
      if (broken.length === 0) {
        console.log(`\n✓ deploy healthy: ${total} asset(s) all 200`);
        process.exit(0);
      }
      console.log(`\n✗ ${broken.length}/${total} asset(s) broken`);
      if (attempt === maxRetries) process.exit(1);
    } catch (e) {
      console.error("check error:", e.message);
      if (attempt === maxRetries) process.exit(1);
    }
  }
}

main();
