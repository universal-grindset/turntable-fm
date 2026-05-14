import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { useParams } from "@tanstack/react-router";
import { roomStore, enqueue, removeFromQueue, type Track } from "../lib/store";
import { getPool } from "../lib/track-pools";
import { Plus, X, Music2, Sparkles, Loader2 } from "lucide-react";

function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const seg = u.pathname.split("/").filter(Boolean);
      const i = seg.indexOf("shorts");
      if (i >= 0 && seg[i + 1]) return seg[i + 1];
      if (seg[0] === "embed" && seg[1]) return seg[1];
    }
  } catch { /* not a url */ }
  return null;
}

async function fetchTitle(id: string): Promise<string> {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${id}`
      )}&format=json`
    );
    if (!r.ok) return `youtube ${id}`;
    const j = (await r.json()) as { title?: string };
    return j.title ?? `youtube ${id}`;
  } catch {
    return `youtube ${id}`;
  }
}

export function MyQueue() {
  const me = useStore(roomStore, (s) => s.me);
  const djs = useStore(roomStore, (s) => s.djs);
  const currentTrack = useStore(roomStore, (s) => s.currentTrack);
  const mySlot = djs.find((d) => d.userId === me.id);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Find the roomId from the URL params
  let roomId = "the-basement";
  try {
    const p = useParams({ strict: false }) as { roomId?: string };
    if (p?.roomId) roomId = p.roomId;
  } catch {
    /* not in a route context — leave default */
  }

  async function addByInput() {
    const id = parseYouTubeId(input);
    if (!id || !mySlot) return;
    setBusy(true);
    const title = await fetchTitle(id);
    enqueue(me.id, { videoId: id, title });
    setInput("");
    setBusy(false);
  }

  async function askAiDj(count: number) {
    if (!mySlot) return;
    setAiBusy(true);
    setAiNote(null);
    try {
      const recentTitles = [
        ...(currentTrack ? [currentTrack.title] : []),
        ...mySlot.queue.map((t) => t.title),
      ].slice(0, 8);
      const r = await fetch("/api/aidj", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roomId, recentTitles, count }),
      });
      const j = (await r.json()) as {
        tracks?: Track[];
        reasoning?: string;
        provider?: string;
      };
      if (j.tracks) {
        for (const t of j.tracks) enqueue(me.id, t);
        setAiNote(`${j.provider === "anthropic" ? "🤖 claude" : "🎲 picked"}: ${j.reasoning ?? ""}`);
      } else {
        setAiNote("ai dj is offline");
      }
    } catch (e) {
      setAiNote("ai dj failed: " + (e as Error).message);
    } finally {
      setAiBusy(false);
    }
  }

  if (!mySlot) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
        step up to the booth to start a queue.
      </div>
    );
  }

  const pool = getPool(roomId);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
        <Music2 size={14} /> your queue
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addByInput()}
          placeholder="paste a youtube url or video id…"
          className="flex-1 rounded-md bg-white/5 px-3 py-1.5 text-sm placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-accent/50"
          disabled={busy}
        />
        <button
          onClick={addByInput}
          disabled={!parseYouTubeId(input) || busy}
          className="rounded-md bg-accent/80 px-2 py-1.5 text-white hover:bg-accent disabled:opacity-40"
          title="add to queue"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => askAiDj(3)}
          disabled={aiBusy}
          className="flex items-center gap-1 rounded-md bg-gradient-to-br from-accent to-accent-2 px-2.5 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 disabled:opacity-40"
          title="have AI DJ pick 3 tracks for this room"
        >
          {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span className="hidden sm:inline">ai dj</span>
        </button>
      </div>

      {aiNote && (
        <div className="rounded-md bg-accent-2/15 px-2 py-1 text-[11px] text-accent-2 ring-1 ring-accent-2/30">
          {aiNote}
        </div>
      )}

      <div className="space-y-1">
        {mySlot.queue.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-sm"
          >
            <span className="w-5 text-right text-white/40 tabular-nums">{i + 1}</span>
            <span className="flex-1 truncate">{t.title}</span>
            <button
              onClick={() => removeFromQueue(me.id, i)}
              className="text-white/40 hover:text-white"
              title="remove"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {mySlot.queue.length === 0 && (
          <div className="text-xs text-white/40">
            queue is empty. quick picks for this room:
            <div className="mt-1 flex flex-wrap gap-1">
              {pool.slice(0, 6).map((t) => (
                <button
                  key={t.videoId}
                  onClick={() => enqueue(me.id, t)}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
                >
                  {t.title.split(" — ").slice(-1)[0]?.slice(0, 24) ?? t.title.slice(0, 24)}
                </button>
              ))}
              <button
                onClick={() => askAiDj(5)}
                disabled={aiBusy}
                className="flex items-center gap-1 rounded-full bg-gradient-to-br from-accent/80 to-accent-2/80 px-2 py-0.5 text-[11px] font-semibold text-white disabled:opacity-40"
              >
                <Sparkles size={10} /> ai picks 5
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
