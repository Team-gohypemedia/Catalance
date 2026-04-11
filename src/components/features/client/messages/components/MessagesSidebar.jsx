import React, { useDeferredValue, useMemo, useState } from "react";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Search from "lucide-react/dist/esm/icons/search";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import X from "lucide-react/dist/esm/icons/x";
import { Input } from "@/components/ui/input";
import ConversationItem from "./ConversationItem";
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
    <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-card lg:w-[360px] lg:border-b-0 lg:border-r lg:border-white/[0.06]">
      <div className="px-4 pb-5 pt-5 md:px-6 md:pb-5 md:pt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-[#6b7280]" />
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
            className="h-11 rounded-[16px] border-white/[0.1] bg-background/60 pl-11 text-sm text-white placeholder:text-[#646b77] focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.14] [&::-webkit-scrollbar-track]:bg-transparent">
        {loading ? (
          <div className="flex h-full min-h-[280px] items-center justify-center gap-3 text-sm text-[#8f96a3]">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading chats...</span>
          </div>
        ) : activeTab === "messages" ? (
          filteredConversations.length > 0 ? (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const conversationKey = conversation.serviceKey || conversation.id;
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
              <div className="rounded-full border border-white/[0.06] bg-[#202020] p-4 text-[#ffc107]">
                <Search className="size-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">
                No matching conversations
              </p>
              <p className="mt-2 text-sm text-[#8f96a3]">
                Try a different member name or project title.
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full border border-white/[0.06] bg-[#202020] p-4 text-[#ffc107]">
                <SendHorizontal className="size-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">
                {hasLockedAcceptedProjects
                  ? "Chats unlock after kickoff payment"
                  : "No conversations yet"}
              </p>
              <p className="mt-2 text-sm text-[#8f96a3]">
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
            <div className="rounded-full border border-white/[0.06] bg-[#202020] p-4 text-[#ffc107]">
              <Search className="size-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              No matching requests
            </p>
            <p className="mt-2 text-sm text-[#8f96a3]">
              Try a different freelancer name or request title.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="rounded-full border border-white/[0.06] bg-[#202020] p-4 text-[#ffc107]">
              <X className="size-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-white">
              No pending requests
            </p>
            <p className="mt-2 text-sm text-[#8f96a3]">
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
