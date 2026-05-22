import { useState, useMemo, useCallback, useRef } from "react";
import { X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadTypeToggle, type LeadTypeFilter } from "@/components/operations/LeadTypeToggle";
import { format } from "date-fns";
import { KPICard } from "@/components/operations/KPICard";
import { Users, CalendarDays, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  useLeadsData, filterLeadsByDate, filterLeadsByPreviousPeriod, getLeadsByAgent,
  calcTrendPct,
  type QuickFilter,
} from "@/hooks/useLeadsData";
import { AgentPerformanceCarousel } from "@/components/operations/AgentPerformanceCarousel";
import ListingPerformanceCarousel from "@/components/operations/ListingPerformanceCarousel";
import LeadsByAgentChart from "@/components/operations/LeadsByAgentChart";
import ListingTreemap from "@/components/operations/ListingTreemap";
import LeadVolumeChart from "@/components/operations/LeadVolumeChart";
import AppShell from "@/components/moonlit/AppShell";
import FlipClockTicker from "@/components/operations/FlipClockTicker";
import NewsTicker from "@/components/operations/NewsTicker";
import LeadsDrilldown from "@/components/operations/LeadsDrilldown";
import LeadFunnelCard from "@/components/crm/LeadFunnelCard";
import AgentActivityCard from "@/components/crm/AgentActivityCard";
import AdLeadAssignmentCard from "@/components/crm/AdLeadAssignmentCard";
import type { Lead } from "@/hooks/useLeadsData";

const EXCLUDED_AGENT_TAGS = ["[INACTIVE]", "[STAFF]", "[NOT AGENT]"];

function isActiveAgent(agent: string | null): boolean {
  if (!agent || !agent.trim()) return false;
  const upper = agent.toUpperCase();
  if (upper === "MOONSHINE MARKETING") return false;
  return !EXCLUDED_AGENT_TAGS.some((tag) => upper.includes(tag));
}

const quickFilters: { key: QuickFilter; label: string }[] = [
  { key: "last_7", label: "7D" },
  { key: "last_30", label: "30D" },
  { key: "last_90", label: "90D" },
  { key: "this_year", label: "YTD" },
  { key: "all", label: "ALL" },
];

// Visual card wrapper to avoid repetition
const GLASS_CARD_STYLE: React.CSSProperties = {
  background: "rgba(20, 20, 20, 0.72)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  border: "1px solid rgba(135, 127, 73, 0.45)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
};

function VisualCard({ children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
  <div
  className={cn("relative p-6 transition-all duration-200 hover:-translate-y-1", className)}
  style={{
  ...GLASS_CARD_STYLE,
  transition: "box-shadow 0.3s ease, transform 0.2s ease",
  }}
  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 25px 8px rgba(0, 180, 166, 0.15), 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)"; }}
  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)"; }}
  >
  {children}
  </div>
  );
}

const Operations = () => {
  const { data: allLeads, isLoading, error } = useLeadsData();
  const [filter, setFilter] = useState<QuickFilter>("last_30");
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Drilldown state  -  when set, page contents are replaced with the drilldown view.
  type Drilldown =
  | { kind: "total"; }
  | { kind: "month"; }
  | { kind: "week"; }
  | { kind: "agent"; agent: string }
  | { kind: "listing"; address: string };
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
  const savedScrollRef = useRef(0);

  const openDrilldown = useCallback((d: Drilldown) => {
  savedScrollRef.current = window.scrollY;
  setDrilldown(d);
  }, []);

  const closeDrilldown = useCallback(() => {
  setDrilldown(null);
  // Restore scroll on next paint
  requestAnimationFrame(() => {
  window.scrollTo({ top: savedScrollRef.current, behavior: "auto" });
  });
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  const allLeadsList = allLeads || [];

  // Apply lead type filter globally
  const typeFilteredLeads = useMemo(() => {
  if (leadTypeFilter === "all") return allLeadsList;
  return allLeadsList.filter((l) => l.lead_type?.trim().toLowerCase() === leadTypeFilter);
  }, [allLeadsList, leadTypeFilter]);

  // Custom date range filtering
  const leads = useMemo(() => {
  if (dateFrom || dateTo) {
  return typeFilteredLeads.filter((l) => {
  const dateVal = l.created_at || l.date;
  if (!dateVal) return false;
  const d = new Date(dateVal);
  if (dateFrom && d < dateFrom) return false;
  if (dateTo) {
  const endOfTo = new Date(dateTo);
  endOfTo.setHours(23, 59, 59, 999);
  if (d > endOfTo) return false;
  }
  return true;
  });
  }
  return filterLeadsByDate(typeFilteredLeads, filter);
  }, [typeFilteredLeads, filter, dateFrom, dateTo]);

  const previousLeads = useMemo(() => {
  if (dateFrom || dateTo) return []; // no comparison for custom range
  return filterLeadsByPreviousPeriod(typeFilteredLeads, filter);
  }, [typeFilteredLeads, filter, dateFrom, dateTo]);

  // Total Leads = lifetime count regardless of the period filter, so it's
  // always >= Leads This Month and Leads This Week. Using period-filtered
  // counts made Total smaller than Month and confused users.
  const totalLeads = typeFilteredLeads.length;
  const previousTotal = previousLeads.length;
  const totalTrend = useMemo(() => calcTrendPct(leads.length, previousTotal), [leads.length, previousTotal]);

  // Rolling 30-day window so "Leads This Month" is always meaningfully wider
  // than "Leads This Week" regardless of the calendar position. (Calendar
  // month-to-date can collapse to a few days early in the month and overlap
  // the 7-day window.)
  const leadsThisMonthSet = useMemo(() => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30); cutoff.setHours(0, 0, 0, 0);
  return typeFilteredLeads.filter((l) => {
  const d = l.created_at || l.date;
  return d && new Date(d) >= cutoff;
  });
  }, [typeFilteredLeads]);
  const leadsThisMonth = leadsThisMonthSet.length;
  const previousLeadsThisMonth = useMemo(() => {
  const now = new Date();
  const prevStart = new Date(now); prevStart.setDate(now.getDate() - 60);
  const prevEnd = new Date(now);   prevEnd.setDate(now.getDate() - 30);
  return typeFilteredLeads.filter(l => {
  const d = l.created_at || l.date;
  if (!d) return false;
  const dt = new Date(d);
  return dt >= prevStart && dt < prevEnd;
  }).length;
  }, [typeFilteredLeads]);
  const monthTrend = useMemo(() => calcTrendPct(leadsThisMonth, previousLeadsThisMonth), [leadsThisMonth, previousLeadsThisMonth]);

  const leadsThisWeekSet = useMemo(() => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  return typeFilteredLeads.filter((l) => {
  const d = l.created_at || l.date;
  return d && new Date(d) >= cutoff;
  });
  }, [typeFilteredLeads]);
  const leadsThisWeek = leadsThisWeekSet.length;
  const previousLeadsThisWeek = useMemo(() => {
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);
  return typeFilteredLeads.filter(l => {
  const d = l.created_at || l.date;
  if (!d) return false;
  const dt = new Date(d);
  return dt >= twoWeeksAgo && dt < weekAgo;
  }).length;
  }, [typeFilteredLeads]);
  const weekTrend = useMemo(() => calcTrendPct(leadsThisWeek, previousLeadsThisWeek), [leadsThisWeek, previousLeadsThisWeek]);

  const activeLeads = useMemo(() => leads.filter((l) => isActiveAgent(l.agent)), [leads]);
  const agentData = useMemo(() => getLeadsByAgent(activeLeads), [activeLeads]);

  const handleCustomDate = (type: "from" | "to", date: Date | undefined) => {
  if (type === "from") setDateFrom(date);
  else setDateTo(date);
  };

  const clearCustomDates = () => { setDateFrom(undefined); setDateTo(undefined); };

  if (isLoading) {
  return (
  <AppShell>
  <div className="space-y-6">
  <Skeleton className="h-8 w-48 rounded-lg" />
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[...Array(4)].map((_, i) => (
  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-6 space-y-3">
  <Skeleton className="h-3 w-24 rounded-full" />
  <Skeleton className="h-8 w-16 rounded-lg" />
  </div>
  ))}
  </div>
  </div>
  </AppShell>
  );
  }

  if (error) {
  return (
  <AppShell>
  <p style={{ color: "#EF6F5C" }}>Failed to load leads data.</p>
  </AppShell>
  );
  }

  return (
  <AppShell maxWidth="max-w-6xl">
  {/* Market Intel Ticker - full width */}
  <div className="mb-6">
  <FlipClockTicker />
  </div>

  <div ref={containerRef}>
  <div className="space-y-8">
  {drilldown && (() => {
  let drillLeads: Lead[] = [];
  let title = "";
  let subtitle: string | undefined;
  let standings: { label: string; value: string }[] | undefined;

  if (drilldown.kind === "total") {
  // Total = all leads regardless of period filter, so it's distinct from
  // Month (rolling 30) and Week (rolling 7).
  drillLeads = typeFilteredLeads;
  title = "Total Leads";
  subtitle = "All leads on file - lifetime";
  } else if (drilldown.kind === "month") {
  drillLeads = leadsThisMonthSet;
  title = "Leads This Month";
  subtitle = "Leads created since the 1st of this month";
  } else if (drilldown.kind === "week") {
  drillLeads = leadsThisWeekSet;
  title = "Leads This Week";
  subtitle = "Leads created in the last 7 days";
  } else if (drilldown.kind === "agent") {
  const name = drilldown.agent;
  drillLeads = allLeadsList.filter(
  (l) => l.agent?.trim().toLowerCase() === name.toLowerCase()
  );
  title = name;
  subtitle = "All leads handled by this agent";
  const listings = new Set<string>();
  const sources = new Map<string, number>();
  let minD: number | null = null, maxD: number | null = null;
  for (const l of drillLeads) {
  const addr = l.listing?.trim() || l.listing_address?.trim();
  if (addr) listings.add(addr);
  const src = l.source?.trim() || l.lead_source?.trim();
  if (src) sources.set(src, (sources.get(src) || 0) + 1);
  const d = l.created_at || l.date;
  if (d) {
  const t = new Date(d).getTime();
  if (minD == null || t < minD) minD = t;
  if (maxD == null || t > maxD) maxD = t;
  }
  }
  let topSource = "-", topSourceCount = 0;
  for (const [k, v] of sources) {
  if (v > topSourceCount) { topSource = k; topSourceCount = v; }
  }
  const range =
  minD != null && maxD != null
  ? `${format(new Date(minD), "d MMM yyyy")}  -  ${format(new Date(maxD), "d MMM yyyy")}`
  : "-";
  standings = [
  { label: "Total Leads", value: drillLeads.length.toLocaleString() },
  { label: "Unique Programs", value: listings.size.toString() },
  { label: "Top Source", value: topSource },
  { label: "Active Range", value: range },
  ];
  } else if (drilldown.kind === "listing") {
  const addr = drilldown.address;
  drillLeads = allLeadsList.filter(
  (l) => (l.listing_address?.trim() || "") === addr
  );
  title = addr;
  subtitle = "All leads for this listing";
  const agents = new Map<string, number>();
  const sources = new Map<string, number>();
  let minD: number | null = null, maxD: number | null = null;
  for (const l of drillLeads) {
  const a = l.agent?.trim();
  if (a) agents.set(a, (agents.get(a) || 0) + 1);
  const src = l.source?.trim() || l.lead_source?.trim();
  if (src) sources.set(src, (sources.get(src) || 0) + 1);
  const d = l.created_at || l.date;
  if (d) {
  const t = new Date(d).getTime();
  if (minD == null || t < minD) minD = t;
  if (maxD == null || t > maxD) maxD = t;
  }
  }
  let topAgent = "-", topAgentCount = 0;
  for (const [k, v] of agents) {
  if (v > topAgentCount) { topAgent = k; topAgentCount = v; }
  }
  let topSource = "-", topSourceCount = 0;
  for (const [k, v] of sources) {
  if (v > topSourceCount) { topSource = k; topSourceCount = v; }
  }
  const range =
  minD != null && maxD != null
  ? `${format(new Date(minD), "d MMM yyyy")}  -  ${format(new Date(maxD), "d MMM yyyy")}`
  : "-";
  standings = [
  { label: "Total Leads", value: drillLeads.length.toLocaleString() },
  { label: "Top Sales Rep", value: topAgent },
  { label: "Top Source", value: topSource },
  { label: "Active Range", value: range },
  ];
  }

  return (
  <LeadsDrilldown
  title={title}
  subtitle={subtitle}
  leads={drillLeads}
  standings={standings}
  onBack={closeDrilldown}
  />
  );
  })()}

  {!drilldown && (<>
  {/* Header: Title left, Filters right */}
  <div className="flex items-start justify-between flex-wrap gap-4">
  <div>
  <h1 className="font-extrabold tracking-tight text-foreground" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontSize: "42px", fontVariant: "small-caps" }}><span style={{ color: "#ffffff" }}>Leads and </span><span style={{ color: "#5BA3E8" }}>Agents</span></h1>
  </div>

  <div className="flex items-center gap-3 flex-wrap">
  {/* Master lead type filter */}
  <LeadTypeToggle value={leadTypeFilter} onChange={(v) => { setLeadTypeFilter(v); }} />
  {/* Quick filters */}
  <div className="flex items-center gap-1.5">
  {quickFilters.map((f) => (
  <button
  key={f.key}
  onClick={() => { setFilter(f.key); clearCustomDates(); }}
  className={cn(
  "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-150 border",
  filter === f.key && !dateFrom && !dateTo
  ? "bg-primary text-primary-foreground border-primary shadow-sm"
  : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
  )}
  >
  {f.label}
  </button>
  ))}
  </div>

  {/* Date range picker */}
  <div className="flex items-center gap-1.5">
  <Popover>
  <PopoverTrigger asChild>
  <Button variant="outline" size="sm" className={cn("text-xs gap-1.5 h-7", dateFrom && "text-foreground border-primary/50")}>
  <CalendarIcon className="h-3 w-3" />
  {dateFrom ? format(dateFrom, "d MMM") : "From"}
  </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="end">
  <Calendar
  mode="single"
  selected={dateFrom}
  onSelect={(d) => handleCustomDate("from", d)}
  className="p-3 pointer-events-auto"
  />
  </PopoverContent>
  </Popover>
  <Popover>
  <PopoverTrigger asChild>
  <Button variant="outline" size="sm" className={cn("text-xs gap-1.5 h-7", dateTo && "text-foreground border-primary/50")}>
  <CalendarIcon className="h-3 w-3" />
  {dateTo ? format(dateTo, "d MMM") : "To"}
  </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="end">
  <Calendar
  mode="single"
  selected={dateTo}
  onSelect={(d) => handleCustomDate("to", d)}
  className="p-3 pointer-events-auto"
  />
  </PopoverContent>
  </Popover>
  {(dateFrom || dateTo) && (
  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={clearCustomDates}>
  <X className="h-3 w-3" />
  </Button>
  )}
  </div>
  </div>
  </div>

  {/* KPI Cards  -  compact, clickable, no Avg/Day */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <KPICard
  value={totalLeads}
  label="TOTAL LEADS"
  change={totalTrend}
  delay={0}
  animate
  compact
  icon={<Users className="h-4 w-4" stroke="#00B4A6" strokeWidth={2} />}
  onClick={() => openDrilldown({ kind: "total" })}
  />
  <KPICard
  value={leadsThisMonth}
  label="LEADS THIS MONTH"
  change={monthTrend}
  delay={0}
  animate
  compact
  icon={<CalendarDays className="h-4 w-4" stroke="#00B4A6" strokeWidth={2} />}
  onClick={() => openDrilldown({ kind: "month" })}
  />
  <KPICard
  value={leadsThisWeek}
  label="LEADS THIS WEEK"
  change={weekTrend}
  delay={0}
  animate
  compact
  icon={<CalendarClock className="h-4 w-4" stroke="#00B4A6" strokeWidth={2} />}
  onClick={() => openDrilldown({ kind: "week" })}
  />
  </div>

  {/* Market Intel News Ticker */}
  <NewsTicker />

  {/* CRM  -  Lead Pipeline Funnel + Sales Rep Activity table */}
  <LeadFunnelCard leads={leads} />
  <AgentActivityCard onAgentSelect={(agent) => openDrilldown({ kind: "agent", agent })} />

  {/* Ad-lead assignment  -  route Meta/Google leads to sales reps */}
  <AdLeadAssignmentCard leads={leads} />

  {/* Visual 1  -  Agent Performance (full width, hero card) */}
  <VisualCard label="Visual 1">
  <AgentPerformanceCarousel
  leads={leads}
  onAgentSelect={(agent) => openDrilldown({ kind: "agent", agent })}
  />
  </VisualCard>

  {/* Visual 2  -  Listing Performance (full width, below) */}
  <VisualCard label="Visual 2">
  <ListingPerformanceCarousel leads={leads} />
  </VisualCard>

  {/* Visual 3 + 5  -  Leads by Agent (60%) + Leads by Listing treemap (40%) */}
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">
  <VisualCard label="Visual 3" className="h-full">
  <LeadsByAgentChart data={agentData.map(d => {
  const aLeads = activeLeads.filter(l => l.agent === d.agent);
  const listingSet = new Set<string>();
  for (const l of aLeads) {
  const addr = l.listing?.trim() || l.listing_address?.trim();
  if (addr) listingSet.add(addr);
  }
  const l2l = listingSet.size > 0 ? aLeads.length / listingSet.size : 0;
  return { agent: d.agent, lead_count: d.count, l2l };
  })} />
  </VisualCard>
  </div>
  <div className="lg:col-span-2">
  <VisualCard label="Visual 5" className="h-full">
  <ListingTreemap
  leads={leads}
  onSelect={(address) => openDrilldown({ kind: "listing", address })}
  />
  </VisualCard>
  </div>
  </div>

  {/* Visual 6 - Lead Volume */}
  <VisualCard label="Visual 6">
  <h2 className="text-lg font-semibold mb-1" style={{ color: "#ffffff" }}>
  Lead Volume by Week
  </h2>
  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
  Weekly lead volume trend
  </p>
  <LeadVolumeChart leads={leads} />
  </VisualCard>
  </>)}
  </div>
  </div>
  </AppShell>
  );
};

export default Operations;
