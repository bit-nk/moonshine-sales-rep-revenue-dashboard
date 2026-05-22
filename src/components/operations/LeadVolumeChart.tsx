import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import type { Lead } from "@/hooks/useLeadsData";

interface WeeklyData {
  weekLabel: string;
  leads: number;
}

function getISOMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon...6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[date.getMonth()]}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const leadsVal = payload.find((p) => p.dataKey === "leads")?.value ?? 0;
    return (
      <div className="rounded-lg border px-4 py-3 shadow-md" style={{ backgroundColor: '#242424', borderColor: '#00e5cc' }}>
        <p className="font-medium text-sm" style={{ color: '#ffffff' }}>w/c {label}</p>
        <p className="text-sm mt-1" style={{ color: '#a1a1aa' }}>
          <span className="font-semibold" style={{ color: '#00e5cc' }}>{leadsVal.toLocaleString()}</span> leads
        </p>
      </div>
    );
  }
  return null;
}

interface LeadVolumeChartProps {
  leads: Lead[];
}

export default function LeadVolumeChart({ leads }: LeadVolumeChartProps) {
  const data = useMemo<WeeklyData[]>(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const weeklyLeads: Record<string, number> = {};

    for (const lead of leads) {
      const dateVal = lead.created_at || lead.date;
      if (!dateVal) continue;
      const d = new Date(dateVal);
      if (d < ninetyDaysAgo) continue;

      const monday = getISOMonday(d);
      const weekKey = monday.toISOString().split("T")[0];

      weeklyLeads[weekKey] = (weeklyLeads[weekKey] || 0) + 1;
    }

    const sortedWeeks = Object.keys(weeklyLeads).sort();

    return sortedWeeks.map((weekKey) => {
      const monday = new Date(weekKey);
      return {
        weekLabel: formatDate(monday),
        leads: weeklyLeads[weekKey],
      };
    });
  }, [leads]);

  return (
    <div>
      <div style={{ height: 300 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <XAxis
              dataKey="weekLabel"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="leads"
              name="Lead Volume"
              stroke="#00e5cc"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#00e5cc", stroke: "hsl(var(--card))", strokeWidth: 2 }}
            >
              <LabelList
                dataKey="leads"
                position="top"
                style={{ fill: "#00B4A6", fontWeight: 700, fontSize: 11 }}
                offset={6}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
