import { Progress } from "@/components/ui/progress";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  actualSpend: number;
  monthlyBudget: number;
  dailyBudget: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const BudgetPacingCard = ({ actualSpend, monthlyBudget, dailyBudget }: Props) => {
  const pctUsed = monthlyBudget > 0 ? Math.min((actualSpend / monthlyBudget) * 100, 100) : 0;
  const remaining = Math.max(monthlyBudget - actualSpend, 0);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const expectedPct = (dayOfMonth / daysInMonth) * 100;

  const pacingStatus = pctUsed > expectedPct + 10
    ? 'Over-pacing'
    : pctUsed < expectedPct - 10
    ? 'Under-pacing'
    : 'On track';

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <h3 className="text-lg font-semibold mb-1" style={{ color: "#ffffff" }}>Budget Pacing</h3>
      <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>
        {formatCurrency(dailyBudget)}/day · {formatCurrency(monthlyBudget)}/month target
      </p>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span style={{ color: "rgba(255,255,255,0.6)" }}>Spent this period</span>
          <span className="font-semibold" style={{ color: "#ffffff" }}>{formatCurrency(actualSpend)}</span>
        </div>
        <Progress value={pctUsed} className="h-3" />
        <div className="flex justify-between text-sm">
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{pctUsed.toFixed(1)}% of budget used</span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{formatCurrency(remaining)} remaining</span>
        </div>
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(135, 127, 73, 0.3)" }}>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${pacingStatus === 'Over-pacing' ? 'status-dot-pulse' : ''}`}
            style={{ background: pacingStatus === 'On track' ? '#00B4A6' : '#877F49' }}
          />
          <span className="text-sm font-medium" style={{ color: "#ffffff" }}>{pacingStatus}</span>
          <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Expected: ~{expectedPct.toFixed(0)}% by day {dayOfMonth}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetPacingCard;
