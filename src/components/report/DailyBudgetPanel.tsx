import { GLASS_CARD_STYLE } from "@/lib/glassStyles";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BudgetItem {
  label: string;
  dailyBudget: number;
  monthlyEstimate: number;
}

interface Props {
  items?: BudgetItem[];
}

const defaultItems: BudgetItem[] = [
  { label: "Search Conversions  -  Consolidated (All Developments)", dailyBudget: 500, monthlyEstimate: 15000 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const DailyBudgetPanel = ({ items }: Props) => {
  const budgetItems = items && items.length > 0 ? items : defaultItems;
  const totalDaily = budgetItems.reduce((sum, item) => sum + item.dailyBudget, 0);
  const totalMonthly = budgetItems.reduce((sum, item) => sum + item.monthlyEstimate, 0);

  return (
  <div className="p-6 h-full" style={GLASS_CARD_STYLE}>
  <h3 className="text-lg font-semibold mb-5" style={{ color: "#ffffff" }}>Daily Budget Allocation (Current)</h3>
  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(135,127,73,0.3)" }}>
  <Table>
  <TableHeader>
  <TableRow className="border-b" style={{ borderColor: "rgba(135,127,73,0.3)" }}>
  <TableHead style={{ color: "rgba(255,255,255,0.6)" }} className="text-xs uppercase tracking-wider">Campaign</TableHead>
  <TableHead style={{ color: "rgba(255,255,255,0.6)" }} className="text-xs uppercase tracking-wider text-right">Daily</TableHead>
  <TableHead style={{ color: "rgba(255,255,255,0.6)" }} className="text-xs uppercase tracking-wider text-right">Monthly</TableHead>
  </TableRow>
  </TableHeader>
  <TableBody>
  {budgetItems.map((item, index) => (
  <TableRow
  key={index}
  className="border-b transition-colors"
  style={{ borderColor: "rgba(135,127,73,0.2)" }}
  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,180,166,0.06)"; }}
  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
  >
  <TableCell className="text-sm" style={{ color: "#ffffff" }}>{item.label}</TableCell>
  <TableCell className="text-sm text-right" style={{ color: "rgba(255,255,255,0.85)" }}>{formatCurrency(item.dailyBudget)}</TableCell>
  <TableCell className="text-sm text-right" style={{ color: "rgba(255,255,255,0.85)" }}>~{formatCurrency(item.monthlyEstimate)}</TableCell>
  </TableRow>
  ))}
  </TableBody>
  <TableFooter>
  <TableRow style={{ background: "rgba(0, 180, 166, 0.12)", borderTop: "1px solid rgba(0,180,166,0.35)" }}>
  <TableCell className="text-sm font-semibold" style={{ color: "#ffffff" }}>Total Paid Media Budget</TableCell>
  <TableCell className="text-sm font-bold text-right" style={{ color: "#00B4A6" }}>{formatCurrency(totalDaily)}</TableCell>
  <TableCell className="text-sm font-bold text-right" style={{ color: "#00B4A6" }}>~{formatCurrency(totalMonthly)}</TableCell>
  </TableRow>
  </TableFooter>
  </Table>
  </div>
  <p className="text-xs italic mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
  Budgets are capped to align with card limits while prioritising active developments. Actual spend may fluctuate slightly day-to-day based on auction dynamics but is controlled at a monthly level.
  </p>
  </div>
  );
};

export default DailyBudgetPanel;
