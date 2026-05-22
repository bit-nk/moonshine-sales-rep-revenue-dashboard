import { useMemo, useState } from "react";
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, CheckCircle2, XCircle, ChevronDown, ChevronRight, FileText, User as UserIcon } from "lucide-react";


import AppShell from "@/components/moonlit/AppShell";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";
import { STUB_CALLS, AGENTS, type DialerCall } from "@/data/stubData";
import { format } from "date-fns";

const OUTCOME_COLORS: Record<string, string> = {
  Connected: "#00B4A6",
  "Demo Booked": "#877F49",
  Voicemail: "#4A90E2",
  "No Answer": "#666666",
  Disqualified: "#E2734A",
  "Callback Scheduled": "#D4B85A",
};

const formatDuration = (seconds: number) => {
  if (seconds === 0) return " - ";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const PAGE_SIZE = 15;

export default function Dialer() {
  const [page, setPage] = useState(0);
  const [directionFilter, setDirectionFilter] = useState<"all" | "Inbound" | "Outbound">("all");
  const [repFilter, setRepFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const calls = STUB_CALLS;

  const outcomeBreakdown = useMemo(() => {
  const map = new Map<string, number>();
  for (const c of calls) map.set(c.outcome, (map.get(c.outcome) || 0) + 1);
  return Array.from(map.entries())
  .map(([outcome, count]) => ({ outcome, count, pct: (count / calls.length) * 100 }))
  .sort((a, b) => b.count - a.count);
  }, [calls]);

  const directionStats = useMemo(() => {
  const inbound = calls.filter((c) => c.direction === "Inbound").length;
  const outbound = calls.filter((c) => c.direction === "Outbound").length;
  return { inbound, outbound, total: calls.length };
  }, [calls]);

  const connectRate = useMemo(() => {
  const connected = calls.filter((c) => c.outcome === "Connected" || c.outcome === "Demo Booked").length;
  return calls.length > 0 ? (connected / calls.length) * 100 : 0;
  }, [calls]);

  const avgDuration = useMemo(() => {
  const connected = calls.filter((c) => c.duration_seconds > 0);
  if (connected.length === 0) return 0;
  return connected.reduce((s, c) => s + c.duration_seconds, 0) / connected.length;
  }, [calls]);

  const demosBooked = useMemo(
  () => calls.filter((c) => c.outcome === "Demo Booked").length,
  [calls],
  );

  const callsPerRep = useMemo(() => {
  const out: { agent: string; total: number; connected: number; demosBooked: number }[] = [];
  for (const agent of AGENTS) {
  const reps = calls.filter((c) => c.agent === agent);
  out.push({
  agent,
  total: reps.length,
  connected: reps.filter((c) => c.outcome === "Connected" || c.outcome === "Demo Booked").length,
  demosBooked: reps.filter((c) => c.outcome === "Demo Booked").length,
  });
  }
  return out.sort((a, b) => b.total - a.total);
  }, [calls]);

  // Filter calls by direction + rep before sort + pagination
  const filteredCalls: DialerCall[] = useMemo(() => {
    return calls.filter((c) => {
      if (directionFilter !== "all" && c.direction !== directionFilter) return false;
      if (repFilter !== "all" && c.agent !== repFilter) return false;
      return true;
    });
  }, [calls, directionFilter, repFilter]);

  const sortedCalls: DialerCall[] = useMemo(
  () => [...filteredCalls].sort((a, b) => (b.call_at > a.call_at ? 1 : -1)),
  [filteredCalls],
  );
  const totalPages = Math.max(1, Math.ceil(sortedCalls.length / PAGE_SIZE));
  const paged = sortedCalls.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to first page whenever the filters change so the view isn't stuck
  // on an out-of-range page after a narrow filter.
  const resetPage = (cb: () => void) => () => { setPage(0); setExpandedId(null); cb(); };

  return (
  <AppShell>
  <div className="space-y-6">
  {/* Page header (no inner Back button - the Home connector drilldown
        provides a sticky one; the sidebar Overview link handles the deep-URL case) */}
  <div className="flex items-center gap-4">
  <div className="flex items-center gap-3">
  <div
  className="flex items-center justify-center"
  style={{
  width: 44,
  height: 44,
  borderRadius: 10,
  background: "rgba(0, 180, 166, 0.12)",
  border: "1px solid rgba(0, 180, 166, 0.4)",
  }}
  >
  <PhoneCall size={22} color="#00B4A6" />
  </div>
  <div>
  <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
  Dialer
  </h1>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
  Outbound &amp; inbound call activity · REST + webhook events
  </p>
  </div>
  </div>
  </div>

  {/* KPI strip */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {[
  { label: "Total Calls", value: directionStats.total.toLocaleString(), Icon: PhoneCall, color: "#00B4A6" },
  { label: "Connect Rate", value: `${connectRate.toFixed(1)}%`, Icon: CheckCircle2, color: "#877F49" },
  { label: "Avg Duration", value: formatDuration(Math.round(avgDuration)), Icon: Clock, color: "#4A90E2" },
  { label: "Demos Booked", value: demosBooked.toLocaleString(), Icon: PhoneOutgoing, color: "#D4B85A" },
  ].map((k) => (
  <div key={k.label} className="px-5 py-4" style={GLASS_CARD_STYLE}>
  <div className="flex items-center gap-3 mb-2">
  <k.Icon size={16} color={k.color} />
  <p className="text-[11px] uppercase tracking-widest" style={{ color: k.color }}>
  {k.label}
  </p>
  </div>
  <p className="text-2xl font-bold tabular-nums" style={{ color: "#ffffff" }}>
  {k.value}
  </p>
  </div>
  ))}
  </div>

  {/* Direction split + outcome breakdown */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Direction Split
  </h2>
  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  Inbound vs outbound calls in the period
  </p>
  <div className="space-y-3">
  <div className="flex items-center gap-3">
  <PhoneOutgoing size={16} color="#00B4A6" />
  <div className="flex-1">
  <div className="flex justify-between mb-1">
  <span className="text-sm" style={{ color: "#ffffff" }}>Outbound</span>
  <span className="text-sm tabular-nums font-semibold" style={{ color: "#ffffff" }}>
  {directionStats.outbound.toLocaleString()}
  </span>
  </div>
  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
  <div
  className="h-full rounded-full"
  style={{
  width: `${(directionStats.outbound / directionStats.total) * 100}%`,
  background: "#00B4A6",
  }}
  />
  </div>
  </div>
  </div>
  <div className="flex items-center gap-3">
  <PhoneIncoming size={16} color="#877F49" />
  <div className="flex-1">
  <div className="flex justify-between mb-1">
  <span className="text-sm" style={{ color: "#ffffff" }}>Inbound</span>
  <span className="text-sm tabular-nums font-semibold" style={{ color: "#ffffff" }}>
  {directionStats.inbound.toLocaleString()}
  </span>
  </div>
  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
  <div
  className="h-full rounded-full"
  style={{
  width: `${(directionStats.inbound / directionStats.total) * 100}%`,
  background: "#877F49",
  }}
  />
  </div>
  </div>
  </div>
  </div>
  </div>

  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Call Outcomes
  </h2>
  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  Webhook-reported outcome distribution
  </p>
  <div className="space-y-2.5">
  {outcomeBreakdown.map((o) => (
  <div key={o.outcome} className="flex items-center gap-3">
  <span
  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
  style={{ background: OUTCOME_COLORS[o.outcome] ?? "#666" }}
  />
  <span className="text-sm flex-1" style={{ color: "#ffffff" }}>
  {o.outcome}
  </span>
  <span className="text-sm tabular-nums" style={{ color: "rgba(255,255,255,0.7)" }}>
  {o.count.toLocaleString()}
  </span>
  <span className="text-xs tabular-nums w-12 text-right" style={{ color: "rgba(255,255,255,0.5)" }}>
  {o.pct.toFixed(1)}%
  </span>
  </div>
  ))}
  </div>
  </div>
  </div>

  {/* Calls per rep */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Calls per Sales Rep
  </h2>
  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  Activity volume and demo-booking effectiveness
  </p>
  <div className="overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
  <tr
  className="text-xs uppercase tracking-wider"
  style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(135,127,73,0.3)" }}
  >
  <th className="text-left py-2 pr-4">Sales Rep</th>
  <th className="text-right py-2 px-3">Total Calls</th>
  <th className="text-right py-2 px-3">Connected</th>
  <th className="text-right py-2 px-3">Connect Rate</th>
  <th className="text-right py-2 pl-3">Demos Booked</th>
  </tr>
  </thead>
  <tbody>
  {callsPerRep.map((r) => (
  <tr key={r.agent} style={{ borderBottom: "1px solid rgba(135,127,73,0.12)" }}>
  <td className="py-2.5 pr-4 font-medium" style={{ color: "#ffffff" }}>
  {r.agent}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
  {r.total.toLocaleString()}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
  {r.connected.toLocaleString()}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#00B4A6" }}>
  {r.total > 0 ? `${((r.connected / r.total) * 100).toFixed(1)}%` : " - "}
  </td>
  <td className="py-2.5 pl-3 text-right tabular-nums font-semibold" style={{ color: "#877F49" }}>
  {r.demosBooked.toLocaleString()}
  </td>
  </tr>
  ))}
  </tbody>
  </table>
  </div>
  </div>

  {/* Recent calls log */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
  <div>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Recent Calls
  </h2>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
  Showing {sortedCalls.length.toLocaleString()} of {calls.length.toLocaleString()} dialer events - click any row for the rep&apos;s note
  </p>
  </div>
  <div className="flex items-center gap-2 flex-wrap">
  {/* Direction filter chips */}
  <div
  className="inline-flex items-center rounded-md p-0.5 gap-0.5"
  style={{
  background: "rgba(15, 25, 50, 0.5)",
  border: "1px solid rgba(184, 212, 240, 0.18)",
  }}
  >
  {([
  { key: "all" as const,      label: "All directions" },
  { key: "Inbound" as const,  label: "Inbound" },
  { key: "Outbound" as const, label: "Outbound" },
  ]).map((d) => (
  <button
  key={d.key}
  onClick={resetPage(() => setDirectionFilter(d.key))}
  className="px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors flex items-center gap-1.5"
  style={{
  background: directionFilter === d.key ? "rgba(91, 163, 232, 0.18)" : "transparent",
  color:      directionFilter === d.key ? "#5BA3E8" : "rgba(184,212,240,0.7)",
  }}
  >
  {d.key === "Inbound"  && <PhoneIncoming size={10} />}
  {d.key === "Outbound" && <PhoneOutgoing size={10} />}
  {d.label}
  </button>
  ))}
  </div>

  {/* Sales rep filter dropdown */}
  <select
  value={repFilter}
  onChange={(e) => { setPage(0); setExpandedId(null); setRepFilter(e.target.value); }}
  className="text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(15, 25, 50, 0.65)",
  border: "1px solid rgba(184, 212, 240, 0.25)",
  color: "#E0E8F0",
  }}
  >
  <option value="all">All sales reps</option>
  {AGENTS.map((a) => (
  <option key={a} value={a}>{a}</option>
  ))}
  </select>
  </div>
  </div>

  <div className="overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
  <tr
  className="text-xs uppercase tracking-wider"
  style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
  >
  <th className="text-left py-2 pr-3 w-8"></th>
  <th className="text-left py-2 pr-4">When</th>
  <th className="text-left py-2 pr-4">Lead</th>
  <th className="text-left py-2 pr-4">Sales Rep</th>
  <th className="text-left py-2 pr-4">Direction</th>
  <th className="text-right py-2 px-3">Duration</th>
  <th className="text-left py-2 pl-3">Outcome</th>
  </tr>
  </thead>
  <tbody>
  {paged.length === 0 ? (
  <tr>
  <td colSpan={7} className="text-center py-10" style={{ color: "rgba(184,212,240,0.55)" }}>
  No calls match these filters.
  </td>
  </tr>
  ) : paged.map((c) => {
  const isOpen = expandedId === c.id;
  return (
  <>
  <tr
  key={c.id}
  onClick={() => setExpandedId(isOpen ? null : c.id)}
  className="hover:bg-white/[0.04] transition-colors"
  style={{
  borderBottom: "1px solid rgba(184,212,240,0.08)",
  background: isOpen ? "rgba(91, 163, 232, 0.05)" : "transparent",
  cursor: "pointer",
  }}
  >
  <td className="py-2.5 pr-3">
  {isOpen ? <ChevronDown size={14} color="#5BA3E8" /> : <ChevronRight size={14} color="rgba(184,212,240,0.55)" />}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {format(new Date(c.call_at), "d MMM, HH:mm")}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap font-mono text-xs" style={{ color: "rgba(184,212,240,0.85)" }}>
  {c.hubspot_id}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "#ffffff" }}>
  {c.agent}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap">
  <span
  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
  style={{
  background: c.direction === "Outbound" ? "rgba(91,163,232,0.15)" : "rgba(184,212,240,0.10)",
  color:      c.direction === "Outbound" ? "#5BA3E8" : "#B8D4F0",
  }}
  >
  {c.direction === "Outbound" ? <PhoneOutgoing size={11} /> : <PhoneIncoming size={11} />}
  {c.direction}
  </span>
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>
  {formatDuration(c.duration_seconds)}
  </td>
  <td className="py-2.5 pl-3 whitespace-nowrap">
  <span
  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
  style={{
  background: `${OUTCOME_COLORS[c.outcome]}22`,
  color:      OUTCOME_COLORS[c.outcome],
  }}
  >
  {(c.outcome === "Connected" || c.outcome === "Demo Booked") && <CheckCircle2 size={11} />}
  {(c.outcome === "Disqualified" || c.outcome === "No Answer") && <XCircle size={11} />}
  {c.outcome}
  </span>
  </td>
  </tr>
  {isOpen && (
  <tr style={{ borderBottom: "1px solid rgba(184,212,240,0.12)" }}>
  <td colSpan={7} className="py-4 px-5" style={{ background: "rgba(15, 25, 50, 0.4)" }}>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
  {/* Sales-rep note */}
  <div className="md:col-span-2">
  <p
  className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"
  style={{ color: "rgba(184,212,240,0.55)" }}
  >
  <FileText size={11} /> Sales rep note
  </p>
  <p
  className="text-sm leading-relaxed"
  style={{
  color: "#E0E8F0",
  background: "rgba(91, 163, 232, 0.06)",
  border: "1px solid rgba(91, 163, 232, 0.20)",
  borderRadius: 8,
  padding: "12px 14px",
  }}
  >
  {c.notes}
  </p>
  </div>

  {/* Call context */}
  <div>
  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>
  Context
  </p>
  <div className="space-y-2 text-xs" style={{ color: "rgba(184,212,240,0.75)" }}>
  <div className="flex items-center gap-2">
  <UserIcon size={11} />
  <span>{c.agent}</span>
  </div>
  <div>
  <span style={{ color: "rgba(184,212,240,0.55)" }}>Lead: </span>
  <span className="font-mono" style={{ color: "#ffffff" }}>{c.hubspot_id}</span>
  </div>
  <div>
  <span style={{ color: "rgba(184,212,240,0.55)" }}>Direction: </span>
  <span style={{ color: "#ffffff" }}>{c.direction}</span>
  </div>
  <div>
  <span style={{ color: "rgba(184,212,240,0.55)" }}>Duration: </span>
  <span style={{ color: "#ffffff" }}>{formatDuration(c.duration_seconds)}</span>
  </div>
  <div>
  <span style={{ color: "rgba(184,212,240,0.55)" }}>Logged at: </span>
  <span style={{ color: "#ffffff" }}>{format(new Date(c.call_at), "d MMM yyyy, HH:mm")}</span>
  </div>
  </div>
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

  {totalPages > 1 && (
  <div className="flex items-center justify-between mt-4">
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
  Page {page + 1} of {totalPages}
  </p>
  <div className="flex gap-2">
  <button
  onClick={() => setPage((p) => Math.max(0, p - 1))}
  disabled={page === 0}
  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  style={{
  background: "rgba(135, 127, 73, 0.15)",
  border: "1px solid rgba(135, 127, 73, 0.45)",
  color: "#ffffff",
  }}
  >
  Previous
  </button>
  <button
  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
  disabled={page >= totalPages - 1}
  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  style={{
  background: "rgba(135, 127, 73, 0.15)",
  border: "1px solid rgba(135, 127, 73, 0.45)",
  color: "#ffffff",
  }}
  >
  Next
  </button>
  </div>
  </div>
  )}
  </div>
  </div>
  </AppShell>
  );
}
