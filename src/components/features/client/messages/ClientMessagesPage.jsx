import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientPageHeader from "@/components/features/client/ClientPageHeader";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import MessagesHeaderTabs from "./components/MessagesHeaderTabs";
import MessagesSidebar from "./components/MessagesSidebar";
import RequestDetailsPanel from "./components/RequestDetailsPanel";
import ChatArea from "./components/ChatArea";
import useClientMessagesBootstrap from "./hooks/useClientMessagesBootstrap";
import useConversationSession from "./hooks/useConversationSession";
import { getConversationKey, getDisplayName, getInitials } from "./utils";

const ClientMessagesPage = () => {
  const { user, authFetch, token, isAuthenticated, isLoading: authLoading } =
    useAuth();
  const { socket: notificationSocket, unreadCount } = useNotifications();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("messages");
  const [mobileDetailPane, setMobileDetailPane] = useState(null);

  const currentUserId = user?.id || null;
  const currentClientName = getDisplayName(user);
  const requestedProjectId = useMemo(
    () => searchParams.get("projectId"),
    [searchParams],
  );

  const {
    conversations,
    activeConversation,
    pendingRequests,
    activeRequest,
    selectedConversationKey,
    selectedRequestId,
    setSelectedConversationKey,
    setSelectedRequestId,
    patchConversation,
    setConversationResolvedId,
    loading,
    hasLockedAcceptedProjects,
  } = useClientMessagesBootstrap({
    authFetch,
    token,
    isAuthenticated,
    authLoading,
    currentUserId,
    currentClientName,
    requestedProjectId,
  });

  const isMobileMessagesDetailOpen =
    isMobile &&
    activeTab === "messages" &&
    mobileDetailPane === "messages" &&
    Boolean(activeConversation);

  const isMobileRequestDetailOpen =
    isMobile &&
    activeTab === "requests" &&
    mobileDetailPane === "requests" &&
    Boolean(activeRequest);

  const isMobileDetailOpen =
    isMobileMessagesDetailOpen || isMobileRequestDetailOpen;

  const session = useConversationSession({
    activeConversation:
      activeTab === "messages" && (!isMobile || isMobileMessagesDetailOpen)
        ? activeConversation
        : null,
    authFetch,
    token,
    isAuthenticated,
    currentUser: user,
    headerDisplayName: currentClientName,
    patchConversation,
    setConversationResolvedId,
  });

  const handleConversationSelect = useCallback(
    (conversation) => {
      const nextKey = getConversationKey(conversation);
      if (!conversation?.chatUnlocked || !nextKey) {
        return;
      }

      setActiveTab("messages");
      setSelectedConversationKey(nextKey);
      patchConversation(nextKey, { unreadCount: 0 });
      if (isMobile) {
        setMobileDetailPane("messages");
      }
    },
    [isMobile, patchConversation, setSelectedConversationKey],
  );

  const handleRequestSelect = useCallback(
    (requestId) => {
      setSelectedRequestId(requestId);
      if (isMobile) {
        setMobileDetailPane("requests");
      }
    },
    [isMobile, setSelectedRequestId],
  );

  const handleTabChange = useCallback(
    (nextTab) => {
      setActiveTab(nextTab);
      if (isMobile) {
        setMobileDetailPane(null);
      }
    },
    [isMobile],
  );

  const handleMobileBack = useCallback(() => {
    setMobileDetailPane(null);
  }, []);

  useEffect(() => {
    if (
      isMobile &&
      requestedProjectId &&
      activeConversation &&
      String(activeConversation.projectId) === String(requestedProjectId)
    ) {
      setMobileDetailPane("messages");
    }
  }, [activeConversation, isMobile, requestedProjectId]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    if (mobileDetailPane === "messages" && !activeConversation) {
      setMobileDetailPane(null);
    }

    if (mobileDetailPane === "requests" && !activeRequest) {
      setMobileDetailPane(null);
    }
  }, [activeConversation, activeRequest, isMobile, mobileDetailPane]);

  useEffect(() => {
    if (!notificationSocket) return undefined;

    const handleNotification = (data) => {
      if (data.type !== "chat" || !data.data?.service) {
        return;
      }

      patchConversation(data.data.service, (conversation) => {
        const isActive =
          getConversationKey(conversation) === selectedConversationKey &&
          (!isMobile || isMobileMessagesDetailOpen);

        return {
          lastActivity: Date.now(),
          unreadCount: isActive
            ? 0
            : Number(conversation.unreadCount || 0) + 1,
        };
      });
    };

    notificationSocket.on("notification:new", handleNotification);

    return () => {
      notificationSocket.off("notification:new", handleNotification);
    };
  }, [
    isMobile,
    isMobileMessagesDetailOpen,
    notificationSocket,
    patchConversation,
    selectedConversationKey,
  ]);

  const onlineConversationKey =
    activeTab === "messages" &&
    session.online &&
    selectedConversationKey &&
    (!isMobile || isMobileMessagesDetailOpen)
      ? selectedConversationKey
      : null;

  const renderEmptyConversationState = () => (
    <div className="flex h-full min-h-0 items-center justify-center bg-card px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020] text-[#ffc107]">
          <SendHorizontal className="size-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">
          Select a conversation
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#8f96a3]">
          Pick a project thread from the left to review updates, reply to
          freelancers, and keep delivery moving.
        </p>
      </div>
    </div>
  );

  const renderActiveDetail = () => {
    if (activeTab === "requests") {
      return (
        <RequestDetailsPanel
          request={activeRequest}
          mobileView={isMobileRequestDetailOpen}
          onBack={handleMobileBack}
        />
      );
    }

    if (!activeConversation) {
      return renderEmptyConversationState();
    }

    return (
      <ChatArea
        conversation={activeConversation}
        messages={session.messages}
        loadingMessages={session.loadingMessages}
        onSendMessage={session.sendMessage}
        onFileUpload={session.uploadChatFile}
        onDeleteAttachment={session.deleteAttachment}
        sending={session.sending}
        currentUser={user}
        typingUsers={session.typingUsers}
        online={session.online}
        onTyping={session.emitTypingSignal}
        onClearChat={
          activeConversation?.isMarketplaceRequestChat
            ? undefined
            : session.clearChat
        }
        isClearingChat={session.clearingChat}
        chatUnlocked={Boolean(activeConversation?.chatUnlocked)}
        drafts={session.drafts}
        mobileView={isMobileMessagesDetailOpen}
        onBack={handleMobileBack}
      />
    );
  };

  const renderSidebar = () => (
    <MessagesSidebar
      activeTab={activeTab}
      conversations={conversations}
      pendingRequests={pendingRequests}
      loading={loading}
      hasLockedAcceptedProjects={hasLockedAcceptedProjects}
      selectedConversationKey={selectedConversationKey}
      selectedRequestId={selectedRequestId}
      onlineConversationKey={onlineConversationKey}
      onConversationSelect={handleConversationSelect}
      onRequestSelect={handleRequestSelect}
    />
  );

  return (
    <div className="min-h-screen bg-background text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: currentClientName,
            initial: getInitials(currentClientName),
          }}
          activeWorkspaceKey="messages"
          unreadCount={unreadCount}
          primaryActionLabel="Create Proposal"
          primaryActionTo="/client/proposal"
        />

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isMobileDetailOpen ? "overflow-hidden py-3" : "pb-12",
          )}
        >
          <h1 className="sr-only">Messages</h1>

          {!isMobileDetailOpen ? (
            <ClientPageHeader
              className="shrink-0 lg:items-start"
              title="Messages"
              dateLabel={false}
              actions={
                <MessagesHeaderTabs
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  messagesCount={conversations.length}
                  requestsCount={pendingRequests.length}
                />
              }
            />
          ) : null}

          <section
            className={cn(
              "flex min-h-0 flex-1",
              isMobileDetailOpen ? "mt-0 overflow-hidden" : "mt-8",
            )}
          >
            {isMobile ? (
              <div className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-[28px] border border-white/[0.05] bg-card">
                {isMobileDetailOpen ? renderActiveDetail() : renderSidebar()}
              </div>
            ) : (
              <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/[0.05] bg-card md:h-[680px] lg:h-[720px] lg:flex-row">
                {renderSidebar()}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {renderActiveDetail()}
                </div>
              </div>
            )}
          </section>
        </main>

        {!isMobileDetailOpen ? (
          <ClientDashboardFooter variant="workspace" />
        ) : null}
      </div>
    </div>
  );
};

export default ClientMessagesPage;
