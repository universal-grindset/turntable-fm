import { createFileRoute } from "@tanstack/react-router";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { TRACK_POOLS } from "../../lib/track-pools";

const RequestSchema = z.object({
  roomId: z.string().min(1).max(64),
  recentTitles: z.array(z.string()).max(8).optional(),
  count: z.number().int().min(1).max(5).optional(),
});

export const Route = createFileRoute("/api/aidj")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body;
        try {
          body = RequestSchema.parse(await request.json());
        } catch (e: any) {
          return new Response(JSON.stringify({ error: "bad request", detail: e?.message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const pool = TRACK_POOLS[body.roomId] ?? TRACK_POOLS["the-basement"];
        const count = body.count ?? 3;
        const apiKey =
          (typeof process !== "undefined" && process.env?.ANTHROPIC_API_KEY) ||
          (globalThis as any).ANTHROPIC_API_KEY;

        // Helper: pick `count` indexes from the pool avoiding any that match
        // recentTitles. Used as the fallback and as a safety net.
        const heuristic = (): number[] => {
          const recentSet = new Set((body.recentTitles ?? []).map((t) => t.toLowerCase()));
          const eligible: number[] = [];
          pool.forEach((t, i) => {
            if (!recentSet.has(t.title.toLowerCase())) eligible.push(i);
          });
          const fallback = eligible.length > 0 ? eligible : pool.map((_, i) => i);
          // shuffle + take count
          const shuffled = [...fallback].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, count);
        };

        let picks: number[];
        let reasoning = "heuristic shuffle";

        if (apiKey) {
          try {
            const anthropic = new Anthropic({ apiKey });
            const poolList = pool
              .map((t, i) => `${i}: ${t.title}${t.durationSec ? ` (${Math.floor(t.durationSec / 60)}:${(t.durationSec % 60).toString().padStart(2, "0")})` : ""}`)
              .join("\n");
            const recentList = (body.recentTitles ?? []).length
              ? `\n\nJust played (avoid repeats):\n${(body.recentTitles ?? []).join("\n")}`
              : "";
            const completion = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 256,
              messages: [
                {
                  role: "user",
                  content:
                    `You are an AI DJ in a virtual club room called "${body.roomId}". ` +
                    `Pick ${count} tracks from the numbered pool below that flow well together for this room's vibe. ` +
                    `Aim for variety, ride the energy of the room.${recentList}\n\n` +
                    `POOL:\n${poolList}\n\n` +
                    `Respond with ONLY a JSON object: {"picks": [<index>, <index>, ...], "why": "<one sentence>"} ` +
                    `with exactly ${count} indexes. No prose, no markdown.`,
                },
              ],
            });
            const raw = completion.content
              .filter((c: any) => c.type === "text")
              .map((c: any) => c.text)
              .join("");
            const match = raw.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (Array.isArray(parsed.picks)) {
                const valid = parsed.picks
                  .map((n: any) => Number(n))
                  .filter((n: number) => Number.isInteger(n) && n >= 0 && n < pool.length);
                if (valid.length >= 1) {
                  picks = valid.slice(0, count);
                  reasoning = typeof parsed.why === "string" ? parsed.why.slice(0, 200) : "claude pick";
                  // ensure we have `count`; top up with heuristic if short
                  while (picks.length < count) {
                    const more = heuristic().find((i) => !picks.includes(i));
                    if (more === undefined) break;
                    picks.push(more);
                  }
                  return new Response(
                    JSON.stringify({
                      tracks: picks.map((i) => pool[i]),
                      reasoning,
                      provider: "anthropic",
                    }),
                    { headers: { "content-type": "application/json" } }
                  );
                }
              }
            }
            // fall through to heuristic if parsing fails
          } catch (e: any) {
            console.error("aidj anthropic error:", e?.message);
          }
        }

        picks = heuristic();
        return new Response(
          JSON.stringify({
            tracks: picks.map((i) => pool[i]),
            reasoning,
            provider: apiKey ? "fallback" : "no-key",
          }),
          { headers: { "content-type": "application/json" } }
        );
      },
    },
  },
});
