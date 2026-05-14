import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { YouTubePlayer } from "../components/YouTubePlayer";
import { RoomStage } from "../components/RoomStage";
import { SquareSlot } from "../components/SquareSlot";
import { Marquee } from "../components/Marquee";
import { Header } from "../components/Header";
import { Chat } from "../components/Chat";
import { MyQueue } from "../components/MyQueue";
import { AwesomeBurst } from "../components/AwesomeBurst";
import { BotLoop } from "../components/BotLoop";
import { seedDemo } from "../lib/store";
import { connectParty, disconnectParty } from "../lib/party";

const PARTY_HOST = (import.meta as any).env?.VITE_PARTY_HOST as string | undefined;

export const Route = createFileRoute("/")({ component: Room });

function Room() {
  useEffect(() => {
    if (PARTY_HOST) {
      connectParty("the-basement");
      return () => disconnectParty();
    }
    seedDemo();
    return undefined;
  }, []);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden">
      <YouTubePlayer />
      {!PARTY_HOST && <BotLoop />}
      <AwesomeBurst />

      <Header />

      <main className="flex flex-1 min-h-0 gap-3 px-3 py-3">
        <section className="flex flex-1 min-w-0 flex-col gap-3">
          <Marquee />
          <div className="flex-1 w-full min-h-0">
            <SquareSlot>
              <RoomStage />
            </SquareSlot>
          </div>
        </section>

        <aside className="hidden w-80 shrink-0 flex-col gap-3 lg:flex">
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
