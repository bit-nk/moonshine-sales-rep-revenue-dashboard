import { ChevronRight, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ConnectorMetric {
  label: string;
  value: string;
}

interface Props {
  name: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
  /** Optional route - used only when onClick is not provided. */
  route?: string;
  /** Preferred - in-place drilldown handler (no navigation). */
  onClick?: () => void;
  primaryValue: string;
  primaryLabel: string;
  metrics: ConnectorMetric[];
  status?: "Connected" | "Syncing" | "Disconnected";
}

const STATUS_STYLE: Record<NonNullable<Props["status"]>, { color: string; bg: string }> = {
  Connected:  { color: "#00B4A6", bg: "rgba(0, 180, 166, 0.12)" },
  Syncing:  { color: "#D4B85A", bg: "rgba(212, 184, 90, 0.15)" },
  Disconnected: { color: "#E2734A", bg: "rgba(226, 115, 74, 0.15)" },
};

export default function ConnectorTile({
  name,
  description,
  Icon,
  accent,
  route,
  onClick,
  primaryValue,
  primaryLabel,
  metrics,
  status = "Connected",
}: Props) {
  const navigate = useNavigate();
  const s = STATUS_STYLE[status];
  const handleClick = onClick ?? (route ? () => navigate(route) : undefined);

  return (
  <button
  type="button"
  onClick={handleClick}
  className="group text-left transition-all"
  style={{
  background: "rgba(20, 20, 20, 0.72)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  border: "1px solid rgba(135, 127, 73, 0.45)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
  padding: "1.5rem",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  }}
  onMouseEnter={(e) => {
  e.currentTarget.style.borderColor = `${accent}99`;
  e.currentTarget.style.boxShadow = `0 0 28px 4px ${accent}26, 0 8px 32px rgba(0,0,0,0.45)`;
  e.currentTarget.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
  e.currentTarget.style.borderColor = "rgba(135, 127, 73, 0.45)";
  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)";
  e.currentTarget.style.transform = "translateY(0)";
  }}
  >
  {/* Accent stripe */}
  <span
  aria-hidden
  style={{
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 3,
  background: accent,
  }}
  />

  {/* Header */}
  <div className="flex items-start justify-between mb-3">
  <div className="flex items-center gap-3">
  <div
  className="flex items-center justify-center"
  style={{
  width: 40,
  height: 40,
  borderRadius: 10,
  background: `${accent}1A`,
  border: `1px solid ${accent}40`,
  }}
  >
  <Icon size={20} color={accent} />
  </div>
  <div>
  <h3 className="text-sm font-semibold" style={{ color: "#ffffff" }}>
  {name}
  </h3>
  <span
  className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5"
  style={{ background: s.bg, color: s.color }}
  >
  {status}
  </span>
  </div>
  </div>
  <ChevronRight
  size={16}
  className="transition-transform group-hover:translate-x-0.5"
  style={{ color: "rgba(255,255,255,0.5)" }}
  />
  </div>

  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  {description}
  </p>

  {/* Hero metric */}
  <div className="mb-4">
  <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: "#ffffff" }}>
  {primaryValue}
  </p>
  <p
  className="text-[10px] uppercase tracking-widest mt-1"
  style={{ color: accent }}
  >
  {primaryLabel}
  </p>
  </div>

  {/* Supporting metrics */}
  <div className="pt-3" style={{ borderTop: "1px solid rgba(135, 127, 73, 0.2)" }}>
  <div className="grid grid-cols-2 gap-3">
  {metrics.map((m) => (
  <div key={m.label}>
  <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
  {m.label}
  </p>
  <p className="text-sm font-semibold tabular-nums" style={{ color: "#ffffff" }}>
  {m.value}
  </p>
  </div>
  ))}
  </div>
  </div>
  </button>
  );
}
