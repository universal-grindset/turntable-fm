import { useStore } from "@tanstack/react-store";
import { roomStore, joinAsDj, leaveDj } from "../lib/store";
import { Avatar } from "./Avatar";
import { cn } from "../lib/utils";

export function DjBooth() {
  const djs = useStore(roomStore, (s) => s.djs);
  const users = useStore(roomStore, (s) => s.users);
  const currentDj = useStore(roomStore, (s) => s.currentDj);
  const me = useStore(roomStore, (s) => s.me);
  const meIsDj = djs.some((d) => d.userId === me.id);

  return (
    <div className="relative">
      <div
        className="rounded-2xl border border-white/10 px-4 pt-6 pb-4 backdrop-blur"
        style={{
          background:
            "linear-gradient(180deg, rgba(42,23,72,0.85) 0%, rgba(26,15,46,0.95) 100%)",
        }}
      >
        <div className="absolute inset-x-0 -top-3 mx-auto flex w-fit items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-[11px] uppercase tracking-widest text-accent ring-1 ring-accent/40">
          The Booth
        </div>

        <div className="grid grid-cols-5 gap-3">
          {djs.map((slot, i) => {
            const user = slot.userId ? users[slot.userId] : null;
            const isCurrent = currentDj === i;
            const empty = !user;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex flex-col items-center justify-end rounded-xl border p-3",
                  empty
                    ? "border-dashed border-white/15 bg-white/5"
                    : "border-white/10 bg-black/30",
                  isCurrent && "border-accent/60 glow-pink"
                )}
                style={{ minHeight: 150 }}
              >
                {empty ? (
                  <button
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-[12px] text-white/60 hover:text-white"
                    onClick={() => !meIsDj && joinAsDj()}
                    disabled={meIsDj}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-xl">
                      +
                    </div>
                    <span>{meIsDj ? "" : "step up"}</span>
                  </button>
                ) : (
                  <>
                    <Avatar
                      user={user}
                      size={64}
                      dancing={isCurrent}
                      active={isCurrent}
                      showName
                      showPoints
                    />
                    {/* deck */}
                    <div className="mt-2 flex items-center gap-1">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full bg-black ring-2 ring-white/30",
                          isCurrent && "platter"
                        )}
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at center, #444 1px, #000 2px), radial-gradient(circle at center, transparent 60%, rgba(255,255,255,0.05) 61%)",
                          backgroundSize: "100% 100%",
                        }}
                      />
                      <div className="text-[10px] text-white/50">
                        {slot.queue.length} q
                      </div>
                    </div>

                    {user.id === me.id && (
                      <button
                        onClick={() => leaveDj()}
                        className="absolute right-1 top-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] hover:bg-white/20"
                      >
                        step down
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* stage lights */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full blink"
              style={{
                background: i % 3 === 0 ? "#ff3bd4" : i % 3 === 1 ? "#7c5cff" : "#ffcb47",
                animationDelay: `${i * 0.1}s`,
                boxShadow: "0 0 8px currentColor",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
