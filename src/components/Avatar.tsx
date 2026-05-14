import { useState } from "react";
import type { User } from "../lib/store";
import { cn } from "../lib/utils";

type Props = {
  user: User;
  size?: number;
  dancing?: boolean;
  active?: boolean;
  showName?: boolean;
  showPoints?: boolean;
  // "circle" — old behavior, cropped headshot circle (still used in chat / tight areas)
  // "card"   — tall rectangle showing the full pixel-art character
  variant?: "circle" | "card";
};

export function Avatar({
  user,
  size = 56,
  dancing = false,
  active = false,
  showName = false,
  showPoints = false,
  variant = "card",
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = user.avatar.startsWith("/") || user.avatar.startsWith("http");

  if (variant === "circle") {
    return (
      <div className="flex flex-col items-center gap-1 select-none">
        <div
          className={cn(
            "relative overflow-hidden rounded-full ring-2",
            active ? "ring-accent glow-pink" : "ring-white/30",
            dancing && "dance"
          )}
          style={{ width: size, height: size, background: user.color }}
          title={user.name}
        >
          {isImage && !imgFailed ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-full w-full object-cover"
              style={{ imageRendering: "pixelated" }}
              onError={() => setImgFailed(true)}
              draggable={false}
            />
          ) : (
            <div className="grid h-full w-full place-items-center font-bold text-white" style={{ fontSize: size * 0.5 }}>
              {isImage ? user.name[0]?.toUpperCase() ?? "?" : user.avatar}
            </div>
          )}
        </div>
        {showName && (
          <div className="text-[11px] text-white/90 max-w-[80px] truncate text-center font-medium">
            {user.name}
          </div>
        )}
      </div>
    );
  }

  // Card variant — show the whole character. Aspect 3:4 fits the full-body
  // pixel art comfortably.
  const w = size;
  const h = Math.round(size * 1.25);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className={cn(
          "relative",
          dancing && "dance"
        )}
        style={{ width: w, height: h }}
        title={user.name}
      >
        {/* drop shadow plate so the character anchors to the scene */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%]"
          style={{
            width: w * 0.7,
            height: 6,
            background: "rgba(0,0,0,0.55)",
            filter: "blur(2px)",
          }}
        />
        {isImage && !imgFailed ? (
          <img
            src={user.avatar}
            alt={user.name}
            className={cn(
              "h-full w-full object-contain",
              active && "drop-shadow-[0_0_6px_rgba(255,59,212,0.8)]"
            )}
            style={{
              imageRendering: "pixelated",
              filter: active ? `drop-shadow(0 0 4px ${user.color})` : `drop-shadow(0 1px 2px rgba(0,0,0,0.7))`,
            }}
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center rounded-lg font-bold text-white"
            style={{ background: user.color, fontSize: w * 0.4 }}
          >
            {isImage ? user.name[0]?.toUpperCase() ?? "?" : user.avatar}
          </div>
        )}
      </div>
      {showName && (
        <div
          className={cn(
            "max-w-[88px] truncate rounded px-1 text-center text-[10px] font-semibold",
            active ? "bg-accent text-white" : "bg-black/60 text-white/90"
          )}
        >
          {user.name}
        </div>
      )}
      {showPoints && user.points > 0 && (
        <div className="rounded-full bg-gold/90 px-1 text-[9px] font-bold leading-tight text-black">
          ★ {user.points}
        </div>
      )}
    </div>
  );
}
