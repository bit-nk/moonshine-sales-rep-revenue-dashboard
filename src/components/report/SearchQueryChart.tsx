import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { SearchQueryData } from "@/data/searchQueryData";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";
import { PALETTE } from "@/lib/chartColors";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

interface Props {
  data: SearchQueryData[];
}

const SearchQueryChart = ({ data: rawData }: Props) => {
  const data = rawData.slice(0, 10).map(item => ({
    query: item.query.length > 28 ? item.query.substring(0, 25) + "..." : item.query,
    fullQuery: item.query,
    spend: item.spend,
    conversions: item.conversions,
    type: item.queryType,
    isBranded: item.queryType === "Branded",
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-4 max-w-xs" style={GLASS_TOOLTIP_STYLE}>
          <p className="font-medium mb-2 text-sm" style={{ color: "#ffffff" }}>"{d.fullQuery}"</p>
          <div className="space-y-1 text-sm">
            <p><span style={{ color: "rgba(255,255,255,0.6)" }}>Spend: </span><span className="font-semibold" style={{ color: "#ffffff" }}>{formatCurrency(d.spend)}</span></p>
            <p><span style={{ color: "rgba(255,255,255,0.6)" }}>Conversions: </span><span className={d.conversions > 0 ? "font-semibold" : ""} style={{ color: d.conversions > 0 ? "#00B4A6" : "rgba(255,255,255,0.6)" }}>{d.conversions > 0 ? d.conversions.toFixed(1) : "-"}</span></p>
            <p><span style={{ color: "rgba(255,255,255,0.6)" }}>Type: </span><span className="font-medium" style={{ color: "#ffffff" }}>{d.type}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Top Search Queries by Spend</h3>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>What buyers are searching for before submitting enquiries</p>
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" tickFormatter={(value) => `$${value}`} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <YAxis type="category" dataKey="query" width={180} tick={{ fill: '#ffffff', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spend" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isBranded ? PALETTE.gold : PALETTE.grey} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid rgba(135, 127, 73, 0.3)" }}>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: PALETTE.gold }} /><span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Branded development searches</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: PALETTE.grey }} /><span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Generic high-intent searches</span></div>
      </div>
    </div>
  );
};

export default SearchQueryChart;
