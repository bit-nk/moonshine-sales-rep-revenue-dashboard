import { ChannelData, formatCurrency, formatNumber } from "@/data/channelData";
import { Target, Eye } from "lucide-react";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface ChannelCardProps {
  channel: ChannelData;
}

const ChannelCard = ({ channel }: ChannelCardProps) => {
  const isCapture = channel.role === 'capture';
  
  return (
    <div className="overflow-hidden" style={GLASS_CARD_STYLE}>
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(135, 127, 73, 0.3)", background: isCapture ? "rgba(0, 180, 166, 0.1)" : "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isCapture ? "rgba(0, 180, 166, 0.2)" : "rgba(255,255,255,0.08)" }}>
            {isCapture ? (
              <Target className="w-5 h-5" style={{ color: "#00B4A6" }} />
            ) : (
              <Eye className="w-5 h-5" style={{ color: "rgba(255,255,255,0.6)" }} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>{channel.channel}</h3>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: isCapture ? "#00B4A6" : "rgba(255,255,255,0.6)" }}>
              {isCapture ? "Demand Capture" : "Demand Creation"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Spend */}
      <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(135, 127, 73, 0.3)" }}>
        <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Spend to Date</p>
        <p className="text-3xl font-bold" style={{ color: "#ffffff" }}>{formatCurrency(channel.spend)}</p>
      </div>
      
      {/* Metrics */}
      <div className="px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
          Efficiency Context
        </p>
        <div className="grid grid-cols-1 gap-3">
          {channel.metrics.map((metric) => (
            <div key={metric.label} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{metric.label}</span>
              <span className="text-sm font-semibold" style={{ color: "#ffffff" }}>
                {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Role Description */}
      <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(135, 127, 73, 0.3)", background: "rgba(255,255,255,0.02)" }}>
        <p className="text-sm leading-relaxed" style={{ color: "#cccccc" }}>
          {channel.roleDescription}
        </p>
      </div>
    </div>
  );
};

export default ChannelCard;
