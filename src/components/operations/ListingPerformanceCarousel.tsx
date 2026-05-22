import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@/hooks/useLeadsData";
import { ENGAGEMENT_STATES, ENGAGEMENT_COLORS, toEngagementState } from "@/lib/engagementStatus";

interface ListingData {
  groupKey: string;
  ref: string;
  address: string;
  totalLeads: number;
  buyers: number;
  tenants: number;
  topAgent: string;
  leads: Lead[];
}

function computeListings(leads: Lead[]): ListingData[] {
  const grouped = new Map<string, Lead[]>();
  for (const l of leads) {
  const key = l.listing?.trim() || l.propdata_listing_address?.trim();
  if (!key || key === "\\N" || key === "N/A") continue;
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key)!.push(l);
  }

  const listings: ListingData[] = [];
  for (const [groupKey, group] of grouped) {
  const buyers = group.filter((l) => l.lead_type?.toLowerCase() === "buyer").length;
  const tenants = group.filter((l) => l.lead_type?.toLowerCase() === "tenant").length;
  const firstLead = group[0];
  const ref = firstLead.listing_ref?.trim() || "";
  const address = firstLead.listing_address?.trim() || groupKey;

  const agentCounts = new Map<string, number>();
  for (const l of group) {
  const a = l.agent?.trim();
  if (a) agentCounts.set(a, (agentCounts.get(a) || 0) + 1);
  }
  let topAgent = "-";
  let topCount = 0;
  for (const [name, count] of agentCounts) {
  if (count > topCount) { topAgent = name; topCount = count; }
  }

  listings.push({ groupKey, ref, address, totalLeads: group.length, buyers, tenants, topAgent, leads: group });
  }

  return listings.sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 5);
}

interface Props {
  leads: Lead[];
}

export default function ListingPerformanceCarousel({ leads }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listings = useMemo(() => computeListings(leads), [leads]);

  if (listings.length === 0) {
  return (
  <div className="space-y-3">
  <h2 className="text-lg font-semibold text-foreground">Program Performance</h2>
  <p className="text-sm text-muted-foreground">No listing data available</p>
  </div>
  );
  }

  const goToPrevious = () => setCurrentIndex((p) => (p === 0 ? listings.length - 1 : p - 1));
  const goToNext = () => setCurrentIndex((p) => (p === listings.length - 1 ? 0 : p + 1));
  const listing = listings[currentIndex];

  const engagementCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const s of ENGAGEMENT_STATES) counts[s] = 0;
  for (const l of listing.leads) {
  const s = toEngagementState(l.wa_engagement_status);
  counts[s] = (counts[s] || 0) + 1;
  }
  return ENGAGEMENT_STATES.map((s) => ({ status: s, count: counts[s] }));
  }, [listing]);

  const engagementTotal = engagementCounts.reduce((s, e) => s + e.count, 0);
  const waiting = engagementCounts.find((e) => e.status === "Not Yet Messaged")?.count ?? 0;
  const waitingPct = engagementTotal > 0 ? (waiting / engagementTotal) * 100 : 0;
  const engagedTotal = engagementTotal - waiting;
  const scopeLabel = listing.ref || listing.address;

  return (
  <div className="space-y-3">
  <div className="flex items-center justify-between">
  <div>
  <h2 className="text-lg font-semibold text-foreground">Program Performance</h2>
  <p className="text-sm text-muted-foreground">Top 5 listings by lead count</p>
  </div>
  <div className="flex items-center gap-3">
  <div className="flex items-center gap-1">
  {listings.map((_, idx) => (
  <button
  key={idx}
  onClick={() => setCurrentIndex(idx)}
  className={`h-2 rounded-full transition-all ${
  idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
  }`}
  style={idx === currentIndex ? { boxShadow: "0 0 10px 2px rgba(0, 180, 166, 0.55)" } : undefined}
  >
  <span className="sr-only">Go to listing {idx + 1}</span>
  </button>
  ))}
  </div>
  <div className="flex gap-1">
  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full transition-all hover:bg-primary/15 hover:border-primary/60 hover:text-primary" onClick={goToPrevious}>
  <ChevronLeft className="h-5 w-5" />
  </Button>
  <Button variant="outline" size="icon" className="h-10 w-10 rounded-full transition-all hover:bg-primary/15 hover:border-primary/60 hover:text-primary" onClick={goToNext}>
  <ChevronRight className="h-5 w-5" />
  </Button>
  </div>
  </div>
  </div>

  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
  <CardContent className="p-5 space-y-4">
  {/* Identity */}
  <div>
  {listing.ref && (
  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{listing.ref}</p>
  )}
  <h3
  className="text-2xl text-foreground mt-1"
  style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800 }}
  >
  {listing.address}
  </h3>
  </div>

  {/* KPI bento  -  3 columns */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
  {/* Total Leads hero */}
  <div
  className="lg:col-span-4 flex flex-col items-center justify-center rounded-xl p-4 text-center"
  style={{ background: "rgba(30, 30, 30, 0.55)", border: "1px solid rgba(135, 127, 73, 0.35)" }}
  >
  <span className="text-5xl font-bold tabular-nums" style={{ color: "#877F49" }}>
  {listing.totalLeads.toLocaleString()}
  </span>
  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">
  Total Leads
  </span>
  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-0.5">
  Leads Received
  </span>
  </div>

  {/* Buyer / Tenant split */}
  <div
  className="lg:col-span-4 flex items-center justify-center gap-4 rounded-xl p-4"
  style={{ background: "rgba(30, 30, 30, 0.55)", border: "1px solid rgba(135, 127, 73, 0.35)" }}
  >
  <div className="flex flex-col items-center" style={{ opacity: listing.buyers === 0 ? 0.5 : 1 }}>
  <span className="text-3xl font-bold tabular-nums text-foreground">{listing.buyers}</span>
  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Buyers</span>
  </div>
  <div className="h-10 w-px" style={{ background: "rgba(135,127,73,0.30)" }} />
  <div className="flex flex-col items-center" style={{ opacity: listing.tenants === 0 ? 0.5 : 1 }}>
  <span className="text-3xl font-bold tabular-nums text-foreground">{listing.tenants}</span>
  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Tenants</span>
  </div>
  </div>

  {/* Top Sales Rep */}
  <div
  className="lg:col-span-4 flex items-center gap-3 rounded-xl p-4"
  style={{ background: "rgba(30, 30, 30, 0.55)", border: "1px solid rgba(135, 127, 73, 0.35)" }}
  >
  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
  <User className="h-5 w-5 text-muted-foreground" />
  </div>
  <div className="min-w-0">
  <p className="text-base font-bold text-foreground truncate">{listing.topAgent}</p>
  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Top Sales Rep</p>
  </div>
  </div>
  </div>

  {/* Divider */}
  <div className="my-2" style={{ height: 1, background: "rgba(135,127,73,0.20)" }} />

  {/* Engagement section */}
  <div className="space-y-3">
  <h3
  className="text-xs font-bold text-foreground"
  style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Inter', system-ui, sans-serif" }}
  >
  Lead Engagement  -  {scopeLabel.toUpperCase()} ({engagementTotal} {engagementTotal === 1 ? "LEAD" : "LEADS"})
  </h3>

  <div className="flex flex-col md:flex-row gap-4 items-stretch">
  {/* Hero callout */}
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

  {/* Stacked bar */}
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
  {engagementTotal === 0 ? (
  <div style={{ width: "100%", background: ENGAGEMENT_COLORS["Not Yet Messaged"] }} />
  ) : (
  engagementCounts
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
  }}
  >
  {showLabel ? `${pct.toFixed(0)}%` : ""}
  </div>
  );
  })
  )}
  </div>
  </div>
  </div>

  {/* Legend  -  engagement order */}
  <div
  className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2"
  style={{ opacity: engagedTotal === 0 ? 0.4 : 1 }}
  >
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
  Showing engagement for {scopeLabel} | {engagementTotal} total {engagementTotal === 1 ? "lead" : "leads"}
  </p>
  </div>
  </CardContent>
  </Card>

  <p className="text-center text-xs" style={{ color: "#ffffff" }}>
  Listing <span className="font-semibold">{currentIndex + 1}</span> of <span className="font-semibold">{listings.length}</span>
  </p>
  </div>
  );
}
