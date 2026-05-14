import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { YouTubePlayer } from "../components/YouTubePlayer";
import { DjBooth } from "../components/DjBooth";
import { NowPlaying } from "../components/NowPlaying";
import { Crowd } from "../components/Crowd";
import { Chat } from "../components/Chat";
import { MyQueue } from "../components/MyQueue";
import { MeBar } from "../components/MeBar";
import { AwesomeBurst } from "../components/AwesomeBurst";
import { seedDemo } from "../lib/store";

export const Route = createFileRoute("/")({ component: Room });

function Room() {
  useEffect(() => {
    seedDemo();
  }, []);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <YouTubePlayer />
      <AwesomeBurst />

      <header className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-accent to-accent-2 shadow-md glow-purple">
            <div className="absolute inset-1.5 rounded-full bg-black/80 ring-2 ring-white/30" />
            <div className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-white/90" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-widest text-glow">TURNTABLE</div>
            <div className="-mt-0.5 text-[10px] uppercase tracking-[0.3em] text-white/50">
              .fm reborn
            </div>
          </div>
        </div>

        <div className="flex flex-1 justify-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            🛖 the basement
          </div>
        </div>

        <MeBar />
      </header>

      <main className="flex flex-1 min-h-0 gap-3 px-3 pt-3 pb-3">
        <aside className="hidden w-64 shrink-0 flex-col gap-3 md:flex">
          <MyQueue />
        </aside>

        <section className="flex flex-1 min-w-0 flex-col gap-3">
          <NowPlaying />
          <DjBooth />
          <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-white/5 bg-white/[0.02]">
            <Crowd />
          </div>
        </section>

        <aside className="hidden w-72 shrink-0 lg:flex">
          <Chat />
        </aside>
      </main>

      <div className="lg:hidden flex h-48 px-3 pb-3">
        <Chat />
      </div>
    </div>
  );
}
