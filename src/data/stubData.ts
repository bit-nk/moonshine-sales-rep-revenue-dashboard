// Local stub data for the Sales Lead CRM Dashboard. No backend or network
// calls  -  values are generated deterministically at module load using a seeded
// RNG so reloading the page produces the same dataset. All dates are anchored
// to `new Date()` so the demo always shows "recent" months.
//
// Data shapes are aligned with the SoW connector model:
//  - HubSpot (CRM / leads)  → STUB_LEADS
//  - Meta Marketing API  → STUB_AD_GROUPS  (ad sets) + STUB_CAMPAIGNS
//  - Dialer (REST + webhooks) → STUB_CALLS
//  - NetSweep (qualification) → STUB_NETSWEEP_SIGNALS  (also folded into Lead)
//  - Stripe (revenue / payments) → STUB_SALES  (closed deals / Stripe payments)
//
// All currency is USD. All addresses are US-based (Dallas-heavy).

import type { Lead } from "@/hooks/useLeadsData";
import type { SaleRow } from "@/hooks/useSalesData";

// ─── Deterministic RNG ────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260522);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => rng() * (max - min) + min;
const weightedPick = <T,>(items: readonly { v: T; w: number }[]): T => {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rng() * total;
  for (const it of items) {
  r -= it.w;
  if (r <= 0) return it.v;
  }
  return items[items.length - 1].v;
};

const TODAY = new Date();
function daysAgo(n: number): Date {
  const d = new Date(TODAY);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Reference data ──────────────────────────────────────────────────────────
// Sales agents (names match AGENT_CONFIG in AgentPerformanceCarousel)
export const AGENTS = [
  "Shelley Adler",
  "Denise Langley",
  "Martie Zimmermann",
  "Sharon Lawson",
  "Garon Kolman",
  "Tom Mason",
  "Loren Adler",
  "Stella Brooks",
  "Steven Reed",
  "Norah Mitchell",
] as const;

// Programs / offers a lead can be interested in (semantic replacement for
// "developments" in the original realty model  -  kept as the `listing` field on
// Lead so existing components still render them).
export const PROGRAMS = [
  "10X Sales Mastery",
  "Moonshine University",
  "Real Estate Investing",
  "Moonshine Capital Fund",
  "10X Business Bootcamp",
  "Sales Training Pro",
  "10X Growth Conference",
  "Multifamily Mastery",
] as const;

// Lead sources (channels)
export const SOURCES = [
  "Meta Ads",
  "Google Ads",
  "Organic",
  "Outbound",
  "Referral",
  "Direct",
  "Webinar",
] as const;

// US cities  -  Dallas-heavy, the rest a US-only spread
const US_CITIES = [
  "Dallas",
  "Plano",
  "Fort Worth",
  "Frisco",
  "Houston",
  "Austin",
  "San Antonio",
  "Atlanta",
  "Miami",
  "New York",
  "Los Angeles",
  "Chicago",
  "Phoenix",
  "Denver",
  "Seattle",
] as const;

// Meta campaign names (mapped from PROGRAMS via "Meta - <program>" naming)
export const META_CAMPAIGNS = PROGRAMS.map((p) => `Meta - ${p}`);
// Re-export under the old name so existing components continue to find ad-group labels
export const AD_GROUPS = META_CAMPAIGNS.map((c) => `${c} - Lead Form`);
// Legacy alias used by some realty-era components
export const DEVELOPMENTS = PROGRAMS;

// CRM pipeline stages
export const STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Demo Booked",
  "Demo Completed",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

const PRIORITIES = ["High", "Medium", "Low"] as const;

const LEAD_TYPES = ["Inbound", "Outbound"] as const;

const ENGAGEMENT_RAW = [
  "never_sent",
  "sent",
  "read",
  "clicked",
  "replied",
  "uncontacted",
] as const;

const FIRST_NAMES = [
  "Aiden", "Alex", "Bella", "Carlos", "Diana", "Emma", "Felix", "Grace", "Henry",
  "Iris", "Jacob", "Kira", "Liam", "Maya", "Noah", "Olivia", "Peter", "Quinn",
  "Rachel", "Sam", "Tara", "Umar", "Vera", "Will", "Yara", "Zoe",
];

const LAST_NAMES = [
  "Adams", "Brooks", "Carter", "Davis", "Evans", "Fisher", "Garcia", "Hayes",
  "Ito", "Johnson", "Kim", "Lee", "Martinez", "Nguyen", "O'Brien", "Park",
  "Quinn", "Rivera", "Smith", "Taylor", "Ueda", "Vargas", "Williams", "Yang", "Zhou",
];

// Stage distribution weights  -  most leads are early-funnel, fewer make it deep
const STAGE_WEIGHTS = [
  { v: "New", w: 22 },
  { v: "Contacted", w: 18 },
  { v: "Qualified", w: 15 },
  { v: "Demo Booked", w: 11 },
  { v: "Demo Completed", w: 8 },
  { v: "Negotiation", w: 6 },
  { v: "Closed Won", w: 10 },
  { v: "Closed Lost", w: 10 },
] as const;

// Source weights  -  Meta is the primary paid channel per the SoW
const SOURCE_WEIGHTS = [
  { v: "Meta Ads", w: 38 },
  { v: "Google Ads", w: 14 },
  { v: "Organic", w: 12 },
  { v: "Outbound", w: 14 },
  { v: "Referral", w: 8 },
  { v: "Direct", w: 8 },
  { v: "Webinar", w: 6 },
] as const;

// ─── Generators ──────────────────────────────────────────────────────────────
function makePhone(): string {
  return `(${randInt(214, 972)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`;
}

function makeEmail(first: string, last: string): string {
  const domains = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "hubspot.example"];
  return `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@${pick(domains)}`;
}

// Maps each US city in the stub dataset to its actual state. Used to
// generate believable addresses instead of slapping "TX" on everything.
const CITY_STATE: Record<string, string> = {
  Dallas:        "TX",
  Plano:         "TX",
  "Fort Worth":  "TX",
  Frisco:        "TX",
  Houston:       "TX",
  Austin:        "TX",
  "San Antonio": "TX",
  Atlanta:       "GA",
  Miami:         "FL",
  "New York":    "NY",
  "Los Angeles": "CA",
  Chicago:       "IL",
  Phoenix:       "AZ",
  Denver:        "CO",
  Seattle:       "WA",
};

function streetAddressForCity(city: string): string {
  const state = CITY_STATE[city] ?? "TX";
  const street = randInt(100, 9999);
  const roads = [
  "Main St", "Oak Ave", "Elm St", "McKinney Ave", "Greenville Ave",
  "Mockingbird Ln", "Preston Rd", "Lemmon Ave", "Ross Ave", "Henderson Ave",
  ];
  return `${street} ${pick(roads)}, ${city}, ${state}`;
}

function metaCampaignFor(program: string, source: string): string | null {
  if (source !== "Meta Ads") return null;
  return `Meta - ${program}`;
}

function dealValueFor(program: string): number {
  // Rough program-tier deal values (USD).
  if (program === "Moonshine Capital Fund") return randInt(25_000, 250_000);
  if (program === "Multifamily Mastery") return randInt(8_000, 35_000);
  if (program === "Real Estate Investing") return randInt(3_000, 25_000);
  if (program === "10X Business Bootcamp") return randInt(2_500, 15_000);
  if (program === "10X Growth Conference") return randInt(1_500, 8_000);
  if (program === "10X Sales Mastery") return randInt(2_000, 12_000);
  if (program === "Sales Training Pro") return randInt(1_500, 8_000);
  return randInt(500, 5_000); // Moonshine University default
}

function qualificationStatusFor(score: number): "Qualified" | "Pending" | "Not Qualified" {
  if (score >= 70) return "Qualified";
  if (score >= 40) return "Pending";
  return "Not Qualified";
}

// ─── Leads (HubSpot-shaped) ──────────────────────────────────────────────────
function generateLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  for (let i = 0; i < count; i++) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const program = pick(PROGRAMS);
  const agent = pick(AGENTS);
  const source = weightedPick(SOURCE_WEIGHTS);
  const stage = weightedPick(STAGE_WEIGHTS);
  const priority = pick(PRIORITIES);
  const r = rng();
  const ageDays = r < 0.6 ? randInt(0, 30) : r < 0.9 ? randInt(31, 90) : randInt(91, 180);
  const created = daysAgo(ageDays);
  const lastActivity = daysAgo(randInt(0, Math.min(ageDays, 14)));
  const city = pick(US_CITIES);
  const score = randInt(15, 98);
  const qualStatus = qualificationStatusFor(score);
  const dealValue = dealValueFor(program);
  const status =
  stage === "Closed Won" || stage === "Closed Lost"
  ? "Closed"
  : qualStatus === "Not Qualified"
  ? "Nurture"
  : "Active";

  leads.push({
  id: i + 1,
  hubspot_id: `HS-${20000 + i}`,
  date: isoDate(created),
  name,
  display_name: name,
  first_name: first,
  last_name: last,
  phone: makePhone(),
  email: makeEmail(first, last),
  source,
  all_sources: source,
  source_campaign: metaCampaignFor(program, source),
  agent,
  assigned_agent: agent,
  listing: program,  // legacy field  -  semantically the program/offer
  area: city,
  listing_address: streetAddressForCity(city),
  propdata_listing_address: streetAddressForCity(city),
  listing_ref: `LD-${randInt(10000, 99999)}`,
  lead_type: pick(LEAD_TYPES),
  lead_source: source,
  priority,
  deal_value: dealValue,
  qualification_score: score,
  qualification_status: qualStatus,
  message: "Interested in learning more  -  requested a demo",
  status,
  stage,
  branch: "Moonshine Enterprise",
  lifecycle_status: status,
  wa_engagement_status: pick(ENGAGEMENT_RAW),
  created_at: created.toISOString(),
  last_activity_at: lastActivity.toISOString(),
  } as Lead);
  }
  return leads.sort((a, b) => (b.created_at! > a.created_at! ? 1 : -1));
}

export const STUB_LEADS: Lead[] = generateLeads(320);

// ─── Closed deals / Stripe payments (SaleRow-shaped) ─────────────────────────
// Drawn from the subset of leads that reached "Closed Won" so revenue
// attribution lines up with the lead source.
function generateSales(): SaleRow[] {
  const wonLeads = STUB_LEADS.filter((l) => l.stage === "Closed Won");
  const sales: SaleRow[] = wonLeads.map((lead, idx) => ({
  id: idx + 1,
  development: lead.listing!,  // legacy → program name
  program: lead.listing!,
  unit_number: 100000 + idx,  // legacy → stripe invoice id
  stripe_invoice_id: `in_${(10000 + idx).toString(16)}`,
  lead_agent: lead.agent,  // closer
  closer_agent: lead.agent,
  co_agent_1: rng() < 0.35 ? pick(AGENTS.filter((a) => a !== lead.agent)) : null,
  co_agent_2: null,
  is_external: rng() < 0.08,  // tiny share are channel-partner deals
  sale_date: isoDate(daysAgo(randInt(0, 180))),
  closed_at: lead.last_activity_at,
  sale_price: lead.deal_value!,  // legacy → deal amount
  deal_amount: lead.deal_value!,
  source: lead.source,
  source_campaign: lead.source_campaign,
  stripe_status: weightedPick([
  { v: "succeeded", w: 88 },
  { v: "refunded", w: 4 },
  { v: "pending", w: 8 },
  ]),
  notes: null,
  }) as unknown as SaleRow);

  return sales.sort((a, b) => (b.sale_date! > a.sale_date! ? 1 : -1));
}

export const STUB_SALES: SaleRow[] = generateSales();

// ─── Meta Ads  -  ad set rows (per ad group × day) ─────────────────────────────
export type AdGroupRow = {
  date: string;
  ad_group: string;  // ad-set name (e.g. "Meta - 10X Sales Mastery - Lead Form")
  cost_zar: number;  // legacy field name; semantically USD spend
  conversions: number;  // leads generated
  impressions: number;
  clicks: number;
};

function generateAdGroupRows(): AdGroupRow[] {
  const rows: AdGroupRow[] = [];
  for (let d = 0; d < 120; d++) {
  const date = isoDate(daysAgo(d));
  for (const ad_group of AD_GROUPS) {
  const program = ad_group.replace(/^Meta - /, "").replace(/\s*-\s*Lead Form$/i, "");
  const highSpend = ["10X Sales Mastery", "Moonshine Capital Fund", "Real Estate Investing"].includes(program);
  const midSpend = ["10X Business Bootcamp", "Moonshine University", "Multifamily Mastery"].includes(program);
  const baseCost = highSpend ? randFloat(220, 480) : midSpend ? randFloat(110, 260) : randFloat(40, 140);
  const cost = Math.round(baseCost * 100) / 100;
  const impressions = Math.round(baseCost * randFloat(18, 38));
  const clicks = Math.max(0, Math.round(impressions * randFloat(0.025, 0.07)));
  const conversions = Math.max(0, Math.round(clicks * randFloat(0.06, 0.18) * 100) / 100);
  rows.push({ date, ad_group, cost_zar: cost, conversions, impressions, clicks });
  }
  }
  return rows;
}

export const STUB_AD_GROUPS: AdGroupRow[] = generateAdGroupRows();

// ─── Meta campaign-level rows (one row per day, aggregated) ──────────────────
export type CampaignRow = {
  date: string;
  cost_zar: number;
  conversions: number;
  impressions: number;
  clicks: number;
  search_impr_share: number;
  search_lost_is_budget: number;
  search_lost_is_rank: number;
  campaign: string;
};

function generateCampaignRows(): CampaignRow[] {
  const byDate = new Map<string, { cost: number; conv: number; imp: number; clk: number }>();
  for (const row of STUB_AD_GROUPS) {
  const e = byDate.get(row.date) ?? { cost: 0, conv: 0, imp: 0, clk: 0 };
  e.cost += row.cost_zar;
  e.conv += row.conversions;
  e.imp += row.impressions;
  e.clk += row.clicks;
  byDate.set(row.date, e);
  }
  const rows: CampaignRow[] = [];
  for (const [date, totals] of byDate) {
  const lostBudget = randFloat(0.25, 0.65);
  const lostRank = randFloat(0.05, 0.20);
  const share = Math.max(0, 1 - lostBudget - lostRank);
  rows.push({
  date,
  cost_zar: Math.round(totals.cost * 100) / 100,
  conversions: Math.round(totals.conv * 100) / 100,
  impressions: totals.imp,
  clicks: totals.clk,
  search_impr_share: Math.round(share * 1000) / 1000,
  search_lost_is_budget: Math.round(lostBudget * 1000) / 1000,
  search_lost_is_rank: Math.round(lostRank * 1000) / 1000,
  campaign: "Meta Ads - Moonshine Enterprise",
  });
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const STUB_CAMPAIGNS: CampaignRow[] = generateCampaignRows();

// ─── Search term rows (kept for the "Audience Demand" panel) ─────────────────
export type SearchTermRow = {
  date: string;
  search_term: string;
  cost_zar: number;
  conversions: number;
  clicks: number;
  impressions: number;
  match_type: string;
};

const BRANDED_TERMS = [
  "moonshine 10x",
  "moonshine university",
  "10x sales mastery",
  "moonshine capital fund",
  "10x growth conference",
  "multifamily mastery",
  "sales training pro",
  "moonshine real estate",
];

const GENERIC_TERMS = [
  "sales training online",
  "real estate investing course",
  "passive income coaching",
  "sales coaching program",
  "business growth bootcamp",
  "how to scale sales team",
  "multifamily investing course",
  "best sales training course",
  "income mentorship program",
  "lead generation training",
  "real estate fund investing",
  "high ticket coaching",
];

function generateSearchTermRows(): SearchTermRow[] {
  const rows: SearchTermRow[] = [];
  const allTerms = [
  ...BRANDED_TERMS.map((t) => ({ term: t, isBranded: true })),
  ...GENERIC_TERMS.map((t) => ({ term: t, isBranded: false })),
  ];
  for (let d = 0; d < 90; d++) {
  const date = isoDate(daysAgo(d));
  for (const t of allTerms) {
  if (rng() < 0.45) continue;
  const impressions = randInt(20, t.isBranded ? 280 : 900);
  const clicks = Math.max(0, Math.round(impressions * randFloat(0.03, t.isBranded ? 0.22 : 0.09)));
  const cost = Math.round(clicks * randFloat(6, t.isBranded ? 16 : 28) * 100) / 100;
  const conversions = Math.max(0, Math.round(clicks * randFloat(0.04, t.isBranded ? 0.20 : 0.09) * 100) / 100);
  rows.push({
  date,
  search_term: t.term,
  cost_zar: cost,
  conversions,
  clicks,
  impressions,
  match_type: pick(["Exact", "Phrase", "Broad"]),
  });
  }
  }
  return rows;
}

export const STUB_SEARCH_TERMS: SearchTermRow[] = generateSearchTermRows();

// ─── Geographic rows ─────────────────────────────────────────────────────────
export type GeographicRow = {
  date: string;
  city: string;
  conversions: number;
  impressions: number;
  clicks: number;
  cost_zar: number;
};

function generateGeographicRows(): GeographicRow[] {
  const rows: GeographicRow[] = [];
  // City weights  -  DFW metro is the strongest market (Moonshine HQ is in Aventura but
  // for the demo dataset Dallas is the centre of gravity per the brief).
  const weights: Record<string, number> = {
  Dallas: 1.0,
  Plano: 0.7,
  "Fort Worth": 0.6,
  Frisco: 0.55,
  Houston: 0.6,
  Austin: 0.5,
  "San Antonio": 0.4,
  Atlanta: 0.45,
  Miami: 0.55,
  "New York": 0.5,
  "Los Angeles": 0.45,
  Chicago: 0.4,
  Phoenix: 0.35,
  Denver: 0.3,
  Seattle: 0.3,
  };
  // Only iterate a top subset to keep dataset size sensible
  const cities = ["Dallas", "Plano", "Fort Worth", "Frisco", "Houston", "Austin", "Atlanta", "Miami"] as const;
  for (let d = 0; d < 90; d++) {
  const date = isoDate(daysAgo(d));
  for (const city of cities) {
  const w = weights[city] ?? 0.3;
  const impressions = Math.round(randInt(120, 700) * w);
  const clicks = Math.max(0, Math.round(impressions * randFloat(0.02, 0.07)));
  const cost = Math.round(clicks * randFloat(8, 30) * 100) / 100;
  const conversions = Math.max(0, Math.round(clicks * randFloat(0.03, 0.12) * 100) / 100);
  rows.push({ date, city, conversions, impressions, clicks, cost_zar: cost });
  }
  }
  return rows;
}

export const STUB_GEOGRAPHIC: GeographicRow[] = generateGeographicRows();

// ─── Dialer calls (REST + webhook events) ────────────────────────────────────
export type DialerCallOutcome =
  | "Connected"
  | "Voicemail"
  | "No Answer"
  | "Demo Booked"
  | "Disqualified"
  | "Callback Scheduled";

export type DialerCall = {
  id: number;
  lead_id: number;
  hubspot_id: string;
  agent: string;
  direction: "Inbound" | "Outbound";
  duration_seconds: number;
  outcome: DialerCallOutcome;
  call_at: string;
  notes: string;
};

const NOTE_TEMPLATES: Record<DialerCallOutcome, string[]> = {
  Connected: [
    "Lead picked up - walked through the program structure, sending the deck. Strong fit on budget; follow up Wed.",
    "Great conversation. Lead wants to bring a partner onto the next call. Sent calendar link.",
    "Discussed pricing tiers - decision-maker confirmed. Awaiting internal sign-off, low-friction close expected.",
    "Surfaced two objections (timing, internal approval). Reframed ROI; reschedule next week.",
    "Walked through 10X case studies. Lead engaged on the recurring-revenue plays. Sent comparison doc.",
  ],
  "Demo Booked": [
    "Demo locked in for Tuesday 2pm CT. Sent prep checklist + sample dashboard link.",
    "Booked demo - lead asked to include their CFO. Updated calendar invite.",
    "Demo scheduled. Lead specifically asked about revenue attribution reporting; prepped slides.",
    "Demo on calendar for Thursday. Confirmed primary stakeholders and tech stack.",
  ],
  Voicemail: [
    "Left VM - quick intro + value prop. Sending follow-up email today.",
    "VM with personalised hook (referenced their website launch). Try again tomorrow AM.",
    "Standard VM - retry 48hr cadence.",
  ],
  "No Answer": [
    "No connect. Will try alternate number on file next attempt.",
    "Rang out. Trying after-hours window next.",
    "No pickup - SMS sent as gentle nudge.",
  ],
  Disqualified: [
    "Lead is out of ICP - team size below threshold. Marked DQ in HubSpot.",
    "Budget far below program tiers. Politely closed loop; added to nurture.",
    "Lead confirmed they signed with a competitor. Marked closed-lost.",
    "Wrong contact - real decision-maker reachable via referral; updated record.",
  ],
  "Callback Scheduled": [
    "Lead requested a callback Friday 10am. Set reminder + sent agenda.",
    "Callback booked - lead wants to loop in operations lead. Calendar updated.",
    "Asked for callback next week after their board meeting. Logged for Monday.",
  ],
};

function generateDialerCalls(): DialerCall[] {
  const calls: DialerCall[] = [];
  const outcomes: DialerCallOutcome[] = [
  "Connected",
  "Voicemail",
  "No Answer",
  "Demo Booked",
  "Disqualified",
  "Callback Scheduled",
  ];
  let id = 1;
  // Generate ~3-7 calls per lead, weighted to recent leads
  for (const lead of STUB_LEADS) {
  const callCount = randInt(0, 6);
  for (let i = 0; i < callCount; i++) {
  const outcome = pick(outcomes);
  const duration =
  outcome === "Connected" ? randInt(120, 1800)
  : outcome === "Demo Booked" ? randInt(180, 900)
  : outcome === "Voicemail" ? randInt(15, 45)
  : outcome === "No Answer" ? 0
  : randInt(30, 240);
  const ageDays = randInt(0, 90);
  calls.push({
  id: id++,
  lead_id: lead.id,
  hubspot_id: (lead as Lead & { hubspot_id: string }).hubspot_id,
  agent: lead.agent!,
  direction: rng() < 0.78 ? "Outbound" : "Inbound",
  duration_seconds: duration,
  outcome,
  call_at: daysAgo(ageDays).toISOString(),
  notes: pick(NOTE_TEMPLATES[outcome]),
  });
  }
  }
  return calls.sort((a, b) => (b.call_at > a.call_at ? 1 : -1));
}

export const STUB_CALLS: DialerCall[] = generateDialerCalls();

// ─── NetSweep qualification signals ──────────────────────────────────────────
export type NetSweepSignal = {
  lead_id: number;
  hubspot_id: string;
  qualification_score: number;
  income_band: "<$50k" | "$50-100k" | "$100-250k" | "$250k-1M" | ">$1M";
  credit_tier: "A" | "B" | "C" | "D";
  qualification_status: "Qualified" | "Pending" | "Not Qualified";
  verified_at: string;
};

function bandFor(score: number): NetSweepSignal["income_band"] {
  if (score >= 90) return ">$1M";
  if (score >= 75) return "$250k-1M";
  if (score >= 55) return "$100-250k";
  if (score >= 35) return "$50-100k";
  return "<$50k";
}
function tierFor(score: number): NetSweepSignal["credit_tier"] {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

export const STUB_NETSWEEP_SIGNALS: NetSweepSignal[] = STUB_LEADS.map((lead) => {
  const l = lead as Lead & { hubspot_id: string; qualification_score: number };
  return {
  lead_id: lead.id,
  hubspot_id: l.hubspot_id,
  qualification_score: l.qualification_score,
  income_band: bandFor(l.qualification_score),
  credit_tier: tierFor(l.qualification_score),
  qualification_status: qualificationStatusFor(l.qualification_score),
  verified_at: lead.created_at!,
  };
});

// ─── Stripe payment events (webhook log) ─────────────────────────────────────
export type StripeEvent = {
  id: string;
  type: "payment_intent.succeeded" | "charge.refunded" | "payment_intent.processing";
  lead_id: number;
  amount: number;
  currency: "USD";
  campaign: string | null;
  occurred_at: string;
};

export const STUB_STRIPE_EVENTS: StripeEvent[] = STUB_SALES.map((sale, idx) => {
  const s = sale as SaleRow & { stripe_status?: string; source_campaign?: string | null; deal_amount: number };
  const lead = STUB_LEADS.find((l) => l.agent === sale.lead_agent && l.listing === sale.development);
  return {
  id: `evt_${(50000 + idx).toString(16)}`,
  type:
  s.stripe_status === "refunded"
  ? "charge.refunded"
  : s.stripe_status === "pending"
  ? "payment_intent.processing"
  : "payment_intent.succeeded",
  lead_id: lead?.id ?? 0,
  amount: s.deal_amount,
  currency: "USD",
  campaign: s.source_campaign ?? null,
  occurred_at: new Date(sale.sale_date!).toISOString(),
  };
}).sort((a, b) => (b.occurred_at > a.occurred_at ? 1 : -1));

// ─── Date filter helper ──────────────────────────────────────────────────────
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function filterByDateRange<T extends { date: string }>(
  rows: T[],
  range?: DateRange,
): T[] {
  if (!range?.from && !range?.to) return rows;
  return rows.filter((r) => {
  const d = new Date(r.date);
  if (range.from && d < range.from) return false;
  if (range.to) {
  const end = new Date(range.to);
  end.setHours(23, 59, 59, 999);
  if (d > end) return false;
  }
  return true;
  });
}

// ─── Aggregate helpers for the new SoW panels ────────────────────────────────
/** Lead funnel counts in pipeline-stage order. */
export function getLeadFunnel(leads: Lead[]): { stage: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of STAGES) map.set(s, 0);
  for (const l of leads) {
  const s = (l as Lead & { stage: string }).stage;
  if (s && map.has(s)) map.set(s, (map.get(s) || 0) + 1);
  }
  return STAGES.map((s) => ({ stage: s, count: map.get(s) || 0 }));
}

/** Revenue attributed by source channel, drawn from Stripe events. */
export function getRevenueBySource(): { source: string; revenue: number; deals: number }[] {
  const map = new Map<string, { revenue: number; deals: number }>();
  for (const sale of STUB_SALES) {
  const s = (sale as SaleRow & { source?: string; stripe_status?: string }).source ?? "Unknown";
  if ((sale as SaleRow & { stripe_status?: string }).stripe_status === "refunded") continue;
  const e = map.get(s) ?? { revenue: 0, deals: 0 };
  e.revenue += (sale as SaleRow & { deal_amount: number }).deal_amount;
  e.deals += 1;
  map.set(s, e);
  }
  return Array.from(map.entries())
  .map(([source, v]) => ({ source, ...v }))
  .sort((a, b) => b.revenue - a.revenue);
}

/** Relative spend mix by channel - applied against the period's Meta spend
 * to synthesise paid spend for the other paid channels. The non-paid channels
 * (Outbound, Referral, Direct, Organic) intentionally remain at $0 spend but
 * carry attributed revenue. */
const CHANNEL_SPEND_MULTIPLIER: Record<string, number> = {
  "Meta Ads":   1.00,
  "Google Ads": 0.42,
  Webinar:      0.14,   // event-promotion paid spend
  Outbound:     0.08,   // SDR tooling + outreach licensing (synthetic)
  Referral:     0.0,
  Direct:       0.0,
  Organic:      0.0,
};

/** Spend, leads, CPL, revenue, ROAS - per channel. Used by Source Performance. */
export function getChannelPerformance(range?: DateRange): {
  channel: string;
  spend: number;
  leads: number;
  costPerLead: number | null;
  revenue: number;
  roas: number | null;
}[] {
  const adRowsInRange = filterByDateRange(STUB_AD_GROUPS, range);
  const metaSpend = adRowsInRange.reduce((s, r) => s + r.cost_zar, 0);
  const spendByChannel: Record<string, number> = Object.fromEntries(
    Object.entries(CHANNEL_SPEND_MULTIPLIER).map(([ch, m]) => [
      ch,
      Math.round(metaSpend * m * 100) / 100,
    ]),
  );

  // Filter leads + sales by date range against created_at / sale_date
  const inRangeLeads = STUB_LEADS.filter((l) => {
    if (!range?.from && !range?.to) return true;
    const d = l.created_at ? new Date(l.created_at) : null;
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to) {
      const end = new Date(range.to);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const inRangeSales = STUB_SALES.filter((s) => {
    if (!range?.from && !range?.to) return true;
    const d = s.sale_date ? new Date(s.sale_date) : null;
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to) {
      const end = new Date(range.to);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const leadsByChannel = new Map<string, number>();
  for (const l of inRangeLeads) {
    leadsByChannel.set(l.source!, (leadsByChannel.get(l.source!) || 0) + 1);
  }
  const revenueByChannel = new Map<string, number>();
  for (const sale of inRangeSales) {
    const s = (sale as SaleRow & { source?: string; stripe_status?: string });
    if (s.stripe_status === "refunded") continue;
    revenueByChannel.set(
      s.source ?? "Unknown",
      (revenueByChannel.get(s.source ?? "Unknown") || 0) +
        (sale as SaleRow & { deal_amount: number }).deal_amount,
    );
  }
  return SOURCES.map((source) => {
    const spend = spendByChannel[source] || 0;
    const leads = leadsByChannel.get(source) || 0;
    const revenue = revenueByChannel.get(source) || 0;
    return {
      channel: source,
      spend,
      leads,
      costPerLead: leads > 0 && spend > 0 ? Math.round((spend / leads) * 100) / 100 : null,
      revenue: Math.round(revenue * 100) / 100,
      roas: spend > 0 ? Math.round((revenue / spend) * 100) / 100 : null,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

/** Agent activity table: leads assigned, response time, conversion rate. */
export function getAgentActivity(): {
  agent: string;
  leadsAssigned: number;
  openLeads: number;
  closedWon: number;
  closedLost: number;
  conversionRate: number;
  avgResponseMinutes: number;
}[] {
  const out: ReturnType<typeof getAgentActivity> = [];
  for (const agent of AGENTS) {
  const myLeads = STUB_LEADS.filter((l) => l.agent === agent);
  const open = myLeads.filter((l) => l.status === "Active" || l.status === "Nurture").length;
  const won = myLeads.filter((l) => (l as Lead & { stage: string }).stage === "Closed Won").length;
  const lost = myLeads.filter((l) => (l as Lead & { stage: string }).stage === "Closed Lost").length;
  const conv = myLeads.length > 0 ? (won / myLeads.length) * 100 : 0;
  // Response time derived deterministically from agent index  -  keeps the
  // demo numbers stable but varied.
  const idx = AGENTS.indexOf(agent);
  const avgResponse = 8 + ((idx * 13) % 47);
  out.push({
  agent,
  leadsAssigned: myLeads.length,
  openLeads: open,
  closedWon: won,
  closedLost: lost,
  conversionRate: Math.round(conv * 10) / 10,
  avgResponseMinutes: avgResponse,
  });
  }
  return out.sort((a, b) => b.leadsAssigned - a.leadsAssigned);
}

/** Monthly revenue trend (last 6 months), from Stripe events. */
export function getMonthlyRevenueTrend(): { month: string; revenue: number }[] {
  const map = new Map<string, number>();
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
  const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
  const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  map.set(key, 0);
  }
  for (const evt of STUB_STRIPE_EVENTS) {
  if (evt.type !== "payment_intent.succeeded") continue;
  const d = new Date(evt.occurred_at);
  const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  if (map.has(key)) map.set(key, (map.get(key) || 0) + evt.amount);
  }
  return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
}
