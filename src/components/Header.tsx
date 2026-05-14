import { Star, Share2, Shuffle, List } from "lucide-react";
import { MeBar } from "./MeBar";

export function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-black/40 bg-gradient-to-b from-stage to-bg-2 px-3 py-2 shadow-md">
      {/* yellow turntable wordmark */}
      <a
        href="/"
        className="select-none font-black leading-none tracking-tight"
        style={{
          fontSize: 26,
          color: "#fdd54f",
          textShadow: "2px 2px 0 #5a3a00, 0 0 0 #fff",
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          letterSpacing: -0.5,
        }}
      >
        turntable<span style={{ fontSize: 14, color: "#fdd54f" }}>.fm</span>
      </a>

      {/* room name with star + share */}
      <div
        className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-3 py-1"
        style={{
          background: "linear-gradient(180deg, #4a2418, #2c130a)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.6)",
        }}
      >
        <Star size={16} className="shrink-0 text-gold" fill="#fdd54f" />
        <div className="truncate text-sm font-bold text-gold">the basement</div>
        <div className="ml-2 hidden text-[11px] uppercase tracking-widest text-white/40 sm:block">
          indie · house · vibes
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-1 sm:flex">
          <button className="rounded p-1 text-white/60 hover:bg-white/10" title="share">
            <Share2 size={14} />
          </button>
          <button className="rounded p-1 text-white/60 hover:bg-white/10" title="list rooms">
            <List size={14} />
          </button>
          <button className="rounded p-1 text-white/60 hover:bg-white/10" title="random room">
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      <MeBar />
    </header>
  );
}
