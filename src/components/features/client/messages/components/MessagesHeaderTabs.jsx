import React from "react";
import { cn } from "@/shared/lib/utils";

const MessagesHeaderTabs = React.memo(function MessagesHeaderTabs({
  activeTab,
  onTabChange,
  messagesCount,
  requestsCount,
}) {
  return (
    <div className="inline-flex h-auto w-full max-w-[22rem] flex-nowrap items-stretch gap-1 rounded-[32px] border border-border bg-background p-1 shadow-none sm:w-auto sm:max-w-none sm:gap-2 sm:p-1.5">
      <button
        type="button"
        onClick={() => onTabChange("messages")}
        className={cn(
          "h-10 min-w-0 basis-0 flex-1 whitespace-nowrap rounded-full border border-transparent px-4 text-center text-[0.72rem] font-semibold tracking-[-0.01em] transition sm:h-11 sm:basis-auto sm:flex-none sm:px-5 sm:text-[0.95rem] sm:tracking-normal",
          activeTab === "messages"
            ? "border-[#ffc107]/70 bg-[#ffc107] text-[#141414]"
            : "text-[#9ca3af] hover:text-white",
        )}
      >
        Messages ({messagesCount})
      </button>
      <button
        type="button"
        onClick={() => onTabChange("requests")}
        className={cn(
          "h-10 min-w-0 basis-0 flex-1 whitespace-nowrap rounded-full border border-transparent px-4 text-center text-[0.72rem] font-semibold tracking-[-0.01em] transition sm:h-11 sm:basis-auto sm:flex-none sm:px-5 sm:text-[0.95rem] sm:tracking-normal",
          activeTab === "requests"
            ? "border-[#ffc107]/70 bg-[#ffc107] text-[#141414]"
            : "text-[#9ca3af] hover:text-white",
        )}
      >
        Requests ({requestsCount})
      </button>
    </div>
  );
});

export default MessagesHeaderTabs;
