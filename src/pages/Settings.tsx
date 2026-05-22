import { useCallback, useState } from "react";
import {
  Save,
  Check,
  RefreshCw,
  Settings as SettingsIcon,
  Users,
  Megaphone,
  PhoneCall,
  ShieldCheck,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import AppShell from "@/components/moonlit/AppShell";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

type ConnectorId = "hubspot" | "meta" | "dialer" | "netsweep" | "stripe";

interface ConnectorConfig {
  id: ConnectorId;
  name: string;
  description: string;
  Icon: LucideIcon;
  accent: string;
  apiKeyMasked: string;
}

const CONNECTORS: ConnectorConfig[] = [
  {
  id: "hubspot",
  name: "HubSpot",
  description: "CRM · Lead pipeline & stage tracking",
  Icon: Users,
  accent: "#FF7A59",
  apiKeyMasked: "pat-na1-••••••••-••••-••••-••••-••••••••a32f",
  },
  {
  id: "meta",
  name: "Meta Marketing",
  description: "Paid ad ingestion · Audience & spend",
  Icon: Megaphone,
  accent: "#1877F2",
  apiKeyMasked: "EAAB••••••••••••••••••••••••••••••••••8q2L",
  },
  {
  id: "dialer",
  name: "Dialer",
  description: "REST API + webhook events",
  Icon: PhoneCall,
  accent: "#00B4A6",
  apiKeyMasked: "dlr_••••••••••••••••••••••••••••K9pX",
  },
  {
  id: "netsweep",
  name: "NetSweep",
  description: "Financial qualification signals",
  Icon: ShieldCheck,
  accent: "#D4B85A",
  apiKeyMasked: "ns_••••••••••••••••••••••••••mZ7r",
  },
  {
  id: "stripe",
  name: "Stripe",
  description: "Payments · Revenue attribution · Webhooks",
  Icon: CreditCard,
  accent: "#635BFF",
  apiKeyMasked: "rk_live_••••••••••••••••••••••••••••a8H1",
  },
];

const refreshOptions = [
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 0, label: "Manual only" },
];

const themeOptions = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "Match system" },
];

const dateFormats = [
  { value: "MM/DD/YYYY", example: "05/22/2026" },
  { value: "DD/MM/YYYY", example: "22/05/2026" },
  { value: "YYYY-MM-DD", example: "2026-05-22" },
  { value: "MMM DD, YYYY", example: "May 22, 2026" },
];

interface Settings {
  refreshInterval: number;
  uptimeWarning: number;
  latencyWarning: number;
  errorRateWarning: number;
  emailNotifications: boolean;
  slackNotifications: boolean;
  webhookUrl: string;
  theme: string;
  dateFormat: string;
  defaultPeriod: "today" | "this_week" | "month";
  enabled: Record<ConnectorId, boolean>;
}

const DEFAULTS: Settings = {
  refreshInterval: 30,
  uptimeWarning: 99.5,
  latencyWarning: 2.0,
  errorRateWarning: 5,
  emailNotifications: true,
  slackNotifications: false,
  webhookUrl: "",
  theme: "dark",
  dateFormat: "MMM DD, YYYY",
  defaultPeriod: "month",
  enabled: { hubspot: true, meta: true, dialer: true, netsweep: true, stripe: true },
};

interface RepDraft {
  name: string;
  email: string;
  phone: string;
  role: string;
  region: string;
}
interface RepRecord extends RepDraft {
  id: string;
  addedAt: string;
}

const EMPTY_REP: RepDraft = { name: "", email: "", phone: "", role: "Sales Rep", region: "Dallas" };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState<Record<ConnectorId, boolean>>({
  hubspot: false, meta: false, dialer: false, netsweep: false, stripe: false,
  });
  const [repDraft, setRepDraft] = useState<RepDraft>(EMPTY_REP);
  const [reps, setReps] = useState<RepRecord[]>([]);
  const [repError, setRepError] = useState<string | null>(null);

  const submitRep = () => {
    setRepError(null);
    if (!repDraft.name.trim()) { setRepError("Name is required."); return; }
    if (!repDraft.email.trim() || !/^.+@.+\..+$/.test(repDraft.email.trim())) {
      setRepError("A valid email is required."); return;
    }
    setReps((prev) => [
      {
        id: `r_${Date.now().toString(36)}`,
        addedAt: new Date().toISOString(),
        ...repDraft,
        name: repDraft.name.trim(),
        email: repDraft.email.trim(),
        phone: repDraft.phone.trim(),
        role: repDraft.role.trim() || "Sales Rep",
        region: repDraft.region.trim() || "Dallas",
      },
      ...prev,
    ]);
    setRepDraft(EMPTY_REP);
  };
  const removeRep = (id: string) => setReps((prev) => prev.filter((r) => r.id !== id));

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
  setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleConnector = useCallback((id: ConnectorId) => {
  setSettings((prev) => ({
  ...prev,
  enabled: { ...prev.enabled, [id]: !prev.enabled[id] },
  }));
  }, []);

  const refreshConnector = useCallback((id: ConnectorId) => {
  setRefreshing((prev) => ({ ...prev, [id]: true }));
  setTimeout(() => setRefreshing((prev) => ({ ...prev, [id]: false })), 2500);
  }, []);

  const handleSave = () => {
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
  };

  return (
  <AppShell maxWidth="max-w-5xl">
  <div className="space-y-6">
  {/* Header (no inner Back button - sidebar Overview link handles navigation) */}
  <div className="flex items-center justify-between gap-4">
  <div className="flex items-center gap-4">
  <div className="flex items-center gap-3">
  <div
  className="flex items-center justify-center"
  style={{
  width: 44,
  height: 44,
  borderRadius: 10,
  background: "rgba(156, 163, 175, 0.12)",
  border: "1px solid rgba(156, 163, 175, 0.4)",
  }}
  >
  <SettingsIcon size={22} color="#9CA3AF" />
  </div>
  <div>
  <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
  Settings
  </h1>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
  Connectors · Notifications · Theme &amp; preferences
  </p>
  </div>
  </div>
  </div>
  <button
  onClick={handleSave}
  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
  style={{
  background: saved ? "#00B4A6" : "#877F49",
  color: "#ffffff",
  }}
  >
  {saved ? <Check size={15} /> : <Save size={15} />}
  {saved ? "Saved" : "Save changes"}
  </button>
  </div>

  {/* Connector management */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Data Source Connectors
  </h2>
  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
  Toggle each connector, view its credential, and trigger a manual sync. Disabling a
  connector hides its tile and pauses ingestion.
  </p>
  <div className="space-y-3">
  {CONNECTORS.map((c) => {
  const enabled = settings.enabled[c.id];
  const isRefreshing = refreshing[c.id];
  return (
  <div
  key={c.id}
  className="flex items-center gap-4 rounded-lg px-4 py-3"
  style={{
  background: "rgba(20, 20, 20, 0.5)",
  border: "1px solid rgba(135, 127, 73, 0.3)",
  opacity: enabled ? 1 : 0.55,
  }}
  >
  <div
  className="flex items-center justify-center flex-shrink-0"
  style={{
  width: 36,
  height: 36,
  borderRadius: 8,
  background: `${c.accent}1A`,
  border: `1px solid ${c.accent}40`,
  }}
  >
  <c.Icon size={18} color={c.accent} />
  </div>
  <div className="flex-1 min-w-0">
  <div className="flex items-center gap-2">
  <h3 className="text-sm font-semibold" style={{ color: "#ffffff" }}>
  {c.name}
  </h3>
  <span
  className="text-[10px] px-1.5 py-0.5 rounded"
  style={{
  background: enabled ? "rgba(0, 180, 166, 0.15)" : "rgba(255,255,255,0.06)",
  color: enabled ? "#00B4A6" : "rgba(255,255,255,0.5)",
  }}
  >
  {enabled ? "Connected" : "Disabled"}
  </span>
  </div>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
  {c.description}
  </p>
  <p
  className="text-[11px] mt-1 font-mono tracking-tight truncate"
  style={{ color: "rgba(255,255,255,0.4)" }}
  >
  {c.apiKeyMasked}
  </p>
  </div>
  <button
  onClick={() => refreshConnector(c.id)}
  disabled={!enabled || isRefreshing}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  style={{
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(135, 127, 73, 0.45)",
  color: "#ffffff",
  }}
  >
  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
  {isRefreshing ? "Syncing…" : "Sync"}
  </button>
  {/* Toggle */}
  <button
  onClick={() => toggleConnector(c.id)}
  role="switch"
  aria-checked={enabled}
  className="flex-shrink-0 relative w-10 h-5 rounded-full transition-colors"
  style={{ background: enabled ? "#00B4A6" : "rgba(255,255,255,0.18)" }}
  >
  <span
  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
  style={{ left: enabled ? "22px" : "2px" }}
  />
  </button>
  </div>
  );
  })}
  </div>
  </div>

  {/* Add Sales Rep */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Sales Reps
  </h2>
  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
  Add a new sales rep. Records persist for this session only - production version will sync to HubSpot user provisioning.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
  <div className="md:col-span-2">
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Full name</label>
  <input
  type="text"
  value={repDraft.name}
  onChange={(e) => setRepDraft({ ...repDraft, name: e.target.value })}
  placeholder="e.g. Jordan Rivera"
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{ background: "rgba(20,20,20,0.85)", border: "1px solid rgba(135,127,73,0.45)", color: "#fff" }}
  />
  </div>
  <div className="md:col-span-2">
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Email</label>
  <input
  type="email"
  value={repDraft.email}
  onChange={(e) => setRepDraft({ ...repDraft, email: e.target.value })}
  placeholder="jordan@moonshine.tech"
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{ background: "rgba(20,20,20,0.85)", border: "1px solid rgba(135,127,73,0.45)", color: "#fff" }}
  />
  </div>
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Phone</label>
  <input
  type="tel"
  value={repDraft.phone}
  onChange={(e) => setRepDraft({ ...repDraft, phone: e.target.value })}
  placeholder="(214) 555-0100"
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{ background: "rgba(20,20,20,0.85)", border: "1px solid rgba(135,127,73,0.45)", color: "#fff" }}
  />
  </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
  <div className="md:col-span-2">
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Role</label>
  <select
  value={repDraft.role}
  onChange={(e) => setRepDraft({ ...repDraft, role: e.target.value })}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{ background: "rgba(20,20,20,0.85)", border: "1px solid rgba(135,127,73,0.45)", color: "#fff" }}
  >
  <option value="Sales Rep">Sales Rep</option>
  <option value="Senior Sales Rep">Senior Sales Rep</option>
  <option value="SDR">SDR</option>
  <option value="Account Executive">Account Executive</option>
  <option value="Sales Manager">Sales Manager</option>
  </select>
  </div>
  <div className="md:col-span-2">
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Region</label>
  <input
  type="text"
  value={repDraft.region}
  onChange={(e) => setRepDraft({ ...repDraft, region: e.target.value })}
  placeholder="Dallas"
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{ background: "rgba(20,20,20,0.85)", border: "1px solid rgba(135,127,73,0.45)", color: "#fff" }}
  />
  </div>
  <div className="flex items-end">
  <button
  type="button"
  onClick={submitRep}
  className="w-full text-sm font-semibold rounded px-3 py-2 transition-colors"
  style={{
  background: "rgba(91,163,232,0.20)",
  border: "1px solid rgba(91,163,232,0.55)",
  color: "#E0E8F0",
  boxShadow: "0 0 14px rgba(91,163,232,0.20)",
  }}
  >
  Add Sales Rep
  </button>
  </div>
  </div>

  {repError && (
  <p className="text-xs mb-3" style={{ color: "#EF6F5C" }}>{repError}</p>
  )}

  {reps.length > 0 && (
  <div className="mt-2 overflow-x-auto">
  <table className="w-full text-sm">
  <thead>
  <tr className="text-xs uppercase tracking-wider" style={{ color: "rgba(184,212,240,0.55)", borderBottom: "1px solid rgba(184,212,240,0.15)" }}>
  <th className="text-left py-2 pr-3">Name</th>
  <th className="text-left py-2 px-3">Email</th>
  <th className="text-left py-2 px-3">Phone</th>
  <th className="text-left py-2 px-3">Role</th>
  <th className="text-left py-2 px-3">Region</th>
  <th className="text-right py-2 pl-3 w-16"></th>
  </tr>
  </thead>
  <tbody>
  {reps.map((r) => (
  <tr key={r.id} style={{ borderBottom: "1px solid rgba(184,212,240,0.08)" }}>
  <td className="py-2.5 pr-3 font-medium" style={{ color: "#ffffff" }}>{r.name}</td>
  <td className="py-2.5 px-3" style={{ color: "rgba(184,212,240,0.85)" }}>{r.email}</td>
  <td className="py-2.5 px-3" style={{ color: "rgba(184,212,240,0.85)" }}>{r.phone || "-"}</td>
  <td className="py-2.5 px-3" style={{ color: "rgba(184,212,240,0.85)" }}>{r.role}</td>
  <td className="py-2.5 px-3" style={{ color: "rgba(184,212,240,0.85)" }}>{r.region}</td>
  <td className="py-2.5 pl-3 text-right">
  <button
  type="button"
  onClick={() => removeRep(r.id)}
  className="text-xs px-2 py-0.5 rounded transition-colors"
  style={{ background: "rgba(239,111,92,0.12)", border: "1px solid rgba(239,111,92,0.4)", color: "#EF6F5C" }}
  >
  Remove
  </button>
  </td>
  </tr>
  ))}
  </tbody>
  </table>
  </div>
  )}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Refresh + Thresholds */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Refresh &amp; Alert Thresholds
  </h2>
  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
  How frequently we re-poll connectors and when to warn the team
  </p>
  <div className="space-y-4">
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Refresh interval
  </label>
  <select
  value={settings.refreshInterval}
  onChange={(e) => update("refreshInterval", Number(e.target.value))}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20,20,20,0.85)",
  border: "1px solid rgba(135,127,73,0.45)",
  color: "#fff",
  }}
  >
  {refreshOptions.map((o) => (
  <option key={o.value} value={o.value}>{o.label}</option>
  ))}
  </select>
  </div>
  <div className="grid grid-cols-3 gap-3">
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Uptime ≥
  </label>
  <input
  type="number"
  step="0.1"
  min={0}
  max={100}
  value={settings.uptimeWarning}
  onChange={(e) => update("uptimeWarning", Number(e.target.value))}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20,20,20,0.85)",
  border: "1px solid rgba(135,127,73,0.45)",
  color: "#fff",
  }}
  />
  </div>
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Latency ≤ (s)
  </label>
  <input
  type="number"
  step="0.1"
  min={0}
  value={settings.latencyWarning}
  onChange={(e) => update("latencyWarning", Number(e.target.value))}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20,20,20,0.85)",
  border: "1px solid rgba(135,127,73,0.45)",
  color: "#fff",
  }}
  />
  </div>
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Error rate ≤ (%)
  </label>
  <input
  type="number"
  step="0.1"
  min={0}
  max={100}
  value={settings.errorRateWarning}
  onChange={(e) => update("errorRateWarning", Number(e.target.value))}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20,20,20,0.85)",
  border: "1px solid rgba(135,127,73,0.45)",
  color: "#fff",
  }}
  />
  </div>
  </div>
  </div>
  </div>

  {/* Notifications */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Notifications
  </h2>
  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
  Channels for delivery of alerts and webhook events
  </p>
  <div className="space-y-4">
  <ToggleRow
  label="Email alerts"
  description="High-priority alerts go to nkc@moonshine.tech"
  enabled={settings.emailNotifications}
  onToggle={() => update("emailNotifications", !settings.emailNotifications)}
  />
  <ToggleRow
  label="Slack alerts"
  description="Post to #sales-ops channel"
  enabled={settings.slackNotifications}
  onToggle={() => update("slackNotifications", !settings.slackNotifications)}
  />
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Outbound webhook URL
  </label>
  <input
  type="text"
  placeholder="https://example.com/webhook"
  value={settings.webhookUrl}
  onChange={(e) => update("webhookUrl", e.target.value)}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20,20,20,0.85)",
  border: "1px solid rgba(135,127,73,0.45)",
  color: "#fff",
  }}
  />
  </div>
  </div>
  </div>

  {/* Appearance */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Appearance
  </h2>
  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
  Theme &amp; date formatting
  </p>
  <div className="space-y-4">
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Theme
  </label>
  <div className="grid grid-cols-3 gap-2">
  {themeOptions.map((t) => (
  <button
  key={t.value}
  onClick={() => update("theme", t.value)}
  className="px-3 py-2 rounded-md text-xs font-medium transition-colors"
  style={{
  background: settings.theme === t.value ? "rgba(0,180,166,0.18)" : "rgba(255,255,255,0.04)",
  border: `1px solid ${settings.theme === t.value ? "#00B4A6" : "rgba(135,127,73,0.35)"}`,
  color: settings.theme === t.value ? "#00B4A6" : "rgba(255,255,255,0.8)",
  }}
  >
  {t.label}
  </button>
  ))}
  </div>
  </div>
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Date format
  </label>
  <select
  value={settings.dateFormat}
  onChange={(e) => update("dateFormat", e.target.value)}
  className="w-full text-sm rounded px-3 py-2 focus:outline-none focus:ring-2"
  style={{
  background: "rgba(20,20,20,0.85)",
  border: "1px solid rgba(135,127,73,0.45)",
  color: "#fff",
  }}
  >
  {dateFormats.map((d) => (
  <option key={d.value} value={d.value}>{d.value}  -  {d.example}</option>
  ))}
  </select>
  </div>
  </div>
  </div>

  {/* Defaults */}
  <div className="p-6" style={GLASS_CARD_STYLE}>
  <h2 className="text-base font-semibold mb-1" style={{ color: "#ffffff" }}>
  Defaults
  </h2>
  <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
  Initial values applied on dashboard load
  </p>
  <div className="space-y-4">
  <div>
  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
  Default time period
  </label>
  <div className="grid grid-cols-3 gap-2">
  {(["today", "this_week", "month"] as const).map((p) => (
  <button
  key={p}
  onClick={() => update("defaultPeriod", p)}
  className="px-3 py-2 rounded-md text-xs font-medium capitalize transition-colors"
  style={{
  background: settings.defaultPeriod === p ? "rgba(0,180,166,0.18)" : "rgba(255,255,255,0.04)",
  border: `1px solid ${settings.defaultPeriod === p ? "#00B4A6" : "rgba(135,127,73,0.35)"}`,
  color: settings.defaultPeriod === p ? "#00B4A6" : "rgba(255,255,255,0.8)",
  }}
  >
  {p.replace("_", " ")}
  </button>
  ))}
  </div>
  </div>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
  These settings persist only for the current session. Production version will write
  to user profile via the Next.js API layer.
  </p>
  </div>
  </div>
  </div>
  </div>
  </AppShell>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}
function ToggleRow({ label, description, enabled, onToggle }: ToggleRowProps) {
  return (
  <div className="flex items-center justify-between gap-3">
  <div className="flex-1 min-w-0">
  <p className="text-sm" style={{ color: "#ffffff" }}>{label}</p>
  <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{description}</p>
  </div>
  <button
  onClick={onToggle}
  role="switch"
  aria-checked={enabled}
  className="flex-shrink-0 relative w-10 h-5 rounded-full transition-colors"
  style={{ background: enabled ? "#00B4A6" : "rgba(255,255,255,0.18)" }}
  >
  <span
  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
  style={{ left: enabled ? "22px" : "2px" }}
  />
  </button>
  </div>
  );
}
