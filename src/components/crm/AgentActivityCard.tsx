import { ChevronRight } from "lucide-react";
import { getAgentActivity } from "@/data/stubData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  /**
   * When provided, each row becomes clickable and invokes this with the full
   * agent name. Parent decides what detail view to open (a Lead drilldown,
   * for example).
   */
  onAgentSelect?: (agent: string) => void;
}

export default function AgentActivityCard({ onAgentSelect }: Props) {
  const rows = getAgentActivity();
  const clickable = !!onAgentSelect;

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "#ffffff" }}>
        Sales Rep Activity & Assignment
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
        Leads per rep, open vs closed, conversion rate{clickable && " - click a row to see assigned leads & details"}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(184,212,240,0.18)" }}
            >
              <th className="text-left py-2 pr-4">Sales Rep</th>
              <th className="text-right py-2 px-3">Assigned</th>
              <th className="text-right py-2 px-3">Open</th>
              <th className="text-right py-2 px-3">Won</th>
              <th className="text-right py-2 px-3">Lost</th>
              <th className="text-right py-2 px-3">Conv. Rate</th>
              <th className="text-right py-2 pl-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.agent}
                onClick={() => clickable && onAgentSelect!(r.agent)}
                className={clickable ? "hover:bg-white/[0.04] transition-colors" : ""}
                style={{
                  borderBottom: "1px solid rgba(184,212,240,0.10)",
                  cursor: clickable ? "pointer" : "default",
                }}
              >
                <td className="py-2.5 pr-4 font-medium" style={{ color: "#ffffff" }}>
                  {r.agent}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {r.leadsAssigned.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {r.openLeads.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#7AD4A2" }}>
                  {r.closedWon.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {r.closedLost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#5BA3E8" }}>
                  {r.conversionRate.toFixed(1)}%
                </td>
                <td className="py-2.5 pl-3 text-right">
                  {clickable && <ChevronRight size={14} color="rgba(184,212,240,0.5)" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
