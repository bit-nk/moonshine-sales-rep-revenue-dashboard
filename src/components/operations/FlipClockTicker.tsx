import { useState, useEffect, useRef } from "react";
import { INSIGHT_FEED } from "@/lib/insightFeed";

const INSIGHTS = INSIGHT_FEED;

export default function FlipClockTicker() {
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [nextIndex, setNextIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setNextIndex((index + 1) % INSIGHTS.length);
      setFlipping(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % INSIGHTS.length);
        setFlipping(false);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div
      className="w-full overflow-hidden px-6 flex items-center justify-center"
      style={{
        background: "rgba(20, 20, 20, 0.72)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(135, 127, 73, 0.45)",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        height: 48,
        perspective: "600px",
      }}
    >
      <span className="text-xs mr-3 shrink-0" style={{ color: "#877F49" }}>
        ◆ MARKET INTEL
      </span>
      <div className="relative flex-1 overflow-hidden" style={{ height: 28 }}>
        {/* Current */}
        <p
          className="absolute inset-0 flex items-center text-[13px] font-medium tracking-wide"
          style={{
            color: "hsl(45, 80%, 62%)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
            transform: flipping ? "rotateX(90deg)" : "rotateX(0deg)",
            opacity: flipping ? 0 : 1,
            transformOrigin: "bottom center",
            backfaceVisibility: "hidden",
          }}
        >
          {INSIGHTS[index]}
        </p>
        {/* Next */}
        <p
          className="absolute inset-0 flex items-center text-[13px] font-medium tracking-wide"
          style={{
            color: "hsl(45, 80%, 62%)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
            transform: flipping ? "rotateX(0deg)" : "rotateX(-90deg)",
            opacity: flipping ? 1 : 0,
            transformOrigin: "top center",
            backfaceVisibility: "hidden",
          }}
        >
          {INSIGHTS[nextIndex]}
        </p>
      </div>
      <span className="text-xs ml-3 shrink-0" style={{ color: "#877F49" }}>
        ◆
      </span>
    </div>
  );
}
