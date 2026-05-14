import { useStore } from "@tanstack/react-store";
import { roomStore } from "../lib/store";
import { Avatar } from "./Avatar";

export function Crowd() {
  const users = useStore(roomStore, (s) => s.users);
  const djs = useStore(roomStore, (s) => s.djs);
  const djIds = new Set(djs.map((d) => d.userId).filter(Boolean) as string[]);
  const crowd = Object.values(users).filter((u) => !djIds.has(u.id));

  return (
    <div className="relative">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
        }}
      />
      <div className="flex flex-wrap items-end justify-center gap-3 px-4 py-6">
        {crowd.map((u, i) => (
          <div key={u.id} style={{ animationDelay: `${i * 0.1}s` }} className="dance-slow">
            <Avatar user={u} size={44} showName />
          </div>
        ))}
        {crowd.length === 0 && (
          <div className="text-sm text-white/40">
            the crowd is quiet — invite some friends in 💃
          </div>
        )}
      </div>
    </div>
  );
}
