import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore, pushChat } from "../lib/store";
import { Send } from "lucide-react";

export function Chat() {
  const chat = useStore(roomStore, (s) => s.chat);
  const users = useStore(roomStore, (s) => s.users);
  const me = useStore(roomStore, (s) => s.me);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat.length]);

  function send() {
    const t = text.trim();
    if (!t) return;
    pushChat(t);
    setText("");
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/30 backdrop-blur">
      <div className="border-b border-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white/60">
        chat
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {chat.map((m) => {
          const u = users[m.userId];
          if (m.kind === "system" || m.kind === "spin") {
            return (
              <div
                key={m.id}
                className={`text-[12px] italic ${
                  m.kind === "spin" ? "text-accent" : "text-white/40"
                }`}
              >
                · {m.text}
              </div>
            );
          }
          return (
            <div key={m.id} className="text-sm leading-snug">
              <span
                className="mr-1.5 font-medium"
                style={{ color: u?.color ?? "#ddd" }}
              >
                {u?.name ?? "?"}
              </span>
              <span className="text-white/90">{m.text}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`message as ${me.name}…`}
          className="flex-1 rounded-md bg-white/5 px-3 py-1.5 text-sm placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-accent/50"
        />
        <button
          onClick={send}
          className="rounded-md bg-accent/80 px-2 py-1.5 text-white hover:bg-accent"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
