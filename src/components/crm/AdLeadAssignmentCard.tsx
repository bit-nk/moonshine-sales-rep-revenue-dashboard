import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { Lead } from "@/hooks/useLeadsData";
import { AGENTS } from "@/data/stubData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";
import { format } from "date-fns";

const formatUSD = (value: number | undefined) =>
  value == null
  ? " - "
  : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

interface Props {
  leads: Lead[];
}

const PAGE_SIZE = 12;

export default function AdLeadAssignmentCard({ leads }: Props) {
  const adLeads = useMemo(
  () =>
  leads
  .filter((l) => l.source === "Meta Ads" || l.source === "Google Ads")
  .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")),
  [leads],
  );

  // Local override state  -  keyed by lead id → newly-assigned sales rep.
  // Demo only; not persisted.
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [page, setPage] = useState(0);
  // Filter the table by a rep - clicking any of the rep tiles toggles it.
  const [repFilter, setRepFilter] = useState<string | null>(null);

  // How many leads each rep currently has (uses the local override
  // assignments if present, otherwise the lead's original agent).
  const assignmentCounts = useMemo(() => {
  const counts = new Map<string, number>();
  for (const l of adLeads) {
  const a = assignments[l.id] ?? l.agent ?? "Unassigned";
  counts.set(a, (counts.get(a) || 0) + 1);
  }
  return counts;
  }, [adLeads, assignments]);

  // Apply the active rep filter before paginating
  const filteredLeads = useMemo(() => {
  if (!repFilter) return adLeads;
  return adLeads.filter((l) => (assignments[l.id] ?? l.agent) === repFilter);
  }, [adLeads, assignments, repFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const paged = filteredLeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleRepFilter = (rep: string) => {
  setRepFilter((prev) => (prev === rep ? null : rep));
  setPage(0);
  };

  return (
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <div className="flex items-start justify-between mb-1 gap-4">
  <div>
  <h2 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
  Ad-Lead Assignment
  </h2>
  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
  Route paid-ads leads to sales reps  -  {adLeads.length.toLocaleString()} leads from Meta &amp; Google Ads.
  {repFilter
    ? <> Filtering by <span style={{ color: "#5BA3E8", fontWeight: 600 }}>{repFilter}</span> - click their tile again to clear.</>
    : <> Click a rep tile to filter the table.</>}
  </p>
  </div>
  <div className="flex items-center gap-2 whitespace-nowrap">
  {repFilter && (
  <button
  type="button"
  onClick={() => { setRepFilter(null); setPage(0); }}
  className="text-xs px-3 py-1.5 rounded-full transition-colors"
  style={{
  background: "rgba(91, 163, 232, 0.12)",
  border: "1px solid rgba(91, 163, 232, 0.45)",
  color: "#5BA3E8",
  }}
  >
  Clear filter
  </button>
  )}
  <div
  className="text-xs px-3 py-1.5 rounded-full"
  style={{
  background: "rgba(0, 180, 166, 0.12)",
  border: "1px solid rgba(0, 180, 166, 0.4)",
  color: "#00B4A6",
  }}
  >
  {AGENTS.length} sales reps available
  </div>
  </div>
  </div>

  {/* Per-rep workload summary - clicking a tile filters the table below */}
  <div className="mt-4 mb-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
  {AGENTS.map((rep) => {
  const count = assignmentCounts.get(rep) ?? 0;
  const isActive = repFilter === rep;
  return (
  <button
  key={rep}
  type="button"
  onClick={() => toggleRepFilter(rep)}
  className="rounded-md px-3 py-2 text-left transition-all"
  style={{
  background: isActive ? "rgba(91, 163, 232, 0.15)" : "rgba(20, 20, 20, 0.5)",
  border: `1px solid ${isActive ? "rgba(91, 163, 232, 0.6)" : "rgba(135, 127, 73, 0.25)"}`,
  boxShadow: isActive ? "0 0 18px -4px rgba(91,163,232,0.45)" : undefined,
  cursor: "pointer",
  }}
  onMouseEnter={(e) => {
  if (isActive) return;
  e.currentTarget.style.borderColor = "rgba(91, 163, 232, 0.45)";
  }}
  onMouseLeave={(e) => {
  if (isActive) return;
  e.currentTarget.style.borderColor = "rgba(135, 127, 73, 0.25)";
  }}
  >
  <p className="text-[10px] uppercase tracking-wider" style={{ color: isActive ? "#5BA3E8" : "rgba(255,255,255,0.55)" }}>
  {rep}
  </p>
  <p className="text-lg font-bold tabular-nums" style={{ color: "#ffffff" }}>
  {count}
  </p>
  </button>
  );
  })}
  </div>

  <div className="overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
  <tr
  className="text-xs uppercase tracking-wider"
  style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(135,127,73,0.3)" }}
  >
  <th className="text-left py-2 pr-4">Date</th>
  <th className="text-left py-2 pr-4">Lead</th>
  <th className="text-left py-2 pr-4">Source</th>
  <th className="text-left py-2 pr-4">Program</th>
  <th className="text-right py-2 px-3">Deal Value</th>
  <th className="text-left py-2 pl-3">Assigned Sales Rep</th>
  </tr>
  </thead>
  <tbody>
  {paged.map((l) => {
  const current = assignments[l.id] ?? l.agent ?? "";
  const wasReassigned = assignments[l.id] != null && assignments[l.id] !== l.agent;
  return (
  <tr key={l.id} style={{ borderBottom: "1px solid rgba(135,127,73,0.12)" }}>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {l.created_at ? format(new Date(l.created_at), "d MMM yyyy") : "-"}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap">
  <p className="font-medium" style={{ color: "#ffffff" }}>
  {l.display_name || l.name}
  </p>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
  {l.hubspot_id}
  </p>
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {l.source}
  </td>
  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.85)" }}>
  {l.listing}
  </td>
  <td className="py-2.5 px-3 text-right tabular-nums font-semibold" style={{ color: "#877F49" }}>
  {formatUSD(l.deal_value)}
  </td>
  <td className="py-2.5 pl-3 min-w-[180px]">
  <div className="flex items-center gap-2">
  <select
  value={current}
  onChange={(e) =>
  setAssignments((prev) => ({ ...prev, [l.id]: e.target.value }))
  }
  className="text-sm rounded px-2 py-1 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20, 20, 20, 0.85)",
  border: "1px solid rgba(135, 127, 73, 0.45)",
  color: "#ffffff",
  }}
  >
  {AGENTS.map((rep) => (
  <option key={rep} value={rep}>
  {rep}
  </option>
  ))}
  </select>
  {wasReassigned && (
  <span
  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
  style={{
  background: "rgba(0, 180, 166, 0.15)",
  color: "#00B4A6",
  border: "1px solid rgba(0, 180, 166, 0.4)",
  }}
  >
  <Check className="w-3 h-3" /> reassigned
  </span>
  )}
  </div>
  </td>
  </tr>
  );
  })}
  </tbody>
  </table>
  </div>

  {totalPages > 1 && (
  <div className="flex items-center justify-between mt-4">
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
  Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, filteredLeads.length)} of{" "}
  {filteredLeads.length}{repFilter ? ` (${adLeads.length} total)` : ""}
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
  );
}
