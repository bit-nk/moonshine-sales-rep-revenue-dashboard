import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Megaphone,
  Target,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useSalesData } from "@/hooks/useSalesData";
import { STUB_AD_GROUPS, getChannelPerformance, PROGRAMS } from "@/data/stubData";
import { glass } from "@/lib/glassStyles";
import LeadList from "./LeadList";

type Breakdown = "spend" | "leads" | "revenue" | null;

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const formatUSDExact = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export default function MetaAdsDetail() {
  const { data: leads = [] } = useLeadsData();
  const { data: sales = [] } = useSalesData();
  const [breakdown, setBreakdown] = useState<Breakdown>(null);

  const metaLeads = useMemo(() => leads.filter((l) => l.source === "Meta Ads"), [leads]);
  const metaSales = useMemo(() => sales.filter((s) => s.source === "Meta Ads" && s.stripe_status !== "refunded"), [sales]);

  // Aggregate top Meta campaigns by spend
  const topCampaigns = useMemo(() => {
    const map = new Map<string, { spend: number; conversions: number; clicks: number; impressions: number }>();
    for (const row of STUB_AD_GROUPS) {
      const e = map.get(row.ad_group) ?? { spend: 0, conversions: 0, clicks: 0, impressions: 0 };
      e.spend       += row.cost_zar;
      e.conversions += row.conversions;
      e.clicks      += row.clicks;
      e.impressions += row.impressions;
      map.set(row.ad_group, e);
    }
    return Array.from(map.entries())
      .map(([campaign, v]) => ({
        campaign,
        spend: v.spend,
        conversions: v.conversions,
        clicks: v.clicks,
        impressions: v.impressions,
        cpl: v.conversions > 0 ? v.spend / v.conversions : null,
        ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend);
  }, []);

  // Daily spend trend (last 30 days)
  const trend = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const r of STUB_AD_GROUPS) {
      byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.cost_zar);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-30);
  }, []);
  const trendMax = Math.max(1, ...trend.map(([, v]) => v));

  const channels = useMemo(() => getChannelPerformance(), []);
  const meta = channels.find((c) => c.channel === "Meta Ads");

  const kpis: { key: Breakdown; label: string; value: string; Icon: typeof DollarSign; color: string }[] = [
    { key: "spend",   label: "Total Spend",   value: formatUSD(meta?.spend ?? 0),                  Icon: DollarSign, color: "#5BA3E8" },
    { key: "leads",   label: "Leads Sourced", value: metaLeads.length.toLocaleString(),            Icon: Target,     color: "#7AB8E8" },
    { key: null,      label: "Avg CPL",       value: formatUSD(meta?.costPerLead ?? 0),            Icon: Zap,        color: "#B8D4F0" },
    { key: "revenue", label: "Revenue",       value: formatUSD(meta?.revenue ?? 0),                Icon: TrendingUp, color: "#7AD4A2" },
    { key: null,      label: "ROAS",          value: meta?.roas != null ? `${meta.roas.toFixed(2)}x` : "-", Icon: TrendingUp, color: meta?.roas && meta.roas >= 1 ? "#7AD4A2" : "#F0B870" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(91, 163, 232, 0.14)",
            border: "1px solid rgba(91, 163, 232, 0.45)",
          }}
        >
          <Megaphone size={22} color="#5BA3E8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#E0E8F0" }}>Meta Ads</h1>
          <p className="text-xs" style={{ color: "rgba(184,212,240,0.55)" }}>
            Paid social ingestion - spend, lead sourcing, CPL & attributed revenue
          </p>
        </div>
      </div>

      {/* KPI strip - Total Spend / Leads Sourced / Revenue are clickable for breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {kpis.map((k) => {
          const clickable = !!k.key;
          const active = breakdown === k.key && clickable;
          return (
            <button
              key={k.label}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setBreakdown(active ? null : k.key)}
              className={glass("default", active ? "blue" : "none", "p-4 text-left group transition-all")}
              style={{
                cursor: clickable ? "pointer" : "default",
                borderColor: active ? "rgba(91,163,232,0.6)" : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <k.Icon size={13} strokeWidth={1.8} color={k.color} />
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: k.color }}>{k.label}</p>
                </div>
                {clickable && (
                  <span className="text-[10px]" style={{ color: active ? "#5BA3E8" : "rgba(184,212,240,0.4)" }}>
                    {active ? "Hide" : "Drill"}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold tabular-nums" style={{ color: "#ffffff" }}>{k.value}</p>
            </button>
          );
        })}
      </div>

      {/* Drilldown panel - rendered when a clickable KPI is active */}
      {breakdown === "spend" && (
        <SpendBreakdown
          topCampaigns={topCampaigns}
          trend={trend}
          trendMax={trendMax}
          totalSpend={meta?.spend ?? 0}
          onClose={() => setBreakdown(null)}
        />
      )}
      {breakdown === "leads" && (
        <LeadsBreakdown leads={metaLeads} onClose={() => setBreakdown(null)} />
      )}
      {breakdown === "revenue" && (
        <RevenueBreakdown
          metaSales={metaSales}
          metaLeads={metaLeads}
          totalRevenue={meta?.revenue ?? 0}
          totalSpend={meta?.spend ?? 0}
          onClose={() => setBreakdown(null)}
        />
      )}

      {/* When no drilldown active, show the standard overview content */}
      {breakdown === null && (
        <>
          {/* Top campaigns + daily trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={glass("default", "none", "p-6")}>
              <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>Top Meta Campaigns</h2>
              <p className="text-xs mb-4" style={{ color: "rgba(184,212,240,0.55)" }}>By total ad spend over the period</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-xs uppercase tracking-wider"
                      style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
                    >
                      <th className="text-left py-2 pr-3">Campaign</th>
                      <th className="text-right py-2 px-3">Spend</th>
                      <th className="text-right py-2 px-3">Conversions</th>
                      <th className="text-right py-2 pl-3">CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCampaigns.slice(0, 6).map((c) => (
                      <tr key={c.campaign} style={{ borderBottom: "1px solid rgba(184,212,240,0.08)" }}>
                        <td className="py-2.5 pr-3" style={{ color: "#ffffff" }}>{c.campaign.replace(/^Meta - /, "")}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#5BA3E8" }}>{formatUSD(c.spend)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{Math.round(c.conversions).toLocaleString()}</td>
                        <td className="py-2.5 pl-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{c.cpl != null ? formatUSD(c.cpl) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={glass("default", "none", "p-6")}>
              <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>Daily Spend - Last 30 Days</h2>
              <p className="text-xs mb-4" style={{ color: "rgba(184,212,240,0.55)" }}>Pacing of Meta ad spend</p>
              <div className="flex items-end gap-1 h-44">
                {trend.map(([date, value]) => {
                  const h = (value / trendMax) * 100;
                  return (
                    <div
                      key={date}
                      className="flex-1 rounded-t transition-all hover:brightness-125"
                      title={`${date} - ${formatUSD(value)}`}
                      style={{
                        height: `${Math.max(h, 4)}%`,
                        background: "linear-gradient(180deg, rgba(91,163,232,0.85), rgba(91,163,232,0.30))",
                        border: "1px solid rgba(91,163,232,0.45)",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Meta-sourced leads */}
          <LeadList
            leads={metaLeads}
            title="Meta-Sourced Leads"
            subtitle={`${metaLeads.length.toLocaleString()} leads attributed to Meta Ads - click any row for source, progress, qualification and notes.`}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spend breakdown: per-campaign spend, per-day pacing, share
// ─────────────────────────────────────────────────────────────────────────────
interface SpendBreakdownProps {
  topCampaigns: { campaign: string; spend: number; conversions: number; clicks: number; impressions: number; cpl: number | null; ctr: number }[];
  trend: [string, number][];
  trendMax: number;
  totalSpend: number;
  onClose: () => void;
}
function SpendBreakdown({ topCampaigns, trend, trendMax, totalSpend, onClose }: SpendBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className={glass("default", "blue", "p-6")}>
      <BreakdownHeader title="Spend Breakdown" subtitle={`${formatUSD(totalSpend)} total Meta ad spend - distributed across ${topCampaigns.length} campaigns`} onClose={onClose} />

      {/* Per-campaign table with row expand to CTR / impressions detail */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs uppercase tracking-wider"
              style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
            >
              <th className="text-left py-2 pr-3 w-8"></th>
              <th className="text-left py-2 pr-3">Campaign</th>
              <th className="text-right py-2 px-3">Spend</th>
              <th className="text-right py-2 px-3">Share</th>
              <th className="text-right py-2 px-3">Conversions</th>
              <th className="text-right py-2 pl-3">CPL</th>
            </tr>
          </thead>
          <tbody>
            {topCampaigns.map((c) => {
              const isOpen = expanded === c.campaign;
              const share = totalSpend > 0 ? (c.spend / totalSpend) * 100 : 0;
              return (
                <>
                  <tr
                    key={c.campaign}
                    onClick={() => setExpanded(isOpen ? null : c.campaign)}
                    className="hover:bg-white/[0.04] transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(184,212,240,0.08)",
                      background: isOpen ? "rgba(91,163,232,0.05)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <td className="py-2.5 pr-3">
                      {isOpen ? <ChevronDown size={14} color="#5BA3E8" /> : <ChevronRight size={14} color="rgba(184,212,240,0.55)" />}
                    </td>
                    <td className="py-2.5 pr-3" style={{ color: "#ffffff" }}>{c.campaign.replace(/^Meta - /, "")}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#5BA3E8" }}>{formatUSD(c.spend)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{share.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{Math.round(c.conversions).toLocaleString()}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{c.cpl != null ? formatUSDExact(c.cpl) : "-"}</td>
                  </tr>
                  {isOpen && (
                    <tr style={{ borderBottom: "1px solid rgba(184,212,240,0.12)" }}>
                      <td colSpan={6} className="py-4 px-5" style={{ background: "rgba(15, 25, 50, 0.4)" }}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-xs" style={{ color: "rgba(184,212,240,0.75)" }}>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Impressions</p>
                            <p className="text-lg font-bold tabular-nums" style={{ color: "#ffffff" }}>{c.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Clicks</p>
                            <p className="text-lg font-bold tabular-nums" style={{ color: "#ffffff" }}>{c.clicks.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>CTR</p>
                            <p className="text-lg font-bold tabular-nums" style={{ color: "#7AB8E8" }}>{c.ctr.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Conv. rate</p>
                            <p className="text-lg font-bold tabular-nums" style={{ color: "#7AD4A2" }}>
                              {c.clicks > 0 ? `${((c.conversions / c.clicks) * 100).toFixed(2)}%` : "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Daily pacing */}
      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>
          Daily pacing - last 30 days
        </p>
        <div className="flex items-end gap-1 h-32">
          {trend.map(([date, value]) => {
            const h = (value / trendMax) * 100;
            return (
              <div
                key={date}
                className="flex-1 rounded-t hover:brightness-125 transition-all"
                title={`${date} - ${formatUSD(value)}`}
                style={{
                  height: `${Math.max(h, 4)}%`,
                  background: "linear-gradient(180deg, rgba(91,163,232,0.85), rgba(91,163,232,0.30))",
                  border: "1px solid rgba(91,163,232,0.45)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Leads breakdown: Meta-sourced leads with status + stage breakdowns + LeadList
// ─────────────────────────────────────────────────────────────────────────────
function LeadsBreakdown({ leads, onClose }: { leads: ReturnType<typeof useLeadsData>["data"]; onClose: () => void }) {
  const list = leads ?? [];
  // Breakdowns: by status, by stage, by program
  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of list) m.set(l.status ?? "Unknown", (m.get(l.status ?? "Unknown") || 0) + 1);
    return Array.from(m.entries()).map(([k, v]) => ({ key: k, count: v }));
  }, [list]);
  const byStage = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of list) m.set(l.stage ?? "Unknown", (m.get(l.stage ?? "Unknown") || 0) + 1);
    return Array.from(m.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count);
  }, [list]);
  const byProgram = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of list) m.set(l.listing ?? "Unknown", (m.get(l.listing ?? "Unknown") || 0) + 1);
    return Array.from(m.entries()).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count);
  }, [list]);

  return (
    <div className="space-y-4">
      <div className={glass("default", "blue", "p-6")}>
        <BreakdownHeader title="Leads Sourced Breakdown" subtitle={`${list.length.toLocaleString()} Meta-sourced leads, segmented by status / stage / program`} onClose={onClose} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
          <BreakdownColumn title="By status" rows={byStatus} accent="#7AD4A2" />
          <BreakdownColumn title="By pipeline stage" rows={byStage} accent="#5BA3E8" />
          <BreakdownColumn title="By program" rows={byProgram} accent="#B8D4F0" />
        </div>
      </div>

      <LeadList
        leads={list}
        title="Meta-Sourced Leads"
        subtitle="Filter by status, click any row to see source, stage, qualification and notes."
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue breakdown: by program + recent Meta-attributed deals
// ─────────────────────────────────────────────────────────────────────────────
interface RevenueBreakdownProps {
  metaSales: ReturnType<typeof useSalesData>["data"];
  metaLeads: ReturnType<typeof useLeadsData>["data"];
  totalRevenue: number;
  totalSpend: number;
  onClose: () => void;
}
function RevenueBreakdown({ metaSales, totalRevenue, totalSpend, onClose }: RevenueBreakdownProps) {
  const sales = metaSales ?? [];
  const [expanded, setExpanded] = useState<number | null>(null);

  const byProgram = useMemo(() => {
    const m = new Map<string, { deals: number; revenue: number }>();
    for (const s of sales) {
      const k = s.development ?? "Unknown";
      const e = m.get(k) ?? { deals: 0, revenue: 0 };
      e.deals += 1;
      e.revenue += s.deal_amount ?? s.sale_price ?? 0;
      m.set(k, e);
    }
    // include programs with zero so the table is visually complete
    for (const p of PROGRAMS) if (!m.has(p)) m.set(p, { deals: 0, revenue: 0 });
    return Array.from(m.entries())
      .map(([program, v]) => ({ program, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : null;
  const avgDeal = sales.length > 0 ? totalRevenue / sales.length : 0;

  const sorted = useMemo(() => [...sales].sort((a, b) => (b.sale_date! > a.sale_date! ? 1 : -1)), [sales]);

  return (
    <div className={glass("default", "blue", "p-6")}>
      <BreakdownHeader
        title="Revenue Breakdown"
        subtitle={`${formatUSD(totalRevenue)} attributed to Meta Ads across ${sales.length} deals`}
        onClose={onClose}
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {[
          { label: "Total Revenue", value: formatUSD(totalRevenue), color: "#7AD4A2" },
          { label: "Deals Closed",  value: sales.length.toLocaleString(), color: "#5BA3E8" },
          { label: "Avg Deal",      value: formatUSD(avgDeal), color: "#B8D4F0" },
          { label: "ROAS",          value: roas != null ? `${roas.toFixed(2)}x` : "-", color: roas && roas >= 1 ? "#7AD4A2" : "#F0B870" },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-md px-4 py-3"
            style={{ background: "rgba(15, 25, 50, 0.5)", border: "1px solid rgba(184,212,240,0.18)" }}
          >
            <p className="text-[10px] uppercase tracking-widest" style={{ color: k.color }}>{k.label}</p>
            <p className="text-xl font-bold tabular-nums mt-1" style={{ color: "#ffffff" }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue by program */}
      <div className="mt-6 overflow-x-auto">
        <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "rgba(184,212,240,0.55)" }}>By program</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider" style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}>
              <th className="text-left py-2 pr-3">Program</th>
              <th className="text-right py-2 px-3">Deals</th>
              <th className="text-right py-2 px-3">Revenue</th>
              <th className="text-right py-2 pl-3">Share</th>
            </tr>
          </thead>
          <tbody>
            {byProgram.map((p) => {
              const share = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
              return (
                <tr key={p.program} style={{ borderBottom: "1px solid rgba(184,212,240,0.08)" }}>
                  <td className="py-2.5 pr-3" style={{ color: "#ffffff" }}>{p.program}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{p.deals.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#7AD4A2" }}>{formatUSD(p.revenue)}</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{share.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Meta-attributed deals (click to expand) */}
      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "rgba(184,212,240,0.55)" }}>Recent Meta deals</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}>
                <th className="text-left py-2 pr-3 w-8"></th>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">Program</th>
                <th className="text-left py-2 pr-3">Sales Rep</th>
                <th className="text-left py-2 pr-3">Campaign</th>
                <th className="text-right py-2 pl-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 10).map((s) => {
                const isOpen = expanded === s.id;
                return (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="hover:bg-white/[0.04] transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(184,212,240,0.08)",
                        background: isOpen ? "rgba(91,163,232,0.05)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td className="py-2.5 pr-3">
                        {isOpen ? <ChevronDown size={14} color="#5BA3E8" /> : <ChevronRight size={14} color="rgba(184,212,240,0.55)" />}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                        {s.sale_date ? format(new Date(s.sale_date), "d MMM yyyy") : "-"}
                      </td>
                      <td className="py-2.5 pr-3" style={{ color: "#ffffff" }}>{s.development}</td>
                      <td className="py-2.5 pr-3" style={{ color: "rgba(184,212,240,0.85)" }}>{s.lead_agent ?? "-"}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-xs" style={{ color: "rgba(184,212,240,0.65)" }}>
                        {s.source_campaign ?? "-"}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums font-semibold" style={{ color: "#7AD4A2" }}>
                        {formatUSD(s.deal_amount ?? s.sale_price ?? 0)}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr style={{ borderBottom: "1px solid rgba(184,212,240,0.12)" }}>
                        <td colSpan={6} className="py-4 px-5" style={{ background: "rgba(15, 25, 50, 0.4)" }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs" style={{ color: "rgba(184,212,240,0.75)" }}>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Stripe invoice</p>
                              <p className="font-mono" style={{ color: "#ffffff" }}>{s.stripe_invoice_id ?? "-"}</p>
                              <p className="mt-1" style={{ color: "rgba(184,212,240,0.55)" }}>Status: <span style={{ color: "#ffffff" }}>{s.stripe_status ?? "succeeded"}</span></p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Attribution</p>
                              <p>Channel: <span style={{ color: "#ffffff" }}>{s.source ?? "-"}</span></p>
                              <p>Campaign: <span style={{ color: "#ffffff" }}>{s.source_campaign ?? "-"}</span></p>
                              {s.co_agent_1 && <p>Co-agent: <span style={{ color: "#ffffff" }}>{s.co_agent_1}</span></p>}
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Amount</p>
                              <p className="text-2xl font-bold tabular-nums" style={{ color: "#7AD4A2" }}>{formatUSD(s.deal_amount ?? s.sale_price ?? 0)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────
function BreakdownHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "#ffffff" }}>{title}</h2>
        <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.65)" }}>{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors"
        style={{
          background: "rgba(15, 25, 50, 0.5)",
          border: "1px solid rgba(184, 212, 240, 0.25)",
          color: "#E0E8F0",
        }}
      >
        <ArrowLeft size={12} /> Close
      </button>
    </div>
  );
}

function BreakdownColumn({ title, rows, accent }: { title: string; rows: { key: string; count: number }[]; accent: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>{title}</p>
      <div className="space-y-2">
        {rows.map((r) => {
          const pct = (r.count / max) * 100;
          return (
            <div key={r.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#ffffff" }}>{r.key}</span>
                <span className="tabular-nums font-semibold" style={{ color: accent }}>{r.count.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
