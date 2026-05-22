import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface KPICardProps {
  label: string;
  value: string;
  sublabel?: string;
  variant?: 'default' | 'highlight';
}

const KPICard = ({ label, value, sublabel, variant = 'default' }: KPICardProps) => {
  const style = variant === 'highlight'
    ? { ...GLASS_CARD_STYLE, background: "rgba(0, 180, 166, 0.25)", border: "1px solid rgba(0, 180, 166, 0.5)" }
    : GLASS_CARD_STYLE;

  return (
    <div className="p-6 transition-all" style={style}>
      <p className="text-sm font-medium uppercase tracking-wide mb-2" style={{ color: variant === 'highlight' ? "#00B4A6" : "rgba(255,255,255,0.6)" }}>
        {label}
      </p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
        {value}
      </p>
      {sublabel && (
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          {sublabel}
        </p>
      )}
    </div>
  );
};

export default KPICard;
