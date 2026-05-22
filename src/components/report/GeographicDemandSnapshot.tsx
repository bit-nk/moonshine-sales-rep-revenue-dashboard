import { useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";
import { LocationData, getTotalConversionsByLocation } from "@/data/geographicData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  data: LocationData[];
}

const GeographicDemandSnapshot = ({ data: locationData }: Props) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const totalConversions = getTotalConversionsByLocation(locationData);

  return (
    <div className="p-6" style={GLASS_CARD_STYLE}>
      <div className="pb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#ffffff" }}>
          <MapPin className="w-5 h-5" style={{ color: "#00B4A6" }} />
          Geographic Demand Snapshot
        </h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Enquiries are concentrated in high-value metro areas</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        <div className="flex-1 relative">
          <svg viewBox="0 0 100 85" className="w-full max-w-md mx-auto" style={{ height: "auto" }}>
            <path d="M15,35 Q20,25 35,22 Q50,18 65,22 Q80,28 85,40 Q88,55 82,65 Q75,75 60,78 Q45,82 30,78 Q18,72 12,60 Q8,48 15,35 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(135, 127, 73, 0.4)" strokeWidth="0.5" />
            <ellipse cx="60" cy="42" rx="12" ry="10" fill="rgba(0, 180, 166, 0.15)" stroke="#00B4A6" strokeWidth="0.8" strokeDasharray="2,1" />
            <text x="60" y="55" textAnchor="middle" className="text-[4px] font-medium" fill="#00B4A6">Metro Area</text>
            <TooltipProvider>
              {locationData.map((location) => (
                <Tooltip key={location.name}>
                  <TooltipTrigger asChild>
                    <g className="cursor-pointer transition-transform duration-200 hover:scale-110" onMouseEnter={() => setHoveredLocation(location.name)} onMouseLeave={() => setHoveredLocation(null)}>
                      <circle cx={location.coordinates.x} cy={location.coordinates.y} r={hoveredLocation === location.name ? 4 : 2.5} fill="rgba(0, 180, 166, 0.3)" className="animate-pulse" />
                      <circle cx={location.coordinates.x} cy={location.coordinates.y} r={hoveredLocation === location.name ? 2.5 : 1.8} fill="#00B4A6" stroke="rgba(20,20,20,0.8)" strokeWidth="0.5" />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-sm">
                    <div className="font-medium">{location.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.6)" }}>{location.conversions} conversions</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <g transform="translate(85, 75)">
              <circle r="4" fill="rgba(20,20,20,0.7)" stroke="rgba(135, 127, 73, 0.4)" strokeWidth="0.3" />
              <text textAnchor="middle" y="1.5" className="text-[3px] font-medium" fill="rgba(255,255,255,0.6)">N</text>
            </g>
          </svg>
        </div>
        <div className="lg:w-64 space-y-4">
          <div className="rounded-lg p-4" style={{ background: "rgba(0, 180, 166, 0.1)", border: "1px solid rgba(0, 180, 166, 0.25)" }}>
            <div className="text-2xl font-bold" style={{ color: "#00B4A6" }}>{totalConversions}</div>
            <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Total Metro Conversions</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium" style={{ color: "#ffffff" }}>Active Metro Areas</h4>
            {locationData.map((location) => (
              <div key={location.name} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md transition-colors" style={{ cursor: "pointer" }} onMouseEnter={() => setHoveredLocation(location.name)} onMouseLeave={() => setHoveredLocation(null)}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#00B4A6" }} />
                  <span style={{ color: "#ffffff" }}>{location.name}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{location.conversions}</span>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed pt-2" style={{ color: "rgba(255,255,255,0.6)", borderTop: "1px solid rgba(135, 127, 73, 0.3)" }}>Enquiries originate from established, high-value residential areas confirming marketing is reaching the intended buyer demographic.</p>
        </div>
      </div>
    </div>
  );
};

export default GeographicDemandSnapshot;
