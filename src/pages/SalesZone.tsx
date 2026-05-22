import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Crown, Medal, Award, Trophy } from "lucide-react";
import { format } from "date-fns";
import AppShell from "@/components/moonlit/AppShell";
import { GLASS_CARD_STYLE, GLASS_TOOLTIP_STYLE } from "@/lib/glassStyles";
import { PALETTE } from "@/lib/chartColors";
import { useSalesData, getAgentLeaderboard, getUnitsByDevelopment, getSalesForAgent, type SaleRow } from "@/hooks/useSalesData";
import { useLeadsData, type Lead } from "@/hooks/useLeadsData";
import RevenueFunnelCard from "@/components/crm/RevenueFunnelCard";
import RevenueAttributionCard from "@/components/crm/RevenueAttributionCard";
import SalesDrilldown from "@/components/crm/SalesDrilldown";
import LeadsDrilldown from "@/components/operations/LeadsDrilldown";
import LeadList from "@/components/crm/LeadList";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from "recharts";

const PALETTE_LIST = [PALETTE.gold, PALETTE.blue, PALETTE.terracotta, PALETTE.sage, PALETTE.grey, '#B57FD1', '#5BC0BE', '#E8C46A'];

// Strict-stage filters - clicking a funnel tile drills into leads CURRENTLY
// at that stage, not cumulative "reached and passed through". (The funnel
// card itself still shows the cumulative count.)
const FUNNEL_STAGE_FILTERS: Record<string, (l: Lead) => boolean> = {
  SQLs:              (l) => l.stage === "Qualified",
  "Demos Booked":    (l) => l.stage === "Demo Booked",
  "Demos Completed": (l) => l.stage === "Demo Completed",
  "Deals Closed":    (l) => l.stage === "Closed Won",
};

function filterByFunnelStage(leads: Lead[], stage: string): Lead[] {
  const f = FUNNEL_STAGE_FILTERS[stage];
  return f ? leads.filter(f) : leads;
}

const formatUSDCompact = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function ProgramsList({ sales, onBack, onSelect }: { sales: SaleRow[]; onBack: () => void; onSelect: (program: string) => void }) {
  const byProgram = useMemo(() => {
    const map = new Map<string, { deals: number; revenue: number; reps: Set<string> }>();
    for (const s of sales) {
      const e = map.get(s.development) ?? { deals: 0, revenue: 0, reps: new Set<string>() };
      e.deals += 1;
      e.revenue += s.deal_amount ?? s.sale_price ?? 0;
      if (s.lead_agent) e.reps.add(s.lead_agent);
      map.set(s.development, e);
    }
    return Array.from(map.entries())
      .map(([program, v]) => ({ program, deals: v.deals, revenue: v.revenue, reps: v.reps.size }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#E0E8F0" }}>Active Programs</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(184,212,240,0.65)" }}>
            {byProgram.length} programs with closed deals - click a program to see the deals
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
          style={{
            background: "rgba(15, 25, 50, 0.5)",
            border: "1px solid rgba(184, 212, 240, 0.25)",
            color: "#E0E8F0",
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(15, 25, 50, 0.45)",
          backdropFilter: "blur(18px) saturate(160%)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          border: "1px solid rgba(184, 212, 240, 0.14)",
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs uppercase tracking-wider"
              style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
            >
              <th className="text-left py-3 pl-5 pr-3">Program</th>
              <th className="text-right py-3 px-3">Deals</th>
              <th className="text-right py-3 px-3">Revenue</th>
              <th className="text-right py-3 px-3">Reps involved</th>
              <th className="text-right py-3 pl-3 pr-5"></th>
            </tr>
          </thead>
          <tbody>
            {byProgram.map((p) => (
              <tr
                key={p.program}
                onClick={() => onSelect(p.program)}
                className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                style={{ borderBottom: "1px solid rgba(184,212,240,0.08)" }}
              >
                <td className="py-3 pl-5 pr-3 font-medium" style={{ color: "#ffffff" }}>{p.program}</td>
                <td className="py-3 px-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{p.deals.toLocaleString()}</td>
                <td className="py-3 px-3 text-right tabular-nums font-semibold" style={{ color: "#5BA3E8" }}>{formatUSDCompact(p.revenue)}</td>
                <td className="py-3 px-3 text-right tabular-nums" style={{ color: "rgba(184,212,240,0.85)" }}>{p.reps}</td>
                <td className="py-3 pl-3 pr-5 text-right">
                  <span className="text-xs" style={{ color: "#5BA3E8" }}>Details →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  fontWeight: 800,
  fontVariant: "small-caps",
  letterSpacing: "0.02em",
};

// Hollow moonlit back button - matches Dialer/NetSweep/Settings/Home/LeadsDrilldown.
function GoldBackButton({ onClick }: { onClick: () => void }) {
  return (
  <button
  onClick={onClick}
  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
  style={{
  background: "rgba(15, 25, 50, 0.65)",
  border: "1px solid rgba(91, 163, 232, 0.45)",
  color: "#E0E8F0",
  boxShadow: "0 0 14px rgba(91,163,232,0.15)",
  cursor: "pointer",
  }}
  onMouseEnter={(e) => {
  e.currentTarget.style.borderColor = "rgba(91, 163, 232, 0.85)";
  e.currentTarget.style.boxShadow = "0 0 22px rgba(91,163,232,0.4)";
  }}
  onMouseLeave={(e) => {
  e.currentTarget.style.borderColor = "rgba(91, 163, 232, 0.45)";
  e.currentTarget.style.boxShadow = "0 0 14px rgba(91,163,232,0.15)";
  }}
  >
  <ArrowLeft size={14} />
  Back
  </button>
  );
}

const PAGE_SIZE = 25;

// Match leads to a rep. Stub data stores l.agent as the full name
// (e.g. "Shelley Adler"), and the rep parameter arrives as the full name
// from the leaderboard / activity table - so do a direct full-name compare.
// Fall back to first-name compare for legacy data where l.agent might be a
// first name only.
function leadsForAgent(leads: Lead[], agentName: string): Lead[] {
  const target = agentName.trim().toLowerCase();
  const firstTarget = target.split(/\s+/)[0];
  return leads.filter((l) => {
    const a = l.agent?.trim().toLowerCase();
    if (!a) return false;
    if (a === target) return true;
    // Legacy fallback: lead.agent might just be the first name
    return a === firstTarget;
  });
}

function AgentDrilldown({ agent, sales, leads, onBack }: { agent: string; sales: SaleRow[]; leads: Lead[]; onBack: () => void }) {
  const agentLeads = useMemo(() => leadsForAgent(leads, agent), [leads, agent]);

  const uniqueListings = useMemo(() => {
  const set = new Set<string>();
  for (const l of agentLeads) {
  const addr = l.listing?.trim() || l.listing_address?.trim();
  if (addr) set.add(addr);
  }
  return Array.from(set).sort();
  }, [agentLeads]);

  const agentSales = useMemo(() => getSalesForAgent(sales, agent), [sales, agent]);
  // SalesDrilldown expects SaleRow[]; getSalesForAgent returns { sale, role } pairs
  const agentSaleRows = useMemo(() => agentSales.map((x) => x.sale), [agentSales]);

  const activeLeads = agentLeads.filter((l) => l.status !== "Closed").length;
  const closedLeads = agentLeads.filter((l) => l.status === "Closed").length;

  const kpis = [
  { label: "Total Leads", value: agentLeads.length.toLocaleString() },
  { label: "Active Leads", value: activeLeads.toLocaleString() },
  { label: "Closed Leads", value: closedLeads.toLocaleString() },
  { label: "Sales Credited", value: agentSales.length.toLocaleString() },
  ];

  return (
  <div className="space-y-6">
  <div className="flex items-center justify-between flex-wrap gap-4">
  <h2 className="text-3xl" style={{ color: "#fff", ...HEADING_STYLE }}>{agent}</h2>
  <GoldBackButton onClick={onBack} />
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {kpis.map((k) => (
  <div key={k.label} className="p-5" style={GLASS_CARD_STYLE}>
  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5BA3E8" }}>{k.label}</p>
  <p className="text-3xl font-bold mt-1" style={{ color: "#fff" }}>{k.value}</p>
  </div>
  ))}
  </div>

  {/* Leads - filterable + clickable rows for full lead detail */}
  <LeadList
    leads={agentLeads}
    title={`${agent}'s Leads`}
    subtitle="Filter by status, click any lead to see source, stage, qualification and notes."
    hideSalesRep
  />

  {/* Listings */}
  <div style={GLASS_CARD_STYLE} className="p-6">
  <h3 className="text-sm mb-4" style={{ color: "#fff", ...HEADING_STYLE, fontSize: 14 }}>Programs ({uniqueListings.length})</h3>
  {uniqueListings.length === 0 ? (
  <p className="text-sm text-muted-foreground">No listings</p>
  ) : (
  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-auto themed-scroll pr-2">
  {uniqueListings.map((addr) => (
  <li key={addr} className="text-sm py-2 px-3 rounded-md"
  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(135,127,73,0.2)", color: "rgba(255,255,255,0.85)" }}>
  {addr}
  </li>
  ))}
  </ul>
  )}
  </div>

  {/* Sales - row-expand for full deal detail (no internal back button - the agent drilldown has its own) */}
  {agentSaleRows.length > 0 ? (
    <SalesDrilldown
      title={`${agent}'s Sales`}
      subtitle={`${agentSaleRows.length} deals credited - click any row to see full deal context.`}
      sales={agentSaleRows}
      leads={leads}
    />
  ) : (
    <div className="p-6 text-center" style={GLASS_CARD_STYLE}>
      <p className="text-sm" style={{ color: "rgba(184,212,240,0.6)" }}>No sales credited yet.</p>
    </div>
  )}
  </div>
  );
}

const PODIUM_STYLE = [
  { color: PALETTE.gold,  Icon: Crown,  label: "1st" },
  { color: "#C0C0C0",  Icon: Medal,  label: "2nd" },
  { color: PALETTE.terracotta, Icon: Award,  label: "3rd" },
];

function Podium({ entries, onSelect }: { entries: { agent: string; count: number; inactive: boolean }[]; onSelect: (a: string) => void }) {
  const top3 = entries.slice(0, 3);
  // Visual order: 2nd, 1st, 3rd. Heights vary.
  const order = [1, 0, 2];
  const heights = [140, 180, 120];
  return (
  <div className="grid grid-cols-3 gap-4 items-end">
  {order.map((idx, i) => {
  const e = top3[idx];
  const style = PODIUM_STYLE[idx];
  if (!e) return <div key={i} />;
  const Icon = style.Icon;
  return (
  <button key={e.agent} onClick={() => onSelect(e.agent)} className="group flex flex-col items-center gap-2">
  <Icon className="h-6 w-6" style={{ color: style.color }} />
  <p className="text-sm font-bold text-center" style={{ color: "#fff", ...HEADING_STYLE, fontSize: 16 }}>
  {e.agent}
  {e.inactive && <span className="ml-2 text-[10px] font-normal" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>INACTIVE</span>}
  </p>
  <div
  className="w-full rounded-t-lg flex items-center justify-center transition-all group-hover:-translate-y-1"
  style={{
  height: heights[i],
  background: `linear-gradient(180deg, ${style.color}33 0%, ${style.color}11 100%)`,
  border: `1px solid ${style.color}80`,
  borderBottom: "none",
  boxShadow: `0 -4px 24px ${style.color}30`,
  }}
  >
  <div className="text-center">
  <p className="text-3xl font-extrabold" style={{ color: style.color, ...HEADING_STYLE }}>{e.count}</p>
  <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>{style.label}</p>
  </div>
  </div>
  </button>
  );
  })}
  </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as { development: string; units: number; internal: number; external: number };
  return (
  <div className="px-3 py-2" style={{ ...GLASS_TOOLTIP_STYLE, color: "#fff" }}>
  <p className="text-sm font-bold">{p.development}</p>
  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>{p.units} units</p>
  <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
  Internal: {p.internal} · External: {p.external}
  </p>
  </div>
  );
}

const SalesZone = () => {
  const { data: sales = [], isLoading: salesLoading, error: salesError } = useSalesData();
  const { data: leads = [], isLoading: leadsLoading } = useLeadsData();

  const [drilldownAgent, setDrilldownAgent] = useState<string | null>(null);
  // KPI drilldown state: "deals" = all, "direct" = is_external=false,
  // "programs" = grouped, "stage:<name>" = lead-funnel stage view.
  const [kpiDrill, setKpiDrill] = useState<null | "deals" | "direct" | "programs" | `stage:${string}`>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const savedScroll = useRef(0);

  const openAgent = useCallback((a: string) => {
  savedScroll.current = window.scrollY;
  setDrilldownAgent(a);
  }, []);
  const closeAgent = useCallback(() => {
  setDrilldownAgent(null);
  requestAnimationFrame(() => window.scrollTo({ top: savedScroll.current, behavior: "auto" }));
  }, []);

  const openKpi = useCallback((k: "deals" | "direct" | "programs") => {
    savedScroll.current = window.scrollY;
    setKpiDrill(k);
    setSelectedProgram(null);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }, []);
  const closeKpi = useCallback(() => {
    setKpiDrill(null);
    setSelectedProgram(null);
    requestAnimationFrame(() => window.scrollTo({ top: savedScroll.current, behavior: "auto" }));
  }, []);

  const openStage = useCallback((stage: string) => {
    savedScroll.current = window.scrollY;
    setKpiDrill(`stage:${stage}`);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }, []);

  const leaderboard = useMemo(() => getAgentLeaderboard(sales), [sales]);
  const devUnits = useMemo(() => getUnitsByDevelopment(sales), [sales]);
  const totalUnits = sales.length;
  const internalUnits = sales.filter((s) => !s.is_external).length;
  const activeDevs = new Set(sales.map((s) => s.development)).size;

  const kpis = [
  { key: "deals" as const,    label: "Total Deals Closed", value: totalUnits.toLocaleString() },
  { key: "direct" as const,   label: "Direct Sales",       value: internalUnits.toLocaleString() },
  { key: "programs" as const, label: "Active Programs",    value: activeDevs.toLocaleString() },
  ];

  const isLoading = salesLoading || leadsLoading;

  // KPI drilldown views replace main content; agent drilldown takes priority.
  const kpiView = (() => {
    if (!kpiDrill) return null;
    if (kpiDrill === "deals") {
      return <SalesDrilldown title="Deals Closed" subtitle={`All ${sales.length.toLocaleString()} closed deals - click any row to see deal detail`} sales={sales} leads={leads} onBack={closeKpi} />;
    }
    if (kpiDrill === "direct") {
      const direct = sales.filter((s) => !s.is_external);
      return <SalesDrilldown title="Direct Sales" subtitle={`${direct.length.toLocaleString()} in-house deals (excludes channel partners)`} sales={direct} leads={leads} onBack={closeKpi} />;
    }
    if (kpiDrill === "programs") {
      if (selectedProgram) {
        const programSales = sales.filter((s) => s.development === selectedProgram);
        return (
          <SalesDrilldown
            title={selectedProgram}
            subtitle={`${programSales.length.toLocaleString()} deals on this program`}
            sales={programSales}
            leads={leads}
            onBack={() => setSelectedProgram(null)}
          />
        );
      }
      return <ProgramsList sales={sales} onBack={closeKpi} onSelect={setSelectedProgram} />;
    }
    if (kpiDrill.startsWith("stage:")) {
      const stage = kpiDrill.slice("stage:".length);
      const stageLeads = filterByFunnelStage(leads, stage);
      return (
        <LeadsDrilldown
          title={stage}
          subtitle={`${stageLeads.length.toLocaleString()} leads at this funnel stage`}
          leads={stageLeads}
          onBack={closeKpi}
        />
      );
    }
    return null;
  })();

  if (kpiView) {
    return <AppShell maxWidth="max-w-6xl">{kpiView}</AppShell>;
  }

  return (
  <AppShell maxWidth="max-w-6xl">
  <div className="space-y-8">
  {drilldownAgent ? (
  <AgentDrilldown agent={drilldownAgent} sales={sales} leads={leads} onBack={closeAgent} />
  ) : (
  <>
  <div className="flex items-start justify-between flex-wrap gap-4">
  <h1 style={{ ...HEADING_STYLE, fontSize: 42 }}>
  <span style={{ color: "#ffffff" }}>Revenue </span>
  <span style={{ color: "#5BA3E8" }}>Funnel</span>
  </h1>
  <Trophy className="h-8 w-8" style={{ color: PALETTE.gold }} />
  </div>

  {/* Revenue funnel  -  SQL → demo booked → demo completed → closed won */}
  {!isLoading && <RevenueFunnelCard leads={leads} sales={sales} onStageClick={openStage} />}
  {!isLoading && <RevenueAttributionCard />}

  {salesError && (
  <div className="p-4 rounded-md" style={{ background: "rgba(226,115,74,0.1)", border: `1px solid ${PALETTE.terracotta}` }}>
  <p className="text-sm" style={{ color: PALETTE.terracotta }}>Failed to load sales data.</p>
  </div>
  )}

  {isLoading ? (
  <div className="space-y-4">
  <div className="grid grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
  <Skeleton className="h-96" />
  </div>
  ) : (
  <>
  {/* KPI Row (clickable - opens drilldown) */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {kpis.map((k) => (
  <button
  key={k.label}
  type="button"
  onClick={() => openKpi(k.key)}
  className="p-6 text-left transition-all group"
  style={{
  ...GLASS_CARD_STYLE,
  cursor: "pointer",
  }}
  onMouseEnter={(e) => {
  e.currentTarget.style.borderColor = "rgba(91, 163, 232, 0.55)";
  e.currentTarget.style.boxShadow = "0 0 28px -6px rgba(91,163,232,0.4), 0 8px 32px rgba(0,0,0,0.45)";
  e.currentTarget.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
  e.currentTarget.style.borderColor = "rgba(184, 212, 240, 0.14)";
  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)";
  e.currentTarget.style.transform = "translateY(0)";
  }}
  >
  <div className="flex items-center justify-between">
  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#5BA3E8" }}>{k.label}</p>
  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#5BA3E8" }}>Details →</span>
  </div>
  <p className="text-4xl font-extrabold mt-2" style={{ color: "#fff", ...HEADING_STYLE }}>{k.value}</p>
  </button>
  ))}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  {/* Leaderboard */}
  <div className="lg:col-span-3 p-6" style={GLASS_CARD_STYLE}>
  <h2 className="mb-6" style={{ color: "#fff", ...HEADING_STYLE, fontSize: 20 }}>Top Closers</h2>
  {leaderboard.length === 0 ? (
  <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
  ) : (
  <>
  <Podium entries={leaderboard} onSelect={openAgent} />
  {leaderboard.length > 3 && (
  <ul className="mt-8 space-y-2">
  {leaderboard.slice(3).map((e, i) => (
  <li key={e.agent}>
  <button onClick={() => openAgent(e.agent)}
  className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all hover:-translate-y-0.5"
  style={{
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(135,127,73,0.25)",
  }}
  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(135,127,73,0.1)"; }}
  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
  >
  <div className="flex items-center gap-3">
  <span className="text-xs font-bold w-6 text-left" style={{ color: "rgba(255,255,255,0.4)" }}>#{i + 4}</span>
  <span className="text-sm font-semibold" style={{ color: "#fff" }}>{e.agent}</span>
  {e.inactive && (
  <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest"
  style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
  Inactive
  </span>
  )}
  </div>
  <span className="text-sm font-bold" style={{ color: PALETTE.gold }}>{e.count}</span>
  </button>
  </li>
  ))}
  </ul>
  )}
  </>
  )}
  </div>

  {/* Donut */}
  <div className="lg:col-span-2 p-6" style={GLASS_CARD_STYLE}>
  <h2 className="mb-4" style={{ color: "#fff", ...HEADING_STYLE, fontSize: 20 }}>Deals by Program</h2>
  <div className="relative" style={{ height: 280 }}>
  <ResponsiveContainer width="100%" height="100%">
  <PieChart>
  <Pie data={devUnits} dataKey="units" nameKey="development"
  cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} stroke="none">
  {devUnits.map((_, i) => (
  <Cell key={i} fill={PALETTE_LIST[i % PALETTE_LIST.length]} />
  ))}
  </Pie>
  <RTooltip content={<DonutTooltip />} />
  </PieChart>
  </ResponsiveContainer>
  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
  <p className="text-3xl font-extrabold" style={{ color: "#fff", ...HEADING_STYLE }}>{totalUnits}</p>
  <p className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>total units</p>
  </div>
  </div>
  <ul className="mt-4 space-y-1.5">
  {devUnits.map((d, i) => (
  <li key={d.development} className="flex items-center justify-between text-xs">
  <div className="flex items-center gap-2 min-w-0">
  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PALETTE_LIST[i % PALETTE_LIST.length] }} />
  <span className="truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{d.development}</span>
  </div>
  <span className="font-semibold ml-2" style={{ color: "#fff" }}>{d.units}</span>
  </li>
  ))}
  </ul>
  </div>
  </div>
  </>
  )}
  </>
  )}
  </div>
  </AppShell>
  );
};

export default SalesZone;
