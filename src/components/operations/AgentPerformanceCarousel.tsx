import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users, Home, MapPin, User, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@/hooks/useLeadsData";
import { getLifecycleBreakdown } from "@/hooks/useLeadsData";
import { ENGAGEMENT_STATES, ENGAGEMENT_COLORS } from "@/lib/engagementStatus";
import { L2LHero } from "./L2LHero";

import shelleyImg from "@/assets/agents/shelley.png";
import deniseImg from "@/assets/agents/denise.png";
import martieImg from "@/assets/agents/martie.png";
import sharonImg from "@/assets/agents/sharon.png";
import garonImg from "@/assets/agents/garon.png";
import tumisangImg from "@/assets/agents/tumisang.png";
import lorenImg from "@/assets/agents/loren.png";
import stheImg from "@/assets/agents/sthe.png";
import stevenImg from "@/assets/agents/steven.png";
import norahImg from "@/assets/agents/norah.png";

const AGENT_CONFIG: { name: string; role: string; photo: string | null }[] = [
  { name: "Shelley Adler", role: "Sales Rep", photo: shelleyImg },
  { name: "Denise Langley", role: "Sales Rep", photo: deniseImg },
  { name: "Martie Zimmermann", role: "Sales Rep", photo: martieImg },
  { name: "Sharon Lawson", role: "Sales Rep", photo: sharonImg },
  { name: "Garon Kolman", role: "Sales Rep", photo: garonImg },
  { name: "Tom Mason", role: "Sales Rep", photo: tumisangImg },
  { name: "Loren Adler", role: "Sales Rep", photo: lorenImg },
  { name: "Stella Brooks", role: "Sales Rep", photo: stheImg },
  { name: "Steven Reed", role: "Sales Rep", photo: stevenImg },
  { name: "Norah Mitchell", role: "Sales Rep", photo: norahImg },
];

interface AgentStats {
  name: string;
  role: string;
  photo: string | null;
  totalLeads: number;
  activeListings: number;
  topArea: string;
}

function computeAgentStats(leads: Lead[]): AgentStats[] {
  return AGENT_CONFIG.filter(
  (cfg) => cfg.name.toUpperCase() !== "MOONSHINE MARKETING"
  ).map((cfg) => {
  const agentLeads = leads.filter(
  (l) => l.agent?.trim().toLowerCase() === cfg.name.toLowerCase()
  );
  const totalLeads = agentLeads.length;

  // Known development names  -  match against listing addresses so the
  // "Top Area" pill displays a clean development label rather than a
  // truncated street address.
  const DEVELOPMENTS = [
  "38 on 1st",
  "25 St Audley",
  "59 East Hertford",
  "Development Showcase",
  "St Audley",
  "East Hertford",
  ];

  const listingSet = new Set<string>();
  const areaCounts = new Map<string, number>();
  for (const l of agentLeads) {
  const addr = l.listing?.trim() || l.listing_address?.trim();
  if (!addr) continue;
  listingSet.add(addr);

  const lower = addr.toLowerCase();
  const matchedDev = DEVELOPMENTS.find((d) => lower.includes(d.toLowerCase()));
  let area: string;
  if (matchedDev) {
  area = matchedDev;
  } else {
  const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
  area = parts.length > 1 ? parts[parts.length - 1] : addr;
  }
  areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
  }

  let topArea = "-";
  let topCount = 0;
  for (const [area, count] of areaCounts) {
  if (count > topCount) {
  topArea = area;
  topCount = count;
  }
  }

  return {
  ...cfg,
  totalLeads,
  activeListings: listingSet.size,
  topArea,
  };
  }).sort((a, b) => b.totalLeads - a.totalLeads);
}

interface KPIItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  fullValue?: string;
}

function KPIItem({ icon, label, value, fullValue }: KPIItemProps) {
  const tipText = fullValue && fullValue !== String(value) ? fullValue : undefined;
  return (
  <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 min-w-0">
  <div
  className="flex items-center justify-center rounded-md flex-shrink-0"
  style={{
  width: 32,
  height: 32,
  background: "rgba(0, 180, 166, 0.12)",
  border: "1px solid rgba(0, 180, 166, 0.3)",
  color: "#00B4A6",
  }}
  >
  {icon}
  </div>
  <div className="flex flex-col min-w-0" title={tipText}>
  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
  {label}
  </span>
  <span className="text-lg font-bold text-foreground truncate">{value}</span>
  </div>
  </div>
  );
}

interface Props {
  leads: Lead[];
  onAgentSelect?: (agentName: string) => void;
}

export function AgentPerformanceCarousel({ leads, onAgentSelect }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const agents = useMemo(() => computeAgentStats(leads), [leads]);
  const teamAverageL2L = useMemo(() => {
  const ratios = agents
  .filter((a) => a.activeListings > 0 && a.totalLeads > 0)
  .map((a) => a.totalLeads / a.activeListings);
  if (ratios.length === 0) return 0;
  return ratios.reduce((s, r) => s + r, 0) / ratios.length;
  }, [agents]);

  const goToPrevious = () => {
  setCurrentIndex((prev) => (prev === 0 ? agents.length - 1 : prev - 1));
  };

  const goToNext = () => {
  setCurrentIndex((prev) => (prev === agents.length - 1 ? 0 : prev + 1));
  };

  if (agents.length === 0) return null;

  const current = agents[currentIndex];
  const ratio = current.activeListings > 0 ? current.totalLeads / current.activeListings : 0;
  const delta = ratio - teamAverageL2L;
  const aboveAvg = delta >= 0;
  const benchColor = aboveAvg ? "#00B4A6" : "#E2734A";

  // Per-agent engagement breakdown (scoped to currently selected carousel agent)
  const agentLeads = useMemo(
  () => leads.filter((l) => l.agent?.trim().toLowerCase() === current.name.toLowerCase()),
  [leads, current.name]
  );
  const engagementCounts = useMemo(() => {
  const buckets = getLifecycleBreakdown(agentLeads);
  const lookup = new Map(buckets.map((b) => [b.name, b.value]));
  return ENGAGEMENT_STATES.map((s) => ({ status: s, count: lookup.get(s) || 0 }));
  }, [agentLeads]);
  const engagementTotal = engagementCounts.reduce((s, e) => s + e.count, 0);
  const waiting = engagementCounts.find((e) => e.status === "Not Yet Messaged")?.count ?? 0;
  const waitingPct = engagementTotal > 0 ? (waiting / engagementTotal) * 100 : 0;
  const engagedTotal = engagementTotal - waiting;
  const firstName = current.name.split(" ")[0];

  return (
  <div className="space-y-3">
  <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
  <div>
  <h2 className="text-lg font-semibold text-foreground">Sales Rep Performance</h2>
  <p className="text-sm text-muted-foreground">Track your team's key metrics</p>
  </div>
  </div>
  <div className="flex gap-1">
  <Button
  variant="outline"
  size="icon"
  className="h-10 w-10 rounded-full transition-all hover:bg-primary/15 hover:border-primary/60 hover:text-primary"
  onClick={goToPrevious}
  >
  <ChevronLeft className="h-5 w-5" />
  <span className="sr-only">Previous agent</span>
  </Button>
  <Button
  variant="outline"
  size="icon"
  className="h-10 w-10 rounded-full transition-all hover:bg-primary/15 hover:border-primary/60 hover:text-primary"
  onClick={goToNext}
  >
  <ChevronRight className="h-5 w-5" />
  <span className="sr-only">Next agent</span>
  </Button>
  </div>
  </div>

  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
  <CardContent className="p-5 space-y-4">
  {/* Agent Header */}
  <div className="flex items-center gap-4">
  <div className="relative">
  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
  {current.photo ? (
  <img
  src={current.photo}
  alt={current.name}
  className="h-full w-full object-cover"
  />
  ) : (
  <User className="h-7 w-7 text-muted-foreground" />
  )}
  </div>
  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
  {currentIndex + 1}
  </div>
  </div>
  <div className="flex-1">
  {onAgentSelect ? (
  <button
  type="button"
  onClick={() => onAgentSelect(current.name)}
  className="text-left group"
  >
  <h3
  className="text-lg font-bold text-foreground group-hover:underline transition-colors"
  style={{ textDecorationColor: "#877F49" }}
  >
  {current.name}
  </h3>
  <p className="text-sm text-muted-foreground">{current.role}</p>
  </button>
  ) : (
  <>
  <h3 className="text-lg font-bold text-foreground">{current.name}</h3>
  <p className="text-sm text-muted-foreground">{current.role}</p>
  </>
  )}
  </div>
  <div className="flex items-center gap-1">
  {agents.map((_, idx) => (
  <button
  key={idx}
  onClick={() => setCurrentIndex(idx)}
  className={`h-2 rounded-full transition-all ${
  idx === currentIndex
  ? "w-8 bg-primary"
  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
  }`}
  style={
  idx === currentIndex
  ? { boxShadow: "0 0 10px 2px rgba(0, 180, 166, 0.55)" }
  : undefined
  }
  >
  <span className="sr-only">Go to agent {idx + 1}</span>
  </button>
  ))}
  </div>
  </div>

  {/* L2L bento  -  hero / benchmark / composition / CTA, side-by-side on wide cards */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
  {/* L2L hero */}
  <div className="lg:col-span-4">
  <L2LHero ratio={ratio} />
  </div>

  {/* Benchmark vs team average */}
  <div className="lg:col-span-4 flex flex-col items-center justify-center rounded-xl p-4 text-center"
  style={{
  background: "rgba(20, 20, 20, 0.6)",
  border: "1px solid rgba(135, 127, 73, 0.35)",
  }}
  >
  <div
  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
  style={{
  background: `${benchColor}1F`,
  border: `1px solid ${benchColor}66`,
  color: benchColor,
  }}
  >
  {aboveAvg ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
  <span className="text-base font-bold tabular-nums">
  {aboveAvg ? "+" : ""}
  {delta.toFixed(1)}
  </span>
  <span className="text-[11px] uppercase tracking-wider font-semibold">
  {aboveAvg ? "above" : "below"} avg
  </span>
  </div>
  <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wider">
  Team average {teamAverageL2L.toFixed(1)}
  </p>
  </div>

  {/* Composition: leads ÷ listings = ratio */}
  <div className="lg:col-span-4 flex items-center justify-center gap-3 rounded-xl p-4"
  style={{
  background: "rgba(20, 20, 20, 0.6)",
  border: "1px solid rgba(135, 127, 73, 0.35)",
  }}
  >
  <div className="flex flex-col items-center min-w-0">
  <span className="text-2xl font-bold text-foreground tabular-nums">{current.totalLeads.toLocaleString()}</span>
  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Leads</span>
  </div>
  <span className="text-xl text-muted-foreground/70 font-light">÷</span>
  <div className="flex flex-col items-center min-w-0">
  <span className="text-2xl font-bold text-foreground tabular-nums">{current.activeListings}</span>
  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Programs</span>
  </div>
  <span className="text-xl text-muted-foreground/70 font-light">=</span>
  <div className="flex flex-col items-center min-w-0">
  <span className="text-2xl font-bold tabular-nums" style={{ color: "#877F49" }}>{ratio.toFixed(1)}</span>
  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">L2L</span>
  </div>
  </div>
  </div>

  {/* KPI pill row */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <KPIItem
  icon={<Users className="h-3.5 w-3.5" />}
  label="Total Leads"
  value={current.totalLeads.toLocaleString()}
  />
  <KPIItem
  icon={<Home className="h-3.5 w-3.5" />}
  label="Unique Programs"
  value={current.activeListings}
  />
  <KPIItem
  icon={<MapPin className="h-3.5 w-3.5" />}
  label="Top City"
  value={current.topArea}
  fullValue={current.topArea}
  />
  </div>

  {/* Divider between L2L bento and engagement section */}
  <div className="my-2" style={{ height: 1, background: "rgba(135,127,73,0.20)" }} />

  {/* Lead Engagement (scoped to current agent) */}
  <div className="space-y-3">
  <h3
  className="text-xs font-bold text-foreground"
  style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter', system-ui, sans-serif" }}
  >
  Lead Engagement  -  {firstName.toUpperCase()}'S {engagementTotal} {engagementTotal === 1 ? "LEAD" : "LEADS"}
  </h3>

  {engagementTotal === 0 ? (
  <div
  className="rounded-xl p-6 text-center text-sm text-muted-foreground"
  style={{ background: "rgba(30,30,30,0.55)", border: "1px solid rgba(135,127,73,0.25)" }}
  >
  No leads on record yet for {firstName}
  </div>
  ) : engagedTotal === 0 ? (
  <>
  <div className="flex flex-col md:flex-row gap-4 items-stretch">
  <div className="md:w-[30%] flex flex-col justify-center">
  <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: "#D4B85A" }}>
  {waiting.toLocaleString()}
  </p>
  <p
  className="text-[11px] font-semibold mt-2 text-muted-foreground"
  style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
  >
  Leads Waiting
  </p>
  </div>
  <div
  className="md:w-[70%] flex items-center justify-center rounded-xl p-6 text-center text-sm text-muted-foreground"
  style={{ background: "rgba(30,30,30,0.55)", border: "1px solid rgba(135,127,73,0.25)" }}
  >
  No WhatsApp engagement data yet for {firstName}'s leads
  </div>
  </div>
  </>
  ) : (
  <>
  <div className="flex flex-col md:flex-row gap-4 items-stretch">
  {/* Hero callout  -  left ~30% */}
  <div className="md:w-[30%] flex flex-col justify-center">
  <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: "#D4B85A" }}>
  {waiting.toLocaleString()}
  </p>
  <p
  className="text-[11px] font-semibold mt-2 text-muted-foreground"
  style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
  >
  Leads Waiting
  </p>
  <p className="text-[12px] text-muted-foreground mt-1">
  {waitingPct.toFixed(1)}% not yet messaged
  </p>
  </div>

  {/* Stacked bar  -  right ~70% */}
  <div className="md:w-[70%] flex items-center">
  <div
  className="w-full"
  style={{
  height: 32,
  borderRadius: 8,
  overflow: "hidden",
  display: "flex",
  border: "1px solid rgba(135,127,73,0.35)",
  }}
  >
  {engagementCounts
  .filter((d) => d.count > 0)
  .map((entry) => {
  const pct = (entry.count / engagementTotal) * 100;
  const showLabel = pct >= 15;
  return (
  <div
  key={entry.status}
  title={`${entry.status}  -  ${entry.count.toLocaleString()} (${pct.toFixed(1)}%)`}
  style={{
  width: `${pct}%`,
  background: ENGAGEMENT_COLORS[entry.status],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(0,0,0,0.78)",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  transition: "filter 0.15s ease",
  }}
  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
  onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
  >
  {showLabel ? `${pct.toFixed(0)}%` : ""}
  </div>
  );
  })}
  </div>
  </div>
  </div>

  {/* Legend  -  engagement order, never sorted by percentage */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
  {engagementCounts.map((item) => {
  const pct = engagementTotal > 0 ? (item.count / engagementTotal) * 100 : 0;
  return (
  <div key={item.status} className="flex items-center gap-2 min-w-0">
  <span
  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
  style={{ backgroundColor: ENGAGEMENT_COLORS[item.status] }}
  />
  <span className="text-muted-foreground text-xs truncate">{item.status}</span>
  <span className="text-foreground text-xs font-medium ml-auto tabular-nums">
  {item.count.toLocaleString()}
  </span>
  <span className="text-muted-foreground/60 text-xs w-10 text-right tabular-nums">
  {pct.toFixed(1)}%
  </span>
  </div>
  );
  })}
  </div>

  <p className="text-[11px] text-muted-foreground text-right">
  Showing engagement for {current.name} | {engagementTotal} total {engagementTotal === 1 ? "lead" : "leads"}
  </p>
  </>
  )}
  </div>

  {onAgentSelect && (
  <div className="flex justify-end pt-1">
  <button
  type="button"
  onClick={() => onAgentSelect(current.name)}
  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
  style={{ color: "#877F49" }}
  onMouseEnter={(e) => (e.currentTarget.style.color = "#a39a5a")}
  onMouseLeave={(e) => (e.currentTarget.style.color = "#877F49")}
  >
  View leads <ArrowRight className="h-3 w-3" />
  </button>
  </div>
  )}
  </CardContent>
  </Card>

  <p className="text-center text-xs" style={{ color: "#ffffff" }}>
  Sales Rep <span className="font-semibold">{currentIndex + 1}</span> of <span className="font-semibold">{agents.length}</span>
  </p>
  </div>
  );
}
