import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore, vote, advance } from "../lib/store";
import { fmtTime } from "../lib/utils";
import { SkipForward, ThumbsDown, Heart } from "lucide-react";

export function NowPlaying() {
  const track = useStore(roomStore, (s) => s.currentTrack);
  const startedAt = useStore(roomStore, (s) => s.trackStartedAt);
  const awesomes = useStore(roomStore, (s) => s.awesomesThisSpin);
  const lames = useStore(roomStore, (s) => s.lamesThisSpin);
  const myVote = useStore(roomStore, (s) => s.votes[s.me.id]);
  const burstAt = useStore(roomStore, (s) => s.awesomeBurstAt);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = track && startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const total = track?.durationSec ?? 0;
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;

  if (!track) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-white/60">
        no DJ is spinning — step up to the booth and queue a track 🎧
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-accent-2/30 via-accent/20 to-accent/30 px-5 py-4">
      <div className="flex items-center gap-4">
        <div
          className="platter relative h-16 w-16 shrink-0 rounded-full bg-black ring-4 ring-white/20"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, #ff3bd4 2px, #000 3px), repeating-radial-gradient(circle, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px)",
          }}
        >
          <div className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-white/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-widest text-white/60">
            Now Spinning
          </div>
          <div className="truncate text-lg font-semibold text-glow">{track.title}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-2"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-20 text-right font-mono text-[11px] tabular-nums text-white/70">
              {fmtTime(elapsed)}
              {total ? ` / ${fmtTime(total)}` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => vote("lame")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
              myVote === "lame"
                ? "bg-lame/20 text-lame ring-2 ring-lame/60"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
            title="lame"
          >
            <ThumbsDown size={16} />
            <span className="tabular-nums">{lames}</span>
          </button>
          <button
            onClick={() => vote("awesome")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
              myVote === "awesome"
                ? "bg-awesome/20 text-awesome ring-2 ring-awesome/60"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
            title="awesome"
          >
            <Heart size={16} fill={myVote === "awesome" ? "currentColor" : "none"} />
            <span className="tabular-nums">{awesomes}</span>
          </button>
          <button
            onClick={() => advance()}
            className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10"
            title="skip"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {burstAt && Date.now() - burstAt < 1200 && (
        <div
          key={burstAt}
          className="float-up pointer-events-none absolute right-24 top-2 text-3xl"
        >
          💜
        </div>
      )}
    </div>
  );
}
