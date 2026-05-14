import { type ReactNode, useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore } from "../lib/store";
import { Disc3, Music2, MessageCircle } from "lucide-react";
import { cn } from "../lib/utils";

type Tab = "room" | "queue" | "chat";

type Props = {
  room: ReactNode;
  queue: ReactNode;
  chat: ReactNode;
};

export function MobileTabs({ room, queue, chat }: Props) {
  const [tab, setTab] = useState<Tab>("room");
  const chatLen = useStore(roomStore, (s) => s.chat.length);
  const [unread, setUnread] = useState(0);

  // Increment unread when chat grows and we're not on the chat tab.
  useEffect(() => {
    if (tab !== "chat") setUnread((u) => u + 1);
    // intentional: only react to chatLen changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatLen]);

  useEffect(() => {
    if (tab === "chat") setUnread(0);
  }, [tab]);

  // Render all three panes but only show the active one; this preserves
  // state (scroll, in-progress input, YT player position) across tabs.
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={cn("h-full", tab === "room" ? "block" : "hidden")}>{room}</div>
        <div className={cn("h-full", tab === "queue" ? "block" : "hidden")}>{queue}</div>
        <div className={cn("h-full", tab === "chat" ? "block" : "hidden")}>{chat}</div>
      </div>
      <nav className="flex shrink-0 items-center justify-around border-t border-white/10 bg-black/60 px-2 py-1 backdrop-blur">
        <TabButton active={tab === "room"} onClick={() => setTab("room")} icon={<Disc3 size={18} />} label="room" />
        <TabButton active={tab === "queue"} onClick={() => setTab("queue")} icon={<Music2 size={18} />} label="queue" />
        <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<MessageCircle size={18} />} label="chat" badge={unread} />
      </nav>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[11px] uppercase tracking-widest transition",
        active ? "text-accent" : "text-white/60 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent" />
      )}
      {badge !== undefined && badge > 0 && !active && (
        <span className="absolute right-2 top-0.5 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}
