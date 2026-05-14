#!/usr/bin/env node
// Generate turntable.fm-style art via inference.sh.
// Auth: API key from 1Password ("My First Inference.sh API Key") or INFSH_API_KEY env.
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "..", "public", "img");
mkdirSync(outDir, { recursive: true });

function getKey() {
  if (process.env.INFSH_API_KEY) return process.env.INFSH_API_KEY;
  try {
    return execSync("op item get ybqjxeigfxrnva5ojp2xrv62oe --reveal --fields credential", {
      encoding: "utf8",
    }).trim();
  } catch (e) {
    console.error("could not read API key from 1Password:", e.message);
    process.exit(1);
  }
}

const API_KEY = getKey();
const BASE = "https://api.inference.sh";

const STYLE =
  "classic turntable.fm web app art style, 2010s chibi pixel cartoon, " +
  "bright saturated colors, simple shapes, web-2.0 playful, " +
  "thick black outlines, flat shading, mascot-friendly, square crop, " +
  "transparent or solid pastel background";

const NEG =
  "photorealistic, 3d render, gritty, dark, low contrast, " +
  "blurry, watermark, text, signature, ugly, scary";

const JOBS = [
  { name: "room.png",
    prompt:
      "isometric view of a cozy virtual nightclub room, wooden floor, " +
      "red velvet curtain backdrop, five DJ decks lined up at the back stage with glowing vinyl turntables, " +
      "neon disco lights, empty dance floor in foreground, no people, " + STYLE,
    aspect: "16:9", w: 1280, h: 768 },
  { name: "room-portrait.png",
    prompt:
      "vertical portrait composition of a cozy virtual nightclub room, " +
      "DJ booth at the top half with five turntables and red velvet curtain backdrop, " +
      "wide hardwood dance floor at the bottom with a spotlight, neon disco lights overhead, no people, " + STYLE,
    aspect: "9:16", w: 768, h: 1280 },
  { name: "room-hiphop-portrait.png",
    prompt:
      "vertical portrait composition of a hip hop lounge, brick wall and graffiti backdrop, " +
      "DJ booth at the top half with five turntables and an MPC, " +
      "warm dance floor at the bottom with a spotlight, gold neon accents, boombox in corner, no people, " + STYLE,
    aspect: "9:16", w: 768, h: 1280 },
  { name: "room-psych-portrait.png",
    prompt:
      "vertical portrait composition of a psychedelic 1970s rock club, lava-lamp blob backdrop at top, " +
      "DJ booth in upper half with five vintage turntables, swirly patterned dance floor below, " +
      "warm orange and purple lighting, no people, " + STYLE,
    aspect: "9:16", w: 768, h: 1280 },
  { name: "room-house-portrait.png",
    prompt:
      "vertical portrait composition of an underground house music bunker, concrete walls, " +
      "DJ booth in upper half with five CDJs and a mixer, dance floor below, " +
      "blue and cyan laser lights, subwoofer stacks, fog haze, no people, " + STYLE,
    aspect: "9:16", w: 768, h: 1280 },
  { name: "room-lofi-portrait.png",
    prompt:
      "vertical portrait composition of a cozy lofi bedroom studio at night, fairy lights and plants on the walls, " +
      "DJ booth in upper half with five cassette players and a small sampler, " +
      "plush rug dance area below, soft warm yellow lamp glow, no people, " + STYLE,
    aspect: "9:16", w: 768, h: 1280 },
  { name: "room-hiphop.png",
    prompt:
      "isometric view of a brick-walled hip hop lounge, graffiti backdrop, " +
      "five DJ decks at the back with vinyl turntables and an MPC sampler, " +
      "gold neon accents, dim warm lighting, boombox in the corner, no people, " + STYLE,
    aspect: "16:9", w: 1280, h: 768 },
  { name: "room-psych.png",
    prompt:
      "isometric view of a psychedelic 1970s rock club, lava-lamp blob backdrop, " +
      "five DJ decks at the back with vintage turntables, " +
      "warm orange and purple lighting, swirly patterned floor, no people, " + STYLE,
    aspect: "16:9", w: 1280, h: 768 },
  { name: "room-house.png",
    prompt:
      "isometric view of an underground house music bunker, concrete walls, " +
      "five DJ decks at the back with CDJs and a mixer, blue and cyan laser lights, " +
      "subwoofer stacks, fog haze, no people, " + STYLE,
    aspect: "16:9", w: 1280, h: 768 },
  { name: "room-lofi.png",
    prompt:
      "isometric pixel-art cozy lofi bedroom studio at night, fairy lights, hanging plants, " +
      "five DJ decks lined up at the back with cassette players and a small sampler, " +
      "soft warm yellow lamp glow, plush rug, no people, " + STYLE,
    aspect: "16:9", w: 1280, h: 768 },
  { name: "logo.png",
    prompt:
      "big chunky vector wordmark that reads 'TURNTABLE FM', retro 2010s web logo, " +
      "pink and purple gradient text, vinyl record replacing the dot on the i, solid dark navy background, centered, " + STYLE,
    aspect: "2:1", w: 1024, h: 512 },
  { name: "av-yeti.png",  prompt: "full body chibi pixel-art yeti character standing pose, white fluffy fur, big black eyes, headphones, holding small vinyl record, NO BACKGROUND, solid flat black background fully transparent #000000, character isolated on pure black, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-robot.png", prompt: "chibi pixel-art square robot DJ character standing, glowing cyan eyes, antenna on head, big headphones, full body visible, pure black solid background, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-panda.png", prompt: "pixel-art mascot bear character with black and white fur, big circular ears, dj headphones, baseball cap, cute simple shapes, standing pose, solid pure black background, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-ninja.png", prompt: "full body chibi pixel-art ninja character standing pose, red headband, big anime eyes, headphones, NO BACKGROUND, solid flat black background fully transparent #000000, character isolated on pure black, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-fox.png",   prompt: "pixel-art mascot orange canine character with pointy ears, fluffy curly tail, dj headphones, smiling, cute simple shapes, standing pose, solid pure black background, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-alien.png", prompt: "chibi pixel-art friendly lime green alien DJ character standing, three round eyes, single head antenna, big headphones, full body visible, pure black solid background, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-cat.png",   prompt: "full body chibi pixel-art orange tabby cat character standing pose, big black headphones, content half-closed eyes, NO BACKGROUND, solid flat black background fully transparent #000000, character isolated on pure black, " + STYLE, aspect: "1:1", w: 768, h: 768 },
  { name: "av-shark.png", prompt: "full body chibi pixel-art blue shark character standing pose, big toothy grin, headphones, NO BACKGROUND, solid flat black background fully transparent #000000, character isolated on pure black, " + STYLE, aspect: "1:1", w: 768, h: 768 },
];

function buildInput(app, job) {
  if (app.startsWith("google/nano-banana") || app === "google/gemini-2-5-flash-image") {
    return { prompt: job.prompt, aspect_ratio: job.aspect, num_images: 1, output_format: "png" };
  }
  if (app === "bytedance/seedream-4-0") {
    return { prompt: job.prompt, size: "2K" };
  }
  if (app === "xai/grok-imagine-image-quality") {
    return { prompt: job.prompt };
  }
  // flux / sdxl / hidream — use width/height
  return {
    prompt: job.prompt,
    negative_prompt: NEG,
    width: job.w,
    height: job.h,
  };
}

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const txt = await res.text();
  let body;
  try { body = JSON.parse(txt); } catch { body = txt; }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${txt.slice(0, 400)}`);
  return body;
}

async function pickApp() {
  // qwen-image had upstream init failures, falling back to current top-tier image models.
  const candidates = [
    "bytedance/seedream-4-0",    // latest seedream (2026)
    "google/nano-banana",        // gemini 2.5 flash image
    "google/gemini-2-5-flash-image",
    "infsh/flux-1-dev",
    "infsh/hidream-i1",
    "xai/grok-imagine-image-quality",
    "infsh/sdxl",
  ];
  for (const c of candidates) {
    try {
      const [ns, name] = c.split("/");
      const r = await api(`/apps/${ns}/${name}`);
      if (r?.success && r?.data) {
        console.log("✓ using app:", c);
        return c;
      }
    } catch { /* keep trying */ }
  }
  throw new Error("no image app available");
}

async function run(app, input) {
  const submit = await api(`/run`, {
    method: "POST",
    body: JSON.stringify({ app, input }),
  });
  const id = submit?.data?.id ?? submit?.id;
  if (!id) throw new Error("no task id in submit response: " + JSON.stringify(submit).slice(0, 300));
  // status codes: 1=received, ...running..., 9=completed (no output ready?), 10=completed-with-output, 11=cancelled/failed
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    const t = await api(`/tasks/${id}`);
    const data = t?.data ?? t;
    const status = data?.status;
    if (data?.output) return data;
    if (status === 9 || status === 10) return data;
    if (status === 11 || data?.error) {
      throw new Error(`task ${id} failed: ${JSON.stringify(data?.error ?? data?.status_text ?? "")}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`task ${id} timed out`);
}

function pickUrlFromOutput(out) {
  if (!out) return null;
  // common shapes
  if (typeof out === "string" && out.startsWith("http")) return out;
  if (Array.isArray(out)) {
    for (const o of out) {
      const u = pickUrlFromOutput(o);
      if (u) return u;
    }
  }
  if (typeof out === "object") {
    if (out.uri && typeof out.uri === "string") return out.uri;
    if (out.url && typeof out.url === "string") return out.url;
    if (out.image && typeof out.image === "string") return out.image;
    for (const k of ["images", "outputs", "result", "data"]) {
      if (out[k]) {
        const u = pickUrlFromOutput(out[k]);
        if (u) return u;
      }
    }
    for (const v of Object.values(out)) {
      const u = pickUrlFromOutput(v);
      if (u) return u;
    }
  }
  return null;
}

async function downloadTo(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}: ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const app = await pickApp();
  for (const job of JOBS) {
    const dest = path.join(outDir, job.name);
    if (existsSync(dest)) {
      console.log("·", job.name, "(skip — already exists)");
      continue;
    }
    console.log("→", job.name);
    try {
      const input = buildInput(app, job);
      const res = await run(app, input);
      const url = pickUrlFromOutput(res?.output ?? res);
      if (!url) {
        console.error("  no url in response; dumping:", JSON.stringify(res).slice(0, 400));
        continue;
      }
      const size = await downloadTo(url, dest);
      console.log("  ✓", dest, `(${(size / 1024).toFixed(0)}kb)`);
    } catch (e) {
      console.error("  ✗", job.name, e.message);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
