import React from "react";
import { cn } from "@/shared/lib/utils";
import {
  formatConversationTimestamp,
  getFirstNonEmptyText,
} from "../utils";

const RequestListItem = React.memo(function RequestListItem({
  request,
  isActive,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[20px] border px-4 py-4 text-left transition",
        isActive
          ? "border-[var(--primary)]/60 text-foreground dark:text-white bg-background/70 shadow-[0_0_0_1px_rgba(255,193,7,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-border text-foreground dark:border-transparent dark:text-white hover:border-border/80 dark:hover:border-white/[0.05] dark:hover:bg-white/[0.03] bg-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.98rem] font-semibold text-foreground dark:text-white">
            {getFirstNonEmptyText(
              request?.serviceTitle,
              request?.title,
              "Marketplace Request",
            )}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground dark:text-[#cbd5e1]">
            {getFirstNonEmptyText(request?.freelancerName, "Freelancer")}
          </p>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground/80 dark:text-[#7f8795]">
          {formatConversationTimestamp(request?.updatedAt || request?.createdAt)}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 rounded-[16px] bg-muted/60 dark:bg-white/[0.03] px-3 py-2 text-sm leading-6 text-muted-foreground dark:text-[#8f96a3]">
        {request?.requestMessage || request?.previewText || "Marketplace request"}
      </p>
    </button>
  );
});

export default RequestListItem;
