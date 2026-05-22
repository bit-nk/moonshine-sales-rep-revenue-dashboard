import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getDevColor } from "@/lib/chartColors";
import { toNumber } from "@/lib/csvParser";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";

interface Props {
  rows: Record<string, string>[];
}

interface WeeklyPoint {
  week: string;
  [dev: string]: number | string;
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const CostPerConversionTrend = ({ rows }: Props) => {
  const { data, developments } = useMemo(() => {
    const weekDevMap = new Map<string, Map<string, { spend: number; conversions: number }>>();
    const devSet = new Set<string>();

    for (const row of rows) {
      const dateStr = row['Date'] || '';
      const adGroup = row['Ad Group'] || '';
      if (!dateStr || !adGroup) continue;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) continue;

      const development = adGroup.replace(/\s*-\s*Search$/, '').replace(/\s*-\s*Display$/, '').trim();
      if (!development) continue;
      devSet.add(development);

      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekDevMap.has(weekKey)) weekDevMap.set(weekKey, new Map());
      const devMap = weekDevMap.get(weekKey)!;
      const existing = devMap.get(development) || { spend: 0, conversions: 0 };
      existing.spend += toNumber(row['Cost (USD)'] || row['Cost'] || '0');
      existing.conversions += toNumber(row['Conversions'] || '0');
      devMap.set(development, existing);
    }

    const weeks = Array.from(weekDevMap.keys()).sort();
    const developments = Array.from(devSet).filter(dev => {
      return Array.from(weekDevMap.values()).some(m => (m.get(dev)?.conversions || 0) > 0);
    });

    const data: WeeklyPoint[] = weeks.map(week => {
      const devMap = weekDevMap.get(week)!;
      const point: WeeklyPoint = {
        week: new Date(week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      };
      for (const dev of developments) {
        const d = devMap.get(dev);
        point[dev] = d && d.conversions > 0 ? Math.round(d.spend / d.conversions) : 0;
      }
      return point;
    });

    return { data, developments };
  }, [rows]);

  if (data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3" style={GLASS_TOOLTIP_STYLE}>
          <p className="font-medium mb-2" style={{ color: "#ffffff" }}>Week of {label}</p>
          {payload.filter((p: any) => p.value > 0).map((p: any) => (
            <p key={p.dataKey} className="text-sm">
              <span style={{ color: p.color }}>{p.dataKey}: </span>
              <span className="font-semibold" style={{ color: "#ffffff" }}>{formatCurrency(p.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Cost per Conversion Trend</h3>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>Weekly trend by development (only showing developments with conversions)</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value: string) => <span className="text-sm" style={{ color: "#cccccc" }}>{value}</span>} />
            {developments.map((dev) => (
              <Line
                key={dev}
                type="monotone"
                dataKey={dev}
                stroke={getDevColor(dev)}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CostPerConversionTrend;
