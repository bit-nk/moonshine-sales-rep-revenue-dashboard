/**
 * DigitalZoneBento.jsx
 * Limestone Zone  -  Luxury Real Estate Marketing Dashboard
 *
 * Bento grid layout replacing the flat stacked tab layout.
 *
 * Props:
 *  performanceData  -  { totalSpend, totalConversions, avgCPC, topDevelopment,
 *  marketingData, channelData, budgetItems, budgetInsight,
 *  insights?, dateRange? }
 *  intelligenceData  -  { rawCampaignCRows, rawCampaignRows, searchData,
 *  geoData, marketingData, dateRange? }
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KPICard } from "@/components/operations/KPICard";
import SpendBreakdownChart from "@/components/report/SpendBreakdownChart";
import BudgetPacingCard from "@/components/report/BudgetPacingCard";
import ChannelCard from "@/components/report/ChannelCard";
import DailyBudgetPanel from "@/components/report/DailyBudgetPanel";
import ChannelSpendChart from "@/components/report/ChannelSpendChart";
import BarChartComparison from "@/components/report/BarChartComparison";
import CostPerConversionTrend from "@/components/report/CostPerConversionTrend";
import SearchIntentDonut from "@/components/report/SearchIntentDonut";
import GeographicDemandSnapshot from "@/components/report/GeographicDemandSnapshot";
import SearchQueryChart from "@/components/report/SearchQueryChart";
import SearchQueryTable from "@/components/report/SearchQueryTable";
import SearchDemandInsight from "@/components/report/SearchDemandInsight";
import { DollarSign, Target, TrendingDown, Trophy, Layers, AlertTriangle } from "lucide-react";

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const T = {
  teal:  "#00B4A6",
  gold:  "rgba(135,127,73,0.45)",
  goldDim:  "rgba(135,127,73,0.3)",
  goldSolid:  "#877F49",
  bg:  "#1a1a1a",
  cardBg:  "rgba(20,20,20,0.72)",
  backdrop:  "blur(16px) saturate(180%)",
  white:  "#ffffff",
  dim:  "rgba(255,255,255,0.6)",
  dimmer:  "#6b6b6b",
  muted:  "#cccccc",
  gap:  16,
  radius:  16,
};

const GLASS = {
  background:  T.cardBg,
  backdropFilter:  T.backdrop,
  WebkitBackdropFilter: T.backdrop,
  border:  `1px solid ${T.gold}`,
  borderRadius:  T.radius,
  boxShadow:  "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const HOVER_SHADOW = "0 0 0 1.5px rgba(0,180,166,0.4), 0 16px 48px rgba(0,180,166,0.22), 0 4px 16px rgba(0,0,0,0.5)";

const formatUSD = (value) =>
  new Intl.NumberFormat("en-US", {
  style:  "currency",
  currency:  "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  }).format(value);

// ─── Animation helpers ─────────────────────────────────────────────────────────

const d = (i) => i * 0.08; // stagger delay per card index

const tabVariants = {
  hidden: { opacity: 0 },
  show:  { opacity: 1, transition: { duration: 0.2 } },
  exit:  { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Row label  -  section heading with teal left border ────────────────────────

const RowLabel = ({ children }) => (
  <p style={{
  fontSize:  "0.85rem",
  fontWeight:  600,
  color:  "rgba(255,255,255,0.7)",
  borderLeft:  "3px solid #00B4A6",
  paddingLeft:  12,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom:  12,
  fontFamily:  "'Inter', system-ui, sans-serif",
  }}>
  {children}
  </p>
);

// ─── BentoCell ─────────────────────────────────────────────────────────────────

const BentoCell = ({ children, delay = 0, style = {} }) => (
  <motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
  whileHover={{
  y:  -4,
  boxShadow: HOVER_SHADOW,
  transition: { duration: 0.2, ease: "easeOut" },
  }}
  style={{ borderRadius: T.radius, position: "relative", ...style }}
  >
  {children}
  </motion.div>
);

// ─── GlassCard ─────────────────────────────────────────────────────────────────

const GlassCard = ({ children, delay = 0, style = {}, padding = 28 }) => (
  <motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
  whileHover={{
  y:  -4,
  boxShadow: HOVER_SHADOW,
  transition: { duration: 0.2, ease: "easeOut" },
  }}
  style={{ ...GLASS, padding, position: "relative", ...style }}
  >
  {children}
  </motion.div>
);

// ─── Impression Share stat card (Tab 2 Row 1) ─────────────────────────────────

const ImpressionStatCard = ({ label, value, description, alarming = false, delay = 0, visualNum }) => (
  <GlassCard delay={delay} padding={28} visualNum={visualNum}>
  <p style={{
  fontSize:  10,
  fontWeight:  600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color:  T.dimmer,
  marginBottom:  16,
  fontFamily:  "'Inter', system-ui, sans-serif",
  }}>
  {label}
  </p>

  <p style={{
  fontSize:  52,
  fontWeight:  800,
  lineHeight:  1,
  letterSpacing: "-0.03em",
  color:  alarming ? T.teal : T.white,
  marginBottom: 12,
  fontFamily:  "'Inter', system-ui, sans-serif",
  }}>
  {value}
  </p>

  {alarming && (
  <div style={{
  display:  "inline-flex",
  alignItems:  "center",
  gap:  5,
  padding:  "3px 9px",
  borderRadius:  6,
  background:  "rgba(0,180,166,0.1)",
  border:  "1px solid rgba(0,180,166,0.3)",
  marginBottom:  10,
  }}>
  <AlertTriangle size={10} color={T.teal} />
  <span style={{ fontSize: 10, fontWeight: 700, color: T.teal, letterSpacing: "0.05em", textTransform: "uppercase" }}>
  Review required
  </span>
  </div>
  )}

  <p style={{ fontSize: 12, color: T.dim, lineHeight: 1.65 }}>
  {description}
  </p>
  </GlassCard>
);

// ─── Investment Strategy card (Tab 1 Row 4) ────────────────────────────────────

const InvestmentStrategyCard = ({ performanceData, delay = 0 }) => {
  const { channelData = [], budgetItems = [], budgetInsight = "" } = performanceData;
  const monthlyTotal = budgetItems.reduce((s, i) => s + (i.monthlyEstimate || 0), 0);

  return (
  <GlassCard delay={delay} padding={28}>
  {/* Header */}
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
  <div style={{
  width:  32,
  height:  32,
  borderRadius:  9,
  background:  "rgba(0,180,166,0.1)",
  border:  "1px solid rgba(0,180,166,0.25)",
  display:  "flex",
  alignItems:  "center",
  justifyContent: "center",
  flexShrink:  0,
  }}>
  <Layers size={15} color={T.teal} />
  </div>
  <h3 style={{
  fontSize:  19,
  fontWeight: 800,
  color:  T.white,
  fontFamily: "'Inter', system-ui, sans-serif",
  }}>
  Investment Strategy
  </h3>
  </div>

  <p style={{
  fontSize:  10,
  fontWeight:  600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color:  T.dimmer,
  marginBottom:  20,
  fontFamily:  "'Inter', system-ui, sans-serif",
  }}>
  Channel allocation framework
  </p>

  {/* Monthly budget figure */}
  <div style={{
  display:  "flex",
  alignItems:  "baseline",
  gap:  6,
  marginBottom:  20,
  paddingBottom: 20,
  borderBottom:  `1px solid ${T.goldDim}`,
  }}>
  <span style={{
  fontSize:  38,
  fontWeight:  800,
  color:  T.white,
  letterSpacing: "-0.025em",
  fontFamily:  "'Inter', system-ui, sans-serif",
  lineHeight:  1,
  }}>
  {formatUSD(monthlyTotal)}
  </span>
  <span style={{ fontSize: 13, color: T.dim, fontWeight: 400 }}>/ month</span>
  </div>

  {/* Channel breakdown */}
  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
  {channelData.map((ch) => (
  <div key={ch.channel} style={{
  display:  "flex",
  justifyContent: "space-between",
  alignItems:  "center",
  padding:  "12px 16px",
  borderRadius:  10,
  background:  ch.role === "capture"
  ? "rgba(0,180,166,0.07)"
  : "rgba(255,255,255,0.04)",
  border:  ch.role === "capture"
  ? "1px solid rgba(0,180,166,0.2)"
  : `1px solid ${T.goldDim}`,
  }}>
  <div>
  <p style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 2 }}>
  {ch.channel}
  </p>
  <p style={{
  fontSize:  10,
  fontWeight:  600,
  color:  ch.role === "capture" ? T.teal : T.goldSolid,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  }}>
  {ch.role === "capture" ? "Demand Capture" : "Demand Creation"}
  </p>
  </div>
  <div style={{ textAlign: "right" }}>
  <p style={{ fontSize: 15, fontWeight: 700, color: T.white }}>
  {formatUSD(ch.spend)}
  </p>
  <p style={{ fontSize: 10, color: T.dim }}>total spend</p>
  </div>
  </div>
  ))}

  {budgetItems.map((item, i) => (
  <div key={i} style={{
  display:  "flex",
  justifyContent: "space-between",
  alignItems:  "center",
  padding:  "10px 16px",
  borderRadius:  10,
  background:  "rgba(255,255,255,0.03)",
  border:  `1px solid ${T.goldDim}`,
  }}>
  <p style={{ fontSize: 12, color: T.dim, maxWidth: "60%" }}>{item.label}</p>
  <p style={{ fontSize: 13, fontWeight: 600, color: T.white }}>
  {formatUSD(item.dailyBudget)}<span style={{ fontSize: 11, fontWeight: 400, color: T.dim }}>/day</span>
  </p>
  </div>
  ))}
  </div>

  {/* Strategic rationale */}
  <div style={{
  paddingTop:  16,
  borderTop:  `1px solid ${T.goldDim}`,
  }}>
  <p style={{
  fontSize:  12,
  fontWeight: 500,
  color:  T.goldSolid,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: 8,
  }}>
  Strategic rationale
  </p>
  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
  {budgetInsight}
  </p>
  </div>
  </GlassCard>
  );
};

// ─── Default insight content ───────────────────────────────────────────────────

const DEFAULT_INSIGHTS = [
  {
  number: 1,
  title: "Spend follows buyer demand",
  description:
  "Marketing investment is concentrated on developments with active buyer interest. 59 East Hertford and 25 St Audley receive the majority of Google Search spend because they have established demand and are generating qualified enquiries.",
  },
  {
  number: 2,
  title: "Search captures demand; Meta creates it",
  description:
  "Google Search targets buyers actively searching for specific developments, delivering immediate conversions. Meta (awareness) builds recognition for newer developments where search demand has not yet materialised.",
  },
  {
  number: 3,
  title: "New developments require awareness before search",
  description:
  "Developments like 38 on 1st are in an awareness-building phase. Search campaigns are paused until sufficient market awareness exists for buyers to begin searching by name, ensuring spend is allocated efficiently.",
  },
];

// ─── Compute impression share from raw rows ────────────────────────────────────

function useImpressionStats(rows = []) {
  return useMemo(() => {
  let imprSum = 0, budgetSum = 0, rankSum = 0, count = 0;

  const parse = (v) => {
  if (!v || v === "--" || v === "< 10%") return 0;
  return parseFloat(v.replace("%", "")) / 100;
  };

  for (const row of rows) {
  const impr  = row["Search Impr. Share"]  || row["Search Impr. share"] || "";
  const budget = row["Search Lost IS (Budget)"] || row["Search Lost IS (budget)"] || "";
  const rank  = row["Search Lost IS (Rank)"]  || row["Search Lost IS (rank)"] || "";
  if (!impr && !budget && !rank) continue;
  imprSum  += parse(impr);
  budgetSum += parse(budget);
  rankSum  += parse(rank);
  count++;
  }

  if (count === 0) return null;
  return {
  avgImprShare: imprSum  / count,
  avgBudget:  budgetSum / count,
  avgRank:  rankSum  / count,
  };
  }, [rows]);
}

// ─── Tab 1: Performance ────────────────────────────────────────────────────────

const PerformanceTab = ({ data }) => {
  const {
  totalSpend = 0,
  totalRevenue = 0,
  totalConversions = 0,
  avgCPC = 0,
  topDevelopment = null,
  marketingData = [],
  channelData = [],
  budgetItems = [],
  budgetInsight = "",
  insights = DEFAULT_INSIGHTS,
  dateRange = "",
  } = data || {};

  const grid = {
  display: "grid",
  gap:  T.gap,
  };

  return (
  <motion.div
  key="performance"
  variants={tabVariants}
  initial="hidden"
  animate="show"
  exit="exit"
  style={{ display: "flex", flexDirection: "column", gap: 24 }}
  >
  {/* ── Row 1  -  KPI cards (no visual number, consistent with Agent Zone) ── */}
  <section>
  <RowLabel>Key Performance Indicators</RowLabel>
  <div style={{ ...grid, gridTemplateColumns: "repeat(5, 1fr)" }}>
  <KPICard
  value={Math.round(totalSpend)}
  label="Total Spend"
  prefix="$"
  hideTrend
  subText="Period total"
  icon={<DollarSign size={16} color={T.teal} />}
  delay={d(0)}
  animate
  />
  <KPICard
  value={Math.round(totalRevenue)}
  label="Total Revenue"
  prefix="$"
  hideTrend
  subText="Stripe attributed"
  icon={<DollarSign size={16} color={T.teal} />}
  delay={d(0.5)}
  animate
  />
  <KPICard
  value={totalConversions}
  label="Total Conversions"
  hideTrend
  subText="Calls, Email & Form Enquiries"
  icon={<Target size={16} color={T.teal} />}
  delay={d(1)}
  animate
  info="Conversions represent calls, WhatsApp messages, and form enquiries."
  />
  <KPICard
  value={Math.round(avgCPC)}
  label="Avg. Cost per Conversion"
  prefix="$"
  hideTrend
  subText="Primary programs only"
  icon={<TrendingDown size={16} color={T.teal} />}
  delay={d(2)}
  animate
  />
  {topDevelopment ? (
  <motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d(3) }}
  whileHover="hovered"
  style={{ ...GLASS, padding: "2rem 2.25rem", position: "relative", cursor: "default" }}
  >
  <motion.div
  style={{ position: "absolute", inset: 0, borderRadius: T.radius, pointerEvents: "none" }}
  variants={{ hovered: { boxShadow: "0 0 28px 4px rgba(0,180,166,0.14), inset 0 0 0 1px rgba(0,180,166,0.3)" } }}
  transition={{ duration: 0.25 }}
  />
  <div style={{
  width: 36, height: 36, borderRadius: 10,
  background: "rgba(0,180,166,0.12)", border: "1px solid rgba(0,180,166,0.25)",
  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
  }}>
  <Trophy size={16} color={T.teal} />
  </div>
  <p style={{ fontSize: "2.2rem", fontWeight: 700, color: T.white, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 4 }}>
  {topDevelopment}
  </p>
  <p style={{ fontSize: "0.72rem", fontWeight: 500, color: T.dimmer, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
  Top Performing Program
  </p>
  <div style={{ height: 1, background: `linear-gradient(to right, ${T.gold}, transparent)`, marginBottom: "1rem" }} />
  <p style={{ fontSize: "0.72rem", color: "#555" }}>Based on total enquiries</p>
  </motion.div>
  ) : (
  <KPICard
  value={0}
  label="Top Program"
  hideTrend
  subText="No conversions yet"
  icon={<Trophy size={16} color={T.teal} />}
  delay={d(3)}
  animate
  />
  )}
  </div>
  </section>

  {/* ── Row 2  -  Spend Allocation + Channel Performance ─────────────────── */}
  <section>
  <RowLabel>Spend Allocation / Channel Performance</RowLabel>
  <div style={{ ...grid, gridTemplateColumns: "58fr 42fr", alignItems: "stretch" }}>
  {/* Left column  -  Spend donut + Budget Pacing */}
  <div style={{ display: "flex", flexDirection: "column", gap: T.gap }}>
  <BentoCell delay={d(4)}>
  <SpendBreakdownChart data={marketingData} />
  </BentoCell>
  <BentoCell delay={d(5)}>
  <BudgetPacingCard
  actualSpend={totalSpend}
  monthlyBudget={(budgetItems[0]?.monthlyEstimate) || 15000}
  dailyBudget={(budgetItems[0]?.dailyBudget) || 500}
  />
  </BentoCell>
  </div>

  {/* Right column  -  Channel Performance (2-col grid so Webinar/Outbound
        sit beside Meta/Google instead of stacking and leaving a big gap)
        + Daily Budget below */}
  <div style={{ display: "flex", flexDirection: "column", gap: T.gap }}>
  <BentoCell delay={d(6)}>
  <div
  style={{
  display: "grid",
  gridTemplateColumns: channelData.length >= 2 ? "repeat(2, 1fr)" : "1fr",
  gap: T.gap,
  alignItems: "stretch",
  }}
  >
  {channelData.length > 0 ? (
  channelData.map((ch) => (
  <ChannelCard key={ch.channel} channel={ch} />
  ))
  ) : (
  <p style={{ fontSize: 13, color: T.dim, padding: 24 }}>No channel data available.</p>
  )}
  </div>
  </BentoCell>
  <BentoCell delay={d(7)}>
  <DailyBudgetPanel items={budgetItems} />
  </BentoCell>
  </div>
  </div>
  </section>

  {/* ── Row 3  -  3 Key Insights ───────────────────────────────────────── */}
  <section>
  <RowLabel>Key Insights</RowLabel>
  <GlassCard delay={d(8)} padding={28}>
  <div
  style={{
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 0,
  }}
  >
  {insights.map((ins, i) => (
  <div
  key={ins.number}
  style={{
  padding: i === 0 ? "4px 24px 4px 0" : i === insights.length - 1 ? "4px 0 4px 24px" : "4px 24px",
  borderLeft: i === 0 ? "none" : `1px solid ${T.goldDim}`,
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
  }}
  >
  <div
  style={{
  flexShrink: 0,
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "rgba(0, 180, 166, 0.15)",
  border: "1px solid rgba(0, 180, 166, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  }}
  >
  <span style={{ color: T.teal, fontSize: 13, fontWeight: 700 }}>
  {ins.number}
  </span>
  </div>
  <div>
  <h3 style={{ color: T.white, fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
  {ins.title}
  </h3>
  <p style={{ color: T.muted, fontSize: 12.5, lineHeight: 1.6 }}>
  {ins.description}
  </p>
  </div>
  </div>
  ))}
  </div>
  </GlassCard>
  </section>

  {/* ── Row 4  -  Spend by Channel + Investment Strategy ───────────────── */}
  <section>
  <RowLabel>Spend by Channel / Investment Strategy</RowLabel>
  <div style={{ ...grid, gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
  <BentoCell delay={d(11)}>
  <ChannelSpendChart data={channelData} />
  </BentoCell>
  <InvestmentStrategyCard
  performanceData={{ channelData, budgetItems, budgetInsight }}
  delay={d(12)}
  />
  </div>
  </section>
  </motion.div>
  );
};

// ─── Tab 2: Intelligence ───────────────────────────────────────────────────────

const IntelligenceTab = ({ data }) => {
  const {
  rawCampaignCRows = [],
  rawCampaignRows  = [],
  searchData  = [],
  geoData  = [],
  marketingData  = [],
  dateRange  = "",
  } = data || {};

  const impr = useImpressionStats(rawCampaignCRows);

  const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;

  const grid = { display: "grid", gap: T.gap };

  return (
  <motion.div
  key="intelligence"
  variants={tabVariants}
  initial="hidden"
  animate="show"
  exit="exit"
  style={{ display: "flex", flexDirection: "column", gap: 24 }}
  >
  {/* ── Row 1  -  Impression Share stat cards ──────────────────────────── */}
  <section>
  <RowLabel>Impression Share: Search Visibility</RowLabel>
  <div style={{ ...grid, gridTemplateColumns: "repeat(3, 1fr)" }}>
  <ImpressionStatCard
  label="Avg. Impression Share"
  value={impr ? fmtPct(impr.avgImprShare) : "-"}
  description="Percentage of eligible search impressions captured. Higher is better - reflects overall search presence."
  alarming={false}
  delay={d(0)}
  
  />
  <ImpressionStatCard
  label="Lost to Budget"
  value={impr ? fmtPct(impr.avgBudget) : "-"}
  description="Impressions missed because daily budget ran out. Reducing this recovers high-intent buyer queries."
  alarming={impr ? impr.avgBudget > 0.15 : false}
  delay={d(1)}
  />
  <ImpressionStatCard
  label="Lost to Rank"
  value={impr ? fmtPct(impr.avgRank) : "-"}
  description="Impressions missed due to ad quality or bid rank. Optimising Quality Score reduces this loss."
  alarming={impr ? impr.avgRank > 0.15 : false}
  delay={d(2)}
  />
  </div>
  </section>

  {/* ── Row 2  -  Spend vs Conversions + Search Intent ──────────────────── */}
  <section>
  <RowLabel>Campaign Performance / Search Intent</RowLabel>
  <div style={{ ...grid, gridTemplateColumns: "55fr 45fr", alignItems: "start" }}>
  {/* Left  -  Spend vs Conversions + Cost per Conversion trend */}
  <div style={{ display: "flex", flexDirection: "column", gap: T.gap }}>
  <BentoCell delay={d(3)}>
  <BarChartComparison data={marketingData} dateRange={dateRange} />
  </BentoCell>
  <BentoCell delay={d(4)}>
  <CostPerConversionTrend rows={rawCampaignRows} />
  </BentoCell>
  </div>

  {/* Right  -  Search Intent Donut + Geographic Demand */}
  <div style={{ display: "flex", flexDirection: "column", gap: T.gap }}>
  <BentoCell delay={d(5)}>
  <SearchIntentDonut data={searchData} />
  </BentoCell>
  <BentoCell delay={d(6)}>
  <GeographicDemandSnapshot data={geoData} />
  </BentoCell>
  </div>
  </div>
  </section>

  {/* ── Row 3  -  Top Queries + Query Table ────────────────────────────── */}
  <section>
  <RowLabel>Search Query Analysis</RowLabel>
  <div style={{ ...grid, gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
  <BentoCell delay={d(7)}>
  <SearchQueryChart data={searchData} />
  </BentoCell>
  <BentoCell delay={d(8)}>
  <SearchQueryTable data={searchData} />
  </BentoCell>
  </div>
  </section>

  {/* ── Row 4  -  Search insight callout ───────────────────────────────── */}
  <section>
  <BentoCell delay={d(9)}>
  <SearchDemandInsight data={searchData} />
  </BentoCell>
  </section>
  </motion.div>
  );
};

// ─── Tab switcher ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "performance",  label: "Performance" },
  { id: "intelligence", label: "Intelligence" },
];

const TabBar = ({ active, onSwitch }) => (
  <div style={{
  display:  "flex",
  alignItems:  "center",
  gap:  6,
  marginBottom:  28,
  padding:  "8px 12px",
  borderRadius:  12,
  background:  "rgba(10,10,10,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border:  `1px solid ${T.goldDim}`,
  width:  "fit-content",
  }}>
  {TABS.map((tab) => {
  const isActive = active === tab.id;
  return (
  <button
  key={tab.id}
  onClick={() => onSwitch(tab.id)}
  style={{
  padding:  "7px 20px",
  borderRadius:  8,
  fontSize:  13,
  fontWeight:  600,
  fontFamily:  "'Inter', system-ui, sans-serif",
  cursor:  "pointer",
  border:  isActive ? "none" : `1px solid ${T.goldDim}`,
  background:  isActive ? T.teal : "transparent",
  color:  isActive ? T.white : T.dim,
  letterSpacing: "0.02em",
  transition:  "all 0.18s ease",
  outline:  "none",
  }}
  >
  {tab.label}
  </button>
  );
  })}
  </div>
);

// ─── DigitalZoneBento  -  main export ───────────────────────────────────────────

const DigitalZoneBento = ({ performanceData = {}, intelligenceData = {} }) => {
  const [activeTab, setActiveTab] = useState("performance");

  return (
  <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
  <TabBar active={activeTab} onSwitch={setActiveTab} />

  <AnimatePresence mode="wait">
  {activeTab === "performance" ? (
  <PerformanceTab key="perf" data={performanceData} />
  ) : (
  <IntelligenceTab key="intel" data={intelligenceData} />
  )}
  </AnimatePresence>
  </div>
  );
};

export default DigitalZoneBento;
