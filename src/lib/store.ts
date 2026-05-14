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
  isBot?: boolean;
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
const STORAGE_KEY = "tt_me_v1";

type StoredMe = { id: string; name: string; color: string; avatar: string };

function loadStoredMe(): StoredMe | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (typeof j !== "object" || !j) return null;
    if (typeof j.id !== "string" || typeof j.name !== "string") return null;
    return {
      id: String(j.id).slice(0, 64),
      name: String(j.name).slice(0, 32),
      color: typeof j.color === "string" ? j.color.slice(0, 16) : "#7c5cff",
      avatar: typeof j.avatar === "string" ? j.avatar.slice(0, 256) : "/img/av-yeti.png",
    };
  } catch {
    return null;
  }
}

function saveStoredMe(me: { id: string; name: string; color: string; avatar: string }) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: me.id, name: me.name, color: me.color, avatar: me.avatar })
    );
  } catch {
    /* quota or disabled — non-fatal */
  }
}

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

// When connected to a multi-user server, action calls below are forwarded
// to the server instead of mutating state directly. The local mutation
// implementations remain so the app works fully offline / for tests.
export type RemoteHandlers = {
  joinDj: () => void;
  leaveDj: () => void;
  enqueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  advance: () => void;
  vote: (v: "awesome" | "lame") => void;
  chat: (text: string) => void;
  rename: (name: string) => void;
  setAvatar: (avatar: string) => void;
};

let remote: RemoteHandlers | null = null;
export function setRemote(r: RemoteHandlers | null) {
  remote = r;
}

export function setMyName(name: string) {
  set((s) => {
    const me = { ...s.me, name };
    saveStoredMe(me);
    return { ...s, me, users: { ...s.users, [me.id]: me } };
  });
  if (remote) remote.rename(name);
}

export function setMyAvatar(avatar: string) {
  set((s) => {
    const me = { ...s.me, avatar };
    saveStoredMe(me);
    return { ...s, me, users: { ...s.users, [me.id]: me } };
  });
  if (remote) remote.setAvatar(avatar);
}

/**
 * Client-only: hydrate the local store with the persisted identity (id +
 * name + avatar + color). Safe to call multiple times; idempotent.
 */
export function rehydrateMe() {
  const stored = loadStoredMe();
  if (!stored) {
    // First visit — mint a stable id so reconnects look like the same person
    if (typeof localStorage !== "undefined") {
      const id = "u-" + Math.random().toString(36).slice(2, 12);
      set((s) => {
        const me = { ...s.me, id };
        saveStoredMe(me);
        return { ...s, me, users: { [id]: me } };
      });
    }
    return;
  }
  set((s) => {
    const me = { ...s.me, ...stored, points: s.users[stored.id]?.points ?? 0 };
    return {
      ...s,
      me,
      users: { ...s.users, [me.id]: me },
    };
  });
}

export function setVolume(v: number) {
  set((s) => ({ ...s, volume: Math.max(0, Math.min(100, Math.round(v))) }));
}

export function pushChat(text: string, kind: ChatMsg["kind"] = "msg", userId?: string) {
  if (remote && kind === "msg" && !userId) {
    remote.chat(text);
    return;
  }
  set((s) => ({
    ...s,
    chat: [
      ...s.chat,
      { id: nanoid(), userId: userId ?? s.me.id, text, at: Date.now(), kind },
    ].slice(-300),
  }));
}

export function joinAsDj() {
  if (remote) return remote.joinDj();
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
  if (remote) return remote.leaveDj();
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
  if (remote && slotUserId === roomStore.state.me.id) return remote.enqueue(track);
  set((s) => ({
    ...s,
    djs: s.djs.map((d) =>
      d.userId === slotUserId ? { ...d, queue: [...d.queue, track] } : d
    ),
  }));
}

export function removeFromQueue(slotUserId: string, index: number) {
  if (remote && slotUserId === roomStore.state.me.id) return remote.removeFromQueue(index);
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
  if (remote) return remote.advance();
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
  // -1 so the first iteration picks the first active DJ on fresh start.
  let cursor = s.currentDj === null ? -1 : order.indexOf(s.currentDj);

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

export function castVote(userId: string, v: Exclude<Vote, null>) {
  if (remote && userId === roomStore.state.me.id) return remote.vote(v);
  const s = roomStore.state;
  const prev = s.votes[userId];
  if (prev === v) return;
  const newVotes = { ...s.votes, [userId]: v };
  const awesomes = Object.values(newVotes).filter((x) => x === "awesome").length;
  const lames = Object.values(newVotes).filter((x) => x === "lame").length;

  let users = s.users;
  if (v === "awesome" && prev !== "awesome" && s.currentDj !== null) {
    const djId = s.djs[s.currentDj].userId;
    if (djId && djId !== userId) {
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
    awesomeBurstAt:
      v === "awesome" && prev !== "awesome" && userId === c.me.id
        ? Date.now()
        : c.awesomeBurstAt,
  }));
}

export function vote(v: Exclude<Vote, null>) {
  castVote(roomStore.state.me.id, v);
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

const AV_POOL = [
  "/img/av-yeti.png",
  "/img/av-robot.png",
  "/img/av-panda.png",
  "/img/av-ninja.png",
  "/img/av-fox.png",
  "/img/av-alien.png",
  "/img/av-cat.png",
  "/img/av-shark.png",
];

const COLOR_POOL = ["#ff3bd4", "#7c5cff", "#2ee6a8", "#ffcb47", "#42c9ff", "#a3e635", "#f06292", "#60a5fa", "#fb7185", "#ff8c42"];

const HANDLES = [
  "dj_starlight", "808_owl", "vinyl_cat", "neon_panda", "miss_alien",
  "ninja_b", "shark_dad", "wax_witch", "subkick", "ghost_kid",
  "synth_buddy", "polaroid", "tape_loop", "patch_bay", "loop_pedal",
  "moog_cat", "rave_rabbit", "midi_mom", "low_pass", "bass_face",
  "tempo_lord", "scratch_dust", "monitor_kid", "stage_left", "bpm_baby",
];

let seeded = false;
export function seedDemo() {
  if (seeded) return;
  seeded = true;

  const dj1 = addUser({ id: "starlight", name: "dj_starlight", color: "#ff3bd4", avatar: "/img/av-fox.png", isBot: true });
  const dj2 = addUser({ id: "808owl", name: "808_owl", color: "#42c9ff", avatar: "/img/av-robot.png", isBot: true });

  // Seed a dense crowd so the dancefloor looks like a real room.
  for (let i = 0; i < HANDLES.length - 2; i++) {
    const name = HANDLES[i + 2];
    addUser({
      id: name,
      name,
      color: COLOR_POOL[i % COLOR_POOL.length],
      avatar: AV_POOL[i % AV_POOL.length],
      isBot: true,
    });
  }

  botJoin(dj1, [DEMO[1], DEMO[3]]);
  botJoin(dj2, [DEMO[2], DEMO[4]]);

  pushChat("anyone got a 90s set?", "msg", dj1);
  pushChat("i got u 🔥", "msg", dj2);

  if (roomStore.state.currentDj === null) advance();
}

const BOT_REACTIONS = [
  "🔥",
  "vibes immaculate",
  "this slaps",
  "ok this is fire",
  "ohhh yes",
  "🪩",
  "yessss",
  "this take me back",
  "💃💃",
  "perfect for the room rn",
  "🎧🎧🎧",
  "wholesome track choice",
  "WHO IS THIS",
  "saving this one",
];

export function botRestockQueue(botId: string) {
  const s = roomStore.state;
  const slot = s.djs.find((d) => d.userId === botId);
  if (!slot) return;
  if (slot.queue.length >= 2) return;
  // pick 1-2 demo tracks not already in this bot's queue
  const inQueue = new Set(slot.queue.map((t) => t.videoId));
  const pool = DEMO.filter((t) => !inQueue.has(t.videoId));
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const [picked] = pool.splice(idx, 1);
    enqueue(botId, picked);
  }
}

export { DEMO as DEMO_TRACKS, BOT_REACTIONS };
