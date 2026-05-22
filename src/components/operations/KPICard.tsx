import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function useCountUp(target: number, shouldAnimate: boolean, duration = 1500) {
  // Initialise to the target so the card never gets stuck on "0" when the
  // animation can't start (e.g. headless contexts where IntersectionObserver
  // doesn't fire, or when the parent gates `shouldAnimate` on something that
  // resolves late). Animation, when enabled, will reset to 0 and tick up.
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplay(target);
      return;
    }
    setDisplay(0);
    startRef.current = undefined;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOut: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, shouldAnimate, duration]);

  return display;
}

const styles = {
  card: {
    background: "rgba(20, 20, 20, 0.72)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(135, 127, 73, 0.45)",
    borderRadius: "16px",
    padding: "2rem 2.25rem",
    width: "100%",
    position: "relative" as const,
    cursor: "default",
    boxSizing: "border-box" as const,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
  },
  cardCompact: {
    padding: "1.1rem 1.25rem",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
  },
  iconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(0, 180, 166, 0.12)",
    border: "1px solid rgba(0, 180, 166, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: (isPositive: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.03em",
    color: isPositive ? "#4ade80" : "#f87171",
    background: isPositive ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
    border: `1px solid ${isPositive ? "rgba(74, 222, 128, 0.2)" : "rgba(248, 113, 113, 0.2)"}`,
    borderRadius: "6px",
    padding: "3px 7px",
  }),
  valueRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
    marginBottom: "0.35rem",
  },
  prefix: {
    fontSize: "1.25rem",
    fontWeight: 500,
    color: "#a0a0a0",
    lineHeight: 1,
  },
  value: {
    fontSize: "2.6rem",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  suffix: {
    fontSize: "1rem",
    fontWeight: 400,
    color: "#a0a0a0",
    lineHeight: 1,
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#6b6b6b",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    marginBottom: "1.25rem",
  },
  divider: {
    height: "1px",
    background: "linear-gradient(to right, rgba(135, 127, 73, 0.4), transparent)",
    marginBottom: "1rem",
  },
  subText: {
    fontSize: "0.72rem",
    color: "#555",
    letterSpacing: "0.02em",
  },
  glowOverlay: {
    position: "absolute" as const,
    inset: 0,
    borderRadius: "16px",
    pointerEvents: "none" as const,
  },
};

interface KPICardProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  change?: number;
  invertTrend?: boolean;
  hideTrend?: boolean;
  subText?: string;
  icon?: React.ReactNode;
  delay?: number;
  animate?: boolean;
  customValue?: string;
  info?: string;
  onClick?: () => void;
  compact?: boolean;
}

export function KPICard({
  value = 0,
  label = "Metric",
  prefix = "",
  suffix = "",
  change = 0,
  hideTrend = false,
  invertTrend = false,
  subText = "vs. last period",
  icon,
  delay = 0,
  animate = false,
  customValue,
  info,
  onClick,
  compact = false,
}: KPICardProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Drop the `margin: "-40px"` clamp - it was preventing the observer from
  // firing for cards that sit near the top of the viewport (and never firing
  // at all in headless contexts), leaving the count stuck at 0.
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, animate && inView);
  const isPositive = invertTrend ? change <= 0 : change >= 0;

  return (
    <motion.div
      ref={ref}
      style={{
        ...styles.card,
        ...(compact ? styles.cardCompact : null),
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      whileHover="hovered"
    >
      <motion.div
        style={styles.glowOverlay}
        variants={{
          hovered: {
            boxShadow: "0 0 28px 4px rgba(0, 180, 166, 0.14), inset 0 0 0 1px rgba(0, 180, 166, 0.3)",
          },
        }}
        transition={{ duration: 0.25 }}
      />

      <div style={styles.topRow}>
        <div style={styles.iconBadge}>
          {icon ?? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B4A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          )}
        </div>
        {!hideTrend && (
          <div style={styles.trendBadge(isPositive)}>
            {isPositive ? "▲" : "▼"} {Math.abs(change)}%
          </div>
        )}
      </div>

      <div style={{ ...styles.valueRow, ...(compact ? { marginBottom: "0.25rem" } : null) }}>
        {customValue ? (
          <span style={{ ...styles.value, fontSize: "1.6rem" }}>{customValue}</span>
        ) : (
          <>
            {prefix && <span style={styles.prefix}>{prefix}</span>}
            <motion.span
              style={{ ...styles.value, ...(compact ? { fontSize: "2rem" } : null) }}
              animate={inView ? { color: ["#00B4A6", "#ffffff"] } : {}}
              transition={{ duration: 0.9, delay: delay + 0.2, ease: "easeOut" }}
            >
              {count.toLocaleString()}
            </motion.span>
            {suffix && <span style={styles.suffix}>{suffix}</span>}
          </>
        )}
      </div>

      <div style={{ ...styles.label, ...(compact ? { marginBottom: "0.5rem", fontSize: "0.7rem" } : null) }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {label}
          {info && (
            <span className="relative group" style={{ display: "inline-flex" }}>
              <span
                className="cursor-help select-none"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1px solid rgba(135, 127, 73, 0.7)",
                  fontSize: 9,
                  color: "#ffffff",
                  lineHeight: 1,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                ?
              </span>
              <span
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  width: 240,
                  background: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(135, 127, 73, 0.6)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "#ffffff",
                  fontSize: 11,
                  lineHeight: 1.5,
                  textTransform: "none",
                  letterSpacing: 0,
                  fontWeight: 400,
                }}
              >
                {info}
              </span>
            </span>
          )}
        </span>
      </div>

      {!compact && <div style={styles.divider} />}
      {!compact && <div style={styles.subText}>{subText}</div>}
    </motion.div>
  );
}
