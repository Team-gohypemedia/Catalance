import React, { useDeferredValue, useMemo, useState } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import X from "lucide-react/dist/esm/icons/x";
import { Input } from "@/components/ui/input";
import ConversationItem from "./ConversationItem";
import { getConversationKey } from "../utils";
import RequestListItem from "./RequestListItem";

const MessagesSidebar = React.memo(function MessagesSidebar({
  activeTab,
  conversations,
  pendingRequests,
  loading,
  hasLockedAcceptedProjects,
  selectedConversationKey,
  selectedRequestId,
  onlineConversationKey,
  onConversationSelect,
  onRequestSelect,
}) {
  const [conversationSearch, setConversationSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const deferredConversationSearch = useDeferredValue(conversationSearch);
  const deferredRequestSearch = useDeferredValue(requestSearch);

  const filteredConversations = useMemo(() => {
    const query = deferredConversationSearch.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      String(conversation.searchText || "").includes(query),
    );
  }, [conversations, deferredConversationSearch]);

  const filteredRequests = useMemo(() => {
    const query = deferredRequestSearch.trim().toLowerCase();

    if (!query) {
      return pendingRequests;
    }

    return pendingRequests.filter((request) =>
      String(request.searchText || "").includes(query),
    );
  }, [deferredRequestSearch, pendingRequests]);

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card lg:w-[360px] lg:border-b-0 lg:border-r">
      <div className="px-4 pb-5 pt-5 md:px-6 md:pb-5 md:pt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={activeTab === "messages" ? conversationSearch : requestSearch}
            onChange={(event) =>
              activeTab === "messages"
                ? setConversationSearch(event.target.value)
                : setRequestSearch(event.target.value)
            }
            placeholder={
              activeTab === "messages" ? "Search chats..." : "Search requests..."
            }
            className="h-11 rounded-[16px] border-border bg-muted/50 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        {loading ? (
          <div className="flex h-full min-h-[280px] items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading chats...</span>
          </div>
        ) : activeTab === "messages" ? (
          filteredConversations.length > 0 ? (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const conversationKey = getConversationKey(conversation);
                const isActive = conversationKey === selectedConversationKey;

                return (
                  <ConversationItem
                    key={conversationKey}
                    conversation={conversation}
                    isActive={isActive}
                    onSelect={() => onConversationSelect(conversation)}
                    unreadCount={conversation.unreadCount}
                    showOnline={onlineConversationKey === conversationKey}
                  />
                );
              })}
            </div>
          ) : conversations.length > 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full border border-border bg-muted p-4 text-primary">
                <Search className="size-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-foreground">
                No matching conversations
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different member name or project title.
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full border border-border bg-muted p-4 text-primary">
                <SendHorizontal className="size-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-foreground">
                {hasLockedAcceptedProjects
                  ? "Chats unlock after kickoff payment"
                  : "No conversations yet"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasLockedAcceptedProjects
                  ? "Accepted projects will appear here after the initial 20% payment is completed."
                  : "Accepted collaborations and approved marketplace requests will appear here automatically."}
              </p>
            </div>
          )
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <RequestListItem
                key={request.id}
                request={request}
                isActive={String(request.id) === String(selectedRequestId)}
                onSelect={() => onRequestSelect(request.id)}
              />
            ))}
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full border border-border bg-muted p-4 text-primary">
              <Search className="size-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              No matching requests
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different freelancer name or request title.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full border border-border bg-muted p-4 text-primary">
              <X className="size-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">
              No pending requests
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              New marketplace requests you send will stay here until the freelancer
              responds.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
});

export default MessagesSidebar;

