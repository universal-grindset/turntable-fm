import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore } from "../lib/store";
import { isConnected } from "../lib/party";

const PARTY_HOST = (import.meta as any).env?.VITE_PARTY_HOST as string | undefined;

export function ConnStatus() {
  const userCount = useStore(roomStore, (s) => Object.keys(s.users).length);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!PARTY_HOST) return;
    const id = window.setInterval(() => setConnected(isConnected()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!PARTY_HOST) {
    return (
      <div
        className="hidden items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/60 ring-1 ring-white/10 sm:flex"
        title="single-player mode — seeded with bots"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        offline
      </div>
    );
  }

  return (
    <div
      className={`hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] ring-1 sm:flex ${
        connected
          ? "bg-awesome/15 text-awesome ring-awesome/30"
          : "bg-lame/15 text-lame ring-lame/30"
      }`}
      title={connected ? `multi-user · ${userCount} here` : "reconnecting…"}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-awesome" : "bg-lame"
        } ${connected ? "" : "animate-pulse"}`}
      />
      {connected ? `${userCount} live` : "reconnecting…"}
    </div>
  );
}
