import { createFileRoute } from "@tanstack/react-router";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod";
import { TRACK_POOLS } from "../../lib/track-pools";

const RequestSchema = z.object({
  roomId: z.string().min(1).max(64),
  recentTitles: z.array(z.string()).max(8).optional(),
  count: z.number().int().min(1).max(5).optional(),
});

function buildPrompt(roomId: string, pool: ReadonlyArray<{ title: string; durationSec?: number }>, recent: ReadonlyArray<string>, count: number) {
  const poolList = pool
    .map(
      (t, i) =>
        `${i}: ${t.title}${
          t.durationSec
            ? ` (${Math.floor(t.durationSec / 60)}:${(t.durationSec % 60).toString().padStart(2, "0")})`
            : ""
        }`
    )
    .join("\n");
  const recentList = recent.length
    ? `\n\nJust played (avoid repeats):\n${recent.join("\n")}`
    : "";
  return (
    `You are an AI DJ in a virtual club room called "${roomId}". ` +
    `Pick ${count} tracks from the numbered pool below that flow well together for this room's vibe. ` +
    `Aim for variety, ride the energy of the room.${recentList}\n\n` +
    `POOL:\n${poolList}\n\n` +
    `Respond with ONLY a JSON object: {"picks": [<index>, <index>, ...], "why": "<one sentence>"} ` +
    `with exactly ${count} indexes. No prose, no markdown.`
  );
}

function parsePicks(raw: string, count: number, poolSize: number): { picks: number[]; why?: string } | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.picks)) return null;
    const valid = (parsed.picks as unknown[])
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < poolSize);
    if (valid.length < 1) return null;
    return { picks: valid.slice(0, count), why: typeof parsed.why === "string" ? parsed.why.slice(0, 200) : undefined };
  } catch {
    return null;
  }
}

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
        const recent = body.recentTitles ?? [];

        const swiftKey = typeof process !== "undefined" ? process.env?.SWIFTROUTER_API_KEY : undefined;
        const swiftBase =
          (typeof process !== "undefined" && process.env?.SWIFTROUTER_BASE_URL) ||
          "https://api.swiftrouter.com/v1";
        const swiftModel =
          (typeof process !== "undefined" && process.env?.SWIFTROUTER_MODEL) ||
          "claude-haiku-4-5";
        const anthroKey = typeof process !== "undefined" ? process.env?.ANTHROPIC_API_KEY : undefined;

        const heuristic = (): number[] => {
          const recentSet = new Set(recent.map((t) => t.toLowerCase()));
          const eligible: number[] = [];
          pool.forEach((t, i) => {
            if (!recentSet.has(t.title.toLowerCase())) eligible.push(i);
          });
          const fallback = eligible.length > 0 ? eligible : pool.map((_, i) => i);
          return [...fallback].sort(() => Math.random() - 0.5).slice(0, count);
        };

        const prompt = buildPrompt(body.roomId, pool, recent, count);

        // Try SwiftRouter first (OpenAI-compatible) if key is present
        if (swiftKey) {
          try {
            const openai = new OpenAI({ apiKey: swiftKey, baseURL: swiftBase });
            const completion = await openai.chat.completions.create({
              model: swiftModel,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 256,
            });
            const raw = completion.choices?.[0]?.message?.content ?? "";
            const parsed = parsePicks(raw, count, pool.length);
            if (parsed) {
              while (parsed.picks.length < count) {
                const more = heuristic().find((i) => !parsed.picks.includes(i));
                if (more === undefined) break;
                parsed.picks.push(more);
              }
              return new Response(
                JSON.stringify({
                  tracks: parsed.picks.map((i) => pool[i]),
                  reasoning: parsed.why ?? "swiftrouter pick",
                  provider: "swiftrouter",
                }),
                { headers: { "content-type": "application/json" } }
              );
            }
          } catch (e: any) {
            console.error("aidj swiftrouter error:", e?.message);
          }
        }

        // Fall back to direct Anthropic API
        if (anthroKey) {
          try {
            const anthropic = new Anthropic({ apiKey: anthroKey });
            const completion = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 256,
              messages: [{ role: "user", content: prompt }],
            });
            const raw = completion.content
              .filter((c: any) => c.type === "text")
              .map((c: any) => c.text)
              .join("");
            const parsed = parsePicks(raw, count, pool.length);
            if (parsed) {
              while (parsed.picks.length < count) {
                const more = heuristic().find((i) => !parsed.picks.includes(i));
                if (more === undefined) break;
                parsed.picks.push(more);
              }
              return new Response(
                JSON.stringify({
                  tracks: parsed.picks.map((i) => pool[i]),
                  reasoning: parsed.why ?? "claude pick",
                  provider: "anthropic",
                }),
                { headers: { "content-type": "application/json" } }
              );
            }
          } catch (e: any) {
            console.error("aidj anthropic error:", e?.message);
          }
        }

        // Final fallback: deterministic shuffle of the curated pool
        const picks = heuristic();
        return new Response(
          JSON.stringify({
            tracks: picks.map((i) => pool[i]),
            reasoning: "heuristic shuffle (ai provider unavailable)",
            provider: swiftKey || anthroKey ? "fallback" : "no-key",
          }),
          { headers: { "content-type": "application/json" } }
        );
      },
    },
  },
});
