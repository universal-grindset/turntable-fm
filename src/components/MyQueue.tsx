import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore, enqueue, removeFromQueue, DEMO_TRACKS } from "../lib/store";
import { Plus, X, Music2 } from "lucide-react";

function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  // direct id
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // shorts
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
    const j = (await r.json()) as { title?: string; author_name?: string };
    return j.title ?? `youtube ${id}`;
  } catch {
    return `youtube ${id}`;
  }
}

export function MyQueue() {
  const me = useStore(roomStore, (s) => s.me);
  const djs = useStore(roomStore, (s) => s.djs);
  const mySlot = djs.find((d) => d.userId === me.id);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function addByInput() {
    const id = parseYouTubeId(input);
    if (!id || !mySlot) return;
    setBusy(true);
    const title = await fetchTitle(id);
    enqueue(me.id, { videoId: id, title });
    setInput("");
    setBusy(false);
  }

  if (!mySlot) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
        step up to the booth to start a queue.
      </div>
    );
  }

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
        >
          <Plus size={14} />
        </button>
      </div>

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
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {mySlot.queue.length === 0 && (
          <div className="text-xs text-white/40">
            queue is empty. quick picks:
            <div className="mt-1 flex flex-wrap gap-1">
              {DEMO_TRACKS.map((t) => (
                <button
                  key={t.videoId}
                  onClick={() => enqueue(me.id, t)}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20"
                >
                  {t.title.split(" — ")[1] ?? t.title.slice(0, 24)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
