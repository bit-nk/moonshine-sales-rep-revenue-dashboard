import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// ─── Moonlit theme palette ───────────────────────────────────────────────────
// Deep navy backgrounds, frosted slate-blue glass, sky-blue & silvery accents.
export const THEME = {
  sky:        "#5BA3E8",  // primary blue accent
  skyBright:  "#7AB8E8",
  silver:     "#B8D4F0",  // soft moonlit silver
  ice:        "#E0E8F0",
  navy:       "#0a1024",
  navyDeep:   "#070a1a",
  warning:    "#F0B870",
  danger:     "#EF6F5C",
  white:      "#ffffff",
  textMuted:  "rgba(255, 255, 255, 0.65)",
  textDim:    "rgba(255, 255, 255, 0.45)",
} as const;

// ─── Inline-style versions (kept for existing call sites) ────────────────────
// More transparent than before so the moonlit-sky background image breathes
// through - matches the reference transparent-dashboard mock.
export const GLASS_CARD_STYLE: CSSProperties = {
  background: "rgba(15, 25, 50, 0.28)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: "1px solid rgba(184, 212, 240, 0.18)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
};

export const GLASS_TOOLTIP_STYLE: CSSProperties = {
  background: "rgba(10, 16, 36, 0.88)",
  backdropFilter: "blur(20px) saturate(160%)",
  WebkitBackdropFilter: "blur(20px) saturate(160%)",
  border: "1px solid rgba(184, 212, 240, 0.22)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.55)",
};

export const GLASS_NAV_STYLE: CSSProperties = {
  background: "rgba(7, 10, 26, 0.72)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  borderRight: "1px solid rgba(184, 212, 240, 0.10)",
};

// ─── Tailwind utility variant (cn-based) ─────────────────────────────────────
//
// Usage:
//   <div className={glass()}>                    // default frosted card
//   <div className={glass("elevated", "blue")}>  // brighter + blue glow
//   <div className={glass("subtle", "white", "p-6 rounded-2xl")}>
//
// The glow values mirror the moonlit accent palette and play well with the
// starfield background; pass "blue" to highlight an active/selected card.

export type GlassVariant = "default" | "elevated" | "subtle";
export type GlassGlow = "none" | "blue" | "white" | "warm";

export function glass(
  variant: GlassVariant = "default",
  glow: GlassGlow = "none",
  ...extra: (string | undefined | false | null)[]
) {
  return cn(
    "backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border transition-shadow",
    variant === "default"  && "bg-[rgba(15,25,50,0.28)] border-white/12",
    variant === "elevated" && "bg-[rgba(20,32,64,0.50)] border-white/18",
    variant === "subtle"   && "bg-[rgba(15,25,50,0.15)] border-white/8",
    glow === "blue"  && "shadow-[0_0_42px_-6px_rgba(91,163,232,0.40),inset_0_1px_0_rgba(255,255,255,0.06)]",
    glow === "white" && "shadow-[0_0_42px_-6px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]",
    glow === "warm"  && "shadow-[0_0_42px_-6px_rgba(240,184,112,0.32),inset_0_1px_0_rgba(255,255,255,0.06)]",
    glow === "none"  && "shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
    ...extra,
  );
}
