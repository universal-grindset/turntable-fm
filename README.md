# turntable-fm

A from-scratch homage to the classic [turntable.fm](https://en.wikipedia.org/wiki/Turntable.fm) — a social music room with up to 5 DJs spinning tracks in rotation, listeners voting *awesome* / *lame*, dancing avatars, and chat.

Built in a single session as a greenfield experiment.

## Stack

- **[TanStack Start](https://tanstack.com/start)** (React 19 + Vite) — full-stack framework
- **[TanStack Router](https://tanstack.com/router)** — type-safe routing
- **[TanStack Store](https://tanstack.com/store)** — room state
- **[TanStack Query](https://tanstack.com/query)** — async data
- **[TanStack AI](https://tanstack.com/ai)** — installed for future AI DJ / chat features
- **[Tailwind CSS v4](https://tailwindcss.com)** — styling
- **[Lucide](https://lucide.dev)** — icons
- **YouTube IFrame Player API** — music playback (your YouTube Premium account, if signed in, gives you ad-free playback automatically — each viewer plays the embed in their own browser)
- **[inference.sh](https://inference.sh)** + Bytedance Seedream 4.0 — used at build time to generate the chibi pixel-art avatars, the booth backdrop, and the logo

## Run it

```bash
pnpm install
pnpm dev    # http://localhost:3000
```

## Regenerate the art

Requires an [inference.sh](https://inference.sh) API key.

```bash
# either export it…
export INFSH_API_KEY=inf_...
# …or the script will fall back to reading it from 1Password (item id is in scripts/gen-images.mjs)
node scripts/gen-images.mjs
```

## What's in the room

- **Top bar** — your handle, avatar picker, volume slider
- **Now Playing** — current track, scrubber, awesome / lame / skip
- **The Booth** — 5 DJ slots; click an empty one to *step up*
- **Your Queue** (left) — paste any YouTube URL or video ID and it pulls the title via oEmbed
- **The Crowd** (center, below the booth) — everyone who isn't DJing, bobbing in place
- **Chat** (right) — text room chat with colored handles
- **Awesome bursts** — particle hearts float up when anyone hits awesome

The current build runs single-player with a few seeded bots so you can see the rotation in action. Multi-user sync (Supabase Realtime or similar) is the obvious next step.

## Why YouTube

The original turntable.fm had a hybrid music library that's no longer feasible without crippling licensing complications. YouTube has the broadest free catalog, lets every listener bring their own ad/no-ad experience via their own login, and the IFrame Player API is straightforward to sync.

## Next moves

- Multi-user sync (rooms, presence, realtime queue updates)
- AI DJ that fills the queue when no human is up (TanStack AI is already wired)
- Persistent identity (Clerk / WorkOS / Sign in with Vercel)
- More rooms ("the warehouse", "the lounge", custom rooms with art)
- Better track search (currently paste-only)

## Project layout

```
src/
  routes/
    __root.tsx       # html shell
    index.tsx        # the room
  components/
    YouTubePlayer.tsx
    DjBooth.tsx
    NowPlaying.tsx
    Crowd.tsx
    Chat.tsx
    MyQueue.tsx
    MeBar.tsx
    Avatar.tsx
    AwesomeBurst.tsx
  lib/
    store.ts         # TanStack Store + actions
    utils.ts
public/img/          # generated chibi avatars + room backdrop
scripts/
  gen-images.mjs     # one-shot art generation via inference.sh
```
