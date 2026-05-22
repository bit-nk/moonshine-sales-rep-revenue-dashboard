import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

interface LeadsByAgentData {
  agent: string;
  lead_count: number;
  l2l?: number;
}

interface LeadsByAgentChartProps {
  data: LeadsByAgentData[];
}

const VIBRANT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

type ViewMode = "volume" | "l2l";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: LeadsByAgentData }>;
  mode: ViewMode;
}

const CustomTooltip = ({ active, payload, mode }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border px-4 py-3 shadow-md" style={{ backgroundColor: '#242424', borderColor: '#00e5cc' }}>
        <p className="font-semibold mb-1" style={{ color: '#ffffff' }}>{data.agent}</p>
        <p className="text-sm" style={{ color: '#a1a1aa' }}>
          <span className="font-semibold" style={{ color: '#00e5cc' }}>
            {mode === "volume" ? data.lead_count.toLocaleString() : (data.l2l ?? 0).toFixed(1)}
          </span>{" "}
          {mode === "volume" ? "leads" : "L2L ratio"}
        </p>
      </div>
    );
  }
  return null;
};

export default function LeadsByAgentChart({ data }: LeadsByAgentChartProps) {
  const [mode, setMode] = useState<ViewMode>("volume");

  const dataKey = mode === "volume" ? "lead_count" : "l2l";

  const sortedData = [...data]
    .sort((a, b) => (mode === "volume" ? b.lead_count - a.lead_count : (b.l2l ?? 0) - (a.l2l ?? 0)))
    .slice(0, 10);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Leads by Sales Rep</h2>
          <p className="text-sm text-muted-foreground">
            {mode === "volume" ? "Top 10 sales reps by lead volume" : "Top 10 sales reps by L2L ratio"}
          </p>
        </div>
        <div className="inline-flex items-center rounded-md border border-border bg-muted/30 p-0.5 gap-0.5">
          {([{ value: "volume", label: "Lead Volume" }, { value: "l2l", label: "L2L Ratio" }] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors",
                mode === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "360px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => mode === "volume" ? value.toLocaleString() : value.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="agent"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--foreground))", fontSize: 13 }}
              width={120}
            />
            <Tooltip
              content={<CustomTooltip mode={mode} />}
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            />
            <Bar
              dataKey={dataKey}
              radius={[0, 6, 6, 0]}
              maxBarSize={28}
            >
              {sortedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]}
                />
              ))}
              <LabelList
                dataKey={dataKey}
                position="right"
                fill="hsl(var(--foreground))"
                fontSize={12}
                formatter={(value: number) => mode === "volume" ? value.toLocaleString() : value.toFixed(1)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
