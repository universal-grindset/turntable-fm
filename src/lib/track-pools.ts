import type { Track } from "./store";

// Curated pools of popular YouTube tracks per genre. Hand-picked so we
// don't depend on the YouTube Data API (which needs a key). The AI DJ
// picks from these.
export const TRACK_POOLS: Record<string, ReadonlyArray<Track>> = {
  "the-basement": [
    { videoId: "DHEOF_rcND8", title: "MGMT — Electric Feel", durationSec: 230 },
    { videoId: "iyDmpJlPYE0", title: "Tame Impala — The Less I Know the Better", durationSec: 217 },
    { videoId: "uG6FjEEEy5w", title: "Phoenix — 1901", durationSec: 196 },
    { videoId: "9CYAOsHy_OQ", title: "Vampire Weekend — A-Punk", durationSec: 137 },
    { videoId: "I4lyA5N3VrM", title: "Foster the People — Pumped Up Kicks", durationSec: 240 },
    { videoId: "wXqkQzdcrtw", title: "Arctic Monkeys — Do I Wanna Know?", durationSec: 273 },
    { videoId: "qBzd2zwt53s", title: "The Strokes — Last Nite", durationSec: 192 },
    { videoId: "VHCSO_PvFNc", title: "Two Door Cinema Club — What You Know", durationSec: 192 },
  ],
  "808-lounge": [
    { videoId: "9G2OFqYwSjQ", title: "A Tribe Called Quest — Can I Kick It?", durationSec: 251 },
    { videoId: "tdsKxh0DRkc", title: "Nas — N.Y. State of Mind", durationSec: 294 },
    { videoId: "PBwAxmrE194", title: "Wu-Tang Clan — C.R.E.A.M.", durationSec: 252 },
    { videoId: "kgrV3_g9rYY", title: "J Dilla — Workinonit", durationSec: 178 },
    { videoId: "_JZom_gVfuw", title: "Dr. Dre — Still D.R.E. ft. Snoop Dogg", durationSec: 270 },
    { videoId: "S00B0u6KkLs", title: "MF DOOM — Doomsday", durationSec: 232 },
    { videoId: "JFm7YDVlqnI", title: "Mos Def — Mathematics", durationSec: 257 },
    { videoId: "X8GoLgX2QAk", title: "De La Soul — Eye Know", durationSec: 254 },
  ],
  "psych-den": [
    { videoId: "vsuxjmKKR1g", title: "Pink Floyd — Interstellar Overdrive", durationSec: 588 },
    { videoId: "Y0fxRGfxxCY", title: "Tame Impala — Let It Happen", durationSec: 467 },
    { videoId: "ktvTqknDobU", title: "Radiohead — Burn the Witch", durationSec: 221 },
    { videoId: "AfH4RfDMA5w", title: "The Doors — Riders on the Storm", durationSec: 431 },
    { videoId: "tQz6_4WUMcU", title: "Jefferson Airplane — White Rabbit", durationSec: 152 },
    { videoId: "L4TtCcEt-mw", title: "13th Floor Elevators — You're Gonna Miss Me", durationSec: 156 },
    { videoId: "DLpyR6APyy8", title: "King Gizzard — Robot Stop", durationSec: 287 },
  ],
  "deep-bunker": [
    { videoId: "rfQO9TXFGz4", title: "Disclosure — Latch", durationSec: 247 },
    { videoId: "VtOWFAcaeBs", title: "Daft Punk — Around the World", durationSec: 429 },
    { videoId: "ru0K8uYEZWw", title: "deadmau5 — Strobe", durationSec: 626 },
    { videoId: "5NV6Rdv1a3I", title: "Bicep — Glue", durationSec: 290 },
    { videoId: "3GwjfUFyY6M", title: "Caribou — Odessa", durationSec: 290 },
    { videoId: "PWgvGjAhvIw", title: "Bonobo — Cirrus", durationSec: 327 },
    { videoId: "rzKjW7-mNCk", title: "Justice — D.A.N.C.E.", durationSec: 245 },
  ],
  "lofi-corner": [
    { videoId: "5qap5aO4i9A", title: "Lofi Girl — beats to relax/study to", durationSec: 6000 },
    { videoId: "kgrV3_g9rYY", title: "J Dilla — Workinonit", durationSec: 178 },
    { videoId: "DWcJFNfaw9c", title: "Nujabes — Aruarian Dance", durationSec: 235 },
    { videoId: "WDin1QYU3pU", title: "Tomppabeats — Where Are You?", durationSec: 138 },
    { videoId: "TtkFRMnMAcs", title: "Idealism — Sleepless", durationSec: 132 },
    { videoId: "Sxh39kSiKE0", title: "Engelwood — Crystal Dolphin", durationSec: 192 },
  ],
};

export function getPool(roomId: string): ReadonlyArray<Track> {
  return TRACK_POOLS[roomId] ?? TRACK_POOLS["the-basement"];
}
