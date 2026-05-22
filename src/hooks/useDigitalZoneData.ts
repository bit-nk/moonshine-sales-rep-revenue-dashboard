import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { DevelopmentData } from "@/data/marketingData";
import type { ChannelData } from "@/data/channelData";
import type { SearchQueryData } from "@/data/searchQueryData";
import type { LocationData } from "@/data/geographicData";
import {
  STUB_AD_GROUPS,
  STUB_CAMPAIGNS,
  STUB_SEARCH_TERMS,
  STUB_GEOGRAPHIC,
  filterByDateRange,
} from "@/data/stubData";

// =============================================================================
// Types
// =============================================================================

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DashboardConfig {
  title: string;
  subtitle: string;
  dateRange: string;
  budgetInsight: string;
  developments: Record<string, { category: string; status: string; notes: string }>;
  budgetItems: { label: string; dailyBudget: number; monthlyEstimate: number }[];
}

// =============================================================================
// Constants
// =============================================================================

const DEV_CATEGORIES: Record<string, "primary" | "resale" | "awareness"> = {
  "38 on 1st":  "primary",
  "59 East Hertford":"primary",
  "25 St Audley":  "resale",
  "2 Westbourne":  "resale",
  "42 Lakeshore":  "resale",
  "40 Sutherland":  "awareness",
  "40 Brighton":  "awareness",
  "29 Brighton":  "awareness",
};

const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  Downtown:  { x: 62, y: 42 },
  "Metro Center": { x: 48, y: 55 },
  Hillside:  { x: 56, y: 36 },
  Westfield:  { x: 44, y: 70 },
  Northgate:  { x: 50, y: 30 },
  Lakeside:  { x: 55, y: 50 },
  Riverside:  { x: 45, y: 45 },
};

const BUDGET_ITEMS = [
  { label: "Meta Ads",       dailyBudget: 1850, monthlyEstimate: 55500 },
  { label: "Google Ads",     dailyBudget:  780, monthlyEstimate: 23400 },
  { label: "Webinar Promo",  dailyBudget:  260, monthlyEstimate:  7800 },
  { label: "Outbound Tools", dailyBudget:  150, monthlyEstimate:  4500 },
];

const BUDGET_INSIGHT =
  "Year-to-date spend is concentrated on performance-moonshine activity via Google Search, " +
  "with a growing investment in awareness to support future demand.";

// =============================================================================
// Helpers
// =============================================================================

function devCategory(name: string): "primary" | "resale" | "awareness" {
  return DEV_CATEGORIES[name] ?? "awareness";
}

function devNotes(category: "primary" | "resale" | "awareness"): string {
  if (category === "primary") return "Primary demand driver";
  if (category === "resale") return "Opportunistic resale";
  return "Awareness phase";
}

function classifySearchTerm(query: string): {
  queryType: "Branded" | "Generic High Intent";
  area: string;
  insight: string;
} {
  const lower = query.toLowerCase();
  const brandedNames = [
  "25 st audley", "59 east hertford", "38 on 1st",
  "29 brighton", "42 lakeshore", "40 sutherland",
  "2 westbourne", "40 brighton",
  ];
  const isBranded = brandedNames.some((name) => lower.includes(name));
  const area = lower.includes("downtown")  ? "Downtown"
  : lower.includes("hillside")  ? "Hillside"
  : lower.includes("westfield")  ? "Westfield"
  : lower.includes("metro center")  ? "Metro Center"
  : "Other";
  return {
  queryType: isBranded ? "Branded" : "Generic High Intent",
  area,
  insight: isBranded ? "Branded development search" : "High-intent category search",
  };
}

function dateRangeKey(dateRange?: DateRange): string {
  return `${dateRange?.from?.getTime() ?? ""}_${dateRange?.to?.getTime() ?? ""}`;
}

// =============================================================================
// Local stub data readers (replace Supabase queries)
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAdGroups(dateRange?: DateRange): Promise<any[]> {
  return filterByDateRange(STUB_AD_GROUPS, dateRange);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCampaigns(dateRange?: DateRange): Promise<any[]> {
  return filterByDateRange(STUB_CAMPAIGNS, dateRange);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSearchTerms(dateRange?: DateRange): Promise<any[]> {
  return filterByDateRange(STUB_SEARCH_TERMS, dateRange);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGeographic(dateRange?: DateRange): Promise<any[]> {
  return filterByDateRange(STUB_GEOGRAPHIC, dateRange);
}

// =============================================================================
// Aggregation functions
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateAdGroups(rows: any[]): DevelopmentData[] {
  const devMap = new Map<string, { spend: number; conversions: number }>();
  for (const row of rows) {
  const adGroup: string = row.ad_group ?? "";
  if (!adGroup) continue;
  const development = adGroup
  .replace(/\s*-\s*Search$/i, "")
  .replace(/\s*-\s*Display$/i, "")
  .trim();
  if (!development) continue;
  const existing = devMap.get(development) ?? { spend: 0, conversions: 0 };
  existing.spend  += Number(row.cost_zar  ?? 0);
  existing.conversions += Number(row.conversions ?? 0);
  devMap.set(development, existing);
  }
  return Array.from(devMap.entries())
  .map(([development, totals]) => {
  const category = devCategory(development);
  return {
  development,
  channel: "Google Search",
  spend:  Math.round(totals.spend  * 100) / 100,
  conversions:  Math.round(totals.conversions * 100) / 100,
  costPerConversion: totals.conversions > 0
  ? Math.round((totals.spend / totals.conversions) * 100) / 100
  : null,
  notes:  devNotes(category),
  category,
  };
  })
  .sort((a, b) => b.spend - a.spend);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateCampaigns(rows: any[]): ChannelData[] {
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0;
  for (const row of rows) {
    totalSpend       += Number(row.cost_zar    ?? 0);
    totalImpressions += Number(row.impressions ?? 0);
    totalClicks      += Number(row.clicks      ?? 0);
    totalConversions += Number(row.conversions ?? 0);
  }
  // Break the ad-row totals across the paid channels with the same multipliers
  // getChannelPerformance() uses, so the Investment Strategy and Channel
  // Performance panels agree on the numbers.
  const mix: { channel: string; m: number; role: "capture" | "creation"; desc: string }[] = [
    { channel: "Meta Ads",   m: 1.00, role: "capture",  desc: "Primary paid social channel - drives in-platform lead forms, captures high-intent demand and feeds the Stripe revenue funnel." },
    { channel: "Google Ads", m: 0.42, role: "capture",  desc: "Search intent capture across branded and high-intent generic terms." },
    { channel: "Webinar",    m: 0.14, role: "creation", desc: "Paid webinar promotion - top-of-funnel demand generation for nurture sequences." },
    { channel: "Outbound",   m: 0.08, role: "creation", desc: "SDR tooling & outreach licensing - rep-moonshine lead creation." },
  ];
  return mix.map(({ channel, m, role, desc }) => ({
    channel,
    spend: Math.round(totalSpend * m * 100) / 100,
    role,
    roleDescription: desc,
    metrics: [
      { label: "Impressions",           value: Math.round(totalImpressions * m) },
      { label: "Interactions (Clicks)", value: Math.round(totalClicks * m) },
      { label: "Conversions",           value: Math.round(totalConversions * m * 100) / 100 },
    ],
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateSearchTerms(rows: any[]): SearchQueryData[] {
  const termMap = new Map<string, { spend: number; conversions: number }>();
  for (const row of rows) {
  const searchTerm: string = row.search_term ?? "";
  if (!searchTerm) continue;
  const existing = termMap.get(searchTerm) ?? { spend: 0, conversions: 0 };
  existing.spend  += Number(row.cost_zar  ?? 0);
  existing.conversions += Number(row.conversions ?? 0);
  termMap.set(searchTerm, existing);
  }
  return Array.from(termMap.entries())
  .map(([query, totals]) => {
  const { queryType, area, insight } = classifySearchTerm(query);
  return {
  query,
  queryType,
  spend:  Math.round(totals.spend  * 100) / 100,
  conversions: Math.round(totals.conversions * 100) / 100,
  area,
  insight,
  };
  })
  .sort((a, b) => b.spend - a.spend);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateGeographic(rows: any[]): LocationData[] {
  const cityMap = new Map<string, number>();
  for (const row of rows) {
  const city: string = row.city ?? "";
  if (!city) continue;
  cityMap.set(city, (cityMap.get(city) ?? 0) + Number(row.conversions ?? 0));
  }
  return Array.from(cityMap.entries())
  .map(([name, conversions]) => ({
  name,
  region:  "Metro Area",
  conversions: Math.round(conversions * 100) / 100,
  coordinates: CITY_COORDINATES[name] ?? { x: 50, y: 50 },
  }))
  .sort((a, b) => b.conversions - a.conversions);
}

// Converts Supabase ad_groups rows → Record<string,string>[] that
// CostPerConversionTrend expects (same column names as the old Google Sheet CSV).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRawCampaignRows(rows: any[]): Record<string, string>[] {
  return rows.map((row) => ({
  Date:  String(row.date  ?? ""),
  "Ad Group":  String(row.ad_group  ?? ""),
  "Cost (USD)":  String(row.cost_zar  ?? "0"),
  Conversions:  String(row.conversions ?? "0"),
  Impressions:  String(row.impressions ?? "0"),
  Clicks:  String(row.clicks  ?? "0"),
  }));
}

// Converts Supabase campaigns rows → Record<string,string>[] that
// ImpressionSharePanel expects.
// Impression-share values are stored as decimals (0.XX)  -  multiply × 100 and
// append "%" so the component's parsePercent() function works correctly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRawCampaignCRows(rows: any[]): Record<string, string>[] {
  return rows.map((row) => {
  const pct = (v: unknown) =>
  v != null ? `${(Number(v) * 100).toFixed(1)}%` : "";
  return {
  Date:  String(row.date ?? ""),
  "Search Impr. Share":  pct(row.search_impr_share),
  "Search Lost IS (Budget)":pct(row.search_lost_is_budget),
  "Search Lost IS (Rank)":  pct(row.search_lost_is_rank),
  Impressions:  String(row.impressions ?? "0"),
  };
  });
}

// =============================================================================
// Private base query hooks (shared React Query cache across derived hooks)
// =============================================================================

function useAdGroupsQuery(dateRange?: DateRange) {
  return useQuery({
  queryKey: ["dz", "adGroups", dateRangeKey(dateRange)],
  queryFn:  () => fetchAdGroups(dateRange),
  staleTime: 5 * 60 * 1000,
  retry: 2,
  });
}

function useCampaignsQuery(dateRange?: DateRange) {
  return useQuery({
  queryKey: ["dz", "campaigns", dateRangeKey(dateRange)],
  queryFn:  () => fetchCampaigns(dateRange),
  staleTime: 5 * 60 * 1000,
  retry: 2,
  });
}

// =============================================================================
// Exported hooks  -  read from local stub data (no backend)
// =============================================================================

// ─── useDataDateRange ─────────────────────────────────────────────────────────
export function useDataDateRange() {
  const query = useQuery({
  queryKey: ["dz", "dateRange"],
  queryFn: async () => {
  if (STUB_CAMPAIGNS.length === 0) {
  return { min: undefined as Date | undefined, max: undefined as Date | undefined };
  }
  const dates = STUB_CAMPAIGNS.map((r) => new Date(r.date));
  dates.sort((a, b) => a.getTime() - b.getTime());
  return { min: dates[0], max: dates[dates.length - 1] };
  },
  staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
  if (!query.data) {
  return {
  min:  undefined as Date | undefined,
  max:  undefined as Date | undefined,
  formatted: "",
  isLoading: query.isLoading,
  };
  }
  const { min, max } = query.data;
  const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const formatted = min && max ? `${fmt(min)}  -  ${fmt(max)}` : "";
  return { min, max, formatted, isLoading: false };
  }, [query.data, query.isLoading]);
}

// ─── useMarketingData ─────────────────────────────────────────────────────────
export function useMarketingData(dateRange?: DateRange) {
  const q = useAdGroupsQuery(dateRange);
  return useMemo(
  () => ({
  data:  q.isLoading ? ([] as DevelopmentData[]) : aggregateAdGroups(q.data ?? []),
  isLoading: q.isLoading,
  error:  q.error as Error | null,
  refetch:  q.refetch,
  }),
  [q.data, q.isLoading, q.error, q.refetch]
  );
}

// ─── useChannelData ───────────────────────────────────────────────────────────
export function useChannelData(dateRange?: DateRange) {
  const q = useCampaignsQuery(dateRange);
  return useMemo(
  () => ({
  data:  q.isLoading ? ([] as ChannelData[]) : aggregateCampaigns(q.data ?? []),
  isLoading: q.isLoading,
  error:  q.error as Error | null,
  refetch:  q.refetch,
  }),
  [q.data, q.isLoading, q.error, q.refetch]
  );
}

// ─── useSearchQueryData ───────────────────────────────────────────────────────
export function useSearchQueryData(dateRange?: DateRange) {
  const q = useQuery({
  queryKey: ["dz", "searchTerms", dateRangeKey(dateRange)],
  queryFn:  () => fetchSearchTerms(dateRange),
  staleTime: 5 * 60 * 1000,
  retry: 2,
  });
  return useMemo(
  () => ({
  data:  q.isLoading ? ([] as SearchQueryData[]) : aggregateSearchTerms(q.data ?? []),
  isLoading: q.isLoading,
  error:  q.error as Error | null,
  refetch:  q.refetch,
  }),
  [q.data, q.isLoading, q.error, q.refetch]
  );
}

// ─── useGeographicData ────────────────────────────────────────────────────────
export function useGeographicData(dateRange?: DateRange) {
  const q = useQuery({
  queryKey: ["dz", "geographic", dateRangeKey(dateRange)],
  queryFn:  () => fetchGeographic(dateRange),
  staleTime: 5 * 60 * 1000,
  retry: 2,
  });
  return useMemo(
  () => ({
  data:  q.isLoading ? ([] as LocationData[]) : aggregateGeographic(q.data ?? []),
  isLoading: q.isLoading,
  error:  q.error as Error | null,
  refetch:  q.refetch,
  }),
  [q.data, q.isLoading, q.error, q.refetch]
  );
}

// ─── useRawCampaignRows (for CostPerConversionTrend) ─────────────────────────
// Shares the same React Query cache as useMarketingData  -  no extra network request.
export function useRawCampaignRows(dateRange?: DateRange) {
  const q = useAdGroupsQuery(dateRange);
  return useMemo(
  () => ({
  rows:  q.isLoading || !q.data ? ([] as Record<string, string>[]) : toRawCampaignRows(q.data),
  isLoading: q.isLoading,
  }),
  [q.data, q.isLoading]
  );
}

// ─── useRawCampaignCRows (for ImpressionSharePanel) ──────────────────────────
// Shares the same React Query cache as useChannelData  -  no extra network request.
export function useRawCampaignCRows(dateRange?: DateRange) {
  const q = useCampaignsQuery(dateRange);
  return useMemo(
  () => ({
  rows:  q.isLoading || !q.data ? ([] as Record<string, string>[]) : toRawCampaignCRows(q.data),
  isLoading: q.isLoading,
  }),
  [q.data, q.isLoading]
  );
}

// ─── useDashboardConfig ───────────────────────────────────────────────────────
// No equivalent in Supabase  -  returns hardcoded config. staleTime: Infinity
// means React Query will never re-fetch this.
export function useDashboardConfig() {
  return useQuery({
  queryKey: ["dz", "config"],
  queryFn: (): DashboardConfig => ({
  title:  "Marketing Performance Overview",
  subtitle: "Year-to-Date 2026",
  dateRange: "",
  budgetInsight: BUDGET_INSIGHT,
  developments: Object.fromEntries(
  Object.entries(DEV_CATEGORIES).map(([name, category]) => [
  name,
  { category, status: "active", notes: devNotes(category) },
  ])
  ),
  budgetItems: BUDGET_ITEMS,
  }),
  staleTime: Infinity,
  });
}

// ─── useImpressionShareAlert ──────────────────────────────────────────────────
// Averages search_lost_is_budget over the 7 most recent days in the data.
// Returns lostToBudget as a percentage (0 - 100), e.g. 52.9.
export function useImpressionShareAlert() {
  return useQuery({
  queryKey: ["dz", "imprShareAlert"],
  queryFn: async (): Promise<number | null> => {
  if (STUB_CAMPAIGNS.length === 0) return null;
  const sorted = [...STUB_CAMPAIGNS].sort((a, b) => (a.date < b.date ? 1 : -1));
  const maxDate = new Date(sorted[0].date);
  const cutoff = new Date(maxDate);
  cutoff.setDate(cutoff.getDate() - 6);
  const values = sorted
  .filter((r) => new Date(r.date) >= cutoff)
  .map((r) => Number(r.search_lost_is_budget))
  .filter((v) => !isNaN(v) && v >= 0);
  if (values.length === 0) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 1000) / 10;
  },
  staleTime: 5 * 60 * 1000,
  });
}
