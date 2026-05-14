import { describe, it, expect, beforeEach } from "vitest";
import {
  roomStore,
  initialState,
  addUser,
  botJoin,
  joinAsDj,
  leaveDj,
  enqueue,
  removeFromQueue,
  advance,
  castVote,
  vote,
  pushChat,
  DEMO_TRACKS,
} from "./store";

function reset() {
  roomStore.setState(() => ({
    ...initialState,
    users: {
      [initialState.me.id]: initialState.me,
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
    chat: [],
  }));
}

describe("room store", () => {
  beforeEach(reset);

  it("joins an empty DJ slot when I step up", () => {
    expect(roomStore.state.djs.every((d) => d.userId === null)).toBe(true);
    joinAsDj();
    expect(roomStore.state.djs[0].userId).toBe("me");
    expect(roomStore.state.djs[1].userId).toBe(null);
  });

  it("does not let me take two slots", () => {
    joinAsDj();
    joinAsDj();
    const occupied = roomStore.state.djs.filter((d) => d.userId === "me");
    expect(occupied).toHaveLength(1);
  });

  it("steps down and clears the slot", () => {
    joinAsDj();
    leaveDj();
    expect(roomStore.state.djs.every((d) => d.userId === null)).toBe(true);
  });

  it("enqueues a track into my slot only", () => {
    joinAsDj();
    enqueue("me", DEMO_TRACKS[0]);
    expect(roomStore.state.djs[0].queue).toEqual([DEMO_TRACKS[0]]);
  });

  it("advances rotation across DJs with queued tracks", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    const b = addUser({ id: "b", name: "b", color: "#fff", avatar: "/b.png", isBot: true });
    botJoin(a, [DEMO_TRACKS[0]]);
    botJoin(b, [DEMO_TRACKS[1]]);

    advance();
    expect(roomStore.state.currentTrack?.videoId).toBe(DEMO_TRACKS[0].videoId);
    advance();
    expect(roomStore.state.currentTrack?.videoId).toBe(DEMO_TRACKS[1].videoId);
  });

  it("stops if no DJ has a queued track", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    botJoin(a, []);
    advance();
    expect(roomStore.state.currentTrack).toBe(null);
  });

  it("removes a specific track from the queue", () => {
    joinAsDj();
    enqueue("me", DEMO_TRACKS[0]);
    enqueue("me", DEMO_TRACKS[1]);
    enqueue("me", DEMO_TRACKS[2]);
    removeFromQueue("me", 1);
    const ids = roomStore.state.djs[0].queue.map((t) => t.videoId);
    expect(ids).toEqual([DEMO_TRACKS[0].videoId, DEMO_TRACKS[2].videoId]);
  });

  it("counts awesomes only once per user even on repeat clicks", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    botJoin(a, [DEMO_TRACKS[0]]);
    advance();
    vote("awesome");
    vote("awesome");
    expect(roomStore.state.awesomesThisSpin).toBe(1);
  });

  it("awesomes flip to lames cleanly", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    botJoin(a, [DEMO_TRACKS[0]]);
    advance();
    vote("awesome");
    vote("lame");
    expect(roomStore.state.awesomesThisSpin).toBe(0);
    expect(roomStore.state.lamesThisSpin).toBe(1);
  });

  it("awards a point to the current DJ on each unique awesome", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    botJoin(a, [DEMO_TRACKS[0]]);
    advance();
    expect(roomStore.state.users["a"].points).toBe(0);
    castVote("listener-1", "awesome");
    castVote("listener-2", "awesome");
    expect(roomStore.state.users["a"].points).toBe(2);
  });

  it("never awards a DJ for voting on themselves", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    botJoin(a, [DEMO_TRACKS[0]]);
    advance();
    castVote("a", "awesome");
    expect(roomStore.state.users["a"].points).toBe(0);
  });

  it("resets votes when the track advances", () => {
    const a = addUser({ id: "a", name: "a", color: "#fff", avatar: "/a.png", isBot: true });
    const b = addUser({ id: "b", name: "b", color: "#fff", avatar: "/b.png", isBot: true });
    botJoin(a, [DEMO_TRACKS[0]]);
    botJoin(b, [DEMO_TRACKS[1]]);
    advance();
    vote("awesome");
    expect(roomStore.state.awesomesThisSpin).toBe(1);
    advance();
    expect(roomStore.state.awesomesThisSpin).toBe(0);
    expect(roomStore.state.votes).toEqual({});
  });

  it("appends chat messages and caps history at 300", () => {
    for (let i = 0; i < 320; i++) pushChat(`m${i}`);
    expect(roomStore.state.chat).toHaveLength(300);
    expect(roomStore.state.chat[roomStore.state.chat.length - 1].text).toBe("m319");
  });
});
