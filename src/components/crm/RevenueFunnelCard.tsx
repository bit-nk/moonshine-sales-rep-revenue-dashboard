import type { Lead } from "@/hooks/useLeadsData";
import type { SaleRow } from "@/hooks/useSalesData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  leads: Lead[];
  sales: SaleRow[];
  /** Optional click handler - when set, the stage tiles become buttons that drill into a lead list. */
  onStageClick?: (stage: "SQLs" | "Demos Booked" | "Demos Completed" | "Deals Closed") => void;
}

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function RevenueFunnelCard({ leads, sales, onStageClick }: Props) {
  const sqls = leads.filter((l) =>
    ["Qualified", "Demo Booked", "Demo Completed", "Negotiation", "Closed Won"].includes(l.stage ?? ""),
  ).length;
  const demosBooked = leads.filter((l) =>
    ["Demo Booked", "Demo Completed", "Negotiation", "Closed Won"].includes(l.stage ?? ""),
  ).length;
  const demosCompleted = leads.filter((l) =>
    ["Demo Completed", "Negotiation", "Closed Won"].includes(l.stage ?? ""),
  ).length;
  const closedWon = leads.filter((l) => l.stage === "Closed Won").length;

  const revenue = sales
    .filter((s) => s.stripe_status !== "refunded")
    .reduce((sum, s) => sum + (s.deal_amount ?? s.sale_price ?? 0), 0);

  const winRate = sqls > 0 ? (closedWon / sqls) * 100 : 0;

  const stages = [
    { label: "SQLs", value: sqls, color: "#4A90E2" },
    { label: "Demos Booked", value: demosBooked, color: "#7AB892" },
    { label: "Demos Completed", value: demosCompleted, color: "#D4B85A" },
    { label: "Deals Closed", value: closedWon, color: "#00B4A6" },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
          Revenue Funnel
        </h2>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
              Revenue Attributed
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "#877F49" }}>
              {formatUSD(revenue)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
              SQL → Win Rate
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "#00B4A6" }}>
              {winRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
        Pipeline → Stripe revenue attribution
      </p>

      <div className="grid grid-cols-4 gap-3">
        {stages.map((s) => {
          const pct = (s.value / max) * 100;
          const clickable = !!onStageClick;
          return (
            <button
              type="button"
              key={s.label}
              onClick={() => clickable && onStageClick!(s.label as "SQLs" | "Demos Booked" | "Demos Completed" | "Deals Closed")}
              disabled={!clickable}
              className="rounded-xl p-4 text-center transition-all group"
              style={{
                background: "rgba(20, 20, 20, 0.6)",
                border: "1px solid rgba(135, 127, 73, 0.35)",
                cursor: clickable ? "pointer" : "default",
              }}
              onMouseEnter={(e) => {
                if (!clickable) return;
                e.currentTarget.style.borderColor = `${s.color}99`;
                e.currentTarget.style.boxShadow = `0 0 24px -4px ${s.color}55`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                if (!clickable) return;
                e.currentTarget.style.borderColor = "rgba(135, 127, 73, 0.35)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <p className="text-3xl font-bold tabular-nums" style={{ color: s.color }}>
                {s.value.toLocaleString()}
              </p>
              <p className="text-[11px] uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                {s.label}
              </p>
              <div className="mt-2 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(pct, 4)}%`, background: s.color }}
                />
              </div>
              {clickable && (
                <p className="text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: s.color }}>
                  View leads →
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
