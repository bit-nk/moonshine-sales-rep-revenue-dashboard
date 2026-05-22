import { SearchQueryData } from "@/data/searchQueryData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

interface Props {
  data: SearchQueryData[];
}

const SearchQueryTable = ({ data: rawData }: Props) => {
  const data = rawData.slice(0, 10);

  return (
    <div className="overflow-hidden" style={GLASS_CARD_STYLE}>
      <div className="p-6" style={{ borderBottom: "1px solid rgba(135, 127, 73, 0.3)" }}>
        <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>Search Query Performance</h3>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>Top queries by spend (Year-to-Date 2026)</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow style={{ background: "rgba(255,255,255,0.05)" }}>
            <TableHead className="font-semibold" style={{ color: "#ffffff" }}>Search Query</TableHead>
            <TableHead className="text-right font-semibold" style={{ color: "#ffffff" }}>Spend</TableHead>
            <TableHead className="text-right font-semibold" style={{ color: "#ffffff" }}>Conversions</TableHead>
            <TableHead className="font-semibold" style={{ color: "#ffffff" }}>Intent Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index} className="transition-colors" style={{ borderBottom: "1px solid rgba(135, 127, 73, 0.15)" }}>
              <TableCell className="font-medium max-w-[280px]" style={{ color: "#ffffff" }}>
                <span className="block truncate" title={item.query}>"{item.query}"</span>
              </TableCell>
              <TableCell className="text-right tabular-nums" style={{ color: "#cccccc" }}>{formatCurrency(item.spend)}</TableCell>
              <TableCell className="text-right tabular-nums">
                <span style={{ color: item.conversions > 0 ? "#00B4A6" : "rgba(255,255,255,0.6)" }} className={item.conversions > 0 ? "font-semibold" : ""}>{item.conversions > 0 ? item.conversions.toFixed(1) : "-"}</span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                  background: item.queryType === 'Branded' ? "rgba(0, 180, 166, 0.15)" : "rgba(255,255,255,0.05)",
                  color: item.queryType === 'Branded' ? "#00B4A6" : "#cccccc",
                }}>{item.queryType === 'Branded' ? 'Branded' : 'High Intent'}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SearchQueryTable;
