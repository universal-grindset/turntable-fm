import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore } from "../lib/store";

export function AwesomeBurst() {
  const burstAt = useStore(roomStore, (s) => s.awesomeBurstAt);
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (!burstAt) return;
    const ids = Array.from({ length: 18 }, (_, i) => burstAt + i);
    setParticles(ids);
    const t = window.setTimeout(() => setParticles([]), 1500);
    return () => window.clearTimeout(t);
  }, [burstAt]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {particles.map((p, i) => {
        const left = 30 + Math.random() * 40;
        const delay = i * 30;
        const emoji = ["💜", "💖", "✨", "🔥", "🎉"][i % 5];
        return (
          <div
            key={p}
            className="float-up absolute text-3xl"
            style={{
              left: `${left}%`,
              top: "60%",
              animationDelay: `${delay}ms`,
            }}
          >
            {emoji}
          </div>
        );
      })}
    </div>
  );
}
