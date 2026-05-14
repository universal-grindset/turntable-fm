import { useStore } from "@tanstack/react-store";
import { roomStore, joinAsDj, leaveDj } from "../lib/store";
import { Avatar } from "./Avatar";
import { cn } from "../lib/utils";

// 5 stage slot positions as percentages of the room background.
// Tuned to align with the pixel-art turntable decks in /img/room.png.
const STAGE_X = [18, 33, 48, 63, 78];
const STAGE_Y = 48;

export function RoomStage() {
  const djs = useStore(roomStore, (s) => s.djs);
  const users = useStore(roomStore, (s) => s.users);
  const currentDj = useStore(roomStore, (s) => s.currentDj);
  const me = useStore(roomStore, (s) => s.me);
  const meIsDj = djs.some((d) => d.userId === me.id);

  const djIds = new Set(djs.map((d) => d.userId).filter(Boolean) as string[]);
  const crowd = Object.values(users).filter((u) => !djIds.has(u.id));

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
      style={{
        backgroundImage: "url(/img/room.png)",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    >
      {/* DJ slots, anchored above each turntable deck */}
      {djs.map((slot, i) => {
        const user = slot.userId ? users[slot.userId] : null;
        const isCurrent = currentDj === i;
        const empty = !user;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${STAGE_X[i]}%`, top: `${STAGE_Y}%` }}
          >
            {empty ? (
              <button
                onClick={() => !meIsDj && joinAsDj()}
                disabled={meIsDj}
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-black/30 text-white/70 backdrop-blur-sm transition hover:border-accent hover:bg-accent/30 hover:text-white disabled:opacity-40 disabled:hover:border-white/40 disabled:hover:bg-black/30"
                title={meIsDj ? "you're already DJing" : "step up to DJ"}
              >
                <span className="text-2xl leading-none">+</span>
              </button>
            ) : (
              <div className="relative flex flex-col items-center">
                <Avatar
                  user={user}
                  size={56}
                  dancing={isCurrent}
                  active={isCurrent}
                />
                <div
                  className={cn(
                    "mt-1 max-w-[72px] truncate rounded px-1.5 py-px text-[9px] font-semibold",
                    isCurrent
                      ? "bg-accent text-white shadow"
                      : "bg-black/70 text-white/90"
                  )}
                >
                  {user.name}
                </div>
                {(user.points > 0 || slot.queue.length > 0) && (
                  <div className="mt-0.5 flex items-center gap-1">
                    {user.points > 0 && (
                      <div className="rounded-full bg-gold/90 px-1 text-[9px] font-bold leading-tight text-black">
                        ★{user.points}
                      </div>
                    )}
                    {slot.queue.length > 0 && (
                      <div className="rounded-full bg-black/70 px-1 text-[9px] leading-tight text-white/85">
                        {slot.queue.length}q
                      </div>
                    )}
                  </div>
                )}
                {user.id === me.id && (
                  <button
                    onClick={leaveDj}
                    className="absolute -right-2 -top-2 rounded-full bg-black/80 px-1.5 py-px text-[9px] text-white/80 ring-1 ring-white/20 hover:bg-white/20"
                    title="step down"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Booth label */}
      <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-0.5 text-[10px] uppercase tracking-[0.3em] text-white/80 ring-1 ring-white/10">
        the booth
      </div>

      {/* Dancefloor crowd — anchored on the spotlight in the foreground */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "50%", top: "78%", width: "72%" }}
      >
        <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-0.5">
          {crowd.slice(0, 30).map((u, i) => (
            <div
              key={u.id}
              className="dance-slow"
              style={{ animationDelay: `${(i % 6) * 0.1}s` }}
            >
              <Avatar user={u} size={32} />
            </div>
          ))}
          {crowd.length > 30 && (
            <div className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/70 ring-1 ring-white/10">
              +{crowd.length - 30}
            </div>
          )}
        </div>
      </div>

      {/* Crowd count chip */}
      <div className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80 ring-1 ring-white/10">
        {crowd.length} in the crowd
      </div>
    </div>
  );
}
