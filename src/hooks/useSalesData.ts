import { useQuery } from '@tanstack/react-query';
import { STUB_SALES } from '@/data/stubData';

export interface SaleRow {
  id: number;
  // Legacy fields (still populated; semantically reinterpreted as a Stripe
  // payment / closed deal record)
  development: string;          // program name
  unit_number: number | null;   // synthetic invoice number
  lead_agent: string | null;    // closing agent
  co_agent_1: string | null;    // SDR / co-agent
  co_agent_2: string | null;
  is_external: boolean;         // channel-partner deals
  sale_date: string | null;     // closed_at date
  sale_price: number | null;    // deal amount (USD)
  notes: string | null;
  // CRM-specific fields aligned with the SoW connector model
  program?: string;
  stripe_invoice_id?: string;
  closer_agent?: string | null;
  closed_at?: string;
  deal_amount?: number;
  source?: string;              // lead source channel
  source_campaign?: string | null;
  stripe_status?: "succeeded" | "refunded" | "pending";
}

async function fetchAllSales(): Promise<SaleRow[]> {
  return STUB_SALES;
}

export function useSalesData() {
  return useQuery({ queryKey: ['sales_history'], queryFn: fetchAllSales, staleTime: 5 * 60 * 1000 });
}

const INACTIVE_AGENTS = new Set(['Lorna']);

export function isInactiveAgent(firstName: string): boolean {
  return INACTIVE_AGENTS.has(firstName);
}

export interface AgentSalesEntry {
  agent: string;
  count: number;
  inactive: boolean;
}

/** Leaderboard of internal agents (excludes is_external rows entirely). */
export function getAgentLeaderboard(sales: SaleRow[]): AgentSalesEntry[] {
  const counts = new Map<string, number>();
  for (const s of sales) {
    if (s.is_external) continue;
    for (const k of ['lead_agent', 'co_agent_1', 'co_agent_2'] as const) {
      const name = s[k];
      if (name && name.trim() && name !== 'External') {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
  }
  return Array.from(counts.entries())
    .map(([agent, count]) => ({ agent, count, inactive: isInactiveAgent(agent) }))
    .sort((a, b) => b.count - a.count);
}

export interface DevSalesEntry {
  development: string;
  units: number;
  internal: number;
  external: number;
}

export function getUnitsByDevelopment(sales: SaleRow[]): DevSalesEntry[] {
  const map = new Map<string, DevSalesEntry>();
  for (const s of sales) {
    const dev = s.development || 'Unknown';
    if (!map.has(dev)) map.set(dev, { development: dev, units: 0, internal: 0, external: 0 });
    const e = map.get(dev)!;
    e.units++;
    if (s.is_external) e.external++;
    else e.internal++;
  }
  return Array.from(map.values()).sort((a, b) => b.units - a.units);
}

/** Sales credited to an agent (lead OR co-agent), excluding external rows. */
export function getSalesForAgent(sales: SaleRow[], agent: string): { sale: SaleRow; role: 'Lead' | 'Co-agent' }[] {
  const out: { sale: SaleRow; role: 'Lead' | 'Co-agent' }[] = [];
  for (const s of sales) {
    if (s.is_external) continue;
    if (s.lead_agent === agent) out.push({ sale: s, role: 'Lead' });
    else if (s.co_agent_1 === agent || s.co_agent_2 === agent) out.push({ sale: s, role: 'Co-agent' });
  }
  return out;
}
