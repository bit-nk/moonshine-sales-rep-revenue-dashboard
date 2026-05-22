import { cn } from "@/lib/utils";

export type LeadTypeFilter = "all" | "inbound" | "outbound";

const OPTIONS: { value: LeadTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
];

interface Props {
  value: LeadTypeFilter;
  onChange: (v: LeadTypeFilter) => void;
}

export function LeadTypeToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-muted/30 p-0.5 gap-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
