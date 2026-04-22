import { useEffect, useState } from "react";
import X from "lucide-react/dist/esm/icons/x";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";

import { cn } from "@/shared/lib/utils";
import { API_BASE_URL } from "@/shared/lib/api-client";

export const CaseStudyPreviewCard = ({ 
  caseStudy, 
  index, 
  isActive, 
  onSelect, 
  onRemove,
  isReviewMode = false
}) => {
  const [ogImage, setOgImage] = useState(null);
  
  const title = String(caseStudy?.title || "").trim() || `Project ${index + 1}`;
  const initials = title.substring(0, 2).toUpperCase();
  const niche = String(caseStudy?.niche || "").trim() || "Niche not set";
  const role = String(caseStudy?.role || "").trim() || "Role not set";
  const timeline = String(caseStudy?.timeline || "").trim() || "Timeline not set";
  const budget = String(caseStudy?.budget || "").trim() ? `₹${caseStudy.budget}` : "Budget not set";

  useEffect(() => {
    let active = true;
    const url = String(caseStudy?.projectLink || "").trim();
    if (url) {
      fetch(`${API_BASE_URL}/marketplace/og-meta?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(res => {
          if (active && res?.data?.ogImage) {
            setOgImage(res.data.ogImage);
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [caseStudy?.projectLink]);

  return (
    <div
      onClick={isReviewMode ? undefined : onSelect}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[22px] border bg-[#121212] transition-all",
        !isReviewMode && "cursor-pointer hover:border-primary/50 hover:shadow-lg",
        isActive 
          ? "border-primary ring-1 ring-primary/25 bg-primary/5" 
          : "border-white/10"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
        {ogImage ? (
          <img src={ogImage} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-4xl font-bold text-white/20 tracking-widest">
            {initials}
          </div>
        )}
        
        {isActive && !isReviewMode && (
          <div className="absolute top-4 left-4 flex items-center justify-center rounded-full bg-primary text-black p-1 shadow-md">
            <CheckCircle2 className="w-5 h-5 fill-black stroke-primary" />
          </div>
        )}

        {!isReviewMode && onRemove && (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-4 right-4 flex items-center justify-center rounded-full bg-black/60 p-2 text-white/60 backdrop-blur-md transition-colors hover:bg-red-500/80 hover:text-white border border-white/10"
            aria-label="Remove case study"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h4 className="font-semibold text-lg text-white line-clamp-1">{title}</h4>
        
        <div className="flex flex-col gap-2 text-[13px] text-white/50">
          <div className="flex items-center justify-between">
            <span>Niche:</span>
            <span className="text-white/80 font-medium truncate ml-2 max-w-[60%]">{niche}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Role:</span>
            <span className="text-white/80 font-medium truncate ml-2 max-w-[60%] capitalize">{role.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Timeline:</span>
            <span className="text-white/80 font-medium truncate ml-2 max-w-[60%] capitalize">{timeline.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Budget:</span>
            <span className="text-primary font-medium truncate ml-2">{budget}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
