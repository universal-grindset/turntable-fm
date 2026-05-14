import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore, setMyName, setMyAvatar, setVolume } from "../lib/store";
import { AVATAR_IMAGES } from "../lib/utils";
import { Volume2, VolumeX, Pencil, Check } from "lucide-react";

export function MeBar() {
  const me = useStore(roomStore, (s) => s.me);
  const volume = useStore(roomStore, (s) => s.volume);
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(false);
  const [name, setName] = useState(me.name);

  function commitName() {
    const t = name.trim();
    if (t) setMyName(t);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setPicker((p) => !p)}
          className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/20 hover:ring-accent/60"
          style={{ background: me.color }}
          title="change avatar"
        >
          {me.avatar.startsWith("/") ? (
            <img
              src={me.avatar}
              alt={me.name}
              className="h-full w-full object-cover"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <span className="text-xl">{me.avatar}</span>
          )}
        </button>

        {picker && (
          <div className="absolute left-0 top-12 z-50 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-bg-2 p-2 shadow-xl">
            {AVATAR_IMAGES.map((src) => (
              <button
                key={src}
                onClick={() => {
                  setMyAvatar(src);
                  setPicker(false);
                }}
                className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/10 hover:ring-accent/60"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <input
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitName()}
                className="w-32 rounded-md bg-white/5 px-2 py-1 text-sm outline-none ring-1 ring-white/20"
              />
              <button
                onClick={commitName}
                className="rounded-md bg-accent/70 p-1 text-white"
              >
                <Check size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="text-sm font-medium">{me.name}</div>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md p-1 text-white/40 hover:bg-white/5 hover:text-white"
                title="rename"
              >
                <Pencil size={12} />
              </button>
            </>
          )}
          {me.points > 0 && (
            <div className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold ring-1 ring-gold/30">
              ★ {me.points}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 70)}
          className="text-white/70 hover:text-white"
        >
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="range-volume w-32"
          aria-label="Volume"
        />
        <span className="w-8 text-right font-mono text-[11px] tabular-nums text-white/60">
          {volume}
        </span>
      </div>
    </div>
  );
}
