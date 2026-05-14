#!/usr/bin/env node
// Smoke-test the deployed party server end-to-end:
// connect, send hello, wait for state, send a chat, expect echo.
import WebSocket from "ws";

const HOST = process.argv[2] ?? "turntable-fm.johndfowler.partykit.dev";
const ROOM = process.argv[3] ?? "the-basement";
const URL = `wss://${HOST}/parties/main/${ROOM}`;

console.log("connecting:", URL);
const ws = new WebSocket(URL);
const me = {
  id: "smoketest-" + Math.random().toString(36).slice(2, 8),
  name: "smoketester",
  color: "#42c9ff",
  avatar: "/img/av-robot.png",
};

let gotState = false;
let gotChat = false;

const deadline = setTimeout(() => {
  console.error("✗ timeout (10s) — exiting");
  console.error("  state received:", gotState, "  chat echoed:", gotChat);
  process.exit(1);
}, 10_000);

ws.on("open", () => {
  console.log("✓ open");
  ws.send(JSON.stringify({ type: "hello", me }));
});

ws.on("message", (raw) => {
  let m;
  try { m = JSON.parse(raw.toString()); } catch { return; }
  if (m.type === "state") {
    if (!gotState) {
      gotState = true;
      const userCount = Object.keys(m.state.users || {}).length;
      console.log(`✓ state received — you=${m.you || "(none)"} users=${userCount} djs=${m.state.djs?.length}`);
      // Now send a chat
      ws.send(JSON.stringify({ type: "chat", text: `smoke at ${new Date().toISOString()}` }));
    } else {
      // Subsequent state — look for my chat message
      const myMsgs = (m.state.chat || []).filter((c) => c.userId === me.id);
      if (myMsgs.length > 0 && !gotChat) {
        gotChat = true;
        console.log(`✓ chat echoed: "${myMsgs[myMsgs.length - 1].text}"`);
        clearTimeout(deadline);
        ws.close();
        process.exit(0);
      }
    }
  }
});

ws.on("close", (code, reason) => {
  console.log("close:", code, reason?.toString());
});
ws.on("error", (e) => {
  console.error("✗ ws error:", e.message);
  process.exit(1);
});
