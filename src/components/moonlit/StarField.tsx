import { useMemo } from "react";

interface Star {
  x: number;        // 0-100
  y: number;        // 0-100
  size: number;     // px
  delay: number;    // s
  duration: number; // s
  opacity: number;
  twinkle: boolean;
}

interface Props {
  count?: number;
  className?: string;
}

// Deterministic seeded RNG so the field is stable across re-renders.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function StarField({ count = 140, className }: Props) {
  const stars = useMemo<Star[]>(() => {
    const rng = mulberry32(8732891);
    return Array.from({ length: count }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 1.8 + 0.4,
      delay: rng() * 8,
      duration: rng() * 4 + 2.5,
      opacity: rng() * 0.7 + 0.15,
      twinkle: rng() > 0.25,
    }));
  }, [count]);

  return (
    <div
      aria-hidden
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            background: "#ffffff",
            opacity: s.opacity,
            boxShadow: s.size > 1.4 ? `0 0 ${s.size * 2}px rgba(255,255,255,0.6)` : undefined,
            animation: s.twinkle
              ? `moonlitTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`
              : undefined,
          }}
        />
      ))}
      <style>{`
        @keyframes moonlitTwinkle {
          0%, 100% { opacity: var(--star-min, 0.25); transform: scale(1); }
          50%      { opacity: 1;                       transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
