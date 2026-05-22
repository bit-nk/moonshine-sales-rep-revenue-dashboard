import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  TrendingUp,
  Settings,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  Icon: LucideIcon;
}

// Dialer and NetSweep intentionally live on the Home tile grid only - they
// are accessed via in-place drilldown, not the sidebar.
const PRIMARY_NAV: NavItem[] = [
  { label: "Overview",            to: "/",             Icon: LayoutDashboard },
  { label: "Source Performance",  to: "/digital-zone", Icon: Megaphone },
  { label: "Leads and Agents",    to: "/agent-zone",   Icon: Users },
  { label: "Revenue Funnel",      to: "/sales-zone",   Icon: TrendingUp },
  { label: "Settings",            to: "/settings",     Icon: Settings },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  const renderItem = (item: NavItem) => {
    const active = pathname === item.to;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
          active
            ? "bg-white/10 text-white"
            : "text-white/65 hover:bg-white/[0.04] hover:text-white",
        )}
      >
        <item.Icon
          size={17}
          className={cn(
            "transition-colors",
            active ? "text-[#5BA3E8]" : "text-white/55 group-hover:text-white/80",
          )}
          strokeWidth={1.7}
        />
        <span className="text-sm font-medium">{item.label}</span>
        {active && (
          <span
            aria-hidden
            className="ml-auto w-1 h-5 rounded-full"
            style={{ background: "#5BA3E8", boxShadow: "0 0 8px rgba(91,163,232,0.6)" }}
          />
        )}
      </Link>
    );
  };

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-60 z-30 flex flex-col"
      style={{
        background: "rgba(7, 10, 26, 0.62)",
        backdropFilter: "blur(28px) saturate(160%)",
        WebkitBackdropFilter: "blur(28px) saturate(160%)",
        borderRight: "1px solid rgba(184, 212, 240, 0.14)",
      }}
    >
      {/* Brand - clicks back to Overview (and clears any in-page drilldown via URL) */}
      <Link to="/" className="block px-5 pt-6 pb-6 group">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center transition-shadow group-hover:shadow-[0_0_22px_rgba(91,163,232,0.55)]"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(91, 163, 232, 0.18)",
              border: "1px solid rgba(91, 163, 232, 0.45)",
              boxShadow: "0 0 16px rgba(91, 163, 232, 0.3)",
            }}
          >
            <Moon size={16} strokeWidth={1.8} color="#B8D4F0" />
          </div>
          <span
            className="text-lg font-bold tracking-[0.18em] transition-colors group-hover:text-white"
            style={{ color: "#E0E8F0", textShadow: "0 0 12px rgba(91,163,232,0.45)" }}
          >
            MOONSHINE
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-widest mt-2 pl-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Sales Lead CRM
        </p>
      </Link>

      {/* Section label */}
      <div className="px-5 pb-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(184, 212, 240, 0.5)" }}
        >
          App
        </p>
      </div>

      {/* Primary nav */}
      <nav className="px-3 space-y-0.5">
        {PRIMARY_NAV.map(renderItem)}
      </nav>

      <div className="flex-1" />
    </aside>
  );
}
