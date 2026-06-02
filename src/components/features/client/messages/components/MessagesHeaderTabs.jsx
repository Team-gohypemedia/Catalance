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
      <div className="inline-flex items-center rounded-full border border-border bg-background p-1 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={() => onTabChange("messages")}
          className={cn(
            "rounded-full px-6 py-2 text-[0.95rem] font-semibold transition-colors",
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
            "rounded-full px-6 py-2 text-[0.95rem] font-semibold transition-colors",
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
