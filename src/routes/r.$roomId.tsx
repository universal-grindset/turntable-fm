import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { YouTubePlayer } from "../components/YouTubePlayer";
import { RoomStage } from "../components/RoomStage";
import { Marquee } from "../components/Marquee";
import { Header } from "../components/Header";
import { Chat } from "../components/Chat";
import { MyQueue } from "../components/MyQueue";
import { AwesomeBurst } from "../components/AwesomeBurst";
import { BotLoop } from "../components/BotLoop";
import { MobileTabs } from "../components/MobileTabs";
import { seedDemo, rehydrateMe } from "../lib/store";
import { connectParty, disconnectParty } from "../lib/party";
import { findRoom } from "../lib/rooms";

const PARTY_HOST = (import.meta as any).env?.VITE_PARTY_HOST as string | undefined;

export const Route = createFileRoute("/r/$roomId")({ component: Room });

function Room() {
  const { roomId } = Route.useParams();
  const def = findRoom(roomId);

  useEffect(() => {
    rehydrateMe();
    if (PARTY_HOST) {
      connectParty(roomId);
      return () => disconnectParty();
    }
    seedDemo();
    return undefined;
  }, [roomId]);

  const stage = (
    <div className="flex h-full min-h-0 flex-col gap-2 px-2 pt-2 pb-1 sm:gap-3 sm:px-3 sm:pt-3">
      <Marquee accent={def.accent} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <RoomStage backgroundUrl={def.background} />
      </div>
    </div>
  );

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <YouTubePlayer />
      {!PARTY_HOST && <BotLoop />}
      <AwesomeBurst />

      <Header room={def} />

      {/* Desktop / wide: side-by-side */}
      <main className="hidden lg:flex flex-1 min-h-0 gap-3 px-3 py-3">
        <section className="flex flex-1 min-w-0 flex-col gap-3">
          <Marquee accent={def.accent} />
          <div className="flex-1 w-full min-h-0 overflow-hidden">
            <RoomStage backgroundUrl={def.background} />
          </div>
        </section>
        <aside className="flex w-[22rem] shrink-0 flex-col gap-3">
          <MyQueue />
          <div className="flex-1 min-h-0">
            <Chat />
          </div>
        </aside>
      </main>

      {/* Mobile / narrow: tab strip */}
      <div className="flex lg:hidden flex-1 min-h-0">
        <MobileTabs
          room={stage}
          queue={
            <div className="h-full overflow-y-auto px-2 py-2">
              <MyQueue />
            </div>
          }
          chat={
            <div className="h-full p-2">
              <Chat />
            </div>
          }
        />
      </div>
    </div>
  );
}
