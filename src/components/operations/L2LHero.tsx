import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

function useDecimalCountUp(target: number, duration = 2.2) {
  const [display, setDisplay] = useState("0.0");
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    const unsub = spring.on("change", (v: number) => {
      setDisplay((Math.round(v * 10) / 10).toFixed(1));
    });
    motionVal.set(target);
    return unsub;
  }, [target, motionVal, spring]);

  return display;
}

const TOKEN = {
  teal: "#00B4A6",
  gold: "#877F49",
  white: "#FFFFFF",
  muted: "#6b6b6b",
  mutedMid: "#444444",
};

const glowVariants = {
  pulse: {
    opacity: [0.55, 1, 0.55],
    scale: [1, 1.08, 1],
    transition: {
      duration: 4,
      ease: "easeInOut" as const,
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  },
};

interface L2LHeroProps {
  ratio: number;
  delay?: number;
}

export function L2LHero({ ratio = 3.8, delay = 0 }: L2LHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const display = useDecimalCountUp(inView ? ratio : 0);

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center overflow-hidden rounded-xl py-6 px-4"
      style={{ background: "rgba(20, 20, 20, 0.72)", backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)", border: "1px solid rgba(135, 127, 73, 0.45)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)" }}
    >
      {/* Gold top-bar accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: "64px",
          height: "2px",
          background: `linear-gradient(to right, transparent, ${TOKEN.gold}, transparent)`,
          borderRadius: "0 0 2px 2px",
        }}
      />

      {/* Pulsing ambient teal glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          width: "200px",
          height: "160px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${TOKEN.teal}26 0%, transparent 72%)`,
        }}
        variants={glowVariants}
        animate="pulse"
      />

      {/* Hero number */}
      <div className="relative z-10 mt-1 mb-1" style={{ lineHeight: 1 }}>
        <motion.span
          className="block text-center"
          style={{
            fontSize: "5rem",
            fontWeight: 800,
            color: TOKEN.white,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
          animate={inView ? { color: [TOKEN.teal, TOKEN.white] } : {}}
          transition={{ duration: 1.1, delay: delay + 0.3, ease: "easeOut" }}
        >
          {display}
        </motion.span>
      </div>

      {/* Gold "L2L" label */}
      <motion.div
        className="text-center z-10"
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: TOKEN.gold,
          letterSpacing: "0.25em",
          textTransform: "uppercase" as const,
          marginTop: "0.4rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
        }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: delay + 0.5 }}
      >
        <span>L2L</span>
        <span className="relative group" style={{ display: "inline-flex" }}>
          <span
            className="flex items-center justify-center cursor-help select-none"
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "1px solid rgba(135, 127, 73, 0.7)",
              fontSize: 9,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: 0,
              fontWeight: 600,
            }}
          >
            ?
          </span>
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              width: 260,
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(135, 127, 73, 0.6)",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#ffffff",
              fontSize: 11,
              lineHeight: 1.5,
              letterSpacing: 0,
              textTransform: "none",
              fontWeight: 400,
              textAlign: "left",
              boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            }}
          >
            Leads-to-Listings ratio. Total leads received divided by number of unique listings this agent represents. A higher number indicates more lead volume per property.
          </span>
        </span>
      </motion.div>

      {/* Sub-label */}
      <motion.div
        className="text-center z-10"
        style={{
          fontSize: "0.72rem",
          fontWeight: 400,
          color: TOKEN.muted,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          marginTop: "0.25rem",
        }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: delay + 0.65 }}
      >
        leads per listing
      </motion.div>
    </div>
  );
}
