import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appendMarketplaceConversationMessage,
  getMarketplaceConversationMessages,
  MARKETPLACE_CHAT_UPDATED_EVENT,
} from "@/shared/lib/marketplace-chat-requests";
import { migrateChatConversationStorageKey } from "@/shared/lib/storage-keys";
import { apiClient } from "@/shared/lib/api-client";
import useChatSocket from "./useChatSocket";
import {
  dedupeMessages,
  filterAssistantMessages,
  getConversationKey,
  getDisplayName,
  getMessagePreview,
  getMessageSignature,
  getTimestampValue,
  mergePendingIdentity,
  sortMessagesByCreatedAt,
  SERVICE_LABEL,
} from "../utils";

const EMPTY_ARRAY = [];

const useConversationSession = ({
  activeConversation,
  authFetch,
  token,
  isAuthenticated,
  currentUser,
  headerDisplayName,
  patchConversation,
  setConversationResolvedId,
} = {}) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [online, setOnline] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const draftsRef = useRef({});
  const typingTimeoutRef = useRef(null);
  const historyAbortRef = useRef(null);
  const messageCacheRef = useRef(new Map());
  const activeConversationRef = useRef(activeConversation);
  const activeConversationKeyRef = useRef(getConversationKey(activeConversation));
  const activeConversationIdRef = useRef(null);

  const applyMessagesForConversation = useCallback(
    (conversationKey, nextMessages, options = {}) => {
      if (!conversationKey) {
        return;
      }

      const previousEntry = messageCacheRef.current.get(conversationKey) || {};
      const normalizedMessages = sortMessagesByCreatedAt(
        dedupeMessages(filterAssistantMessages(nextMessages)),
      );
      const lastMessage = normalizedMessages[normalizedMessages.length - 1] || null;
      const resolvedConversationId =
        options.conversationId ||
        previousEntry.conversationId ||
        activeConversationIdRef.current ||
        null;

      messageCacheRef.current.set(conversationKey, {
        conversationId: resolvedConversationId,
        messages: normalizedMessages,
        lastCreatedAt: lastMessage?.createdAt || null,
      });

      if (activeConversationKeyRef.current === conversationKey) {
        setMessages(normalizedMessages);
      }

      if (lastMessage) {
        patchConversation(conversationKey, {
          previewText: getMessagePreview(lastMessage),
          lastActivity:
            getTimestampValue(lastMessage.createdAt) || Date.now(),
          unreadCount: 0,
          messageCount: normalizedMessages.length,
          lastMessage,
        });
      } else if (options.clearMeta) {
        patchConversation(conversationKey, {
          previewText: "No messages yet",
          unreadCount: 0,
          messageCount: 0,
          lastMessage: null,
        });
      }
    },
    [patchConversation],
  );

  const patchCurrentMessages = useCallback((updater) => {
    const conversationKey = activeConversationKeyRef.current;
    if (!conversationKey) {
      return;
    }

    const currentEntry = messageCacheRef.current.get(conversationKey) || {
      conversationId: activeConversationIdRef.current,
      messages: EMPTY_ARRAY,
      lastCreatedAt: null,
    };
    const nextMessages =
      typeof updater === "function"
        ? updater(currentEntry.messages || EMPTY_ARRAY)
        : updater;

    applyMessagesForConversation(conversationKey, nextMessages, {
      conversationId:
        currentEntry.conversationId || activeConversationIdRef.current || null,
      clearMeta: Array.isArray(nextMessages) && nextMessages.length === 0,
    });
  }, [applyMessagesForConversation]);

  const appendMessageForConversation = useCallback(
    (conversationKey, incomingMessage, options = {}) => {
      if (!conversationKey || !incomingMessage) {
        return;
      }

      const currentEntry = messageCacheRef.current.get(conversationKey) || {
        conversationId: options.conversationId || activeConversationIdRef.current,
        messages: EMPTY_ARRAY,
        lastCreatedAt: null,
      };
      const pendingMessage = currentEntry.messages?.find(
        (message) =>
          message.pending &&
          getMessageSignature(message) === getMessageSignature(incomingMessage),
      );
      const filteredMessages = (currentEntry.messages || EMPTY_ARRAY).filter(
        (message) => {
          if (pendingMessage && message === pendingMessage) {
            return false;
          }

          if (incomingMessage.id && message.id === incomingMessage.id) {
            return false;
          }

          return true;
        },
      );
      const nextMessage = mergePendingIdentity(incomingMessage, pendingMessage);

      applyMessagesForConversation(
        conversationKey,
        [...filteredMessages, nextMessage],
        {
          conversationId:
            incomingMessage.conversationId ||
            options.conversationId ||
            currentEntry.conversationId ||
            null,
        },
      );
    },
    [applyMessagesForConversation],
  );

  const resolveConversationId = useCallback(
    async (conversation, signal) => {
      const conversationKey = getConversationKey(conversation);
      if (!conversationKey) {
        return null;
      }

      if (conversation?.conversationId) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            migrateChatConversationStorageKey(conversationKey),
            conversation.conversationId,
          );
        }
        setConversationResolvedId(conversationKey, conversation.conversationId);
        return conversation.conversationId;
      }

      const cachedConversationId =
        messageCacheRef.current.get(conversationKey)?.conversationId || null;
      if (cachedConversationId) {
        setConversationResolvedId(conversationKey, cachedConversationId);
        return cachedConversationId;
      }

      const storageKey = migrateChatConversationStorageKey(conversationKey);
      const storedConversationId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null;

      if (storedConversationId) {
        setConversationResolvedId(conversationKey, storedConversationId);
        messageCacheRef.current.set(conversationKey, {
          ...(messageCacheRef.current.get(conversationKey) || {}),
          conversationId: storedConversationId,
        });
        return storedConversationId;
      }

      if (!authFetch || !token || !isAuthenticated) {
        return null;
      }

      const response = await authFetch("/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: conversation.serviceKey || conversation.label || SERVICE_LABEL,
          projectTitle:
            conversation.projectTitle || conversation.label || SERVICE_LABEL,
        }),
        skipLogoutOn401: true,
        signal,
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to start conversation (status ${response.status})`,
        );
      }

      const payload = await response.json().catch(() => null);
      const resolvedConversationId =
        payload?.data?.id || payload?.id || payload?.data?.conversationId || null;

      if (resolvedConversationId) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, resolvedConversationId);
        }
        setConversationResolvedId(conversationKey, resolvedConversationId);
        messageCacheRef.current.set(conversationKey, {
          ...(messageCacheRef.current.get(conversationKey) || {}),
          conversationId: resolvedConversationId,
        });
      }

      return resolvedConversationId;
    },
    [authFetch, isAuthenticated, setConversationResolvedId, token],
  );

  const fetchConversationMessages = useCallback(
    async ({
      conversation,
      conversationId,
      after = null,
      preserveExisting = false,
    }) => {
      if (!conversationId) {
        return null;
      }

      const conversationKey = getConversationKey(conversation);
      if (!conversationKey) {
        return null;
      }

      if (historyAbortRef.current) {
        historyAbortRef.current.abort();
      }

      const controller = new AbortController();
      historyAbortRef.current = controller;

      if (!preserveExisting && activeConversationKeyRef.current === conversationKey) {
        setLoadingMessages(true);
      }

      try {
        let payload = null;

        if (token && isAuthenticated && authFetch) {
          const query = after
            ? `?after=${encodeURIComponent(after)}`
            : "";
          const response = await authFetch(
            `/chat/conversations/${conversationId}/messages${query}`,
            {
              method: "GET",
              skipLogoutOn401: true,
              signal: controller.signal,
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch messages (status ${response.status})`,
            );
          }

          payload = await response.json().catch(() => null);
        } else {
          payload = await apiClient.fetchChatMessages(conversationId);
        }

        const nextMessages = filterAssistantMessages(
          payload?.data?.messages || payload?.messages || [],
        );

        if (preserveExisting) {
          const previousMessages =
            messageCacheRef.current.get(conversationKey)?.messages || EMPTY_ARRAY;
          applyMessagesForConversation(
            conversationKey,
            [...previousMessages, ...nextMessages],
            { conversationId },
          );
        } else {
          applyMessagesForConversation(conversationKey, nextMessages, {
            conversationId,
          });
        }

        return nextMessages;
      } catch (error) {
        if (controller.signal.aborted) {
          return null;
        }

        console.error("Failed to fetch messages:", error);
        return null;
      } finally {
        if (historyAbortRef.current === controller) {
          historyAbortRef.current = null;
        }
        if (activeConversationKeyRef.current === conversationKey) {
          setLoadingMessages(false);
        }
      }
    },
    [
      applyMessagesForConversation,
      authFetch,
      isAuthenticated,
      token,
    ],
  );

  const handleSocketJoined = useCallback((payload) => {
    const conversationKey = activeConversationKeyRef.current;
    if (!conversationKey || !payload?.conversationId) {
      return;
    }

    activeConversationIdRef.current = payload.conversationId;
    setActiveConversationId(payload.conversationId);
    setConversationResolvedId(conversationKey, payload.conversationId);

    messageCacheRef.current.set(conversationKey, {
      ...(messageCacheRef.current.get(conversationKey) || {}),
      conversationId: payload.conversationId,
    });
  }, [setConversationResolvedId]);

  const handleSocketHistory = useCallback((history = []) => {
    const conversationKey = activeConversationKeyRef.current;
    if (!conversationKey) {
      return;
    }

    applyMessagesForConversation(conversationKey, history, {
      conversationId: activeConversationIdRef.current,
    });
  }, [applyMessagesForConversation]);

  const handleSocketMessage = useCallback((message) => {
    if (message?.role === "assistant") {
      setSending(false);
      return;
    }

    if (
      activeConversationIdRef.current &&
      message?.conversationId &&
      String(message.conversationId) !== String(activeConversationIdRef.current)
    ) {
      return;
    }

    const conversationKey = activeConversationKeyRef.current;
    if (!conversationKey) {
      return;
    }

    appendMessageForConversation(conversationKey, message, {
      conversationId: activeConversationIdRef.current,
    });
    setSending(false);
  }, [appendMessageForConversation]);

  const handleSocketReadReceipt = useCallback(
    ({ conversationId, readAt }) => {
      if (
        !conversationId ||
        String(conversationId) !== String(activeConversationIdRef.current)
      ) {
        return;
      }

      patchCurrentMessages((previous) =>
        previous.map((message) =>
          String(message.senderId || "") === String(currentUser?.id || "") ||
          message.pending
            ? { ...message, readAt: readAt || new Date().toISOString() }
            : message,
        ),
      );
    },
    [currentUser?.id, patchCurrentMessages],
  );

  const handleSocketTyping = useCallback(
    ({ conversationId, typing, userId, userName }) => {
      if (
        !conversationId ||
        String(conversationId) !== String(activeConversationIdRef.current)
      ) {
        return;
      }

      if (userId && currentUser?.id && String(userId) === String(currentUser.id)) {
        return;
      }

      setTypingUsers((previous) => {
        const next = new Map(previous.map((item) => [item.id, item.name]));
        const key = userId || userName || "unknown";

        if (typing) {
          next.set(key, userName || "Someone");
        } else {
          next.delete(key);
        }

        return Array.from(next.entries()).map(([id, name]) => ({ id, name }));
      });
    },
    [currentUser?.id],
  );

  const handleSocketPresence = useCallback(
    ({ conversationId, online: onlineList = [] }) => {
      if (
        !conversationId ||
        String(conversationId) !== String(activeConversationIdRef.current)
      ) {
        return;
      }

      const selfId = currentUser?.id;
      const someoneElseOnline = onlineList.some((id) =>
        selfId ? String(id) !== String(selfId) : true,
      );

      setOnline(someoneElseOnline);
    },
    [currentUser?.id],
  );

  const handleSocketError = useCallback((payload) => {
    console.error("Socket error:", payload);
    setSending(false);
  }, []);

  const socket = useChatSocket({
    currentUser,
    onJoined: handleSocketJoined,
    onHistory: handleSocketHistory,
    onMessage: handleSocketMessage,
    onReadReceipt: handleSocketReadReceipt,
    onTyping: handleSocketTyping,
    onPresence: handleSocketPresence,
    onError: handleSocketError,
  });

  useEffect(() => {
    activeConversationRef.current = activeConversation;
    activeConversationKeyRef.current = getConversationKey(activeConversation);
  }, [activeConversation]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const conversationKey = getConversationKey(activeConversation);

    setTypingUsers([]);
    setOnline(false);

    if (!conversationKey || !activeConversation) {
      setActiveConversationId(null);
      setMessages([]);
      setLoadingMessages(false);
      return undefined;
    }

    if (activeConversation.isMarketplaceRequestChat) {
      setActiveConversationId(null);
      setLoadingMessages(false);
      setMessages(
        getMarketplaceConversationMessages(
          activeConversation.serviceKey || activeConversation.id,
        ),
      );
      return undefined;
    }

    if (!activeConversation.chatUnlocked) {
      setActiveConversationId(null);
      setLoadingMessages(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const cachedEntry = messageCacheRef.current.get(conversationKey) || null;

    if (cachedEntry?.messages?.length) {
      setMessages(cachedEntry.messages);
    }
    setLoadingMessages(!cachedEntry?.messages?.length);

    const bootstrapConversation = async () => {
      try {
        const resolvedConversationId = await resolveConversationId(
          activeConversation,
          controller.signal,
        );

        if (cancelled || !resolvedConversationId) {
          setLoadingMessages(false);
          return;
        }

        setActiveConversationId(resolvedConversationId);
        activeConversationIdRef.current = resolvedConversationId;

        socket.joinConversation({
          conversationId: resolvedConversationId,
          service: activeConversation.serviceKey || activeConversation.label,
          projectTitle: activeConversation.projectTitle,
          includeHistory: false,
        });

        const lastCreatedAt =
          messageCacheRef.current.get(conversationKey)?.lastCreatedAt || null;

        await fetchConversationMessages({
          conversation: activeConversation,
          conversationId: resolvedConversationId,
          after: lastCreatedAt,
          preserveExisting: Boolean(lastCreatedAt),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to prepare conversation session:", error);
        setLoadingMessages(false);
      }
    };

    void bootstrapConversation();

    return () => {
      cancelled = true;
      controller.abort();
      socket.leaveConversation(activeConversationIdRef.current);
    };
  }, [
    activeConversation,
    fetchConversationMessages,
    resolveConversationId,
    socket,
  ]);

  useEffect(() => {
    if (!socket.isConnected || !activeConversationId || !currentUser?.id) {
      return;
    }

    socket.emitRead({
      conversationId: activeConversationId,
      userId: currentUser.id,
    });
  }, [activeConversationId, currentUser?.id, socket]);

  useEffect(() => {
    if (!activeConversation?.isMarketplaceRequestChat) {
      return undefined;
    }

    const syncMessages = () => {
      setMessages(
        getMarketplaceConversationMessages(
          activeConversation.serviceKey || activeConversation.id,
        ),
      );
    };

    syncMessages();

    if (typeof window === "undefined") {
      return undefined;
    }

    window.addEventListener(MARKETPLACE_CHAT_UPDATED_EVENT, syncMessages);
    window.addEventListener("storage", syncMessages);

    return () => {
      window.removeEventListener(MARKETPLACE_CHAT_UPDATED_EVENT, syncMessages);
      window.removeEventListener("storage", syncMessages);
    };
  }, [
    activeConversation?.id,
    activeConversation?.isMarketplaceRequestChat,
    activeConversation?.serviceKey,
  ]);

  useEffect(() => {
    if (
      !activeConversation ||
      activeConversation.isMarketplaceRequestChat ||
      !activeConversation.chatUnlocked ||
      !activeConversationId
    ) {
      return undefined;
    }

    if (!["disabled", "degraded"].includes(socket.status)) {
      return undefined;
    }

    const conversationKey = getConversationKey(activeConversation);
    if (!conversationKey) {
      return undefined;
    }

    const pollMessages = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      const after =
        messageCacheRef.current.get(conversationKey)?.lastCreatedAt || null;

      void fetchConversationMessages({
        conversation: activeConversation,
        conversationId: activeConversationId,
        after,
        preserveExisting: Boolean(after),
      });
    };

    pollMessages();

    const intervalId = window.setInterval(pollMessages, 5000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pollMessages();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    activeConversation,
    activeConversationId,
    fetchConversationMessages,
    socket.status,
  ]);

  const uploadChatFile = useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authFetch("/upload/chat", {
        method: "POST",
        body: formData,
        skipLogoutOn401: true,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json().catch(() => null);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        url: result?.data?.url || result?.url,
      };
    },
    [authFetch],
  );

  const deleteAttachment = useCallback(
    async (messageId) => {
      try {
        const response = await authFetch(`/upload/chat/${messageId}`, {
          method: "DELETE",
          skipLogoutOn401: true,
        });

        if (!response.ok) {
          throw new Error("Delete failed");
        }

        const result = await response.json().catch(() => null);

        patchCurrentMessages((previous) =>
          previous.map((message) => {
            if (message.id !== messageId) {
              return message;
            }

            return result?.deleted
              ? { ...message, attachment: null, deleted: true, content: null }
              : { ...message, attachment: null };
          }),
        );
      } catch (error) {
        console.error("Failed to delete attachment:", error);
        alert("Failed to delete attachment. Please try again.");
      }
    },
    [authFetch, patchCurrentMessages],
  );

  const handleClearChat = useCallback(async () => {
    if (
      !activeConversationId ||
      !authFetch ||
      activeConversation?.isMarketplaceRequestChat
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Clear all messages in this conversation? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setClearingChat(true);

    try {
      const response = await authFetch(
        `/chat/conversations/${activeConversationId}/messages`,
        {
          method: "DELETE",
          skipLogoutOn401: true,
        },
      );

      if (!response.ok) {
        throw new Error(`Clear chat failed (status ${response.status})`);
      }

      setTypingUsers([]);
      applyMessagesForConversation(activeConversationKeyRef.current, [], {
        conversationId: activeConversationId,
        clearMeta: true,
      });
    } catch (error) {
      console.error("Failed to clear chat:", error);
      alert("Failed to clear chat. Please try again.");
    } finally {
      setClearingChat(false);
    }
  }, [
    activeConversation?.isMarketplaceRequestChat,
    activeConversationId,
    applyMessagesForConversation,
    authFetch,
  ]);

  const sendMessage = useCallback(
    async ({ text = "", attachment = null } = {}) => {
      const trimmedMessage = text.trim();

      if ((!trimmedMessage && !attachment) || !activeConversation?.chatUnlocked) {
        return false;
      }

      if (activeConversation?.isMarketplaceRequestChat) {
        const nextMessage = appendMarketplaceConversationMessage({
          conversationKey:
            activeConversation.serviceKey || activeConversation.id || "",
          content: trimmedMessage,
          attachment,
          senderId: currentUser?.id || null,
          senderRole: "CLIENT",
          senderName: headerDisplayName,
        });

        if (!nextMessage) {
          return false;
        }

        setMessages((previous) => [...previous, nextMessage]);
        patchConversation(activeConversationKeyRef.current, {
          previewText: getMessagePreview(nextMessage),
          lastActivity: getTimestampValue(nextMessage.createdAt) || Date.now(),
          unreadCount: 0,
        });
        return true;
      }

      if (!activeConversationId) {
        return false;
      }

      const pendingMessage = {
        conversationId: activeConversationId,
        content: trimmedMessage,
        service:
          activeConversation?.serviceKey ||
          activeConversation?.label ||
          SERVICE_LABEL,
        senderId: currentUser?.id || null,
        senderRole: currentUser?.role || "CLIENT",
        senderName: getDisplayName(currentUser),
        skipAssistant: true,
        attachment: attachment || undefined,
        role: "user",
        pending: true,
        createdAt: new Date().toISOString(),
      };

      appendMessageForConversation(
        activeConversationKeyRef.current,
        pendingMessage,
        {
          conversationId: activeConversationId,
        },
      );
      setSending(true);

      if (socket.isConnected) {
        socket.emitMessage(pendingMessage);
        return true;
      }

      try {
        const userMessage =
          token && isAuthenticated && authFetch
            ? await authFetch(
                `/chat/conversations/${activeConversationId}/messages`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...pendingMessage,
                    conversationId: activeConversationId,
                  }),
                  skipLogoutOn401: true,
                },
              ).then(async (response) => {
                if (!response.ok) {
                  throw new Error(`Send failed (status ${response.status})`);
                }

                const payload = await response.json().catch(() => null);
                return (
                  payload?.data?.message ||
                  payload?.message ||
                  pendingMessage
                );
              })
            : await apiClient
                .sendChatMessage({
                  ...pendingMessage,
                  conversationId: activeConversationId,
                })
                .then(
                  (payload) =>
                    payload?.data?.message ||
                    payload?.message ||
                    pendingMessage,
                );

        appendMessageForConversation(
          activeConversationKeyRef.current,
          userMessage,
          {
            conversationId: activeConversationId,
          },
        );
        setSending(false);
        return true;
      } catch (error) {
        console.error("Failed to send message via HTTP:", error);
        setSending(false);
        return false;
      }
    },
    [
      activeConversation,
      activeConversationId,
      appendMessageForConversation,
      authFetch,
      currentUser,
      headerDisplayName,
      isAuthenticated,
      patchConversation,
      socket,
      token,
    ],
  );

  const emitTypingSignal = useCallback(() => {
    if (
      !socket.isConnected ||
      !activeConversationId ||
      !activeConversation?.chatUnlocked ||
      activeConversation?.isMarketplaceRequestChat
    ) {
      return;
    }

    const payload = {
      conversationId: activeConversationId,
      userName: getDisplayName(currentUser),
    };

    socket.emitTypingState({
      ...payload,
      typing: true,
    });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emitTypingState({
        ...payload,
        typing: false,
      });
    }, 1500);
  }, [
    activeConversation?.chatUnlocked,
    activeConversation?.isMarketplaceRequestChat,
    activeConversationId,
    currentUser,
    socket,
  ]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (historyAbortRef.current) {
        historyAbortRef.current.abort();
      }
    },
    [],
  );

  const draftApi = useMemo(
    () => ({
      getDraft: (conversationKey) => draftsRef.current[conversationKey] || "",
      setDraft: (conversationKey, value) => {
        if (!conversationKey) {
          return;
        }
        draftsRef.current[conversationKey] = value;
      },
    }),
    [],
  );

  return {
    messages,
    loadingMessages,
    sending,
    clearingChat,
    typingUsers: typingUsers.map((item) => item.name),
    online,
    socketStatus: socket.status,
    uploadChatFile,
    deleteAttachment,
    clearChat: handleClearChat,
    sendMessage,
    emitTypingSignal,
    drafts: draftApi,
  };
};

export default useConversationSession;
