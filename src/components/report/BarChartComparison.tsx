import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DevelopmentData, formatCurrency } from "@/data/marketingData";
import { getDevColor } from "@/lib/chartColors";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";

interface Props {
  data: DevelopmentData[];
  dateRange?: string;
}

const BarChartComparison = ({ data: rawData, dateRange }: Props) => {
  const data = rawData
    .filter(item => item.channel === "Google Search" && item.spend > 0)
    .map(item => ({
      name: item.development.length > 15 ? item.development.substring(0, 12) + "..." : item.development,
      fullName: item.development,
      spend: item.spend,
      conversions: item.conversions,
      hasConversions: item.conversions > 0,
      color: getDevColor(item.development),
    }))
    .sort((a, b) => b.spend - a.spend);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-4" style={GLASS_TOOLTIP_STYLE}>
          <p className="font-medium mb-2" style={{ color: "#ffffff" }}>{d.fullName}</p>
          <div className="space-y-1 text-sm">
            <p><span style={{ color: "rgba(255,255,255,0.6)" }}>Spend: </span><span className="font-semibold" style={{ color: "#ffffff" }}>{formatCurrency(d.spend)}</span></p>
            <p><span style={{ color: "rgba(255,255,255,0.6)" }}>Conversions: </span><span className={d.conversions > 0 ? "font-semibold" : ""} style={{ color: d.conversions > 0 ? "#00B4A6" : "rgba(255,255,255,0.6)" }}>{d.conversions > 0 ? d.conversions.toFixed(1) : "-"}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Spend vs Conversions</h3>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Google Search campaigns{dateRange ? ` (${dateRange})` : ''}</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#ffffff', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spend" radius={[0, 4, 4, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4 pt-4 flex-wrap" style={{ borderTop: "1px solid rgba(135, 127, 73, 0.3)" }}>
        {data.slice(0, 4).map((d) => (
          <div key={d.fullName} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{d.fullName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChartComparison;
