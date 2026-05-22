import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChannelData, getTotalChannelSpend, formatCurrency, getChannelSpendShare } from "@/data/channelData";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";
import { PALETTE } from "@/lib/chartColors";

const COLORS = [
  PALETTE.gold,
  PALETTE.blue,
];

interface Props {
  data: ChannelData[];
}

const ChannelSpendChart = ({ data: channelData }: Props) => {
  const chartData = channelData.map(item => ({
    name: item.channel,
    value: item.spend,
    share: getChannelSpendShare(channelData, item.channel),
  }));

  const totalSpend = getTotalChannelSpend(channelData);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3" style={GLASS_TOOLTIP_STYLE}>
          <p className="font-medium" style={{ color: "#ffffff" }}>{payload[0].payload.name}</p>
          <p className="font-semibold" style={{ color: "#00B4A6" }}>{formatCurrency(payload[0].value)}</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{payload[0].payload.share.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#ffffff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {formatCurrency(value)}
      </text>
    );
  };

  return (
    <div className="p-6 h-full" style={GLASS_CARD_STYLE}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Spend by Channel</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Total: {formatCurrency(totalSpend)}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#ffffff" }}>{item.name}</p>
                <p className="text-lg font-bold" style={{ color: "#ffffff" }}>{formatCurrency(item.value)}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{item.share.toFixed(1)}% of spend</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-[280px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={renderCustomLabel} labelLine={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 }}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChannelSpendChart;
