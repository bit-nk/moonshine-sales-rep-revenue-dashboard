import { STUB_SALES, getRevenueBySource } from "@/data/stubData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

// Channels that count as "Ad-Attributed" (paid media)
const AD_CHANNELS = new Set(["Meta Ads", "Google Ads", "Webinar"]);
// All other channels are considered Sales-Rep moonshine (outbound, referral, direct, organic)

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function RevenueAttributionCard() {
  const bySource = getRevenueBySource();
  const adRevenue = bySource.filter((b) => AD_CHANNELS.has(b.source)).reduce((s, b) => s + b.revenue, 0);
  const repRevenue = bySource.filter((b) => !AD_CHANNELS.has(b.source)).reduce((s, b) => s + b.revenue, 0);
  const adDeals = bySource.filter((b) => AD_CHANNELS.has(b.source)).reduce((s, b) => s + b.deals, 0);
  const repDeals = bySource.filter((b) => !AD_CHANNELS.has(b.source)).reduce((s, b) => s + b.deals, 0);

  // Compute Meta spend for ROAS (paid channels only)
  const totalDeals = STUB_SALES.filter((s) => s.stripe_status !== "refunded").length;
  const adShare = totalDeals > 0 ? (adDeals / totalDeals) * 100 : 0;
  const repShare = totalDeals > 0 ? (repDeals / totalDeals) * 100 : 0;

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h2 className="text-lg font-semibold mb-1" style={{ color: "#ffffff" }}>
        Revenue Attribution
      </h2>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
        Ad-moonshine revenue (Meta · Google · Webinar) vs. Sales-Rep generated revenue (Outbound · Referral · Direct · Organic)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ad-Attributed */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(0, 180, 166, 0.08)",
            border: "1px solid rgba(0, 180, 166, 0.45)",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#00B4A6" }}>
            Ad-Attributed Revenue
          </p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "#ffffff" }}>
            {formatUSD(adRevenue)}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {adDeals} deals · {adShare.toFixed(1)}% of total deals
          </p>
          <div className="mt-3 space-y-1.5">
            {bySource
              .filter((b) => AD_CHANNELS.has(b.source))
              .map((b) => (
                <div key={b.source} className="flex items-center justify-between text-xs">
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>{b.source}</span>
                  <span className="tabular-nums font-medium" style={{ color: "#ffffff" }}>
                    {formatUSD(b.revenue)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Rep-Generated */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(135, 127, 73, 0.08)",
            border: "1px solid rgba(135, 127, 73, 0.45)",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#877F49" }}>
            Sales-Rep Generated Revenue
          </p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "#ffffff" }}>
            {formatUSD(repRevenue)}
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {repDeals} deals · {repShare.toFixed(1)}% of total deals
          </p>
          <div className="mt-3 space-y-1.5">
            {bySource
              .filter((b) => !AD_CHANNELS.has(b.source))
              .map((b) => (
                <div key={b.source} className="flex items-center justify-between text-xs">
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>{b.source}</span>
                  <span className="tabular-nums font-medium" style={{ color: "#ffffff" }}>
                    {formatUSD(b.revenue)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
