import { TrendingUp } from "lucide-react";
import { SearchQueryData, getTotalBrandedConversions, getTotalGenericConversions } from "@/data/searchQueryData";
import { GLASS_CARD_STYLE } from "@/lib/glassStyles";

interface Props {
  data: SearchQueryData[];
}

const SearchDemandInsight = ({ data }: Props) => {
  const brandedConversions = getTotalBrandedConversions(data);
  const genericConversions = getTotalGenericConversions(data);
  const totalConversions = brandedConversions + genericConversions;

  return (
    <div className="p-5 flex gap-4" style={{ ...GLASS_CARD_STYLE, border: "1px solid rgba(0, 180, 166, 0.3)" }}>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0, 180, 166, 0.15)" }}>
          <TrendingUp className="w-4 h-4" style={{ color: "#00B4A6" }} />
        </div>
      </div>
      <div className="leading-relaxed space-y-3" style={{ color: "#cccccc" }}>
        <p><strong style={{ color: "#ffffff" }}>Branded searches drive qualified enquiries:</strong> A significant portion of conversions come from buyers searching directly for developments like "59 East Hertford" and "25 St Audley". This confirms strong existing market awareness and buyer intent for these properties.</p>
        <p><strong style={{ color: "#ffffff" }}>High-intent generic searches confirm active research:</strong> Searches such as "houses for sale in Hillside" and "4 bedroom house for sale downtown" indicate buyers actively researching the market with clear purchase intent.</p>
        <p><strong style={{ color: "#ffffff" }}>Broader searches support early discovery:</strong> General queries like "new developments in Hillside" represent buyers in the early research phase. Marketing presence on these terms builds awareness.</p>
      </div>
    </div>
  );
};

export default SearchDemandInsight;
