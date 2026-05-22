import { useMemo, useState } from "react";
import { CreditCard, DollarSign, CheckCircle2, RefreshCcw, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useSalesData } from "@/hooks/useSalesData";
import { useLeadsData } from "@/hooks/useLeadsData";
import { STUB_STRIPE_EVENTS, getMonthlyRevenueTrend } from "@/data/stubData";
import { glass } from "@/lib/glassStyles";
import SalesDrilldown from "./SalesDrilldown";

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const EVENT_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  "payment_intent.succeeded":  { color: "#7AD4A2", bg: "rgba(122,212,162,0.15)", label: "Succeeded" },
  "charge.refunded":           { color: "#EF6F5C", bg: "rgba(239,111,92,0.15)",  label: "Refunded" },
  "payment_intent.processing": { color: "#F0B870", bg: "rgba(240,184,112,0.15)", label: "Processing" },
};

export default function StripeDetail() {
  const { data: sales = [] } = useSalesData();
  const { data: leads = [] } = useLeadsData();
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const totalRevenue = sales
    .filter((s) => s.stripe_status !== "refunded")
    .reduce((sum, s) => sum + (s.deal_amount ?? s.sale_price ?? 0), 0);
  const closedDeals = sales.filter((s) => s.stripe_status !== "refunded").length;
  const refundedDeals = sales.filter((s) => s.stripe_status === "refunded").length;
  const pendingDeals = sales.filter((s) => s.stripe_status === "pending").length;

  const trend = useMemo(() => getMonthlyRevenueTrend(), []);
  const trendMax = Math.max(1, ...trend.map((t) => t.revenue));

  const recentEvents = useMemo(() => STUB_STRIPE_EVENTS.slice(0, 14), []);
  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const kpis = [
    { label: "Total Revenue", value: formatUSD(totalRevenue), Icon: DollarSign, color: "#7AD4A2" },
    { label: "Closed Deals",  value: closedDeals.toLocaleString(), Icon: CheckCircle2, color: "#5BA3E8" },
    { label: "Refunded",      value: refundedDeals.toLocaleString(), Icon: RefreshCcw, color: "#F0B870" },
    { label: "Pending",       value: pendingDeals.toLocaleString(), Icon: Clock, color: "#B8D4F0" },
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
            background: "rgba(99, 91, 255, 0.14)",
            border: "1px solid rgba(99, 91, 255, 0.45)",
          }}
        >
          <CreditCard size={22} color="#635BFF" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#E0E8F0" }}>Stripe</h1>
          <p className="text-xs" style={{ color: "rgba(184,212,240,0.55)" }}>
            Payments - revenue attribution & webhook events
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={glass("default", "none", "p-5")}>
            <div className="flex items-center gap-2 mb-2">
              <k.Icon size={14} strokeWidth={1.8} color={k.color} />
              <p className="text-[10px] uppercase tracking-widest" style={{ color: k.color }}>{k.label}</p>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "#ffffff" }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly revenue trend + Recent events */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className={glass("default", "none", "lg:col-span-2 p-6")}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>Monthly Revenue Trend</h2>
          <p className="text-xs mb-4" style={{ color: "rgba(184,212,240,0.55)" }}>Last 6 months - Stripe attributed</p>
          <div className="grid grid-cols-6 gap-2 h-44 items-end">
            {trend.map((m) => {
              const h = (m.revenue / trendMax) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1.5 h-full">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t transition-all hover:brightness-125"
                      title={`${m.month} - ${formatUSD(m.revenue)}`}
                      style={{
                        height: `${Math.max(h, 6)}%`,
                        background: "linear-gradient(180deg, rgba(99,91,255,0.85), rgba(99,91,255,0.30))",
                        border: "1px solid rgba(99,91,255,0.45)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] tabular-nums" style={{ color: "rgba(184,212,240,0.75)" }}>
                    {formatUSD(m.revenue).replace(/^\$/, "$")}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(184,212,240,0.5)" }}>{m.month}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={glass("default", "none", "lg:col-span-3 p-6")}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>Recent Stripe Events</h2>
          <p className="text-xs mb-4" style={{ color: "rgba(184,212,240,0.55)" }}>
            Last {recentEvents.length} webhook events - click any row to inspect the linked lead
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}
                >
                  <th className="text-left py-2 pr-3 w-6"></th>
                  <th className="text-left py-2 pr-3">When</th>
                  <th className="text-left py-2 px-3">Event</th>
                  <th className="text-left py-2 px-3">Lead</th>
                  <th className="text-right py-2 pl-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e) => {
                  const lead = leadById.get(e.lead_id);
                  const ev = EVENT_STYLE[e.type];
                  const isOpen = expandedEvent === e.id;
                  return (
                    <>
                      <tr
                        key={e.id}
                        onClick={() => setExpandedEvent(isOpen ? null : e.id)}
                        className="hover:bg-white/[0.04] transition-colors"
                        style={{
                          borderBottom: "1px solid rgba(184,212,240,0.08)",
                          cursor: "pointer",
                          background: isOpen ? "rgba(99, 91, 255, 0.06)" : "transparent",
                        }}
                      >
                        <td className="py-2.5 pr-3">
                          {isOpen ? <ChevronDown size={13} color="#635BFF" /> : <ChevronRight size={13} color="rgba(184,212,240,0.55)" />}
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: "rgba(184,212,240,0.85)" }}>
                          {format(new Date(e.occurred_at), "d MMM, HH:mm")}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className="inline-block text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-medium"
                            style={{ background: ev.bg, color: ev.color }}
                          >
                            {ev.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: "#ffffff" }}>
                          {lead?.display_name ?? `Lead #${e.lead_id}`}
                        </td>
                        <td className="py-2.5 pl-3 text-right whitespace-nowrap tabular-nums font-semibold" style={{ color: ev.color }}>
                          {formatUSD(e.amount)}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr style={{ borderBottom: "1px solid rgba(184,212,240,0.12)" }}>
                          <td colSpan={5} className="py-4 px-5" style={{ background: "rgba(15, 25, 50, 0.35)" }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                              <div>
                                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Event ID</p>
                                <p className="font-mono" style={{ color: "#ffffff" }}>{e.id}</p>
                                <p className="mt-2 text-[10px] uppercase tracking-widest" style={{ color: "rgba(184,212,240,0.55)" }}>Type</p>
                                <p style={{ color: "#ffffff" }}>{e.type}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Lead</p>
                                <p style={{ color: "#ffffff" }}>{lead?.display_name ?? "—"}</p>
                                <p style={{ color: "rgba(184,212,240,0.65)" }}>{lead?.email ?? ""}</p>
                                <p style={{ color: "rgba(184,212,240,0.65)" }}>Source: {lead?.source ?? "—"}</p>
                                <p style={{ color: "rgba(184,212,240,0.65)" }}>Program: {lead?.listing ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(184,212,240,0.55)" }}>Attribution</p>
                                <p style={{ color: "#ffffff" }}>Campaign: {e.campaign ?? "—"}</p>
                                <p className="text-2xl font-bold tabular-nums mt-2" style={{ color: "#635BFF" }}>{formatUSD(e.amount)}</p>
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

      {/* Full deals table - reuse SalesDrilldown without its own back button */}
      <SalesDrilldown
        title="Closed Deals"
        subtitle={`All ${sales.length.toLocaleString()} Stripe-processed deals - click a row for full deal context`}
        sales={sales}
        leads={leads}
      />
    </div>
  );
}
