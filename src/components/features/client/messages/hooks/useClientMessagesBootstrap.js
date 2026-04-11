import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MARKETPLACE_CHAT_UPDATED_EVENT,
  buildMarketplaceConversationFromRequest,
  readMarketplaceChatRequests,
} from "@/shared/lib/marketplace-chat-requests";
import {
  enrichConversationRecord,
  enrichRequestRecord,
  getConversationKey,
  patchConversationCollection,
  sortConversations,
} from "../utils";

const useClientMessagesBootstrap = ({
  authFetch,
  token,
  isAuthenticated,
  authLoading,
  currentUserId,
  currentClientName,
  requestedProjectId,
} = {}) => {
  const [remoteConversations, setRemoteConversations] = useState([]);
  const [marketplaceConversations, setMarketplaceConversations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedConversationKey, setSelectedConversationKey] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLockedAcceptedProjects, setHasLockedAcceptedProjects] = useState(false);

  const syncMarketplaceRequests = useCallback(() => {
    const allRequests = readMarketplaceChatRequests();
    const nextPendingRequests = allRequests
      .filter(
        (request) =>
          request.status === "pending" &&
          String(request.clientId || "") === String(currentUserId || ""),
      )
      .map((request) => enrichRequestRecord(request));
    const acceptedRequestConversations = allRequests
      .filter(
        (request) =>
          request.status === "accepted" &&
          String(request.clientId || "") === String(currentUserId || ""),
      )
      .map((request) =>
        enrichConversationRecord(
          {
            ...buildMarketplaceConversationFromRequest(request, "client"),
            isMarketplaceRequestChat: true,
          },
          currentClientName,
        ),
      );

    setPendingRequests(nextPendingRequests);
    setMarketplaceConversations(sortConversations(acceptedRequestConversations));
  }, [currentClientName, currentUserId]);

  useEffect(() => {
    syncMarketplaceRequests();

    if (typeof window === "undefined") {
      return undefined;
    }

    const handleMarketplaceChatUpdated = () => {
      syncMarketplaceRequests();
    };

    window.addEventListener(
      MARKETPLACE_CHAT_UPDATED_EVENT,
      handleMarketplaceChatUpdated,
    );
    window.addEventListener("storage", handleMarketplaceChatUpdated);

    return () => {
      window.removeEventListener(
        MARKETPLACE_CHAT_UPDATED_EVENT,
        handleMarketplaceChatUpdated,
      );
      window.removeEventListener("storage", handleMarketplaceChatUpdated);
    };
  }, [syncMarketplaceRequests]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadBootstrap = async () => {
      if (!authFetch || !token || !isAuthenticated || authLoading) {
        setHasLockedAcceptedProjects(false);
        setRemoteConversations([]);
        setLoading(false);
        return;
      }

      try {
        const response = await authFetch("/chat/client-bootstrap", {
          method: "GET",
          skipLogoutOn401: true,
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (!cancelled) {
            setRemoteConversations([]);
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load chat bootstrap (${response.status})`);
        }

        const payload = await response.json().catch(() => null);
        const conversations = Array.isArray(payload?.data?.conversations)
          ? payload.data.conversations
          : [];
        const nextRemoteConversations = sortConversations(
          conversations.map((conversation) =>
            enrichConversationRecord(conversation, currentClientName),
          ),
        );

        if (!cancelled) {
          setRemoteConversations(nextRemoteConversations);
          setHasLockedAcceptedProjects(
            Boolean(payload?.data?.hasLockedAcceptedProjects),
          );
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load conversations:", error);
        if (!cancelled) {
          setHasLockedAcceptedProjects(false);
          setRemoteConversations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadBootstrap();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    authFetch,
    authLoading,
    currentClientName,
    isAuthenticated,
    token,
  ]);

  useEffect(() => {
    if (!pendingRequests.length) {
      setSelectedRequestId(null);
      return;
    }

    if (
      !pendingRequests.some(
        (request) => String(request.id) === String(selectedRequestId),
      )
    ) {
      setSelectedRequestId(pendingRequests[0].id);
    }
  }, [pendingRequests, selectedRequestId]);

  const conversations = useMemo(
    () => sortConversations([...remoteConversations, ...marketplaceConversations]),
    [marketplaceConversations, remoteConversations],
  );

  useEffect(() => {
    if (!conversations.length) {
      setSelectedConversationKey(null);
      return;
    }

    if (
      selectedConversationKey &&
      conversations.some(
        (conversation) =>
          getConversationKey(conversation) === selectedConversationKey,
      )
    ) {
      return;
    }

    if (requestedProjectId) {
      const requestedConversation = conversations.find(
        (conversation) =>
          String(conversation.projectId || conversation.id) ===
          String(requestedProjectId),
      );

      if (requestedConversation) {
        setSelectedConversationKey(getConversationKey(requestedConversation));
        return;
      }
    }

    setSelectedConversationKey(getConversationKey(conversations[0]));
  }, [conversations, requestedProjectId, selectedConversationKey]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          getConversationKey(conversation) === selectedConversationKey,
      ) || null,
    [conversations, selectedConversationKey],
  );

  const activeRequest = useMemo(
    () =>
      pendingRequests.find(
        (request) => String(request.id) === String(selectedRequestId),
      ) ||
      pendingRequests[0] ||
      null,
    [pendingRequests, selectedRequestId],
  );

  const patchConversation = useCallback((targetKey, updater) => {
    setRemoteConversations((previous) =>
      patchConversationCollection(previous, targetKey, updater),
    );
    setMarketplaceConversations((previous) =>
      patchConversationCollection(previous, targetKey, updater),
    );
  }, []);

  const setConversationResolvedId = useCallback((targetKey, conversationId) => {
    if (!targetKey || !conversationId) {
      return;
    }

    patchConversation(targetKey, (conversation) =>
      conversation.conversationId === conversationId
        ? null
        : { conversationId },
    );
  }, [patchConversation]);

  return {
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
    syncMarketplaceRequests,
  };
};

export default useClientMessagesBootstrap;
