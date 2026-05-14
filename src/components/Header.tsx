import { useState } from "react";
import { Star, Share2, Shuffle, Settings, HelpCircle, Copy, Check } from "lucide-react";
import { MeBar } from "./MeBar";
import { ConnStatus } from "./ConnStatus";
import { RoomPicker } from "./RoomPicker";
import { ROOMS, type RoomDef } from "../lib/rooms";
import { useNavigate } from "@tanstack/react-router";

type Props = { room: RoomDef };

export function Header({ room }: Props) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  function copyLink() {
    if (typeof navigator === "undefined") return;
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  function jumpRandom() {
    const others = ROOMS.filter((r) => r.id !== room.id);
    const next = others[Math.floor(Math.random() * others.length)];
    navigate({ to: "/r/$roomId", params: { roomId: next.id } });
  }

  return (
    <header className="flex items-center gap-3 border-b border-black/40 bg-gradient-to-b from-stage to-bg-2 px-3 py-2 shadow-md">
      <a
        href="/"
        className="select-none font-black leading-none tracking-tight"
        style={{
          fontSize: 26,
          color: "#fdd54f",
          textShadow: "2px 2px 0 #5a3a00",
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          letterSpacing: -0.5,
        }}
      >
        turntable<span style={{ fontSize: 14, color: "#fdd54f" }}>.fm</span>
      </a>

      <div
        className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-3 py-1"
        style={{
          background: "linear-gradient(180deg, #4a2418, #2c130a)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      >
        <Star size={16} className="shrink-0 text-gold" fill="#fdd54f" />
        <div className="truncate text-sm font-bold text-gold">{room.name}</div>
        <div className="ml-2 hidden text-[11px] uppercase tracking-widest text-white/40 sm:block">
          {room.tagline}
        </div>
        <div className="ml-2"><ConnStatus /></div>
        <div className="flex-1" />
        <div className="hidden items-center gap-1 sm:flex">
          <button
            onClick={copyLink}
            className="rounded p-1 text-white/60 hover:bg-white/10"
            title={copied ? "copied!" : "copy room link"}
          >
            {copied ? <Check size={14} className="text-awesome" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => {
              const url = encodeURIComponent(window.location.href);
              window.open(`https://twitter.com/intent/tweet?url=${url}&text=join%20me%20in%20${encodeURIComponent(room.name)}`, "_blank", "noopener");
            }}
            className="rounded p-1 text-white/60 hover:bg-white/10"
            title="share on twitter"
          >
            <Share2 size={14} />
          </button>
          <RoomPicker currentRoomId={room.id} />
          <button
            onClick={jumpRandom}
            className="rounded p-1 text-white/60 hover:bg-white/10"
            title="random room"
          >
            <Shuffle size={14} />
          </button>
          <button
            className="rounded p-1 text-white/60 hover:bg-white/10"
            title="settings (coming soon)"
            onClick={() => alert("settings coming soon — for now you can rename + change avatar in the top right")}
          >
            <Settings size={14} />
          </button>
          <button
            className="rounded p-1 text-white/60 hover:bg-white/10"
            title="how does this work?"
            onClick={() => alert("step up to one of the 5 DJ slots, queue YouTube tracks, hit play. up to 5 people can DJ at once; everyone else votes awesome or lame. open a second tab to test multi-user.")}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      <MeBar />
    </header>
  );
}
