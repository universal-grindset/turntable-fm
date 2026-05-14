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
import { seedDemo } from "../lib/store";
import { connectParty, disconnectParty } from "../lib/party";
import { findRoom } from "../lib/rooms";

const PARTY_HOST = (import.meta as any).env?.VITE_PARTY_HOST as string | undefined;

export const Route = createFileRoute("/r/$roomId")({ component: Room });

function Room() {
  const { roomId } = Route.useParams();
  const def = findRoom(roomId);

  useEffect(() => {
    if (PARTY_HOST) {
      connectParty(roomId);
      return () => disconnectParty();
    }
    seedDemo();
    return undefined;
  }, [roomId]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <YouTubePlayer />
      {!PARTY_HOST && <BotLoop />}
      <AwesomeBurst />

      <Header room={def} />

      <main className="flex flex-1 min-h-0 gap-3 px-3 py-3">
        <section className="flex flex-1 min-w-0 flex-col gap-3">
          <Marquee accent={def.accent} />
          <div className="flex-1 w-full min-h-0 overflow-hidden">
            <RoomStage backgroundUrl={def.background} />
          </div>
        </section>

        <aside className="hidden w-[22rem] shrink-0 flex-col gap-3 lg:flex">
          <MyQueue />
          <div className="flex-1 min-h-0">
            <Chat />
          </div>
        </aside>
      </main>

      <div className="lg:hidden flex h-48 px-3 pb-3">
        <Chat />
      </div>
    </div>
  );
}
