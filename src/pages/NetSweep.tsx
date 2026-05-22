import { useMemo, useState } from "react";
import { ShieldCheck, TrendingUp, Award, AlertTriangle } from "lucide-react";
import AppShell from "@/components/moonlit/AppShell";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";
import { STUB_NETSWEEP_SIGNALS, STUB_LEADS } from "@/data/stubData";

const STATUS_COLORS: Record<string, string> = {
  Qualified: "#00B4A6",
  Pending: "#D4B85A",
  "Not Qualified": "#E2734A",
};

const TIER_COLORS: Record<string, string> = {
  A: "#00B4A6",
  B: "#7AB892",
  C: "#D4B85A",
  D: "#E2734A",
};

const PAGE_SIZE = 12;

export default function NetSweep() {
  const [filter, setFilter] = useState<"all" | "Qualified" | "Pending" | "Not Qualified">("Qualified");
  const [page, setPage] = useState(0);

  const signals = STUB_NETSWEEP_SIGNALS;

  const statusBreakdown = useMemo(() => {
  const map = new Map<string, number>();
  for (const s of signals) map.set(s.qualification_status, (map.get(s.qualification_status) || 0) + 1);
  return Array.from(map.entries())
  .map(([status, count]) => ({ status, count, pct: (count / signals.length) * 100 }))
  .sort((a, b) => b.count - a.count);
  }, [signals]);

  const tierBreakdown = useMemo(() => {
  const map = new Map<string, number>();
  for (const s of signals) map.set(s.credit_tier, (map.get(s.credit_tier) || 0) + 1);
  return ["A", "B", "C", "D"].map((tier) => ({
  tier,
  count: map.get(tier) ?? 0,
  pct: signals.length > 0 ? ((map.get(tier) ?? 0) / signals.length) * 100 : 0,
  }));
  }, [signals]);

  const incomeBreakdown = useMemo(() => {
  const order = [">$1M", "$250k-1M", "$100-250k", "$50-100k", "<$50k"];
  const map = new Map<string, number>();
  for (const s of signals) map.set(s.income_band, (map.get(s.income_band) || 0) + 1);
  return order.map((band) => ({
  band,
  count: map.get(band) ?? 0,
  pct: signals.length > 0 ? ((map.get(band) ?? 0) / signals.length) * 100 : 0,
  }));
  }, [signals]);

  const avgScore = useMemo(() => {
  if (signals.length === 0) return 0;
  return signals.reduce((s, x) => s + x.qualification_score, 0) / signals.length;
  }, [signals]);

  const qualifiedCount = signals.filter((s) => s.qualification_status === "Qualified").length;
  const tierAcount = signals.filter((s) => s.credit_tier === "A").length;

  // Join signals to leads for the table
  const leadById = useMemo(() => new Map(STUB_LEADS.map((l) => [l.id, l])), []);
  const rows = useMemo(() => {
  const all = signals.map((sig) => ({ sig, lead: leadById.get(sig.lead_id) }));
  return filter === "all" ? all : all.filter((r) => r.sig.qualification_status === filter);
  }, [signals, leadById, filter]);

  const sortedRows = useMemo(
  () => rows.sort((a, b) => b.sig.qualification_score - a.sig.qualification_score),
  [rows],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const paged = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
  <AppShell>
  <div className="space-y-6">
  {/* Header (no inner Back button - Home connector drilldown handles it) */}
  <div className="flex items-center gap-4">
  <div className="flex items-center gap-3">
  <div
  className="flex items-center justify-center"
  style={{
  width: 44,
  height: 44,
  borderRadius: 10,
  background: "rgba(212, 184, 90, 0.12)",
  border: "1px solid rgba(212, 184, 90, 0.4)",
  }}
  >
  <ShieldCheck size={22} color="#D4B85A" />
  </div>
  <div>
  <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
  NetSweep
  </h1>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
  Financial qualification signals · Income · Credit · Score
  </p>
  </div>
  </div>
  </div>

  {/* KPI strip */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {[
  { label: "Total Signals", value: signals.length.toLocaleString(), Icon: ShieldCheck, color: "#D4B85A" },
  { label: "Qualified", value: qualifiedCount.toLocaleString(), Icon: Award, color: "#00B4A6" },
  { label: "Avg Score", value: avgScore.toFixed(1), Icon: TrendingUp, color: "#877F49" },
  { label: "Tier-A Leads", value: tierAcount.toLocaleString(), Icon: AlertTriangle, color: "#4A90E2" },
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

  {/* Status + Tier + Income breakdowns */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Qualification Status
  </h2>
  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  Distribution of NetSweep verdicts
  </p>
  <div className="space-y-3">
  {statusBreakdown.map((s) => (
  <div key={s.status}>
  <div className="flex items-center justify-between mb-1">
  <span className="text-sm" style={{ color: "#ffffff" }}>
  {s.status}
  </span>
  <span className="text-sm tabular-nums font-semibold" style={{ color: "#ffffff" }}>
  {s.count.toLocaleString()}
  </span>
  </div>
  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
  <div
  className="h-full rounded-full"
  style={{
  width: `${s.pct}%`,
  background: STATUS_COLORS[s.status] ?? "#666",
  }}
  />
  </div>
  </div>
  ))}
  </div>
  </div>

  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Credit Tier Distribution
  </h2>
  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  Lead spread across A · B · C · D tiers
  </p>
  <div className="space-y-3">
  {tierBreakdown.map((t) => (
  <div key={t.tier} className="flex items-center gap-3">
  <div
  className="flex items-center justify-center w-8 h-8 rounded-md font-bold text-sm"
  style={{
  background: `${TIER_COLORS[t.tier]}22`,
  color: TIER_COLORS[t.tier],
  border: `1px solid ${TIER_COLORS[t.tier]}55`,
  }}
  >
  {t.tier}
  </div>
  <div className="flex-1">
  <div className="flex justify-between mb-1">
  <span className="text-sm" style={{ color: "#ffffff" }}>Tier {t.tier}</span>
  <span className="text-sm tabular-nums font-semibold" style={{ color: "#ffffff" }}>
  {t.count.toLocaleString()}
  </span>
  </div>
  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
  <div
  className="h-full rounded-full"
  style={{ width: `${t.pct}%`, background: TIER_COLORS[t.tier] }}
  />
  </div>
  </div>
  </div>
  ))}
  </div>
  </div>

  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Income Band
  </h2>
  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
  Self-reported income distribution
  </p>
  <div className="space-y-3">
  {incomeBreakdown.map((b) => (
  <div key={b.band}>
  <div className="flex items-center justify-between mb-1">
  <span className="text-sm" style={{ color: "#ffffff" }}>{b.band}</span>
  <span className="text-sm tabular-nums font-semibold" style={{ color: "#ffffff" }}>
  {b.count.toLocaleString()}
  </span>
  </div>
  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
  <div
  className="h-full rounded-full"
  style={{ width: `${b.pct}%`, background: "#877F49" }}
  />
  </div>
  </div>
  ))}
  </div>
  </div>
  </div>

  {/* Lead table with filter */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
  <div>
  <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
  Leads by Qualification
  </h2>
  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
  Filter to surface the highest-priority leads for the sales team
  </p>
  </div>
  <div className="inline-flex items-center rounded-md p-0.5 gap-0.5" style={{
  background: "rgba(20, 20, 20, 0.5)",
  border: "1px solid rgba(135, 127, 73, 0.3)",
  }}>
  {(["Qualified", "Pending", "Not Qualified", "all"] as const).map((opt) => (
  <button
  key={opt}
  onClick={() => { setFilter(opt); setPage(0); }}
  className="px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors"
  style={{
  background: filter === opt ? "rgba(0,180,166,0.18)" : "transparent",
  color: filter === opt ? "#00B4A6" : "rgba(255,255,255,0.65)",
  }}
  >
  {opt === "all" ? "All" : opt}
  </button>
  ))}
  </div>
  </div>

  <div className="overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
  <tr
  className="text-xs uppercase tracking-wider"
  style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(135,127,73,0.3)" }}
  >
  <th className="text-left py-2 pr-4">Lead</th>
  <th className="text-left py-2 pr-4">Source</th>
  <th className="text-left py-2 pr-4">Sales Rep</th>
  <th className="text-right py-2 px-3">Score</th>
  <th className="text-center py-2 px-3">Tier</th>
  <th className="text-left py-2 px-3">Income</th>
  <th className="text-left py-2 pl-3">Status</th>
  </tr>
  </thead>
  <tbody>
  {paged.map((r) => (
  <tr key={r.sig.lead_id} style={{ borderBottom: "1px solid rgba(135,127,73,0.12)" }}>
  <td className="py-2.5 pr-4 whitespace-nowrap">
  <p className="font-medium" style={{ color: "#ffffff" }}>
  {r.lead?.display_name || " - "}
  </p>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
  {r.sig.hubspot_id}
  </p>
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {r.lead?.source ?? " - "}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {r.lead?.agent ?? " - "}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#ffffff" }}>
  {r.sig.qualification_score}
  </td>
  <td className="py-2.5 px-3 text-center">
  <span
  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
  style={{
  background: `${TIER_COLORS[r.sig.credit_tier]}22`,
  color: TIER_COLORS[r.sig.credit_tier],
  border: `1px solid ${TIER_COLORS[r.sig.credit_tier]}55`,
  }}
  >
  {r.sig.credit_tier}
  </span>
  </td>
  <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {r.sig.income_band}
  </td>
  <td className="py-2.5 pl-3 whitespace-nowrap">
  <span
  className="inline-block text-xs px-2 py-0.5 rounded"
  style={{
  background: `${STATUS_COLORS[r.sig.qualification_status]}22`,
  color: STATUS_COLORS[r.sig.qualification_status],
  }}
  >
  {r.sig.qualification_status}
  </span>
  </td>
  </tr>
  ))}
  </tbody>
  </table>
  </div>

  {totalPages > 1 && (
  <div className="flex items-center justify-between mt-4">
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
  Showing {page * PAGE_SIZE + 1} - 
  {Math.min((page + 1) * PAGE_SIZE, sortedRows.length)} of {sortedRows.length}
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
