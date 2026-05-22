import { useQuery } from '@tanstack/react-query';
import { startOfMonth, subDays, subMonths, subWeeks } from 'date-fns';
import { ENGAGEMENT_STATES, toEngagementState } from '@/lib/engagementStatus';
import { STUB_LEADS } from '@/data/stubData';

export type QuickFilter = 'all' | 'last_7' | 'last_30' | 'last_90' | 'this_year';

export interface Lead {
  id: number;
  // Legacy fields (still populated; semantically reinterpreted for the CRM)
  date: string | null;
  name: string | null;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;              // lead source channel (Meta Ads, Google Ads, ...)
  all_sources: string | null;
  agent: string | null;               // assigned sales agent
  listing: string | null;             // program / offer the lead is interested in
  area: string | null;                // city
  listing_address: string | null;     // US address
  propdata_listing_address: string | null;
  listing_ref: string | null;
  lead_type: string | null;
  lead_source: string | null;
  message: string | null;
  status: string | null;              // Active / Nurture / Closed
  stage: string | null;               // pipeline stage (New, Contacted, ... Closed Won)
  branch: string | null;
  lifecycle_status: string | null;
  wa_engagement_status: string | null; // outreach status
  created_at: string | null;
  // CRM-specific fields aligned with the SoW connector model
  hubspot_id?: string;
  first_name?: string;
  last_name?: string;
  assigned_agent?: string;
  source_campaign?: string | null;
  priority?: "High" | "Medium" | "Low";
  deal_value?: number;
  qualification_score?: number;       // NetSweep 0-100
  qualification_status?: "Qualified" | "Pending" | "Not Qualified";
  last_activity_at?: string;
}

export function getLifecycleBreakdown(leads: Lead[]): { name: string; value: number }[] {
  // Returns the canonical 4-state engagement breakdown, always in fixed order
  // (Not Yet Messaged → Sent → Read → Clicked) so legends read consistently.
  const counts = new Map<string, number>();
  for (const label of ENGAGEMENT_STATES) counts.set(label, 0);
  for (const l of leads) {
    const state = toEngagementState(l.wa_engagement_status);
    counts.set(state, (counts.get(state) || 0) + 1);
  }
  return ENGAGEMENT_STATES.map((name) => ({ name, value: counts.get(name) || 0 }));
}

async function fetchAllLeads(): Promise<Lead[]> {
  return STUB_LEADS;
}

export function useLeadsData() {
  return useQuery({
    queryKey: ['master_leads_v4'],
    queryFn: fetchAllLeads,
    staleTime: 5 * 60 * 1000,
  });
}

function getFilterRange(filter: QuickFilter): { from: Date; to: Date } {
  const now = new Date();
  if (filter === 'last_7') return { from: subDays(now, 7), to: now };
  if (filter === 'last_30') return { from: subDays(now, 30), to: now };
  if (filter === 'last_90') return { from: subDays(now, 90), to: now };
  if (filter === 'this_year') return { from: new Date(now.getFullYear(), 0, 1), to: now };
  return { from: new Date(0), to: now };
}

export function filterLeadsByDate(leads: Lead[], filter: QuickFilter): Lead[] {
  if (filter === 'all') return leads;
  const { from } = getFilterRange(filter);
  return leads.filter((l) => {
    const dateVal = l.created_at || l.date;
    if (!dateVal) return false;
    return new Date(dateVal) >= from;
  });
}

export function filterLeadsByPreviousPeriod(leads: Lead[], filter: QuickFilter): Lead[] {
  const now = new Date();
  let from: Date, to: Date;

  if (filter === 'last_7') {
    from = subDays(now, 14); to = subDays(now, 7);
  } else if (filter === 'last_30') {
    from = subDays(now, 60); to = subDays(now, 30);
  } else if (filter === 'last_90') {
    from = subDays(now, 180); to = subDays(now, 90);
  } else if (filter === 'this_year') {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    // Same number of days into previous year
    const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    from = prevYearStart;
    to = new Date(prevYearStart);
    to.setDate(to.getDate() + dayOfYear);
  } else {
    // 'all' - no meaningful previous period
    return [];
  }

  return leads.filter((l) => {
    const dateVal = l.created_at || l.date;
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return d >= from && d < to;
  });
}

export function getTopByCount(leads: Lead[], key: keyof Lead): { name: string; count: number } {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const val = l[key];
    if (val && typeof val === 'string' && val.trim()) {
      counts.set(val, (counts.get(val) || 0) + 1);
    }
  }
  let topName = '-';
  let topCount = 0;
  for (const [name, count] of counts) {
    if (count > topCount) {
      topName = name;
      topCount = count;
    }
  }
  return { name: topName, count: topCount };
}

export function getLeadsByAgent(leads: Lead[], limit = 10): { agent: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    if (l.agent && l.agent.trim()) {
      counts.set(l.agent, (counts.get(l.agent) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([agent, count]) => ({ agent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getLeadsBySource(leads: Lead[]): { source: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const val = l.source?.trim() || l.lead_source?.trim();
    if (val) {
      counts.set(val, (counts.get(val) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export function getLeadsThisMonth(leads: Lead[]): number {
  const cutoff = startOfMonth(new Date());
  return leads.filter((l) => { const d = l.created_at || l.date; return d && new Date(d) >= cutoff; }).length;
}

export function getLeadsThisWeek(leads: Lead[]): number {
  const cutoff = subDays(new Date(), 7);
  return leads.filter((l) => { const d = l.created_at || l.date; return d && new Date(d) >= cutoff; }).length;
}

export function getAvgLeadsPerDayThisMonth(leads: Lead[]): string {
  const now = new Date();
  const cutoff = startOfMonth(now);
  const count = leads.filter((l) => { const d = l.created_at || l.date; return d && new Date(d) >= cutoff; }).length;
  const dayOfMonth = now.getDate();
  return dayOfMonth > 0 ? (count / dayOfMonth).toFixed(1) : '0';
}

export function getLeadsLastMonth(leads: Lead[]): number {
  const now = new Date();
  const startLast = startOfMonth(subMonths(now, 1));
  const endLast = startOfMonth(now);
  return leads.filter((l) => {
    const dateVal = l.created_at || l.date;
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return d >= startLast && d < endLast;
  }).length;
}

export function getLeadsLastWeek(leads: Lead[]): number {
  const now = new Date();
  const day = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((day + 6) % 7));
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = subWeeks(thisMonday, 1);
  return leads.filter((l) => {
    const dateVal = l.created_at || l.date;
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return d >= lastMonday && d < thisMonday;
  }).length;
}

export function getAvgLeadsPerDayLastMonth(leads: Lead[]): string {
  const now = new Date();
  const startLast = startOfMonth(subMonths(now, 1));
  const endLast = startOfMonth(now);
  const count = leads.filter((l) => {
    const dateVal = l.created_at || l.date;
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return d >= startLast && d < endLast;
  }).length;
  const daysInLastMonth = Math.round((endLast.getTime() - startLast.getTime()) / (1000 * 60 * 60 * 24));
  return daysInLastMonth > 0 ? (count / daysInLastMonth).toFixed(1) : '0';
}

export function calcTrendPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
