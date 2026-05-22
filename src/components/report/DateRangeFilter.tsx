import { useState } from "react";
import { format, subDays, subMonths, startOfYear } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type QuickFilter = "all" | "last_7" | "last_30" | "last_90" | "this_year";

export interface DateFilter {
  from: Date | undefined;
  to: Date | undefined;
  quickFilter: QuickFilter;
}

interface Props {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
  dataDateRange?: { min: Date; max: Date };
}

const quickFilters: { key: QuickFilter; label: string }[] = [
  { key: "last_7", label: "7D" },
  { key: "last_30", label: "30D" },
  { key: "last_90", label: "90D" },
  { key: "this_year", label: "YTD" },
  { key: "all", label: "ALL" },
];

export function getDateFilterRange(
  filter: DateFilter,
  maxDate?: Date
): { from: Date | undefined; to: Date | undefined } {
  if (filter.from && filter.to) return { from: filter.from, to: filter.to };
  if (filter.quickFilter === "all") return { from: undefined, to: undefined };
  const refDate = maxDate || new Date();
  if (filter.quickFilter === "last_7") {
    return { from: subDays(refDate, 7), to: refDate };
  }
  if (filter.quickFilter === "last_30") {
    return { from: subDays(refDate, 30), to: refDate };
  }
  if (filter.quickFilter === "last_90") {
    return { from: subDays(refDate, 90), to: refDate };
  }
  if (filter.quickFilter === "this_year") {
    return { from: startOfYear(refDate), to: refDate };
  }
  return { from: filter.from, to: filter.to };
}

const DateRangeFilter = ({ value, onChange, dataDateRange }: Props) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleQuick = (key: QuickFilter) => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onChange({ from: undefined, to: undefined, quickFilter: key });
  };

  const handleCustomDate = (type: "from" | "to", date: Date | undefined) => {
    if (type === "from") {
      setDateFrom(date);
      if (date && dateTo) {
        onChange({ from: date, to: dateTo, quickFilter: "all" });
      }
    } else {
      setDateTo(date);
      if (dateFrom && date) {
        onChange({ from: dateFrom, to: date, quickFilter: "all" });
      }
    }
  };

  const clearCustomDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onChange({ from: undefined, to: undefined, quickFilter: value.quickFilter });
  };

  const isCustomActive = !!(dateFrom || dateTo);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Quick filters */}
      <div className="flex items-center gap-1.5">
        {quickFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleQuick(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-150 border",
              value.quickFilter === f.key && !isCustomActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date range picker */}
      <div className="flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("text-xs gap-1.5 h-7", dateFrom && "text-foreground border-primary/50")}>
              <CalendarIcon className="h-3 w-3" />
              {dateFrom ? format(dateFrom, "d MMM") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={(d) => handleCustomDate("from", d)}
              className="p-3 pointer-events-auto"
              disabled={(date) => {
                if (!dataDateRange) return false;
                return date < dataDateRange.min || date > dataDateRange.max;
              }}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("text-xs gap-1.5 h-7", dateTo && "text-foreground border-primary/50")}>
              <CalendarIcon className="h-3 w-3" />
              {dateTo ? format(dateTo, "d MMM") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={(d) => handleCustomDate("to", d)}
              className="p-3 pointer-events-auto"
              disabled={(date) => {
                if (!dataDateRange) return false;
                return date < dataDateRange.min || date > dataDateRange.max;
              }}
            />
          </PopoverContent>
        </Popover>
        {isCustomActive && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={clearCustomDates}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
