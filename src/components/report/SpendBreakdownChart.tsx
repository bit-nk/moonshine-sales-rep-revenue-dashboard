import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DevelopmentData } from "@/data/marketingData";
import { getDevColor } from "@/lib/chartColors";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

interface Props {
  data: DevelopmentData[];
}

const SpendBreakdownChart = ({ data }: Props) => {
  const chartData = data
    .filter(item => item.spend > 0)
    .map(item => ({
      name: item.development,
      value: item.spend,
      category: item.category,
      color: getDevColor(item.development),
    }))
    .sort((a, b) => b.value - a.value);

  const totalSpend = chartData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3" style={GLASS_TOOLTIP_STYLE}>
          <p className="font-medium" style={{ color: "#ffffff" }}>{payload[0].payload.name}</p>
          <p className="font-semibold" style={{ color: "#00B4A6" }}>{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#ffffff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {formatCurrency(value)}
      </text>
    );
  };

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
        <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>Spend by Development</h3>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
            Total Spend
          </p>
          <p className="text-xl font-bold" style={{ color: "#ffffff", letterSpacing: "-0.01em" }}>
            {formatCurrency(totalSpend)}
          </p>
        </div>
      </div>
      <div className="h-[360px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="40%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value" label={renderCustomLabel} labelLine={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 }}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ paddingLeft: '20px' }} formatter={(value: string) => <span className="text-sm" style={{ color: "#cccccc" }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendBreakdownChart;
