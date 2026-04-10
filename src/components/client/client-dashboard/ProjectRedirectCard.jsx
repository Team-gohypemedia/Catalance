import React, { memo } from "react";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { DashboardPanel } from "./shared.jsx";
import { cn } from "@/shared/lib/utils";

const ProjectRedirectCard = memo(function ProjectRedirectCard({ item, className }) {
  return (
    <DashboardPanel
      className={cn(
        "flex min-h-[320px] flex-col justify-between overflow-hidden bg-card p-4 sm:p-5 xl:p-6",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <h3 className="w-full text-center text-[clamp(1.5rem,5vw,2.15rem)] font-semibold tracking-[-0.04em] text-white">
          {item.title}
        </h3>

        <div className="flex flex-1 items-center justify-center">
          {item.Icon ? (
            <button
              type="button"
              aria-label={item.title}
              onClick={item.onClick}
              className="inline-flex h-[104px] w-[104px] items-center justify-center rounded-[14px] border border-primary/30 bg-primary/20 text-primary transition-colors hover:bg-primary/28"
            >
              <item.Icon className="size-10" strokeWidth={2.6} />
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={item.onClick}
        className="inline-flex h-[58px] w-full shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[#ffc107] px-5 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#ffd54f]"
      >
        <span>{String(item.actionLabel || "").toUpperCase()}</span>
        <ChevronRight className="size-4" />
      </button>
    </DashboardPanel>
  );
});

export default ProjectRedirectCard;