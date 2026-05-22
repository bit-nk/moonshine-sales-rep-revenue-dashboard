import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SearchQueryData } from "@/data/searchQueryData";
import { INTENT_COLORS } from "@/lib/chartColors";
import { useMemo } from "react";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";

interface Props {
  data: SearchQueryData[];
}

const SearchIntentDonut = ({ data }: Props) => {
  const chartData = useMemo(() => {
    let branded = 0, highIntent = 0, broad = 0;

    for (const q of data) {
      const lower = q.query.toLowerCase();
      if (q.queryType === 'Branded') {
        branded += q.spend;
      } else if (
        lower.includes('for sale') ||
        lower.includes('to buy') ||
        lower.includes('bedroom') ||
        lower.includes('price')
      ) {
        highIntent += q.spend;
      } else {
        broad += q.spend;
      }
    }

    return [
      { name: 'Branded', value: Math.round(branded), color: INTENT_COLORS.branded },
      { name: 'High-Intent Generic', value: Math.round(highIntent), color: INTENT_COLORS.highIntent },
      { name: 'Broad / Discovery', value: Math.round(broad), color: INTENT_COLORS.broad },
    ].filter(d => d.value > 0);
  }, [data]);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="p-3" style={GLASS_TOOLTIP_STYLE}>
          <p className="font-medium" style={{ color: "#ffffff" }}>{d.name}</p>
          <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{formatCurrency(d.value)}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{pct}% of search spend</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) return null;

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Search Intent Breakdown</h3>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Spend distribution by search intent type</p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 flex-1">
          {chartData.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium" style={{ color: "#ffffff" }}>{d.name}</span>
                    <span className="text-sm font-semibold" style={{ color: "#ffffff" }}>{formatCurrency(d.value)}</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{pct}% of spend</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SearchIntentDonut;
