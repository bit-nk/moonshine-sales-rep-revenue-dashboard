import type { Lead } from "@/hooks/useLeadsData";
import { getLeadFunnel } from "@/data/stubData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  leads: Lead[];
}

const STAGE_COLORS: Record<string, string> = {
  New: "#4A90E2",
  Contacted: "#5BA3E8",
  Qualified: "#7AB892",
  "Demo Booked": "#D4B85A",
  "Demo Completed": "#E2A14A",
  Negotiation: "#E2734A",
  "Closed Won": "#00B4A6",
  "Closed Lost": "#666666",
};

export default function LeadFunnelCard({ leads }: Props) {
  const funnel = getLeadFunnel(leads);
  const max = Math.max(1, ...funnel.map((f) => f.count));
  const total = funnel.reduce((s, f) => s + f.count, 0);
  const won = funnel.find((f) => f.stage === "Closed Won")?.count ?? 0;
  const lost = funnel.find((f) => f.stage === "Closed Lost")?.count ?? 0;
  const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
          Lead Pipeline Funnel
        </h2>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
            Win Rate
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: "#00B4A6" }}>
            {winRate.toFixed(1)}%
          </p>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
        {total.toLocaleString()} leads across all pipeline stages (HubSpot)
      </p>

      <div className="space-y-2">
        {funnel.map((f) => {
          const pct = (f.count / max) * 100;
          const color = STAGE_COLORS[f.stage] ?? "#666";
          return (
            <div
              key={f.stage}
              className="flex items-center gap-3 group rounded-md px-1 -mx-1 py-0.5 transition-colors hover:bg-white/[0.03]"
              style={{ cursor: "default" }}
            >
              <div
                className="w-32 text-xs uppercase tracking-wider transition-colors group-hover:text-white"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {f.stage}
              </div>
              <div className="flex-1 relative h-7 rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div
                  className="absolute left-0 top-0 bottom-0 rounded transition-all duration-300 group-hover:brightness-110"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: color,
                    boxShadow: `0 0 12px ${color}40`,
                  }}
                />
                {/* Glow overlay on hover */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: `linear-gradient(90deg, ${color}00 0%, ${color}55 50%, ${color}00 100%)`,
                  }}
                />
              </div>
              <div
                className="w-16 text-right tabular-nums font-semibold text-sm transition-transform group-hover:scale-110"
                style={{ color: "#ffffff" }}
              >
                {f.count.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
