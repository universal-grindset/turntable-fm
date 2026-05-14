export type RoomDef = {
  id: string;
  name: string;
  tagline: string;
  background: string;
  accent: string; // dominant accent hex for marquee/glow per room
};

export const ROOMS: ReadonlyArray<RoomDef> = [
  {
    id: "the-basement",
    name: "the basement",
    tagline: "indie · house · vibes",
    background: "/img/room.png",
    accent: "#ff3bd4",
  },
  {
    id: "808-lounge",
    name: "808 lounge",
    tagline: "hip hop heads",
    background: "/img/room-hiphop.png",
    accent: "#ffcb47",
  },
  {
    id: "psych-den",
    name: "psych den",
    tagline: "psych rock & garage",
    background: "/img/room-psych.png",
    accent: "#ff8c42",
  },
  {
    id: "deep-bunker",
    name: "deep bunker",
    tagline: "underground house",
    background: "/img/room-house.png",
    accent: "#42c9ff",
  },
  {
    id: "lofi-corner",
    name: "lofi corner",
    tagline: "study beats · chillhop",
    background: "/img/room-lofi.png",
    accent: "#a3e635",
  },
];

const BY_ID: Record<string, RoomDef> = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

export function findRoom(id: string | null | undefined): RoomDef {
  return (id && BY_ID[id]) || ROOMS[0];
}
