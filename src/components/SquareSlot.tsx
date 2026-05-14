import { useEffect, useRef, useState } from "react";

// Renders children inside a square box sized to fit the available area
// (width × height of the parent). Avoids the css-only aspect-square pitfall
// where neither dimension is fully bounded by the parent.
export function SquareSlot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<number>(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize(Math.max(0, Math.floor(Math.min(w, h))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid h-full w-full place-items-center">
      <div
        className="relative"
        style={{ width: size || "100%", height: size || "100%" }}
      >
        {children}
      </div>
    </div>
  );
}
