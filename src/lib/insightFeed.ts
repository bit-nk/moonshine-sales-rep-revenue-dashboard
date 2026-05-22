// Computes the "market intel" ad-revenue insight strings displayed in
// the dashboard tickers, moonshine by the local stub data so the numbers
// stay consistent with the rest of the UI.

import {
  STUB_AD_GROUPS,
  STUB_CALLS,
  STUB_LEADS,
  STUB_NETSWEEP_SIGNALS,
  STUB_SALES,
  getChannelPerformance,
} from "@/data/stubData";

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const formatK = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000)     return `$${(value / 1_000).toFixed(1)}k`;
  return formatUSD(value);
};

function computeInsights(): string[] {
  const metaSpend       = STUB_AD_GROUPS.reduce((s, r) => s + r.cost_zar, 0);
  const metaConversions = STUB_AD_GROUPS.reduce((s, r) => s + r.conversions, 0);
  const metaCPL         = metaConversions > 0 ? metaSpend / metaConversions : 0;

  const activeLeads = STUB_LEADS.filter((l) => l.status !== "Closed").length;
  const pipelineValue = STUB_LEADS
    .filter((l) => l.status !== "Closed")
    .reduce((s, l) => s + (l.deal_value ?? 0), 0);

  const closedWonLeads = STUB_LEADS.filter((l) => l.stage === "Closed Won").length;
  const revenue = STUB_SALES
    .filter((s) => s.stripe_status !== "refunded")
    .reduce((s, sale) => s + (sale.deal_amount ?? sale.sale_price ?? 0), 0);

  const tierA = STUB_NETSWEEP_SIGNALS.filter((s) => s.credit_tier === "A").length;
  const qualified = STUB_NETSWEEP_SIGNALS.filter((s) => s.qualification_status === "Qualified").length;

  const connectedCalls = STUB_CALLS.filter(
    (c) => c.outcome === "Connected" || c.outcome === "Demo Booked",
  ).length;
  const connectRate = STUB_CALLS.length > 0 ? (connectedCalls / STUB_CALLS.length) * 100 : 0;
  const demosBooked = STUB_CALLS.filter((c) => c.outcome === "Demo Booked").length;

  const channels = getChannelPerformance();
  const metaChan = channels.find((c) => c.channel === "Meta Ads");
  const googleChan = channels.find((c) => c.channel === "Google Ads");
  const topROAS = channels.filter((c) => c.roas != null).sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))[0];

  return [
    `Meta Ads burned ${formatK(metaSpend)} this period - ${Math.round(metaConversions).toLocaleString()} leads at ${formatUSD(metaCPL)} CPL`,
    `Stripe attributed ${formatK(revenue)} in revenue across ${closedWonLeads.toLocaleString()} closed-won deals`,
    `HubSpot pipeline holds ${formatK(pipelineValue)} of active opportunity across ${activeLeads.toLocaleString()} open leads`,
    `Dialer connect rate at ${connectRate.toFixed(1)}% - ${demosBooked.toLocaleString()} demos booked this period`,
    `NetSweep flagged ${tierA.toLocaleString()} tier-A leads (${qualified.toLocaleString()} qualified) - priority queue for closers`,
    topROAS
      ? `Top ROAS channel: ${topROAS.channel} at ${topROAS.roas!.toFixed(2)}x on ${formatK(topROAS.spend)} spend`
      : `Channel ROAS calculations pending sufficient revenue volume`,
    metaChan && googleChan
      ? `Meta vs Google: CPL ${formatUSD(metaChan.costPerLead ?? 0)} vs ${formatUSD(googleChan.costPerLead ?? 0)} - paid channels delivering at parity`
      : `Paid-search and Meta channels actively syncing`,
    `Ad-attributed share of revenue trending toward ${Math.round((channels.filter((c) => ["Meta Ads", "Google Ads", "Webinar"].includes(c.channel)).reduce((s, c) => s + c.revenue, 0) / Math.max(1, revenue)) * 100)}% - paid-media engine compounding`,
  ];
}

// Computed once at module load - the stub data is deterministic so this is
// stable across renders.
export const INSIGHT_FEED: string[] = computeInsights();
