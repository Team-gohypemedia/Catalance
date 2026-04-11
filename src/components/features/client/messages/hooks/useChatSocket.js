import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  SOCKET_ENABLED,
  SOCKET_IO_URL,
  SOCKET_OPTIONS,
} from "@/shared/lib/api-client";

const useChatSocket = ({
  currentUser,
  onJoined,
  onHistory,
  onMessage,
  onReadReceipt,
  onTyping,
  onPresence,
  onError,
} = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef({
    onJoined,
    onHistory,
    onMessage,
    onReadReceipt,
    onTyping,
    onPresence,
    onError,
  });
  const joinedRoomRef = useRef(null);
  const [status, setStatus] = useState(
    SOCKET_ENABLED && SOCKET_IO_URL ? "connecting" : "disabled",
  );

  useEffect(() => {
    handlersRef.current = {
      onJoined,
      onHistory,
      onMessage,
      onReadReceipt,
      onTyping,
      onPresence,
      onError,
    };
  }, [onError, onHistory, onJoined, onMessage, onPresence, onReadReceipt, onTyping]);

  useEffect(() => {
    if (!SOCKET_ENABLED || !SOCKET_IO_URL) {
      setStatus("disabled");
      return undefined;
    }

    const socket = io(SOCKET_IO_URL, SOCKET_OPTIONS);
    socketRef.current = socket;

    const handleConnect = () => setStatus("connected");
    const handleDisconnect = () => setStatus("degraded");
    const handleConnectError = (error) => {
      setStatus("degraded");
      handlersRef.current.onError?.({
        message: error?.message || "Socket connection error",
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("chat:joined", (payload) => handlersRef.current.onJoined?.(payload));
    socket.on("chat:history", (payload) => handlersRef.current.onHistory?.(payload));
    socket.on("chat:message", (payload) => handlersRef.current.onMessage?.(payload));
    socket.on("chat:read_receipt", (payload) =>
      handlersRef.current.onReadReceipt?.(payload),
    );
    socket.on("chat:typing", (payload) => handlersRef.current.onTyping?.(payload));
    socket.on("chat:presence", (payload) => handlersRef.current.onPresence?.(payload));
    socket.on("chat:error", (payload) => handlersRef.current.onError?.(payload));

    return () => {
      if (joinedRoomRef.current) {
        socket.emit("chat:leave", { conversationId: joinedRoomRef.current });
      }
      joinedRoomRef.current = null;
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinConversation = useCallback(
    ({ conversationId, service, projectTitle, includeHistory = false }) => {
      if (!socketRef.current || !conversationId) {
        return false;
      }

      if (
        joinedRoomRef.current &&
        joinedRoomRef.current !== conversationId
      ) {
        socketRef.current.emit("chat:leave", {
          conversationId: joinedRoomRef.current,
        });
      }

      joinedRoomRef.current = conversationId;
      socketRef.current.emit("chat:join", {
        conversationId,
        service,
        projectTitle,
        includeHistory,
        senderId: currentUser?.id || null,
      });
      return true;
    },
    [currentUser?.id],
  );

  const leaveConversation = useCallback((conversationId = null) => {
    const roomId = conversationId || joinedRoomRef.current;
    if (!socketRef.current || !roomId) {
      return;
    }

    socketRef.current.emit("chat:leave", { conversationId: roomId });
    if (joinedRoomRef.current === roomId) {
      joinedRoomRef.current = null;
    }
  }, []);

  const emitRead = useCallback(
    ({ conversationId, userId }) => {
      if (!socketRef.current || !conversationId) {
        return false;
      }

      socketRef.current.emit("chat:read", {
        conversationId,
        userId: userId || currentUser?.id || null,
      });
      return true;
    },
    [currentUser?.id],
  );

  const emitTypingState = useCallback(
    ({ conversationId, typing = true, userName }) => {
      if (!socketRef.current || !conversationId) {
        return false;
      }

      socketRef.current.emit("chat:typing", {
        conversationId,
        typing,
        userId: currentUser?.id || socketRef.current.id,
        userName,
      });
      return true;
    },
    [currentUser?.id],
  );

  const emitMessage = useCallback((payload) => {
    if (!socketRef.current) {
      return false;
    }

    socketRef.current.emit("chat:message", payload);
    return true;
  }, []);

  return useMemo(
    () => ({
      status,
      isConnected: status === "connected",
      joinConversation,
      leaveConversation,
      emitRead,
      emitTypingState,
      emitMessage,
    }),
    [emitMessage, emitRead, emitTypingState, joinConversation, leaveConversation, status],
  );
};

export default useChatSocket;
