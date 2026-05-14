import PartySocket from "partysocket";
import {
  roomStore,
  initialState,
  setRemote,
  type RoomState,
  type Track,
} from "./store";

const PARTY_HOST =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PARTY_HOST) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_PARTY_HOST) ||
  "127.0.0.1:1999"; // sensible default for `pnpm party:dev`

type ServerMsg =
  | { type: "state"; you: string; state: Omit<RoomState, "me" | "awesomesThisSpin" | "lamesThisSpin" | "awesomeBurstAt" | "volume"> }
  | { type: "awesomeBurst"; at: number };

let socket: PartySocket | null = null;
let connected = false;

export function connectParty(roomId: string) {
  if (socket) return socket;
  socket = new PartySocket({
    host: PARTY_HOST,
    room: roomId,
  });

  socket.addEventListener("open", () => {
    connected = true;
    setRemote(remote);
    // Assign me a stable random id so server can identify me across reconnects.
    let id = roomStore.state.me.id;
    if (id === "me") {
      const persisted =
        typeof localStorage !== "undefined" ? localStorage.getItem("tt_uid") : null;
      id = persisted ?? Math.random().toString(36).slice(2, 12);
      if (typeof localStorage !== "undefined") localStorage.setItem("tt_uid", id);
      roomStore.setState((s) => ({ ...s, me: { ...s.me, id } }));
    }
    const me = roomStore.state.me;
    socket?.send(
      JSON.stringify({
        type: "hello",
        me: {
          id,
          name: me.name,
          color: me.color,
          avatar: me.avatar,
        },
      })
    );
  });

  socket.addEventListener("close", () => {
    connected = false;
    setRemote(null);
  });

  socket.addEventListener("message", (e) => {
    let msg: ServerMsg;
    try {
      msg = JSON.parse(typeof e.data === "string" ? e.data : "");
    } catch {
      return;
    }
    if (msg.type === "state") {
      const s = msg.state;
      const awesomes = Object.values(s.votes).filter((v) => v === "awesome").length;
      const lames = Object.values(s.votes).filter((v) => v === "lame").length;
      roomStore.setState((cur) => {
        // Preserve `me` identity client-side
        let me = cur.me;
        if (msg.you && s.users[msg.you]) {
          me = s.users[msg.you];
        }
        return {
          ...cur,
          me,
          users: s.users,
          djs: s.djs,
          currentDj: s.currentDj,
          currentTrack: s.currentTrack,
          trackStartedAt: s.trackStartedAt,
          votes: s.votes,
          awesomesThisSpin: awesomes,
          lamesThisSpin: lames,
          chat: s.chat,
        };
      });
    } else if (msg.type === "awesomeBurst") {
      roomStore.setState((cur) => ({ ...cur, awesomeBurstAt: msg.at }));
    }
  });

  return socket;
}

export function isConnected() {
  return connected;
}

function send(payload: object) {
  socket?.send(JSON.stringify(payload));
}

export const remote = {
  joinDj: () => send({ type: "joinDj" }),
  leaveDj: () => send({ type: "leaveDj" }),
  enqueue: (track: Track) => send({ type: "enqueue", track }),
  removeFromQueue: (index: number) => send({ type: "removeFromQueue", index }),
  advance: () => send({ type: "advance" }),
  vote: (v: "awesome" | "lame") => send({ type: "vote", v }),
  chat: (text: string) => send({ type: "chat", text }),
  rename: (name: string) => send({ type: "rename", name }),
  setAvatar: (avatar: string) => send({ type: "setAvatar", avatar }),
};

export function disconnectParty() {
  socket?.close();
  socket = null;
  connected = false;
  setRemote(null);
  roomStore.setState(() => ({ ...initialState }));
}
