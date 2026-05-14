import { useEffect, useRef } from "react";
import { useStore } from "@tanstack/react-store";
import {
  roomStore,
  castVote,
  pushChat,
  botRestockQueue,
  BOT_REACTIONS,
} from "../lib/store";

// Runs the simulated room activity: bots randomly vote awesome, drop chat
// messages, and refill their queues so the room never goes silent.
export function BotLoop() {
  const trackId = useStore(roomStore, (s) => s.currentTrack?.videoId ?? null);
  const startedAt = useStore(roomStore, (s) => s.trackStartedAt);
  const lastSpinRef = useRef<string | null>(null);

  // schedule per-spin reactions
  useEffect(() => {
    if (!trackId || !startedAt) return;
    if (lastSpinRef.current === `${trackId}@${startedAt}`) return;
    lastSpinRef.current = `${trackId}@${startedAt}`;

    const timers: number[] = [];
    const s = roomStore.state;
    const currentDjUserId =
      s.currentDj !== null ? s.djs[s.currentDj].userId : null;
    const bots = Object.values(s.users).filter(
      (u) => u.isBot && u.id !== currentDjUserId
    );

    // Each bot has ~70% chance to awesome this track, at a random delay
    for (const bot of bots) {
      if (Math.random() > 0.7) continue;
      const delay = 1500 + Math.random() * 22_000;
      const t = window.setTimeout(() => {
        if (
          roomStore.state.currentTrack?.videoId === trackId &&
          roomStore.state.trackStartedAt === startedAt
        ) {
          castVote(bot.id, "awesome");
        }
      }, delay);
      timers.push(t);
    }

    // 30% of the time, one random bot drops a chat reaction
    if (Math.random() < 0.65 && bots.length > 0) {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const text = BOT_REACTIONS[Math.floor(Math.random() * BOT_REACTIONS.length)];
      const delay = 4000 + Math.random() * 10_000;
      const t = window.setTimeout(() => {
        if (
          roomStore.state.currentTrack?.videoId === trackId &&
          roomStore.state.trackStartedAt === startedAt
        ) {
          pushChat(text, "msg", bot.id);
        }
      }, delay);
      timers.push(t);
    }

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [trackId, startedAt]);

  // every 25s, restock any bot DJ that's running low
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = roomStore.state;
      for (const slot of s.djs) {
        if (!slot.userId) continue;
        const user = s.users[slot.userId];
        if (!user?.isBot) continue;
        if (slot.queue.length < 2) botRestockQueue(slot.userId);
      }
    }, 25_000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
