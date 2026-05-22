import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { SaleRow } from "@/hooks/useSalesData";
import type { Lead } from "@/hooks/useLeadsData";
import { glass } from "@/lib/glassStyles";

const PAGE_SIZE = 20;

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

interface Props {
  title: string;
  subtitle?: string;
  sales: SaleRow[];
  leads: Lead[];
  /** Optional - when omitted, no back button is rendered (embedded mode). */
  onBack?: () => void;
}

export default function SalesDrilldown({ title, subtitle, sales, leads, onBack }: Props) {
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const leadByAgent = useMemo(() => {
    // Best-effort linkage: find the most recent lead from the same agent
    // for each sale - the stub data doesn't carry a direct sale->lead pointer.
    const byAgent = new Map<string, Lead[]>();
    for (const l of leads) {
      const a = l.agent ?? "";
      const arr = byAgent.get(a) ?? [];
      arr.push(l);
      byAgent.set(a, arr);
    }
    return byAgent;
  }, [leads]);

  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => (b.sale_date! > a.sale_date! ? 1 : -1)),
    [sales],
  );
  const totalPages = Math.max(1, Math.ceil(sortedSales.length / PAGE_SIZE));
  const paged = sortedSales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalRevenue = sales.reduce((s, r) => s + (r.deal_amount ?? r.sale_price ?? 0), 0);
  const avgDeal = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#E0E8F0", textShadow: "0 0 18px rgba(91,163,232,0.30)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: "rgba(184,212,240,0.65)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {onBack && (
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
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className={glass("default", "none", "p-4")}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(184,212,240,0.6)" }}>Records</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "#ffffff" }}>{sales.length.toLocaleString()}</p>
        </div>
        <div className={glass("default", "blue", "p-4")}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#7AB8E8" }}>Total Revenue</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "#ffffff" }}>{formatUSD(totalRevenue)}</p>
        </div>
        <div className={glass("default", "none", "p-4")}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(184,212,240,0.6)" }}>Avg Deal</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "#ffffff" }}>{formatUSD(avgDeal)}</p>
        </div>
      </div>

      {/* Table */}
      <div className={glass("default", "none", "p-0 overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs uppercase tracking-wider"
                style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
              >
                <th className="text-left py-3 pl-5 pr-3 w-8"></th>
                <th className="text-left py-3 px-3">Date</th>
                <th className="text-left py-3 px-3">Invoice</th>
                <th className="text-left py-3 px-3">Program</th>
                <th className="text-left py-3 px-3">Sales Rep</th>
                <th className="text-right py-3 px-3">Amount</th>
                <th className="text-left py-3 pl-3 pr-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((sale) => {
                const isOpen = expandedId === sale.id;
                const lead = leadByAgent.get(sale.lead_agent ?? "")?.[0];
                return (
                  <>
                    <tr
                      key={sale.id}
                      onClick={() => setExpandedId(isOpen ? null : sale.id)}
                      style={{
                        borderBottom: "1px solid rgba(184,212,240,0.08)",
                        background: isOpen ? "rgba(91, 163, 232, 0.05)" : "transparent",
                        cursor: "pointer",
                      }}
                      className="hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="py-3 pl-5 pr-3">
                        {isOpen ? (
                          <ChevronDown size={14} color="#5BA3E8" />
                        ) : (
                          <ChevronRight size={14} color="rgba(184,212,240,0.55)" />
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                        {sale.sale_date ? format(new Date(sale.sale_date), "d MMM yyyy") : "-"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-xs" style={{ color: "rgba(184,212,240,0.7)" }}>
                        {sale.stripe_invoice_id ?? `#${sale.unit_number}`}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium" style={{ color: "#ffffff" }}>
                        {sale.development}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                        {sale.lead_agent ?? "-"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap tabular-nums font-semibold" style={{ color: "#5BA3E8" }}>
                        {formatUSD(sale.deal_amount ?? sale.sale_price ?? 0)}
                      </td>
                      <td className="py-3 pl-3 pr-5 whitespace-nowrap">
                        <span
                          className="inline-block text-[10px] px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{
                            background:
                              sale.stripe_status === "succeeded" ? "rgba(122, 212, 162, 0.15)" :
                              sale.stripe_status === "refunded"  ? "rgba(240, 184, 112, 0.15)" :
                              "rgba(184, 212, 240, 0.1)",
                            color:
                              sale.stripe_status === "succeeded" ? "#7AD4A2" :
                              sale.stripe_status === "refunded"  ? "#F0B870" :
                              "rgba(184,212,240,0.75)",
                          }}
                        >
                          {sale.stripe_status ?? "succeeded"}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr style={{ borderBottom: "1px solid rgba(184,212,240,0.12)" }}>
                        <td colSpan={7} className="py-4 px-5" style={{ background: "rgba(15, 25, 50, 0.35)" }}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Deal</p>
                              <p style={{ color: "#ffffff" }}>{sale.development}</p>
                              <p className="mt-1" style={{ color: "rgba(184,212,240,0.65)" }}>
                                Closed {sale.sale_date ? format(new Date(sale.sale_date), "d MMMM yyyy") : "-"}
                              </p>
                              <p style={{ color: "rgba(184,212,240,0.65)" }}>
                                Source channel: {sale.source ?? "Unknown"}
                              </p>
                              {sale.source_campaign && (
                                <p style={{ color: "rgba(184,212,240,0.65)" }}>
                                  Campaign: {sale.source_campaign}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Sales credit</p>
                              <p style={{ color: "#ffffff" }}>Lead: {sale.lead_agent ?? "-"}</p>
                              {sale.co_agent_1 && (
                                <p style={{ color: "rgba(184,212,240,0.7)" }}>Co: {sale.co_agent_1}</p>
                              )}
                              {sale.is_external && (
                                <p className="mt-1" style={{ color: "#F0B870" }}>External channel partner deal</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Stripe</p>
                              <p className="font-mono text-xs" style={{ color: "#ffffff" }}>
                                {sale.stripe_invoice_id ?? "-"}
                              </p>
                              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "#5BA3E8" }}>
                                {formatUSD(sale.deal_amount ?? sale.sale_price ?? 0)}
                              </p>
                              <p style={{ color: "rgba(184,212,240,0.55)" }}>
                                {sale.stripe_status ?? "succeeded"} - USD
                              </p>
                            </div>
                          </div>
                          {lead && (
                            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(184,212,240,0.12)" }}>
                              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(184,212,240,0.55)" }}>
                                Lead context (most recent for this rep)
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs" style={{ color: "rgba(184,212,240,0.75)" }}>
                                <div>
                                  <p style={{ color: "rgba(184,212,240,0.5)" }}>Name</p>
                                  <p style={{ color: "#ffffff" }}>{lead.display_name ?? "-"}</p>
                                </div>
                                <div>
                                  <p style={{ color: "rgba(184,212,240,0.5)" }}>HubSpot ID</p>
                                  <p className="font-mono">{lead.hubspot_id ?? "-"}</p>
                                </div>
                                <div>
                                  <p style={{ color: "rgba(184,212,240,0.5)" }}>Stage</p>
                                  <p>{lead.stage ?? "-"}</p>
                                </div>
                                <div>
                                  <p style={{ color: "rgba(184,212,240,0.5)" }}>Qualification</p>
                                  <p>{lead.qualification_status ?? "-"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: "rgba(184,212,240,0.55)" }}>
                    No records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(184,212,240,0.15)" }}
          >
            <p className="text-xs" style={{ color: "rgba(184,212,240,0.55)" }}>
              Page {page + 1} of {totalPages} - {sales.length.toLocaleString()} total
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
}
