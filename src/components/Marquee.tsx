import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore, vote, advance } from "../lib/store";
import { fmtTime } from "../lib/utils";
import { Heart, ThumbsDown, SkipForward } from "lucide-react";

type Props = { accent?: string };

// LED dot-matrix marquee in the style of the original turntable.fm front
// panel — red/orange dots, scrolling track title, elapsed time.
export function Marquee({ accent = "#ff5f1f" }: Props = {}) {
  const track = useStore(roomStore, (s) => s.currentTrack);
  const startedAt = useStore(roomStore, (s) => s.trackStartedAt);
  const awesomes = useStore(roomStore, (s) => s.awesomesThisSpin);
  const lames = useStore(roomStore, (s) => s.lamesThisSpin);
  const myVote = useStore(roomStore, (s) => s.votes[s.me.id]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = track && startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const display = track
    ? `♪  ${track.title.toUpperCase()}  ·  ${fmtTime(elapsed)}${
        track.durationSec ? ` / ${fmtTime(track.durationSec)}` : ""
      }`
    : "♪  WAITING FOR A DJ TO STEP UP  ·  STEP UP TO THE BOOTH";

  // Decide if we need to scroll — text wider than ~36 chars
  const shouldScroll = display.length > 36;

  return (
    <div className="flex items-center gap-2">
      <Speaker side="left" pulsing={!!track} />

      <div
        className="relative flex-1 overflow-hidden rounded-md border-2 border-black/80 bg-black px-4 py-2 shadow-inner"
        style={{
          background:
            "radial-gradient(circle at center, #1a0000 0%, #000 80%), repeating-linear-gradient(0deg, rgba(255,80,0,0.05) 0 2px, transparent 2px 4px)",
        }}
      >
        <div
          className="font-mono text-[18px] font-bold uppercase whitespace-nowrap tabular-nums tracking-wider"
          style={{
            color: accent,
            textShadow: `0 0 6px ${accent}e6, 0 0 14px ${accent}99`,
            fontFamily: '"DM Mono", "JetBrains Mono", "Courier New", monospace',
          }}
        >
          {shouldScroll ? (
            <ScrollingText text={display + "        "} />
          ) : (
            <span>{display}</span>
          )}
        </div>

        {/* scanline overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0 1px, transparent 1px 3px)",
          }}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => vote("lame")}
          className={`flex h-10 items-center gap-1 rounded-full px-2.5 text-sm transition active:scale-95 ${
            myVote === "lame"
              ? "bg-lame/25 text-lame ring-2 ring-lame/60"
              : "bg-black/40 text-white/70 hover:bg-white/10"
          }`}
          title="lame"
          aria-label="vote lame"
        >
          <ThumbsDown size={16} />
          <span className="tabular-nums text-xs">{lames}</span>
        </button>
        <button
          onClick={() => vote("awesome")}
          className={`flex h-10 items-center gap-1 rounded-full px-2.5 text-sm transition active:scale-95 ${
            myVote === "awesome"
              ? "bg-awesome/25 text-awesome ring-2 ring-awesome/60"
              : "bg-black/40 text-white/70 hover:bg-white/10"
          }`}
          title="awesome"
          aria-label="vote awesome"
        >
          <Heart size={16} fill={myVote === "awesome" ? "currentColor" : "none"} />
          <span className="tabular-nums text-xs">{awesomes}</span>
        </button>
        <button
          onClick={() => advance()}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white/60 hover:bg-white/10 active:scale-95"
          title="skip"
          aria-label="skip track"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <Speaker side="right" pulsing={!!track} />
    </div>
  );
}

function ScrollingText({ text }: { text: string }) {
  const repeated = text + text;
  return (
    <div className="inline-block animate-[marquee_18s_linear_infinite]">
      {repeated}
    </div>
  );
}

function Speaker({ side, pulsing }: { side: "left" | "right"; pulsing: boolean }) {
  return (
    <div
      className="relative grid h-12 w-12 shrink-0 place-items-center rounded-md ring-1 ring-black/40"
      style={{
        background:
          "linear-gradient(135deg, #2a1810 0%, #1a0e08 60%, #0a0604 100%)",
        boxShadow: "inset 0 0 0 2px #5c3a22, 0 4px 12px rgba(0,0,0,0.4)",
      }}
      title={`speaker ${side}`}
    >
      <div
        className={`h-8 w-8 rounded-full ${pulsing ? "dance-slow" : ""}`}
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #555 0%, #1a1a1a 40%, #050505 80%)",
          boxShadow: "inset 0 0 0 2px #2a2a2a, inset 0 -2px 4px rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="m-auto h-2 w-2 translate-y-3 rounded-full"
          style={{ background: "#0a0a0a", boxShadow: "inset 0 0 0 1px #333" }}
        />
      </div>
    </div>
  );
}
