import { useState, useEffect } from "react";
import { INSIGHT_FEED } from "@/lib/insightFeed";

const INSIGHTS = INSIGHT_FEED;

export default function NewsTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % INSIGHTS.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-lg px-6 py-3 flex items-center justify-center min-h-[44px]"
      style={{ background: "hsl(220, 40%, 13%)" }}
    >
      <span className="text-amber-400/70 text-xs mr-3">◆</span>
      <p
        className="text-[13px] font-medium tracking-wide text-center transition-opacity duration-400"
        style={{
          color: "hsl(45, 80%, 62%)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
        }}
      >
        {INSIGHTS[index]}
      </p>
      <span className="text-amber-400/70 text-xs ml-3">◆</span>
    </div>
  );
}
