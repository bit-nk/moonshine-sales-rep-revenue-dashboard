import { getChannelPerformance, type DateRange } from "@/data/stubData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  dateRange?: DateRange;
}

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const formatCPL = (value: number | null) =>
  value == null ? " - " : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

const formatROAS = (value: number | null) =>
  value == null ? " - " : `${value.toFixed(2)}×`;

export default function ChannelPerformanceCard({ dateRange }: Props = {}) {
  const rows = getChannelPerformance(dateRange);
  return (
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-lg font-semibold mb-1" style={{ color: "#ffffff" }}>
  Channel Performance
  </h2>
  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
  Spend, leads, CPL, attributed revenue and ROAS  -  by source channel
  </p>
  <div className="overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
  <tr
  className="text-xs uppercase tracking-wider"
  style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(135,127,73,0.3)" }}
  >
  <th className="text-left py-2 pr-4">Channel</th>
  <th className="text-right py-2 px-3">Spend</th>
  <th className="text-right py-2 px-3">Leads</th>
  <th className="text-right py-2 px-3">CPL</th>
  <th className="text-right py-2 px-3">Revenue</th>
  <th className="text-right py-2 pl-3">ROAS</th>
  </tr>
  </thead>
  <tbody>
  {rows.map((r) => (
  <tr key={r.channel} style={{ borderBottom: "1px solid rgba(135,127,73,0.12)" }}>
  <td className="py-2.5 pr-4 font-medium" style={{ color: "#ffffff" }}>
  {r.channel}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
  {formatUSD(r.spend)}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
  {r.leads.toLocaleString()}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
  {formatCPL(r.costPerLead)}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#877F49" }}>
  {formatUSD(r.revenue)}
  </td>
  <td className="py-2.5 pl-3 text-right tabular-nums font-semibold" style={{ color: "#00B4A6" }}>
  {formatROAS(r.roas)}
  </td>
  </tr>
  ))}
  </tbody>
  </table>
  </div>
  </div>
  );
}
