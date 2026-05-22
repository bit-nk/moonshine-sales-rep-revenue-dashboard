import { useState, useMemo, useCallback } from "react";
import DigitalZoneBento from "@/components/report/DigitalZoneBento";
import ChannelPerformanceCard from "@/components/crm/ChannelPerformanceCard";
import { getChannelPerformance } from "@/data/stubData";
import DateRangeFilter, { type DateFilter, getDateFilterRange } from "@/components/report/DateRangeFilter";
import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/moonlit/AppShell";
import FlipClockTicker from "@/components/operations/FlipClockTicker";
import {
  useMarketingData,
  useChannelData,
  useSearchQueryData,
  useGeographicData,
  useDashboardConfig,
  useDataDateRange,
  useRawCampaignRows,
  useRawCampaignCRows,
  type DateRange,
} from "@/hooks/useDigitalZoneData";
import {
  getTotalSpend,
  getTotalConversions,
  getAverageCostPerConversion,
  getTopPerformingDevelopment,
} from "@/data/marketingData";
import { AlertCircle, RefreshCw } from "lucide-react";
import { format, differenceInMilliseconds } from "date-fns";

// ─── Shared UI helpers ─────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {[...Array(4)].map((_, i) => (
  <Skeleton key={i} className="h-28 rounded-xl" />
  ))}
  </div>
  <Skeleton className="h-80 rounded-xl" />
  <Skeleton className="h-40 rounded-xl" />
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div
  className="rounded-xl p-8 text-center space-y-4"
  style={{
  background:  "rgba(20, 20, 20, 0.72)",
  border:  "1px solid rgba(135, 127, 73, 0.45)",
  borderRadius: "16px",
  }}
  >
  <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
  <p className="font-medium" style={{ color: "#ffffff" }}>Failed to load data</p>
  <p className="text-sm"  style={{ color: "#cccccc" }}>{message}</p>
  <button
  onClick={onRetry}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
  style={{ background: "#00B4A6", color: "#ffffff" }}
  >
  <RefreshCw className="w-4 h-4" /> Retry
  </button>
  </div>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

const Index = () => {
  // Default to last 30 days so KPI change badges are meaningful on first load.
  const [dateFilter, setDateFilter] = useState<DateFilter>({
  from:  undefined,
  to:  undefined,
  quickFilter: "last_30",
  });

  const dataDateRange = useDataDateRange();
  const configQuery  = useDashboardConfig();

  // ── Current period ───────────────────────────────────────────────────────────
  const effectiveDateRange: DateRange | undefined = useMemo(() => {
  const range = getDateFilterRange(dateFilter, dataDateRange.max);
  if (!range.from && !range.to) return undefined;
  return range;
  }, [dateFilter, dataDateRange.max]);

  // ── Previous period (same duration, immediately before current) ─────────────
  // Used to compute period-over-period change percentages for KPI cards.
  const prevDateRange: DateRange | undefined = useMemo(() => {
  if (!effectiveDateRange?.from || !effectiveDateRange?.to) return undefined;
  const durationMs = differenceInMilliseconds(
  effectiveDateRange.to,
  effectiveDateRange.from,
  );
  const prevTo  = new Date(effectiveDateRange.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom, to: prevTo };
  }, [effectiveDateRange]);

  // ── Data queries ─────────────────────────────────────────────────────────────
  const marketingResult  = useMarketingData(effectiveDateRange);
  const prevMarketingResult = useMarketingData(prevDateRange);
  const channelResult  = useChannelData(effectiveDateRange);
  const searchResult  = useSearchQueryData(effectiveDateRange);
  const geoResult  = useGeographicData(effectiveDateRange);
  const rawCampaignRows  = useRawCampaignRows(effectiveDateRange);
  const rawCampaignCRows  = useRawCampaignCRows(effectiveDateRange);

  const marketingData  = marketingResult.data;
  const prevMarketingData = prevMarketingResult.data;
  const channelData  = channelResult.data;
  const searchData  = searchResult.data;
  const geoData  = geoResult.data;
  const config  = configQuery.data;

  // ── Derived display values ───────────────────────────────────────────────────
  const displayDateRange = useMemo(() => {
  if (effectiveDateRange?.from && effectiveDateRange?.to) {
  const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${fmt(effectiveDateRange.from)}  -  ${fmt(effectiveDateRange.to)}`;
  }
  return dataDateRange.formatted;
  }, [effectiveDateRange, dataDateRange.formatted]);

  const isLoading =
  marketingResult.isLoading ||
  channelResult.isLoading  ||
  searchResult.isLoading  ||
  geoResult.isLoading;

  const error =
  marketingResult.error ||
  channelResult.error  ||
  searchResult.error  ||
  geoResult.error;

  // ── Current-period KPIs ──────────────────────────────────────────────────────
  const totalSpend  = getTotalSpend(marketingData);
  const totalConversions = getTotalConversions(marketingData);
  const avgCPC  = getAverageCostPerConversion(marketingData);
  const topDevelopment  = getTopPerformingDevelopment(marketingData);

  // ── Previous-period KPIs (for change badges) ─────────────────────────────────
  const prevTotalSpend  = getTotalSpend(prevMarketingData);
  const prevTotalConversions = getTotalConversions(prevMarketingData);
  const prevAvgCPC  = getAverageCostPerConversion(prevMarketingData);

  const pctChange = useCallback((curr: number, prev: number): number => {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 100);
  }, []);

  const spendChange  = pctChange(totalSpend,  prevTotalSpend);
  const conversionsChange = pctChange(totalConversions, prevTotalConversions);
  const cpcChange  = pctChange(avgCPC,  prevAvgCPC);

  // ── Retry handler ────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
  marketingResult.refetch();
  prevMarketingResult.refetch();
  channelResult.refetch();
  searchResult.refetch();
  geoResult.refetch();
  configQuery.refetch();
  }, [
  marketingResult,
  prevMarketingResult,
  channelResult,
  searchResult,
  geoResult,
  configQuery,
  ]);

  // Total attributed revenue for the period (moonshine by channel performance)
  const totalRevenue = useMemo(() => {
    const channels = getChannelPerformance(effectiveDateRange);
    return channels.reduce((sum, c) => sum + c.revenue, 0);
  }, [effectiveDateRange]);

  // ── Bento prop bundles ───────────────────────────────────────────────────────
  const performanceData = {
  // KPI values
  totalSpend,
  totalRevenue,
  totalConversions,
  avgCPC,
  topDevelopment,
  // Period-over-period change badges (from remote branch)
  spendChange,
  conversionsChange,
  cpcChange,
  prevTotalSpend,
  prevTotalConversions,
  prevAvgCPC,
  // Chart data
  marketingData,
  channelData,
  budgetItems:  config?.budgetItems  ?? [],
  budgetInsight: config?.budgetInsight ?? "",
  dateRange:  displayDateRange,
  };

  const intelligenceData = {
  rawCampaignCRows: rawCampaignCRows.rows,
  rawCampaignRows:  rawCampaignRows.rows,
  searchData,
  geoData,
  marketingData,
  dateRange: displayDateRange,
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
  <AppShell maxWidth="max-w-6xl">
  {/* Market Intel Ticker */}
  <div className="mb-6">
  <FlipClockTicker />
  </div>

  <div>
  {/* Page header */}
  <header className="mb-8 pb-6" style={{ borderBottom: "1px solid rgba(184, 212, 240, 0.18)" }}>
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
  <h1
  className="font-extrabold tracking-tight"
  style={{
  color:  "#ffffff",
  fontFamily:  "'Inter', system-ui, -apple-system, sans-serif",
  fontSize:  "42px",
  fontVariant: "small-caps",
  }}
  >
  <span style={{ color: "#ffffff" }}>Source </span><span style={{ color: "#5BA3E8" }}>Performance</span>
  </h1>
  <div className="flex-shrink-0">
  <DateRangeFilter
  value={dateFilter}
  onChange={setDateFilter}
  dataDateRange={
  dataDateRange.min && dataDateRange.max
  ? { min: dataDateRange.min, max: dataDateRange.max }
  : undefined
  }
  />
  </div>
  </div>
  </header>

  {/* States */}
  {isLoading && <LoadingSkeleton />}

  {error && !isLoading && (
  <ErrorState message={error.message} onRetry={handleRetry} />
  )}

  {/* Channel Performance (top-line CRM view) */}
  {!isLoading && !error && (
  <div className="mb-6">
  <ChannelPerformanceCard dateRange={effectiveDateRange} />
  </div>
  )}

  {/* Bento grid  -  Performance + Intelligence tabs */}
  {!isLoading && !error && (
  <DigitalZoneBento
  performanceData={performanceData}
  intelligenceData={intelligenceData}
  />
  )}

  {/* Footer */}
  <footer
  className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2"
  style={{ borderTop: "1px solid rgba(184, 212, 240, 0.18)" }}
  >
  <p className="text-xs" style={{ color: "rgba(184, 212, 240, 0.55)" }}>
  Last updated: {dataDateRange.max ? format(dataDateRange.max, "d MMMM yyyy") : "-"}
  </p>
  </footer>
  </div>
  </AppShell>
  );
};

export default Index;
