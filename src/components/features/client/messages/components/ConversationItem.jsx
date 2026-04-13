import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import {
  formatConversationTimestamp,
  getFirstNonEmptyText,
  getConversationKey,
  getInitials,
  getMessagePreview,
} from "../utils";

const ConversationItem = React.memo(function ConversationItem({
  conversation,
  isActive,
  onSelect,
  unreadCount = 0,
  showOnline = false,
}) {
  const projectName = getFirstNonEmptyText(
    conversation?.businessName,
    conversation?.projectTitle,
    conversation?.label,
    "Project chat",
  );
  const serviceTypeLabel = getFirstNonEmptyText(
    conversation?.serviceType,
    conversation?.projectServiceLabel,
    conversation?.label,
    "Project chat",
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      data-conversation-key={getConversationKey(conversation)}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-[18px] border bg-card px-4 py-3.5 text-left transition",
        isActive
          ? "border-[#ffc107]/60 text-white shadow-[0_0_0_1px_rgba(255,193,7,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-white/[0.06] text-white hover:border-white/[0.08]",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className={cn("size-12 border", isActive ? "border-white/[0.12]" : "border-white/10")}>
          <AvatarImage src={conversation.avatar || undefined} alt={projectName} />
          <AvatarFallback className="bg-[#2b2b31] text-sm font-semibold text-white">
            {getInitials(projectName)}
          </AvatarFallback>
        </Avatar>
        {showOnline ? (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#171717] bg-[#22c55e]" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "truncate text-[0.98rem] font-semibold",
              isActive ? "text-[#ffc107]" : "text-white",
            )}
          >
            {projectName}
          </p>
          <span
            className="shrink-0 text-[11px] text-muted-foreground"
          >
            {formatConversationTimestamp(conversation.lastActivity)}
          </span>
        </div>

        <p className="mt-1 truncate text-[13px] text-muted-foreground">
          {serviceTypeLabel}
        </p>

        <p
          className="mt-0.5 truncate text-sm text-muted-foreground"
        >
          {getMessagePreview(conversation)}
        </p>
      </div>

      {unreadCount > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  );
});

export default ConversationItem;
