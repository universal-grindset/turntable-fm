/// <reference types="@cloudflare/workers-types" />
import type * as Party from "partykit/server";

// === Types kept in lockstep with src/lib/store.ts ===
type Track = { videoId: string; title: string; channel?: string; durationSec?: number };
type User = {
  id: string;
  name: string;
  color: string;
  avatar: string;
  points: number;
  isBot?: boolean;
};
type DjSlot = { userId: string | null; queue: Track[] };
type ChatMsg = {
  id: string;
  userId: string;
  text: string;
  at: number;
  kind?: "msg" | "system" | "spin";
};
type Vote = "awesome" | "lame" | null;

type RoomState = {
  users: Record<string, User>;
  djs: DjSlot[];
  currentDj: number | null;
  currentTrack: Track | null;
  trackStartedAt: number | null;
  votes: Record<string, Vote>;
  chat: ChatMsg[];
};

type ClientToServer =
  | { type: "hello"; me: Omit<User, "points"> }
  | { type: "rename"; name: string }
  | { type: "setAvatar"; avatar: string }
  | { type: "joinDj" }
  | { type: "leaveDj" }
  | { type: "enqueue"; track: Track }
  | { type: "removeFromQueue"; index: number }
  | { type: "advance" }
  | { type: "vote"; v: "awesome" | "lame" }
  | { type: "chat"; text: string };

type ServerToClient =
  | { type: "state"; you: string; state: RoomState }
  | { type: "chat"; msg: ChatMsg }
  | { type: "awesomeBurst"; at: number };

function nano() {
  return Math.random().toString(36).slice(2, 10);
}

function newState(): RoomState {
  return {
    users: {},
    djs: Array.from({ length: 5 }, () => ({ userId: null, queue: [] })),
    currentDj: null,
    currentTrack: null,
    trackStartedAt: null,
    votes: {},
    chat: [
      {
        id: nano(),
        userId: "system",
        text: "welcome to the booth. step up to DJ when you're ready.",
        at: Date.now(),
        kind: "system",
      },
    ],
  };
}

export default class Room implements Party.Server {
  state: RoomState = newState();
  // map socket id → user id
  socketToUser: Map<string, string> = new Map();

  constructor(public room: Party.Room) {}

  async onStart() {
    const saved = await this.room.storage.get<RoomState>("state");
    if (saved) {
      // Wipe transient presence — anyone "online" before reboot is gone.
      this.state = { ...saved, users: {} };
      this.state.djs = this.state.djs.map((d) => ({ ...d, userId: null }));
      this.state.currentDj = null;
      this.state.votes = {};
    }
  }

  async persist() {
    await this.room.storage.put("state", this.state);
  }

  onConnect(conn: Party.Connection) {
    // Client sends a `hello` message to claim a userId. Send empty placeholder
    // state immediately; full state goes after hello.
    conn.send(
      JSON.stringify({ type: "state", you: "", state: this.state } satisfies ServerToClient)
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientToServer;
    try {
      msg = JSON.parse(message) as ClientToServer;
    } catch {
      return;
    }
    this.handle(msg, sender);
  }

  onClose(conn: Party.Connection) {
    const uid = this.socketToUser.get(conn.id);
    if (!uid) return;
    this.socketToUser.delete(conn.id);
    // If they're still connected on another socket, keep them.
    const stillHere = [...this.socketToUser.values()].includes(uid);
    if (!stillHere) {
      delete this.state.users[uid];
      // Remove from DJ slot if they had one
      const idx = this.state.djs.findIndex((d) => d.userId === uid);
      if (idx !== -1) {
        this.state.djs[idx] = { userId: null, queue: [] };
        if (this.state.currentDj === idx) this.advance();
      }
    }
    this.broadcastState();
    this.persist();
  }

  handle(msg: ClientToServer, sender: Party.Connection) {
    switch (msg.type) {
      case "hello": {
        const me = msg.me;
        this.socketToUser.set(sender.id, me.id);
        if (!this.state.users[me.id]) {
          this.state.users[me.id] = { ...me, points: 0 };
        } else {
          // refresh name/color/avatar from latest hello
          this.state.users[me.id] = {
            ...this.state.users[me.id],
            name: me.name,
            color: me.color,
            avatar: me.avatar,
          };
        }
        sender.send(
          JSON.stringify({ type: "state", you: me.id, state: this.state } satisfies ServerToClient)
        );
        this.broadcastState(sender);
        return;
      }
      case "rename": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid || !this.state.users[uid]) return;
        const name = msg.name.trim().slice(0, 32);
        if (!name) return;
        this.state.users[uid] = { ...this.state.users[uid], name };
        return this.broadcastState();
      }
      case "setAvatar": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid || !this.state.users[uid]) return;
        this.state.users[uid] = { ...this.state.users[uid], avatar: msg.avatar };
        return this.broadcastState();
      }
      case "joinDj": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid) return;
        if (this.state.djs.some((d) => d.userId === uid)) return;
        const idx = this.state.djs.findIndex((d) => d.userId === null);
        if (idx === -1) return;
        this.state.djs[idx] = { ...this.state.djs[idx], userId: uid };
        this.systemChat(`${this.state.users[uid]?.name ?? "?"} stepped up to DJ`);
        if (this.state.currentDj === null) this.advance();
        return this.broadcastState();
      }
      case "leaveDj": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid) return;
        const idx = this.state.djs.findIndex((d) => d.userId === uid);
        if (idx === -1) return;
        this.state.djs[idx] = { userId: null, queue: [] };
        if (this.state.currentDj === idx) this.advance();
        return this.broadcastState();
      }
      case "enqueue": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid) return;
        const slot = this.state.djs.find((d) => d.userId === uid);
        if (!slot) return;
        const clean: Track = {
          videoId: String(msg.track.videoId).slice(0, 32),
          title: String(msg.track.title).slice(0, 200),
          durationSec: msg.track.durationSec ?? undefined,
        };
        slot.queue.push(clean);
        return this.broadcastState();
      }
      case "removeFromQueue": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid) return;
        const slot = this.state.djs.find((d) => d.userId === uid);
        if (!slot) return;
        slot.queue.splice(msg.index, 1);
        return this.broadcastState();
      }
      case "advance": {
        this.advance();
        return this.broadcastState();
      }
      case "vote": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid) return;
        const prev = this.state.votes[uid];
        if (prev === msg.v) return;
        this.state.votes[uid] = msg.v;
        if (msg.v === "awesome" && prev !== "awesome" && this.state.currentDj !== null) {
          const djId = this.state.djs[this.state.currentDj].userId;
          if (djId && djId !== uid) {
            this.state.users[djId] = {
              ...this.state.users[djId],
              points: this.state.users[djId].points + 1,
            };
          }
          this.room.broadcast(
            JSON.stringify({ type: "awesomeBurst", at: Date.now() } satisfies ServerToClient)
          );
        }
        return this.broadcastState();
      }
      case "chat": {
        const uid = this.socketToUser.get(sender.id);
        if (!uid) return;
        const text = String(msg.text).trim().slice(0, 500);
        if (!text) return;
        const m: ChatMsg = { id: nano(), userId: uid, text, at: Date.now(), kind: "msg" };
        this.state.chat = [...this.state.chat, m].slice(-300);
        return this.broadcastState();
      }
    }
  }

  systemChat(text: string) {
    const m: ChatMsg = {
      id: nano(),
      userId: "system",
      text,
      at: Date.now(),
      kind: "system",
    };
    this.state.chat = [...this.state.chat, m].slice(-300);
  }

  advance() {
    const active = this.state.djs
      .map((d, i) => ({ i, d }))
      .filter((x) => !!x.d.userId);

    if (active.length === 0) {
      this.state.currentDj = null;
      this.state.currentTrack = null;
      this.state.trackStartedAt = null;
      this.state.votes = {};
      return;
    }

    const order = active.map((x) => x.i);
    let cursor = this.state.currentDj === null ? -1 : order.indexOf(this.state.currentDj);

    for (let n = 0; n < order.length; n++) {
      cursor = (cursor + 1) % order.length;
      const slotIdx = order[cursor];
      const slot = this.state.djs[slotIdx];
      if (slot.queue.length > 0) {
        const [next, ...rest] = slot.queue;
        this.state.djs[slotIdx] = { ...slot, queue: rest };
        this.state.currentDj = slotIdx;
        this.state.currentTrack = next;
        this.state.trackStartedAt = Date.now();
        this.state.votes = {};
        const djUser = this.state.users[slot.userId!];
        this.systemChat(`${djUser?.name ?? "?"} is spinning: ${next.title}`);
        return;
      }
    }

    this.state.currentTrack = null;
    this.state.trackStartedAt = null;
    this.state.votes = {};
  }

  broadcastState(except?: Party.Connection) {
    const payload = JSON.stringify({
      type: "state",
      you: "",
      state: this.state,
    } satisfies ServerToClient);
    // partykit broadcasts to all sockets; include `except.id` to skip a single conn
    this.room.broadcast(payload, except ? [except.id] : []);
    this.persist();
  }
}

Room satisfies Party.Worker;
