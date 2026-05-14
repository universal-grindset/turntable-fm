import { useEffect, useRef } from "react";
import { useStore } from "@tanstack/react-store";
import { roomStore, advance } from "../lib/store";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYTApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return apiPromise;
}

export function YouTubePlayer() {
  const trackId = useStore(roomStore, (s) => s.currentTrack?.videoId ?? null);
  const startedAt = useStore(roomStore, (s) => s.trackStartedAt);
  const volume = useStore(roomStore, (s) => s.volume);
  const playerRef = useRef<any>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadYTApi().then(() => {
      if (cancelled || !elRef.current) return;
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player(elRef.current, {
        height: "1",
        width: "1",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
        },
        events: {
          onReady: () => {
            playerRef.current.setVolume(volume);
          },
          onStateChange: (e: any) => {
            // 0 = ended
            if (e.data === 0) {
              if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
              advanceTimer.current = window.setTimeout(() => advance(), 1500);
            }
          },
          onError: () => {
            // skip unplayable tracks after a short delay
            if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
            advanceTimer.current = window.setTimeout(() => advance(), 2000);
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !p.loadVideoById) return;
    if (!trackId) {
      try { p.stopVideo?.(); } catch {}
      return;
    }
    try {
      p.loadVideoById({ videoId: trackId, startSeconds: 0 });
    } catch (e) {
      console.warn("yt load failed:", e);
    }
  }, [trackId, startedAt]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !p.setVolume) return;
    try { p.setVolume(volume); } catch {}
  }, [volume]);

  return (
    <div className="absolute -left-[9999px] -top-[9999px] h-1 w-1 overflow-hidden">
      <div ref={elRef} />
    </div>
  );
}
