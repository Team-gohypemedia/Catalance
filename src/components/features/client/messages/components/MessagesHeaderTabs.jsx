import React from "react";
import { cn } from "@/shared/lib/utils";

const MessagesHeaderTabs = React.memo(function MessagesHeaderTabs({
  activeTab,
  onTabChange,
  messagesCount = 0,
  requestsCount = 0,
}) {
  return (
    <div className="flex items-center justify-end">
      <div className="inline-flex items-center gap-2 rounded-[32px] border border-border bg-background p-2 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={() => onTabChange("messages")}
          className={cn(
            "min-w-[164px] rounded-[26px] px-5 py-4 text-[1.02rem] font-semibold transition-colors",
            activeTab === "messages"
              ? "bg-[var(--primary)] text-white dark:text-[#141414]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Messages ({messagesCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("requests")}
          className={cn(
            "min-w-[164px] rounded-[26px] px-5 py-4 text-[1.02rem] font-semibold transition-colors",
            activeTab === "requests"
              ? "bg-[var(--primary)] text-white dark:text-[#141414]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Requests ({requestsCount})
        </button>
      </div>
    </div>
  );
});

export default MessagesHeaderTabs;
