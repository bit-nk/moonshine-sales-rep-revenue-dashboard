import { useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Users, Megaphone, PhoneCall, ShieldCheck, CreditCard, Moon, TrendingUp, TrendingDown } from "lucide-react";
import AppShell from "@/components/moonlit/AppShell";
import { glass } from "@/lib/glassStyles";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useSalesData } from "@/hooks/useSalesData";
import {
  STUB_CALLS,
  STUB_NETSWEEP_SIGNALS,
  STUB_STRIPE_EVENTS,
  STUB_AD_GROUPS,
  getChannelPerformance,
} from "@/data/stubData";
import ConnectorTile from "@/components/crm/ConnectorTile";
import HubSpotDetail from "@/components/crm/HubSpotDetail";
import MetaAdsDetail from "@/components/crm/MetaAdsDetail";
import StripeDetail from "@/components/crm/StripeDetail";
import Dialer from "./Dialer";
import NetSweep from "./NetSweep";

type Connector = "hubspot" | "meta" | "stripe" | "dialer" | "netsweep";
const VALID_CONNECTORS: Connector[] = ["hubspot", "meta", "stripe", "dialer", "netsweep"];

const CONNECTOR_LABELS: Record<Connector, string> = {
  hubspot:  "HubSpot",
  meta:     "Meta Ads",
  stripe:   "Stripe",
  dialer:   "Dialer",
  netsweep: "NetSweep",
};

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const Home = () => {
  const { data: leads = [] } = useLeadsData();
  const { data: sales = [] } = useSalesData();
  // Store active connector in URL so navigating to "/" via the sidebar or
  // MOONSHINE brand naturally resets the view back to the tile grid.
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("c");
  const activeConnector: Connector | null = raw && (VALID_CONNECTORS as string[]).includes(raw) ? (raw as Connector) : null;
  const savedScrollRef = useRef(0);

  const openConnector = useCallback((c: Connector) => {
    savedScrollRef.current = window.scrollY;
    setSearchParams({ c });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }, [setSearchParams]);

  const backToOverview = useCallback(() => {
    setSearchParams({});
    requestAnimationFrame(() => window.scrollTo({ top: savedScrollRef.current, behavior: "auto" }));
  }, [setSearchParams]);

  // If the user navigates back to "/" via the sidebar while a connector is
  // open, the URL clears but if they re-open the same tile we want a fresh
  // scroll position - reset on every activeConnector change.
  useEffect(() => {
    if (activeConnector) window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeConnector]);

  const totalLeads = leads.length;

  const pipelineValue = useMemo(
    () =>
      leads
        .filter((l) => l.status !== "Closed")
        .reduce((sum, l) => sum + (l.deal_value ?? 0), 0),
    [leads],
  );

  const mtdRevenue = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);
    return sales
      .filter((s) => s.stripe_status !== "refunded")
      .filter((s) => s.sale_date && new Date(s.sale_date) >= cutoff)
      .reduce((sum, s) => sum + (s.deal_amount ?? s.sale_price ?? 0), 0);
  }, [sales]);

  const winRate = useMemo(() => {
    const won = leads.filter((l) => l.stage === "Closed Won").length;
    const lost = leads.filter((l) => l.stage === "Closed Lost").length;
    return won + lost > 0 ? (won / (won + lost)) * 100 : 0;
  }, [leads]);

  const hubspotStats = useMemo(() => {
    const active = leads.filter((l) => l.status !== "Closed").length;
    const newThisWeek = leads.filter((l) => {
      const d = l.created_at ? new Date(l.created_at) : null;
      if (!d) return false;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return d >= cutoff;
    }).length;
    return { active, newThisWeek };
  }, [leads]);

  const metaStats = useMemo(() => {
    const spend = STUB_AD_GROUPS.reduce((s, r) => s + r.cost_zar, 0);
    const conversions = STUB_AD_GROUPS.reduce((s, r) => s + r.conversions, 0);
    const cpl = conversions > 0 ? spend / conversions : 0;
    return { spend, conversions, cpl };
  }, []);

  const dialerStats = useMemo(() => {
    const connected = STUB_CALLS.filter(
      (c) => c.outcome === "Connected" || c.outcome === "Demo Booked",
    ).length;
    const connectRate = STUB_CALLS.length > 0 ? (connected / STUB_CALLS.length) * 100 : 0;
    const last7 = STUB_CALLS.filter((c) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return new Date(c.call_at) >= cutoff;
    }).length;
    return { totalCalls: STUB_CALLS.length, connectRate, last7 };
  }, []);

  const netSweepStats = useMemo(() => {
    const qualified = STUB_NETSWEEP_SIGNALS.filter((s) => s.qualification_status === "Qualified").length;
    const qualifiedPct =
      STUB_NETSWEEP_SIGNALS.length > 0 ? (qualified / STUB_NETSWEEP_SIGNALS.length) * 100 : 0;
    const tierA = STUB_NETSWEEP_SIGNALS.filter((s) => s.credit_tier === "A").length;
    return { qualified, qualifiedPct, tierA };
  }, []);

  const stripeStats = useMemo(() => {
    const succeeded = sales.filter((s) => s.stripe_status !== "refunded");
    const revenue = succeeded.reduce((sum, s) => sum + (s.deal_amount ?? s.sale_price ?? 0), 0);
    const eventsThisWeek = STUB_STRIPE_EVENTS.filter((e) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      return new Date(e.occurred_at) >= cutoff;
    }).length;
    return { revenue, deals: succeeded.length, eventsThisWeek };
  }, [sales]);

  const channelPerf = useMemo(() => getChannelPerformance(), []);
  const adChannels = new Set(["Meta Ads", "Google Ads", "Webinar"]);
  const adRevenue = channelPerf.filter((c) => adChannels.has(c.channel)).reduce((s, c) => s + c.revenue, 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // In-place drilldown into a connector's detail view. The page components
  // are themselves wrapped in <AppShell>, but AppShell is idempotent so they
  // render seamlessly inside this Home page.
  if (activeConnector) {
    const DetailComponent = ({
      hubspot:  HubSpotDetail,
      meta:     MetaAdsDetail,
      stripe:   StripeDetail,
      dialer:   Dialer,
      netsweep: NetSweep,
    } as const)[activeConnector];

    return (
      <AppShell>
        <div className="space-y-4">
          {/* Sticky toolbar so the Back button stays visible while scrolling */}
          <div
            className="sticky top-0 z-30 -mx-6 px-6 py-3 flex items-center gap-3"
            style={{
              background: "rgba(7, 10, 26, 0.78)",
              backdropFilter: "blur(14px) saturate(160%)",
              WebkitBackdropFilter: "blur(14px) saturate(160%)",
              borderBottom: "1px solid rgba(184, 212, 240, 0.12)",
            }}
          >
            <button
              type="button"
              onClick={backToOverview}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                background: "rgba(15, 25, 50, 0.65)",
                border: "1px solid rgba(91, 163, 232, 0.45)",
                color: "#E0E8F0",
                boxShadow: "0 0 14px rgba(91,163,232,0.15)",
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
              <ArrowLeft size={14} /> Back to overview
            </button>
            <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(184,212,240,0.65)" }}>
              {CONNECTOR_LABELS[activeConnector]}
            </span>
          </div>
          <DetailComponent />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#E0E8F0", textShadow: "0 0 24px rgba(91,163,232,0.35)" }}>
              Overview
            </h1>
            <p className="mt-1 text-sm flex items-center gap-2" style={{ color: "rgba(184,212,240,0.65)" }}>
              <Moon size={13} className="opacity-70" strokeWidth={1.7} />
              {today}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(184,212,240,0.55)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5BA3E8] animate-pulse" />
            Live - HubSpot, Meta Ads, Dialer, NetSweep, Stripe
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Leads",     value: totalLeads.toLocaleString(),     trend: 12.4,  Icon: Users },
            { label: "Active Pipeline", value: formatUSD(pipelineValue),        trend: 8.1,   Icon: TrendingUp, accent: true },
            { label: "MTD Revenue",     value: formatUSD(mtdRevenue),           trend: -3.2,  Icon: CreditCard },
            { label: "Win Rate",        value: `${winRate.toFixed(1)}%`,        trend: 4.6,   Icon: ShieldCheck },
          ].map((s) => (
            <div key={s.label} className={glass("default", s.accent ? "blue" : "none", "p-5")}>
              <div className="flex items-center gap-2 mb-2">
                <s.Icon size={13} strokeWidth={1.8} style={{ color: s.accent ? "#7AB8E8" : "rgba(184,212,240,0.6)" }} />
                <p className="text-[10px] uppercase tracking-widest" style={{ color: s.accent ? "#7AB8E8" : "rgba(184,212,240,0.6)" }}>
                  {s.label}
                </p>
              </div>
              <p className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: "#ffffff" }}>
                {s.value}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {s.trend >= 0 ? (
                  <TrendingUp size={11} color="#7AD4A2" strokeWidth={2} />
                ) : (
                  <TrendingDown size={11} color="#F0B870" strokeWidth={2} />
                )}
                <span className="text-[11px] tabular-nums" style={{ color: s.trend >= 0 ? "#7AD4A2" : "#F0B870" }}>
                  {s.trend > 0 ? "+" : ""}{s.trend.toFixed(1)}%
                </span>
                <span className="text-[11px]" style={{ color: "rgba(184,212,240,0.4)" }}>
                  vs prior period
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Connector tiles */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(184,212,240,0.55)" }}>
            Data Sources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ConnectorTile
              name="HubSpot"
              description="CRM - Lead pipeline & stage tracking"
              Icon={Users}
              accent="#5BA3E8"
              onClick={() => openConnector("hubspot")}
              primaryValue={totalLeads.toLocaleString()}
              primaryLabel="Leads in pipeline"
              metrics={[
                { label: "Active",        value: hubspotStats.active.toLocaleString() },
                { label: "New / 7 days",  value: hubspotStats.newThisWeek.toLocaleString() },
              ]}
            />
            <ConnectorTile
              name="Meta Ads"
              description="Paid ad ingestion - Cost per lead"
              Icon={Megaphone}
              accent="#7AB8E8"
              onClick={() => openConnector("meta")}
              primaryValue={formatUSD(metaStats.spend)}
              primaryLabel="Ad spend (period)"
              metrics={[
                { label: "Leads sourced", value: Math.round(metaStats.conversions).toLocaleString() },
                { label: "Avg CPL",       value: formatUSD(metaStats.cpl) },
              ]}
            />
            <ConnectorTile
              name="Stripe"
              description="Payments - Revenue attribution"
              Icon={CreditCard}
              accent="#9CB8E8"
              onClick={() => openConnector("stripe")}
              primaryValue={formatUSD(stripeStats.revenue)}
              primaryLabel="Total revenue"
              metrics={[
                { label: "Closed deals",     value: stripeStats.deals.toLocaleString() },
                { label: "Events / 7 days",  value: stripeStats.eventsThisWeek.toLocaleString() },
              ]}
            />
            <ConnectorTile
              name="Dialer"
              description="Outbound & inbound call activity"
              Icon={PhoneCall}
              accent="#B8D4F0"
              onClick={() => openConnector("dialer")}
              primaryValue={dialerStats.totalCalls.toLocaleString()}
              primaryLabel="Total calls"
              metrics={[
                { label: "Connect rate", value: `${dialerStats.connectRate.toFixed(1)}%` },
                { label: "Last 7 days",  value: dialerStats.last7.toLocaleString() },
              ]}
            />
            <ConnectorTile
              name="NetSweep"
              description="Financial qualification signals"
              Icon={ShieldCheck}
              accent="#E0E8F0"
              onClick={() => openConnector("netsweep")}
              primaryValue={`${netSweepStats.qualifiedPct.toFixed(1)}%`}
              primaryLabel="Lead qualification rate"
              metrics={[
                { label: "Qualified",   value: netSweepStats.qualified.toLocaleString() },
                { label: "Tier-A leads", value: netSweepStats.tierA.toLocaleString() },
              ]}
            />
          </div>
        </div>

        {/* Revenue attribution card */}
        <div className={glass("default", "none", "p-6")}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
              Revenue Attribution
            </h2>
            <span className="text-xs" style={{ color: "rgba(184,212,240,0.5)" }}>
              Drill into Revenue Funnel for the full breakdown
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="px-4 py-3 rounded-lg"
              style={{
                background: "rgba(91, 163, 232, 0.08)",
                border: "1px solid rgba(91, 163, 232, 0.40)",
              }}
            >
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#5BA3E8" }}>
                Ad-Attributed Revenue
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#ffffff" }}>
                {formatUSD(adRevenue)}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.55)" }}>
                Meta, Google, Webinar
              </p>
            </div>
            <div
              className="px-4 py-3 rounded-lg"
              style={{
                background: "rgba(184, 212, 240, 0.06)",
                border: "1px solid rgba(184, 212, 240, 0.25)",
              }}
            >
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#B8D4F0" }}>
                Sales-Rep Generated Revenue
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#ffffff" }}>
                {formatUSD(stripeStats.revenue - adRevenue)}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(184,212,240,0.55)" }}>
                Outbound, Referral, Direct, Organic
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;
