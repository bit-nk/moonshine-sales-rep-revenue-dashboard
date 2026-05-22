import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Tag,
  Calendar,
  FileText,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { Lead } from "@/hooks/useLeadsData";

const PAGE_SIZE = 25;

interface Standing {
  label: string;
  value: string;
}

interface LeadsDrilldownProps {
  title: string;
  subtitle?: string;
  leads: Lead[];
  standings?: Standing[];
  onBack: () => void;
}

type StatusFilter = "all" | "Active" | "Nurture" | "Closed";

const STAGE_COLORS: Record<string, string> = {
  New:              "#5BA3E8",
  Contacted:        "#7AB8E8",
  Qualified:        "#7AD4A2",
  "Demo Booked":    "#E8C46A",
  "Demo Completed": "#F0B870",
  Negotiation:      "#EF8E5C",
  "Closed Won":     "#5BC0BE",
  "Closed Lost":    "#7C8499",
};

const PRIORITY_COLORS: Record<string, string> = {
  High:   "#EF6F5C",
  Medium: "#F0B870",
  Low:    "#7C8499",
};

const formatUSD = (value?: number) =>
  value == null
    ? " - "
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(15, 25, 50, 0.45)",
  backdropFilter: "blur(18px) saturate(160%)",
  WebkitBackdropFilter: "blur(18px) saturate(160%)",
  border: "1px solid rgba(184, 212, 240, 0.14)",
  borderRadius: 16,
};

/**
 * Full-page lead drilldown with:
 *  - Title + subtitle + Back button + optional KPI standings strip
 *  - Status filter chips (All / Active / Nurture / Closed)
 *  - Compact table (Date, Name, Source, Stage, Sales Rep, Deal Value, Status)
 *  - Row click expands inline with contact info, pipeline progress,
 *    qualification + sales-rep context.
 */
const LeadsDrilldown = ({
  title,
  subtitle,
  leads,
  standings,
  onBack,
}: LeadsDrilldownProps) => {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const da = a.created_at || a.date;
        const db = b.created_at || b.date;
        if (!da) return 1;
        if (!db) return -1;
        return new Date(db).getTime() - new Date(da).getTime();
      }),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Filter chip counts
  const counts = useMemo(() => {
    const out: Record<StatusFilter, number> = { all: leads.length, Active: 0, Nurture: 0, Closed: 0 };
    for (const l of leads) {
      if (l.status === "Active") out.Active += 1;
      if (l.status === "Nurture") out.Nurture += 1;
      if (l.status === "Closed") out.Closed += 1;
    }
    return out;
  }, [leads]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2
            className="text-3xl font-extrabold tracking-tight"
            style={{
              color: "#E0E8F0",
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              fontVariant: "small-caps",
              textShadow: "0 0 18px rgba(91,163,232,0.30)",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: "rgba(184,212,240,0.65)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
          style={{
            background: "rgba(15, 25, 50, 0.65)",
            border: "1px solid rgba(91, 163, 232, 0.45)",
            color: "#E0E8F0",
            boxShadow: "0 0 14px rgba(91,163,232,0.15)",
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Standings strip (optional) */}
      {standings && standings.length > 0 && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${standings.length}, minmax(0, 1fr))` }}
        >
          {standings.map((s) => (
            <div key={s.label} className="p-4" style={GLASS_CARD}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5BA3E8" }}>
                {s.label}
              </p>
              <p className="text-xl font-bold mt-1 truncate" style={{ color: "#ffffff" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="inline-flex items-center rounded-md p-0.5 gap-0.5"
          style={{
            background: "rgba(15, 25, 50, 0.5)",
            border: "1px solid rgba(184, 212, 240, 0.18)",
          }}
        >
          {([
            { key: "all" as const, label: "All Leads" },
            { key: "Active" as const, label: "Active" },
            { key: "Nurture" as const, label: "Nurture" },
            { key: "Closed" as const, label: "Closed" },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(0); setExpandedId(null); }}
              className="px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors flex items-center gap-1.5"
              style={{
                background: filter === f.key ? "rgba(91, 163, 232, 0.18)" : "transparent",
                color: filter === f.key ? "#5BA3E8" : "rgba(184,212,240,0.7)",
              }}
            >
              {f.label}
              <span
                className="text-[10px] tabular-nums px-1 rounded"
                style={{
                  background: filter === f.key ? "rgba(91,163,232,0.25)" : "rgba(255,255,255,0.06)",
                  color: filter === f.key ? "#7AB8E8" : "rgba(184,212,240,0.55)",
                }}
              >
                {counts[f.key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: "rgba(184,212,240,0.5)" }}>
          Click any lead row for full details
        </span>
      </div>

      {/* Table */}
      <div style={GLASS_CARD} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs uppercase tracking-wider"
                style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
              >
                <th className="text-left py-3 pl-5 pr-3 w-8"></th>
                <th className="text-left py-3 px-3">Date</th>
                <th className="text-left py-3 px-3">Name</th>
                <th className="text-left py-3 px-3">Source</th>
                <th className="text-left py-3 px-3">Stage</th>
                <th className="text-left py-3 px-3">Sales Rep</th>
                <th className="text-right py-3 px-3">Deal Value</th>
                <th className="text-left py-3 pl-3 pr-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10" style={{ color: "rgba(184,212,240,0.55)" }}>
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                paged.map((lead) => {
                  const isOpen = expandedId === (lead.id ?? -1);
                  const stageColor = STAGE_COLORS[lead.stage ?? ""] ?? "#7C8499";
                  return (
                    <>
                      <tr
                        key={lead.id}
                        onClick={() => setExpandedId(isOpen ? null : lead.id ?? -1)}
                        className="hover:bg-white/[0.04] transition-colors"
                        style={{
                          borderBottom: "1px solid rgba(184,212,240,0.08)",
                          background: isOpen ? "rgba(91, 163, 232, 0.05)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <td className="py-3 pl-5 pr-3">
                          {isOpen ? <ChevronDown size={14} color="#5BA3E8" /> : <ChevronRight size={14} color="rgba(184,212,240,0.55)" />}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                          {lead.created_at ? format(new Date(lead.created_at), "d MMM yyyy") : "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-medium" style={{ color: "#ffffff" }}>
                          {lead.display_name || lead.name || "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                          {lead.source || lead.lead_source || "-"}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className="inline-block text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium"
                            style={{ background: `${stageColor}22`, color: stageColor }}
                          >
                            {lead.stage ?? "-"}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                          {lead.agent ?? "-"}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap tabular-nums font-semibold" style={{ color: "#5BA3E8" }}>
                          {formatUSD(lead.deal_value)}
                        </td>
                        <td className="py-3 pl-3 pr-5 whitespace-nowrap">
                          <span
                            className="inline-block text-[10px] px-2 py-0.5 rounded"
                            style={{
                              background:
                                lead.status === "Active" ? "rgba(122,212,162,0.15)" :
                                lead.status === "Nurture" ? "rgba(240,184,112,0.15)" :
                                "rgba(124,132,153,0.15)",
                              color:
                                lead.status === "Active" ? "#7AD4A2" :
                                lead.status === "Nurture" ? "#F0B870" :
                                "#9CA3AF",
                            }}
                          >
                            {lead.status ?? "-"}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr style={{ borderBottom: "1px solid rgba(184,212,240,0.12)" }}>
                          <td colSpan={8} className="py-5 px-5" style={{ background: "rgba(15, 25, 50, 0.4)" }}>
                            <LeadDetail lead={lead} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(184,212,240,0.12)" }}
          >
            <p className="text-xs" style={{ color: "rgba(184,212,240,0.55)" }}>
              Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(184, 212, 240, 0.08)",
                  border: "1px solid rgba(184, 212, 240, 0.25)",
                  color: "#E0E8F0",
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(184, 212, 240, 0.08)",
                  border: "1px solid rgba(184, 212, 240, 0.25)",
                  color: "#E0E8F0",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Detail panel rendered when a lead row is expanded. Includes a Sales Rep
// section so the user gets the rep's context together with the lead.
function LeadDetail({ lead }: { lead: Lead }) {
  const stageColor = STAGE_COLORS[lead.stage ?? ""] ?? "#7C8499";
  const priorityColor = PRIORITY_COLORS[lead.priority ?? "Low"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
      {/* Contact */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>Contact</p>
        <p className="font-medium" style={{ color: "#ffffff" }}>{lead.display_name ?? lead.name ?? "-"}</p>
        <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(184,212,240,0.6)" }}>
          {lead.hubspot_id ?? `#${lead.id}`}
        </p>
        <div className="space-y-1.5 mt-3 text-xs" style={{ color: "rgba(184,212,240,0.75)" }}>
          {lead.email && <div className="flex items-center gap-2"><Mail size={11} /> {lead.email}</div>}
          {lead.phone && <div className="flex items-center gap-2"><Phone size={11} /> {lead.phone}</div>}
          {(lead.listing_address || lead.area) && (
            <div className="flex items-center gap-2"><MapPin size={11} /> {lead.listing_address ?? lead.area}</div>
          )}
          {lead.listing_ref && (
            <div className="flex items-center gap-2"><Tag size={11} /> Ref {lead.listing_ref}</div>
          )}
          {lead.created_at && (
            <div className="flex items-center gap-2">
              <Calendar size={11} /> Created {format(new Date(lead.created_at), "d MMM yyyy")}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>Pipeline</p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className="inline-block text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium"
            style={{ background: `${stageColor}22`, color: stageColor }}
          >
            {lead.stage ?? "-"}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium"
            style={{ background: `${priorityColor}1c`, color: priorityColor }}
          >
            <Tag size={9} /> {lead.priority ?? "Low"} priority
          </span>
        </div>
        <p className="text-xs" style={{ color: "rgba(184,212,240,0.75)" }}>
          Source: <span style={{ color: "#ffffff" }}>{lead.source ?? "-"}</span>
        </p>
        {lead.source_campaign && (
          <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.75)" }}>
            Campaign: <span style={{ color: "#ffffff" }}>{lead.source_campaign}</span>
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.75)" }}>
          Interested in: <span style={{ color: "#ffffff" }}>{lead.listing ?? "-"}</span>
        </p>
        {lead.last_activity_at && (
          <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.55)" }}>
            Last activity {format(new Date(lead.last_activity_at), "d MMM yyyy")}
          </p>
        )}
      </div>

      {/* Sales Rep */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>Sales Rep</p>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(91, 163, 232, 0.18)",
              border: "1px solid rgba(91, 163, 232, 0.45)",
            }}
          >
            <UserIcon size={14} color="#5BA3E8" />
          </div>
          <p className="font-medium" style={{ color: "#ffffff" }}>{lead.agent ?? "-"}</p>
        </div>
        <p className="text-xs" style={{ color: "rgba(184,212,240,0.6)" }}>{lead.branch ?? "Moonshine Zone"}</p>
        <p className="text-xs mt-2" style={{ color: "rgba(184,212,240,0.75)" }}>
          Lead type: <span style={{ color: "#ffffff" }}>{lead.lead_type ?? "-"}</span>
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.75)" }}>
          Lifecycle: <span style={{ color: "#ffffff" }}>{lead.lifecycle_status ?? lead.status ?? "-"}</span>
        </p>
      </div>

      {/* Qualification + deal value */}
      <div>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>Qualification & Deal</p>
        <p className="text-3xl font-bold tabular-nums" style={{ color: "#5BA3E8" }}>{formatUSD(lead.deal_value)}</p>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(184,212,240,0.55)" }}>Potential deal value</p>

        <div className="mt-3 text-xs space-y-1" style={{ color: "rgba(184,212,240,0.75)" }}>
          <div className="flex items-center justify-between">
            <span>NetSweep score</span>
            <span className="font-semibold tabular-nums" style={{ color: "#ffffff" }}>
              {lead.qualification_score ?? "-"}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Qualification</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{
                background:
                  lead.qualification_status === "Qualified" ? "rgba(122,212,162,0.15)" :
                  lead.qualification_status === "Pending" ? "rgba(240,184,112,0.15)" :
                  "rgba(239,111,92,0.15)",
                color:
                  lead.qualification_status === "Qualified" ? "#7AD4A2" :
                  lead.qualification_status === "Pending" ? "#F0B870" :
                  "#EF6F5C",
              }}
            >
              {lead.qualification_status ?? "-"}
            </span>
          </div>
        </div>

        {lead.message && (
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(184,212,240,0.12)" }}>
            <p className="text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "rgba(184,212,240,0.55)" }}>
              <FileText size={9} /> Notes
            </p>
            <p className="text-xs italic" style={{ color: "rgba(184,212,240,0.85)" }}>
              {lead.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadsDrilldown;
