import React, { memo } from "react";
import { cn } from "@/shared/lib/utils";

const ProjectRedirectCard = memo(function ProjectRedirectCard({ item, className }) {
  return (
    <div
      onClick={item.onClick}
      className={cn(
        "group flex h-full w-full overflow-hidden rounded-[28px] border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card/40 hover:bg-primary/5 dark:border-primary/20 dark:hover:border-primary/40 dark:hover:bg-primary/10 transition-all duration-300 cursor-pointer flex-col items-center justify-center p-6 text-center shadow-none",
        className,
      )}
    >
      <div className="rounded-full bg-primary/10 p-4 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
        {item.Icon ? <item.Icon className="size-6" strokeWidth={2.5} /> : null}
      </div>
      <div className="mt-5 space-y-2">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          {item.title}
        </h3>
      </div>
    </div>
  );
});

export default ProjectRedirectCard;
