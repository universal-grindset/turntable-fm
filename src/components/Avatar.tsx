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
};

export function Avatar({
  user,
  size = 56,
  dancing = false,
  active = false,
  showName = false,
  showPoints = false,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = user.avatar.startsWith("/") || user.avatar.startsWith("http");
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className={cn(
          "relative rounded-full ring-2 ring-white/20 overflow-hidden",
          active && "ring-4 glow-pink",
          dancing && "dance"
        )}
        style={{
          width: size,
          height: size,
          background: user.color,
        }}
        title={user.name}
      >
        {isImage && !imgFailed ? (
          <img
            src={user.avatar}
            alt={user.name}
            width={size}
            height={size}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-2xl"
            style={{ fontSize: size * 0.55 }}
          >
            {isImage ? user.name[0]?.toUpperCase() ?? "?" : user.avatar}
          </div>
        )}
      </div>
      {showName && (
        <div className="text-[11px] text-white/90 max-w-[80px] truncate text-center font-medium">
          {user.name}
        </div>
      )}
      {showPoints && user.points > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-black/40 px-1.5 text-[10px] text-gold ring-1 ring-gold/40">
          ★ {user.points}
        </div>
      )}
    </div>
  );
}
