import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  MARKETPLACE_CHAT_UPDATED_EVENT,
  buildMarketplaceConversationFromRequest,
  readMarketplaceChatRequests,
  mapMarketplaceNotificationRequest,
} from "@/shared/lib/marketplace-chat-requests";
import {
  enrichConversationRecord,
  enrichRequestRecord,
  getConversationKey,
  patchConversationCollection,
  sortConversations,
} from "../utils";

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeIdentifier = (value = "") =>
  String(value || "").trim().toLowerCase();

const useClientMessagesBootstrap = ({
  authFetch,
  token,
  isAuthenticated,
  authLoading,
  currentUserId,
  currentClientName,
  requestedProjectId,
  requestedRequestId,
  notifications = [],
} = {}) => {
  const [remoteConversations, setRemoteConversations] = useState([]);
  const [marketplaceConversations, setMarketplaceConversations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedConversationKey, setSelectedConversationKey] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLockedAcceptedProjects, setHasLockedAcceptedProjects] = useState(false);

  const appliedRequestedIdRef = useRef(null);
  const appliedRequestedProjectIdRef = useRef(null);

  const syncMarketplaceRequests = useCallback(() => {
    const currentClientId = normalizeIdentifier(currentUserId);
    const currentClientLabel = normalizeComparableText(currentClientName);
    const storageRequests = readMarketplaceChatRequests();
    const notificationRequests = (Array.isArray(notifications) ? notifications : [])
      .filter((notification) => {
        const type = String(notification?.type || "").toLowerCase();
        return type === "marketplace_request" || type === "marketplace_request_accepted";
      })
      .map(mapMarketplaceNotificationRequest);

    const allRequests = [...storageRequests, ...notificationRequests];

    const matchesClient = (request) => {
      const requestClientId = normalizeIdentifier(request?.clientId || request?.requestedById);
      if (requestClientId && currentClientId) {
        return requestClientId === currentClientId;
      }

      if (!requestClientId && currentClientLabel) {
        return normalizeComparableText(
          request?.clientName || request?.requestedByName || "",
        ) === currentClientLabel;
      }

      return false;
    };

    const nextPendingRequests = new Map();
    const nextAcceptedConversations = new Map();

    allRequests
      .filter((request) => ["pending", "accepted"].includes(String(request.status || "").toLowerCase()))
      .filter(matchesClient)
      .forEach((request) => {
        const requestId = String(request.requestId || request.id || "").trim();
        const status = String(request.status || "pending").trim().toLowerCase();
        const key = requestId ? `${requestId}|${status}` : `${request.clientId}|${request.freelancerId}|${request.serviceId}|${status}`;

        if (status === "pending") {
          const existing = nextPendingRequests.get(key);
          if (!existing || new Date(request.updatedAt || request.createdAt || 0).getTime() >= new Date(existing.updatedAt || existing.createdAt || 0).getTime()) {
            nextPendingRequests.set(key, enrichRequestRecord(request));
          }
          return;
        }

        const conversation = enrichConversationRecord(
          {
            ...buildMarketplaceConversationFromRequest(request, "client"),
            isMarketplaceRequestChat: true,
          },
          currentClientName,
        );

        const existingConversation = nextAcceptedConversations.get(key);
        if (!existingConversation || conversation.lastActivity >= existingConversation.lastActivity) {
          nextAcceptedConversations.set(key, conversation);
        }
      });

    setPendingRequests(
      Array.from(nextPendingRequests.values()).sort(
        (left, right) =>
          new Date(right.updatedAt || right.createdAt || 0).getTime() -
          new Date(left.updatedAt || left.createdAt || 0).getTime(),
      ),
    );
    setMarketplaceConversations(
      sortConversations(Array.from(nextAcceptedConversations.values())),
    );
  }, [currentClientName, currentUserId, notifications]);

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

    const selectedConversation = selectedConversationKey
      ? conversations.find(
          (conversation) =>
            getConversationKey(conversation) === selectedConversationKey,
        )
      : null;

    if (requestedRequestId) {
      if (appliedRequestedIdRef.current !== requestedRequestId) {
        const requestedConversation = conversations.find(
          (conversation) =>
            String(conversation.requestId || conversation.id) ===
            String(requestedRequestId),
        );

        if (requestedConversation) {
          appliedRequestedIdRef.current = requestedRequestId;
          if (
            getConversationKey(requestedConversation) !== selectedConversationKey
          ) {
            setSelectedConversationKey(getConversationKey(requestedConversation));
          }
        } else if (conversations.length > 0) {
          // If not found yet, don't mark as applied in case it loads later
          // setSelectedConversationKey(null); // Remove this to prevent unselecting
        }
        return;
      }
    }

    if (selectedConversation) {
      return;
    }

    if (requestedProjectId) {
      if (appliedRequestedProjectIdRef.current !== requestedProjectId) {
        const requestedConversation = conversations.find(
          (conversation) =>
            String(conversation.projectId || conversation.id) ===
            String(requestedProjectId),
        );

        if (requestedConversation) {
          appliedRequestedProjectIdRef.current = requestedProjectId;
          if (
            getConversationKey(requestedConversation) !== selectedConversationKey
          ) {
            setSelectedConversationKey(getConversationKey(requestedConversation));
          }
        }
        return;
      }
    }

    setSelectedConversationKey(getConversationKey(conversations[0]));
  }, [conversations, requestedProjectId, requestedRequestId, selectedConversationKey]);

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












