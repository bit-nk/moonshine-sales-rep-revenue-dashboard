import { useMemo } from "react";
import { toNumber } from "@/lib/csvParser";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  rows: Record<string, string>[];
}

const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;

const ImpressionSharePanel = ({ rows }: Props) => {
  const data = useMemo(() => {
    let totalImpressions = 0;
    let totalImprShareSum = 0;
    let totalBudgetLossSum = 0;
    let totalRankLossSum = 0;
    let rowCount = 0;

    for (const row of rows) {
      const imprShare = row['Search Impr. Share'] || row['Search Impr. share'] || row['Search impr. share'] || row['Impr. share'] || '';
      const budgetLoss = row['Search Lost IS (Budget)'] || row['Search Lost IS (budget)'] || row['Search lost IS (budget)'] || '';
      const rankLoss = row['Search Lost IS (Rank)'] || row['Search Lost IS (rank)'] || row['Search lost IS (rank)'] || '';

      if (!imprShare && !budgetLoss && !rankLoss) continue;

      const parsePercent = (v: string) => {
        if (!v || v === '--' || v === '< 10%') return 0;
        return toNumber(v.replace('%', '')) / 100;
      };

      totalImprShareSum += parsePercent(imprShare);
      totalBudgetLossSum += parsePercent(budgetLoss);
      totalRankLossSum += parsePercent(rankLoss);
      totalImpressions += toNumber(row['Impressions'] || '0');
      rowCount++;
    }

    if (rowCount === 0) return null;

    return {
      avgImprShare: totalImprShareSum / rowCount,
      avgBudgetLoss: totalBudgetLossSum / rowCount,
      avgRankLoss: totalRankLossSum / rowCount,
      totalImpressions,
    };
  }, [rows]);

  if (!data) {
    return (
      <div className="p-6" style={GLASS_CARD_STYLE}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Impression Share Analysis</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Impression share data not available in current dataset.</p>
      </div>
    );
  }

  const metrics = [
    { label: 'Avg. Impression Share', value: formatPct(data.avgImprShare), description: 'Percentage of eligible impressions captured' },
    { label: 'Lost to Budget', value: formatPct(data.avgBudgetLoss), description: 'Impressions missed due to budget constraints' },
    { label: 'Lost to Rank', value: formatPct(data.avgRankLoss), description: 'Impressions missed due to ad rank' },
  ];

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#ffffff" }}>Impression Share Analysis</h3>
      <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>How much of the available search market is being captured</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{m.label}</p>
            <p className="text-2xl font-bold" style={{ color: "#ffffff" }}>{m.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImpressionSharePanel;
