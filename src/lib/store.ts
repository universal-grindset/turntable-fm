import { Store } from "@tanstack/store";
import { nanoid } from "nanoid";

export type Track = {
  videoId: string;
  title: string;
  channel?: string;
  durationSec?: number;
};

export type User = {
  id: string;
  name: string;
  color: string;
  avatar: string; // image path or emoji
  points: number;
};

export type DjSlot = {
  userId: string | null;
  queue: Track[];
};

export type ChatMsg = {
  id: string;
  userId: string;
  text: string;
  at: number;
  kind?: "msg" | "system" | "spin";
};

export type Vote = "awesome" | "lame" | null;

export type RoomState = {
  me: User;
  users: Record<string, User>;
  djs: DjSlot[];
  currentDj: number | null;
  currentTrack: Track | null;
  trackStartedAt: number | null;
  votes: Record<string, Vote>;
  awesomesThisSpin: number;
  lamesThisSpin: number;
  awesomeBurstAt: number | null;
  chat: ChatMsg[];
  volume: number;
};

const ME_ID = "me";

const DEMO: Track[] = [
  { videoId: "dQw4w9WgXcQ", title: "Rick Astley — Never Gonna Give You Up", durationSec: 213 },
  { videoId: "y6120QOlsfU", title: "Darude — Sandstorm", durationSec: 235 },
  { videoId: "fJ9rUzIMcZQ", title: "Queen — Bohemian Rhapsody", durationSec: 354 },
  { videoId: "9bZkp7q19f0", title: "PSY — Gangnam Style", durationSec: 252 },
  { videoId: "kJQP7kiw5Fk", title: "Luis Fonsi — Despacito", durationSec: 282 },
  { videoId: "JGwWNGJdvx8", title: "Ed Sheeran — Shape of You", durationSec: 264 },
];

export const initialState: RoomState = {
  me: {
    id: ME_ID,
    name: "you",
    color: "#7c5cff",
    avatar: "/img/av-yeti.png",
    points: 0,
  },
  users: {
    [ME_ID]: {
      id: ME_ID,
      name: "you",
      color: "#7c5cff",
      avatar: "/img/av-yeti.png",
      points: 0,
    },
  },
  djs: [
    { userId: null, queue: [] },
    { userId: null, queue: [] },
    { userId: null, queue: [] },
    { userId: null, queue: [] },
    { userId: null, queue: [] },
  ],
  currentDj: null,
  currentTrack: null,
  trackStartedAt: null,
  votes: {},
  awesomesThisSpin: 0,
  lamesThisSpin: 0,
  awesomeBurstAt: null,
  chat: [
    {
      id: nanoid(),
      userId: "system",
      text: "welcome to the booth. step up to DJ when you're ready.",
      at: Date.now(),
      kind: "system",
    },
  ],
  volume: 70,
};

export const roomStore = new Store<RoomState>(initialState);

function set(updater: (s: RoomState) => RoomState) {
  roomStore.setState(updater);
}

export function setMyName(name: string) {
  set((s) => {
    const me = { ...s.me, name };
    return { ...s, me, users: { ...s.users, [me.id]: me } };
  });
}

export function setMyAvatar(avatar: string) {
  set((s) => {
    const me = { ...s.me, avatar };
    return { ...s, me, users: { ...s.users, [me.id]: me } };
  });
}

export function setVolume(v: number) {
  set((s) => ({ ...s, volume: Math.max(0, Math.min(100, Math.round(v))) }));
}

export function pushChat(text: string, kind: ChatMsg["kind"] = "msg", userId?: string) {
  set((s) => ({
    ...s,
    chat: [
      ...s.chat,
      { id: nanoid(), userId: userId ?? s.me.id, text, at: Date.now(), kind },
    ].slice(-300),
  }));
}

export function joinAsDj() {
  const s = roomStore.state;
  if (s.djs.some((d) => d.userId === s.me.id)) return;
  const idx = s.djs.findIndex((d) => d.userId === null);
  if (idx === -1) return;
  set((cur) => ({
    ...cur,
    djs: cur.djs.map((d, i) => (i === idx ? { ...d, userId: cur.me.id } : d)),
  }));
  pushChat(`${s.me.name} stepped up to DJ`, "system", "system");
  if (roomStore.state.currentDj === null) advance();
}

export function leaveDj() {
  const s = roomStore.state;
  const idx = s.djs.findIndex((d) => d.userId === s.me.id);
  if (idx === -1) return;
  set((cur) => ({
    ...cur,
    djs: cur.djs.map((d, i) => (i === idx ? { userId: null, queue: [] } : d)),
  }));
  if (s.currentDj === idx) advance();
}

export function enqueue(slotUserId: string, track: Track) {
  set((s) => ({
    ...s,
    djs: s.djs.map((d) =>
      d.userId === slotUserId ? { ...d, queue: [...d.queue, track] } : d
    ),
  }));
}

export function removeFromQueue(slotUserId: string, index: number) {
  set((s) => ({
    ...s,
    djs: s.djs.map((d) =>
      d.userId === slotUserId
        ? { ...d, queue: d.queue.filter((_, i) => i !== index) }
        : d
    ),
  }));
}

export function advance() {
  const s = roomStore.state;
  const active = s.djs
    .map((d, i) => ({ i, d }))
    .filter((x) => !!x.d.userId);

  if (active.length === 0) {
    set((c) => ({
      ...c,
      currentDj: null,
      currentTrack: null,
      trackStartedAt: null,
      votes: {},
      awesomesThisSpin: 0,
      lamesThisSpin: 0,
    }));
    return;
  }

  const order = active.map((x) => x.i);
  let cursor = s.currentDj === null ? 0 : order.indexOf(s.currentDj);

  for (let n = 0; n < order.length; n++) {
    cursor = (cursor + 1) % order.length;
    const slotIdx = order[cursor];
    const slot = s.djs[slotIdx];
    if (slot.queue.length > 0) {
      const [next, ...rest] = slot.queue;
      set((c) => ({
        ...c,
        djs: c.djs.map((d, i) => (i === slotIdx ? { ...d, queue: rest } : d)),
        currentDj: slotIdx,
        currentTrack: next,
        trackStartedAt: Date.now(),
        votes: {},
        awesomesThisSpin: 0,
        lamesThisSpin: 0,
        awesomeBurstAt: null,
      }));
      const djUser = s.users[slot.userId!];
      pushChat(`${djUser?.name ?? "?"} is spinning: ${next.title}`, "spin", "system");
      return;
    }
  }

  // active DJs but no tracks queued
  set((c) => ({
    ...c,
    currentTrack: null,
    trackStartedAt: null,
    votes: {},
    awesomesThisSpin: 0,
    lamesThisSpin: 0,
  }));
}

export function vote(v: Exclude<Vote, null>) {
  const s = roomStore.state;
  const prev = s.votes[s.me.id];
  if (prev === v) return;
  const newVotes = { ...s.votes, [s.me.id]: v };
  const awesomes = Object.values(newVotes).filter((x) => x === "awesome").length;
  const lames = Object.values(newVotes).filter((x) => x === "lame").length;

  let users = s.users;
  if (v === "awesome" && prev !== "awesome" && s.currentDj !== null) {
    const djId = s.djs[s.currentDj].userId;
    if (djId) {
      const u = users[djId];
      users = { ...users, [djId]: { ...u, points: u.points + 1 } };
    }
  }

  set((c) => ({
    ...c,
    votes: newVotes,
    awesomesThisSpin: awesomes,
    lamesThisSpin: lames,
    users,
    awesomeBurstAt: v === "awesome" && prev !== "awesome" ? Date.now() : c.awesomeBurstAt,
  }));
}

export function addUser(u: Omit<User, "points"> & { points?: number }): string {
  const id = u.id ?? nanoid(8);
  set((s) => ({
    ...s,
    users: { ...s.users, [id]: { ...u, id, points: u.points ?? 0 } },
  }));
  return id;
}

export function botJoin(userId: string, queue: Track[] = []) {
  set((s) => {
    if (s.djs.some((d) => d.userId === userId)) return s;
    const idx = s.djs.findIndex((d) => d.userId === null);
    if (idx === -1) return s;
    return {
      ...s,
      djs: s.djs.map((d, i) => (i === idx ? { userId, queue } : d)),
    };
  });
}

let seeded = false;
export function seedDemo() {
  if (seeded) return;
  seeded = true;
  const a = addUser({ id: "starlight", name: "dj_starlight", color: "#ff3bd4", avatar: "/img/av-fox.png" });
  const b = addUser({ id: "808owl", name: "808_owl", color: "#42c9ff", avatar: "/img/av-robot.png" });
  const c = addUser({ id: "vinylcat", name: "vinyl_cat", color: "#ffcb47", avatar: "/img/av-cat.png" });
  addUser({ id: "neon_panda", name: "neon_panda", color: "#2ee6a8", avatar: "/img/av-panda.png" });
  addUser({ id: "miss_alien", name: "miss_alien", color: "#a3e635", avatar: "/img/av-alien.png" });

  botJoin(a, [DEMO[1], DEMO[3]]);
  botJoin(b, [DEMO[2], DEMO[4]]);
  // c is in crowd, not a DJ

  pushChat("anyone got a 90s set?", "msg", a);
  pushChat("i got u 🔥", "msg", b);

  // If we have any tracks queued and no one is spinning, start
  if (roomStore.state.currentDj === null) advance();
}

export { DEMO as DEMO_TRACKS };
