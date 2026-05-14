import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ROOMS } from "../lib/rooms";
import { List, X } from "lucide-react";

type Props = { currentRoomId: string };

export function RoomPicker({ currentRoomId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded p-1 text-white/60 hover:bg-white/10"
        title="list rooms"
      >
        <List size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-bg-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <div className="text-xs uppercase tracking-widest text-white/60">
                rooms
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-white/60 hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
              {ROOMS.map((r) => {
                const isCurrent = r.id === currentRoomId;
                return (
                  <Link
                    key={r.id}
                    to="/r/$roomId"
                    params={{ roomId: r.id }}
                    onClick={() => setOpen(false)}
                    className={`group relative overflow-hidden rounded-xl border ${
                      isCurrent
                        ? "border-accent ring-2 ring-accent/40"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div
                      className="aspect-[16/9] w-full"
                      style={{
                        backgroundImage: `url(${r.background})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        imageRendering: "pixelated",
                      }}
                    />
                    <div className="flex items-center justify-between gap-2 bg-black/60 px-3 py-2 backdrop-blur">
                      <div>
                        <div className="text-sm font-bold text-gold">{r.name}</div>
                        <div className="text-[11px] uppercase tracking-widest text-white/60">
                          {r.tagline}
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent ring-1 ring-accent/50">
                          here
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
