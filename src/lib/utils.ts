export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

const PALETTE = [
  "#ff3bd4", "#7c5cff", "#2ee6a8", "#ffcb47", "#ff8c42",
  "#42c9ff", "#f06292", "#a3e635", "#fb7185", "#60a5fa",
];

export function pickColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export const AVATAR_IMAGES = [
  "/img/av-yeti.png",
  "/img/av-robot.png",
  "/img/av-panda.png",
  "/img/av-ninja.png",
  "/img/av-fox.png",
  "/img/av-alien.png",
  "/img/av-cat.png",
  "/img/av-shark.png",
] as const;

export const EMOJI_FALLBACKS = ["🦄", "🤖", "🐼", "🥷", "🦊", "👽", "🐱", "🦈", "🐸", "🦉"];
