import { useMemo, useState } from "react";
import { Users, Activity, PauseCircle, CheckCircle2 } from "lucide-react";
import { useLeadsData } from "@/hooks/useLeadsData";
import { glass } from "@/lib/glassStyles";
import LeadList from "./LeadList";

type Filter = "all" | "Active" | "Nurture" | "Closed";

export default function HubSpotDetail() {
  const { data: leads = [] } = useLeadsData();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    let active = 0, nurture = 0, closed = 0;
    for (const l of leads) {
      if (l.status === "Active")  active  += 1;
      if (l.status === "Nurture") nurture += 1;
      if (l.status === "Closed")  closed  += 1;
    }
    return { active, nurture, closed };
  }, [leads]);

  // In-progress = leads currently between New and Negotiation (i.e. Active or Nurture
  // statuses that are mid-funnel rather than closed).
  const inProgress = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.status !== "Closed" &&
          ["Contacted", "Qualified", "Demo Booked", "Demo Completed", "Negotiation"].includes(l.stage ?? ""),
      ).length,
    [leads],
  );

  const cards: { key: Filter; label: string; value: number; sub: string; color: string; Icon: typeof Users }[] = [
    { key: "all",     label: "All Leads",      value: leads.length, sub: "Lifetime pipeline", color: "#5BA3E8", Icon: Users },
    { key: "Active",  label: "Active",         value: counts.active, sub: "Working the deal", color: "#7AD4A2", Icon: Activity },
    { key: "Nurture", label: "In Progress",    value: inProgress,    sub: "Mid-funnel touchpoints", color: "#E8C46A", Icon: Activity },
    { key: "Closed",  label: "Closed",         value: counts.closed, sub: "Won + Lost", color: "#9CA3AF", Icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#E0E8F0", textShadow: "0 0 18px rgba(91,163,232,0.30)" }}>
          HubSpot
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(184,212,240,0.65)" }}>
          CRM - lead pipeline & stage tracking. Click a card to filter the lead list, click a lead row to see source, progress, qualification and notes.
        </p>
      </div>

      {/* Status / filter cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={glass("default", active ? "blue" : "none", "p-5 text-left group transition-all")}
              style={{
                borderColor: active ? `${c.color}99` : undefined,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (active) return;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                if (active) return;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <c.Icon size={14} strokeWidth={1.8} color={active ? c.color : "rgba(184,212,240,0.6)"} />
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: active ? c.color : "rgba(184,212,240,0.55)" }}
                >
                  {c.label}
                </span>
              </div>
              <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: "#ffffff" }}>
                {c.value.toLocaleString()}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(184,212,240,0.55)" }}>
                {c.sub}
              </p>
              {active && (
                <p className="text-[10px] mt-2 uppercase tracking-widest" style={{ color: c.color }}>
                  Filter applied ↓
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtered lead list */}
      <LeadList
        leads={
          filter === "all"
            ? leads
            : filter === "Nurture" // re-purposed as "in progress" in this view
            ? leads.filter(
                (l) =>
                  l.status !== "Closed" &&
                  ["Contacted", "Qualified", "Demo Booked", "Demo Completed", "Negotiation"].includes(l.stage ?? ""),
              )
            : leads.filter((l) => l.status === filter)
        }
        title="Leads"
        subtitle="Click any lead to see source, pipeline stage, qualification and notes."
        hideFilter
      />
    </div>
  );
}
