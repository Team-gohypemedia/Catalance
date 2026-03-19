"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import format from "date-fns/format";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import isSameDay from "date-fns/isSameDay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Clock4 from "lucide-react/dist/esm/icons/clock-4";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Search from "lucide-react/dist/esm/icons/search";
import { apiClient, SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/shared/lib/api-client";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/shared/lib/utils";

const SERVICE_LABEL = "Project Chat";

const formatTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getConversationKey = (conversation) =>
  conversation?.serviceKey || conversation?.id || null;

const sortConversations = (list = []) =>
  [...list].sort((left, right) => (right.lastActivity || 0) - (left.lastActivity || 0));

const getInitials = (value = "") => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "C";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatConversationTimestamp = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "YESTERDAY";

  return format(date, "MMM dd").toUpperCase();
};

const getMessagePreview = (conversation = {}) => {
  if (typeof conversation?.previewText === "string" && conversation.previewText.trim()) {
    return conversation.previewText.trim();
  }

  if (typeof conversation?.projectTitle === "string" && conversation.projectTitle.trim()) {
    return conversation.projectTitle.trim();
  }

  if (typeof conversation?.label === "string" && conversation.label.trim()) {
    return conversation.label.trim();
  }

  return "Open the conversation to continue the project discussion.";
};

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  unreadCount = 0,
  showOnline = false,
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "relative flex w-full items-center gap-4 rounded-[18px] border px-4 py-3 text-left transition",
      isActive
        ? "border-white/[0.08] bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        : "border-transparent text-white hover:border-white/[0.05] hover:bg-white/[0.03]",
    )}
  >
    <div className="relative shrink-0">
      <Avatar className={cn("size-12 border", isActive ? "border-white/[0.12]" : "border-white/10")}>
        <AvatarImage src={conversation.avatar || undefined} alt={conversation.label || conversation.name} />
        <AvatarFallback className="bg-[#2b2b31] text-sm font-semibold text-white">
          {getInitials(conversation.label || conversation.name)}
        </AvatarFallback>
      </Avatar>
      {showOnline ? (
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#171717] bg-[#22c55e]" />
      ) : null}
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[0.98rem] font-semibold text-white">
          {conversation.label || conversation.name || "Project chat"}
        </p>
        <span
          className={cn(
            "shrink-0 text-[11px]",
            isActive ? "text-[#cbd5e1]" : "text-[#7f8795]",
          )}
        >
          {formatConversationTimestamp(conversation.lastActivity)}
        </span>
      </div>

      <p
        className={cn(
          "mt-1 truncate text-sm",
          isActive ? "text-[#cbd5e1]" : "text-[#8f96a3]",
        )}
      >
        {conversation.name ? `${conversation.name} • ${getMessagePreview(conversation)}` : getMessagePreview(conversation)}
      </p>
    </div>

    {unreadCount > 0 ? (
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
        {unreadCount}
      </span>
    ) : null}
  </button>
);

const ChatArea = ({
  conversationName,
  avatar,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sending,
  currentUser,
  typingUsers,
  online,
  onFileUpload,
  onDeleteAttachment
}) => {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!messageInput.trim() && !selectedFile) || uploading) return;
    
    let attachment = null;
    
    if (selectedFile && onFileUpload) {
      setUploading(true);
      try {
        attachment = await onFileUpload(selectedFile);
      } catch (error) {
        console.error("Failed to upload file:", error);
        alert("Failed to upload file. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
      clearFile();
    }
    
    onSendMessage(attachment);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const renderAttachment = (attachment, messageId, isOwnMessage) => {
    if (!attachment || !attachment.url) return null;
    
    const isImage = attachment.type?.startsWith("image/") || 
                    attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    const handleDelete = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this attachment?")) {
        if (onDeleteAttachment) {
          onDeleteAttachment(messageId);
        }
      }
    };
    
    if (isImage) {
      return (
        <div className="relative group mt-2 inline-block">
          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
            <img 
              src={attachment.url} 
              alt={attachment.name || "Attachment"} 
              className={`max-w-[200px] max-h-[200px] rounded-lg object-cover ${isOwnMessage ? "" : "border border-border/50"}`}
            />
          </a>
          {isOwnMessage && onDeleteAttachment && (
            <button
              onClick={handleDelete}
              className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive shadow-md"
              title="Delete attachment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="relative group mt-2">
        <a 
          href={attachment.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity ${isOwnMessage ? "" : "bg-muted/50 hover:bg-muted"}`}
        >
          <Paperclip className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{attachment.name || "File"}</p>
            {attachment.size && (
              <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
            )}
          </div>
        </a>
        {isOwnMessage && onDeleteAttachment && (
          <button
            onClick={handleDelete}
            className="absolute top-1 right-1 p-1 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive shadow-sm"
            title="Delete attachment"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background to-background/70">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--grid-line-color) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/40 bg-card/60 px-8 py-5 backdrop-blur-xl">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} alt={conversationName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {conversationName?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <p className="text-lg font-semibold">{conversationName}</p>
          <p className="text-xs text-muted-foreground">{online ? "Online" : "Offline"}</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          Live
        </Badge>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-6 py-4">
        {messages.map((message, index) => {
          const isSelf =
            (currentUser?.id && String(message.senderId) === String(currentUser.id)) ||
            message.senderRole === "FREELANCER";
          const isAssistant = message.role === "assistant";
          const align = isAssistant || !isSelf ? "justify-start" : "justify-end";
          const isDeleted = message.deleted || message.isDeleted;

          const bubbleClass = (() => {
            if (isAssistant) {
              return "bg-muted/50 text-muted-foreground border border-border/50";
            }
            if (isDeleted) {
              return "bg-muted/30 text-muted-foreground border border-border/50 italic";
            }
            if (isSelf) {
              return "bg-card text-card-foreground border border-border/50 shadow-sm";
            }
            // Received messages -- NOW PRIMARY
            return "bg-primary text-neutral-900 shadow-sm border-none shadow-sm";
          })();

          const prevMessage = messages[index - 1];
          const currentDate = message.createdAt ? new Date(message.createdAt) : new Date();
          const prevDate = prevMessage?.createdAt ? new Date(prevMessage.createdAt) : null;
          const showDateDivider = !prevDate || !isSameDay(currentDate, prevDate);

          return (
            <React.Fragment key={message.id || index}>
              {showDateDivider && (
                <div className="flex justify-center my-4">
                  <span className="bg-muted/40 px-3 py-1 rounded-full text-[10px] uppercase font-medium tracking-wide text-muted-foreground/70">
                    {isToday(currentDate)
                      ? "Today"
                      : isYesterday(currentDate)
                      ? "Yesterday"
                      : format(currentDate, "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className={`flex ${align}`}>
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-2.5 text-sm flex flex-col overflow-hidden ${
                    isSelf ? "rounded-tr-sm" : "rounded-tl-sm"
                  } ${bubbleClass}`}
                  role="group"
                >
                  {isDeleted ? (
                    <div className="flex items-baseline gap-2">
                      <Clock4 className="h-4 w-4 flex-shrink-0 opacity-70" />
                      <span className="italic text-foreground/90 flex-1">
                        {isSelf ? "You deleted this message." : "This message was deleted."}
                      </span>
                    </div>
                  ) : (
                    <>
                      {message.content && (
                        <p
                          className="leading-relaxed whitespace-pre-wrap"
                          style={{
                            overflowWrap: "break-word",
                            wordBreak: "break-all"
                          }}
                        >
                          {message.content}
                        </p>
                      )}
                      {message.attachment && renderAttachment(message.attachment, message.id, isSelf)}
                    </>
                  )}
                  <div className="flex items-center gap-1 self-end mt-1">
                    {message.createdAt ? (
                      <span className="text-[10px] lowercase opacity-70 whitespace-nowrap">
                        {formatTime(message.createdAt)}
                      </span>
                    ) : null}
                     {isSelf && (
                      <span className="ml-1" title={message.readAt ? `Read ${formatTime(message.readAt)}` : "Sent"}>
                        {message.readAt ? (
                          <CheckCheck className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-black/50" strokeWidth={2} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {typingUsers.length > 0 ? (
          <div className="flex justify-start">
            <div className="max-w-[60%] rounded-sm border border-border/60 bg-card/70 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {typingUsers[0]} {typingUsers.length > 1 ? "and others" : ""} typing...
              </span>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/40 px-6 py-5">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Paperclip className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={clearFile}
            >
              <span className="sr-only">Remove file</span>
              ×
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-3 rounded-full bg-card/60 px-4 py-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            title="Attach file"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(event) => onMessageInputChange(event.target.value)}
            onKeyDown={handleKeyPress}
            className="border-none bg-transparent focus-visible:ring-0"
            disabled={sending || uploading}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-full bg-primary"
            disabled={(sending || uploading) || (!messageInput.trim() && !selectedFile)}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const FreelancerChatContent = () => {
  const { user, authFetch, token } = useAuth();
  const { socket: notificationSocket } = useNotifications();
  const [searchParams] = useSearchParams();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useSocket, setUseSocket] = useState(SOCKET_ENABLED);
  const [conversationSearch, setConversationSearch] = useState("");
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const drafts = useRef({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [online, setOnline] = useState(false);
  const deferredConversationSearch = useDeferredValue(conversationSearch);
  const selectedConversationKey = useMemo(
    () => getConversationKey(selectedConversation),
    [selectedConversation],
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const response = await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "GET",
        skipLogoutOn401: true
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch messages (status ${response.status})`);
      }
      const payload = await response.json().catch(() => null);
      const nextMessages =
        payload?.data?.messages || payload?.messages || [];
      setMessages(nextMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [authFetch, conversationId]);

  const emitTyping = () => {
    if (!useSocket || !socketRef.current || !conversationId) return;
    const payload = {
      conversationId,
      typing: true,
      userId: user?.id || socketRef.current.id,
      userName: user?.fullName || user?.name || user?.email || "Someone"
    };
    socketRef.current.emit("chat:typing", payload);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", {
        ...payload,
        typing: false
      });
    }, 1500);
  };

  const startPolling = useCallback(() => {
    stopPolling();
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
  }, [fetchMessages, stopPolling]);

  // Reset state when switching conversation to avoid cross-chat bleed.
  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setTypingUsers([]);
    setOnline(false);
  }, [selectedConversation?.serviceKey, selectedConversation?.id]);

  // Load clients that have sent proposals/own projects for this freelancer
  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      if (!authFetch) return;
      try {
        const response = await authFetch("/proposals?as=freelancer");
        const payload = await response.json().catch(() => null);
        const items = Array.isArray(payload?.data) ? payload.data : [];

        const uniq = [];
        const seen = new Set();
        for (const item of items) {
          // Filter: Only show accepted proposals (active projects)
          if (item.status !== "ACCEPTED") continue;
          const projectStatus = (item.project?.status || "").toUpperCase();
          const spentAmount = Number(item.project?.spent || 0);
          const isPaymentPending =
            projectStatus === "AWAITING_PAYMENT" || spentAmount <= 0;
          if (isPaymentPending) continue;

          const owner = item.project?.owner;
          if (!owner?.id) continue;
          
          const projectId = item.project?.id;
          if (!projectId) continue;

          // Create unique key PER PROJECT (not per client)
          // Format: CHAT:PROJECT_ID:CLIENT_ID:FREELANCER_ID
          const sharedKey = `CHAT:${projectId}:${owner.id}:${user?.id || "freelancer"}`;
          
          // Dedupe by project (not by client)
          if (seen.has(sharedKey)) continue;
          seen.add(sharedKey);

          uniq.push({
            id: projectId, // Use projectId as the conversation id
            clientId: owner.id,
            name: owner.fullName || owner.name || owner.email || "Client",
            avatar: owner.avatar,
            label: item.project?.title || "Client Project",
            serviceKey: sharedKey,
            projectTitle: item.project?.title || "Client Project",
            // Add timestamp for sorting - use backend provided lastActivity if available
            lastActivity: new Date(item.lastActivity || item.updatedAt || item.createdAt || 0).getTime(),
            unreadCount: 0
          });
        }

        const finalList = sortConversations(uniq);
        if (!cancelled) {
          setConversations(finalList);
          // If we have conversations, select the first one by default.
          // Otherwise, select null so we show the "empty state".
          if (finalList.length > 0) {
            const paramProjectId = searchParams.get("projectId");
            let target = null;
            
            if (paramProjectId) {
                target = finalList.find(c => String(c.id) === String(paramProjectId));
            }
            
            if (!target) {
                target = finalList[0];
            }
            setSelectedConversation(target);
          } else {
            setSelectedConversation(null);
          }
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [authFetch, searchParams, user?.id]);

  useEffect(() => {
    if (!selectedConversation) return;
    let cancelled = false;

    const ensureConversation = async () => {
      const storageKey = `markify:chatConversationId:${selectedConversation.serviceKey || selectedConversation.id}`;
      try {
        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
        if (stored) {
          setConversationId(stored);
          return;
        }
        if (!authFetch || !token) return;
        const response = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL,
            projectTitle: selectedConversation.projectTitle || selectedConversation.label || "Project Chat"
          }),
          skipLogoutOn401: true
        });
        if (!response.ok) {
          throw new Error(`Failed to start conversation (status ${response.status})`);
        }
        const payload = await response.json().catch(() => null);
        const conversation = payload?.data || payload;
        if (!cancelled && conversation?.id) {
          setConversationId(conversation.id);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, conversation.id);
          }
        }
      } catch (error) {
        console.error("Failed to start chat conversation:", error);
      }
    };
    ensureConversation();

    return () => {
      cancelled = true;
    };
  }, [authFetch, selectedConversation, token]);

  useEffect(() => {
    if (!conversationId || !selectedConversation) return;

    const storageKey = `markify:chatConversationId:${selectedConversation.serviceKey || selectedConversation.id}`;
    const socket = useSocket && SOCKET_IO_URL ? io(SOCKET_IO_URL, SOCKET_OPTIONS) : null;
    socketRef.current = socket;

    if (!socket) {
      startPolling();
      return () => stopPolling();
    }

    socket.emit("chat:join", {
      conversationId,
      service: selectedConversation.serviceKey || selectedConversation.label || SERVICE_LABEL,
      senderId: user?.id || null
    });

    socket.on("chat:joined", (payload) => {
      if (payload?.conversationId) {
        setConversationId(payload.conversationId);
        // Mark as read immediately upon joining
        socket.emit("chat:read", { conversationId: payload.conversationId, userId: user?.id });
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, payload.conversationId);
        }
      }
    });

    socket.on("chat:read_receipt", ({ conversationId: cid, readAt }) => {
       if (cid !== conversationId) return;
       setMessages(prev => prev.map(msg => {
         // Mark all messages sent by ME (or as 'user') as read if reader is someone else
         // Simplification: just mark anything unread as read if it's not the reader's own message
         if (String(msg.senderId) === String(user?.id) || msg.senderRole === "FREELANCER") { 
             return { ...msg, readAt: readAt || new Date().toISOString() };
         }
         return msg;
       }));
    });

    socket.on("chat:history", (history = []) => {
      const sorted = [...history].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
      setMessages(sorted);
    });

    socket.on("chat:message", (message) => {
      setSending(message?.role !== "assistant");
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) =>
            !msg.pending ||
            msg.content !== message?.content ||
            msg.role !== message?.role
        );
        return [...filtered, message];
      });
      
      // Move this conversation to the top (like WhatsApp)
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if ((conv.serviceKey || conv.id) === (selectedConversation?.serviceKey || selectedConversation?.id)) {
            return { ...conv, lastActivity: Date.now() };
          }
          return conv;
        });
        return sortConversations(updated);
      });

      // If we are viewing this conversation, mark the new message as read immediately
      if (message.conversationId === conversationId && String(message.senderId) !== String(user?.id)) {
         socket.emit("chat:read", { conversationId, userId: user?.id });
      }
    });

    socket.on("chat:error", (payload) => {
      console.error("Socket error:", payload);
      setSending(false);
    });

    socket.on("chat:typing", ({ conversationId: cid, typing, userId: uid, userName }) => {
      if (!cid || cid !== conversationId) return;
      if (uid && user?.id && uid === user.id) return;
      setTypingUsers((prev) => {
        const existing = new Map(prev.map((u) => [u.id, u.name]));
        if (typing) {
          existing.set(uid || userName || "unknown", userName || "Someone");
        } else {
          existing.delete(uid || userName || "unknown");
        }
        return Array.from(existing.entries()).map(([id, name]) => ({
          id,
          name
        }));
      });
    });

    socket.on("chat:presence", ({ conversationId: cid, online: list = [] }) => {
      if (!cid || cid !== conversationId) return;
      setOnline(Array.isArray(list) && list.length > 0);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error?.message || error);
      setUseSocket(false);
      stopPolling();
      startPolling();
      socket.disconnect();
    });

    return () => {
      stopPolling();
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [conversationId, selectedConversation, startPolling, stopPolling, useSocket, user?.id]);

  // Separate effect for global notifications (sorting and unread counts)
  useEffect(() => {
    if (!notificationSocket) return;

    const handleNotification = (data) => {
      console.log("[FreelancerChat] Notification received:", data); // Debug log
      if (data.type === "chat" && data.data) {
         const { service, senderId } = data.data;
         
         setConversations((prev) => {
           console.log("[FreelancerChat] Updating conversations for service:", service, "Sender:", senderId);
           const updated = prev.map(c => {
             // Match strictly by serviceKey to avoid duplicates across multiple projects with same client
             const isMatch = (c.serviceKey && c.serviceKey === service);
             
             if (isMatch) {
               console.log("[FreelancerChat] Matched conversation:", c.name);
               // Check if this conversation is currently selected
               const isSelected = (c.serviceKey || c.id) === (selectedConversation?.serviceKey || selectedConversation?.id);
               return { 
                 ...c, 
                 lastActivity: Date.now(),
                 unreadCount: isSelected ? 0 : (c.unreadCount || 0) + 1
               };
             }
             return c;
           });
           
           return sortConversations(updated);
         });
      }
    };
    
    notificationSocket.on("notification:new", handleNotification);
    return () => {
      notificationSocket.off("notification:new", handleNotification);
    };
  }, [notificationSocket, selectedConversation]);

  // Upload file to server and return attachment metadata
  const uploadChatFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await authFetch("/upload/chat", {
      method: "POST",
      body: formData,
      skipLogoutOn401: true
    });
    
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    
    const result = await response.json();
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      url: result.data?.url || result.url
    };
  };

  // Delete attachment from server and update local state
  const deleteAttachment = async (messageId) => {
    try {
      const response = await authFetch(`/upload/chat/${messageId}`, {
        method: "DELETE",
        skipLogoutOn401: true
      });
      
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      
      const result = await response.json();
      
      // Update local messages state - mark as deleted if no content, or just remove attachment
      setMessages((prev) => prev.map((msg) => {
        if (msg.id === messageId) {
          return result.deleted 
            ? { ...msg, attachment: null, deleted: true, content: null }
            : { ...msg, attachment: null };
        }
        return msg;
      }));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      alert("Failed to delete attachment. Please try again.");
    }
  };

  const handleSendMessage = (attachment = null) => {
    if (!messageInput.trim() && !attachment) return;

    const payload = {
      content: messageInput,
      service: selectedConversation?.serviceKey || selectedConversation?.label || SERVICE_LABEL,
      senderId: user?.id || null,
      senderRole: user?.role || "GUEST",
      senderName: user?.fullName || user?.name || user?.email || "Freelancer",
      skipAssistant: true,
      attachment: attachment || undefined
    };

    setMessages((prev) => [
      ...prev,
      { ...payload, role: "user", pending: true }
    ]);
    setMessageInput("");
    setSending(true);
    
    // Move this conversation to the top immediately when sending (like WhatsApp)
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if ((conv.serviceKey || conv.id) === (selectedConversation?.serviceKey || selectedConversation?.id)) {
          return { ...conv, lastActivity: Date.now() };
        }
        return conv;
      });
      return updated.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
    });
    
    if (useSocket && socketRef.current) {
      socketRef.current.emit("chat:message", payload);
    } else {
      const sender = authFetch
        ? authFetch(`/chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            skipLogoutOn401: true
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(`Send failed (status ${response.status})`);
            }
            const resPayload = await response.json().catch(() => null);
            return resPayload?.data?.message || resPayload?.message || payload;
          })
        : apiClient
            .sendChatMessage({ ...payload, conversationId })
            .then((response) => response?.data?.message || response?.message || payload);

      sender
        .then((userMsg) => {
          setMessages((prev) => {
            const filtered = prev.filter(
              (msg) =>
                !msg.pending ||
                msg.content !== payload.content ||
                msg.role !== "user"
            );
            return [...filtered, userMsg];
          });
        })
        .catch((error) => {
          console.error("Failed to send message via HTTP:", error);
        })
        .finally(() => setSending(false));
    }
  };

  const handleInputChange = (value) => {
    setMessageInput(value);
    emitTyping();
  };

  const activeMessages = useMemo(() => messages, [messages]);
  const filteredConversations = useMemo(() => {
    const query = deferredConversationSearch.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.name,
        conversation.projectTitle,
        conversation.label,
        getMessagePreview(conversation),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, deferredConversationSearch]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background transition-colors duration-300">
      <FreelancerTopBar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 z-10 relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto min-h-full">
          <section className="mt-7 flex min-h-0 flex-1">
            <div className="flex h-[calc(100vh-13.5rem)] min-h-[720px] w-full flex-col overflow-hidden rounded-[28px] border border-white/[0.05] bg-accent lg:flex-row">
              <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-accent lg:w-[360px] lg:border-b-0 lg:border-r lg:border-white/[0.06]">
                <div className="px-6 pb-5 pt-7">
                  <p className="text-[1.05rem] font-semibold text-white">Messages</p>
                </div>

                <div className="px-6 pb-6">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-[#6b7280]" />
                    <Input
                      value={conversationSearch}
                      onChange={(event) => setConversationSearch(event.target.value)}
                      placeholder="Search chats..."
                      className="h-11 rounded-[16px] border-white/[0.1] bg-white/[0.02] pl-11 text-sm text-white placeholder:text-[#646b77] focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.14] [&::-webkit-scrollbar-track]:bg-transparent">
                  {loading ? (
                    <div className="flex h-full min-h-[280px] items-center justify-center gap-3 text-sm text-[#8f96a3]">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading chats...</span>
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    <div className="space-y-2">
                      {filteredConversations.map((conversation) => {
                        const conversationKey = getConversationKey(conversation);
                        const isActive = conversationKey === selectedConversationKey;

                        return (
                          <ConversationItem
                            key={conversationKey}
                            conversation={conversation}
                            isActive={isActive}
                            unreadCount={conversation.unreadCount}
                            showOnline={isActive && online}
                            onSelect={() => {
                              if (selectedConversationKey) {
                                drafts.current[selectedConversationKey] = messageInput;
                              }

                              const nextKey = getConversationKey(conversation);
                              setMessageInput(drafts.current[nextKey] || "");
                              setMessages([]);
                              setConversationId(null);
                              setSelectedConversation(conversation);
                              setConversations((prev) =>
                                prev.map((item) =>
                                  getConversationKey(item) === nextKey
                                    ? { ...item, unreadCount: 0 }
                                    : item,
                                ),
                              );
                            }}
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
                        Try a different client name or project title.
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
                      <div className="rounded-full border border-white/[0.06] bg-[#202020] p-4 text-[#ffc107]">
                        <SendHorizontal className="size-5" />
                      </div>
                      <p className="mt-4 text-base font-semibold text-white">
                        No conversations yet
                      </p>
                      <p className="mt-2 text-sm text-[#8f96a3]">
                        Accepted project collaborations will appear here automatically.
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {selectedConversation ? (
                  <ChatArea
                    conversationName={selectedConversation?.label || selectedConversation?.name || SERVICE_LABEL}
                    avatar={selectedConversation?.avatar}
                    messages={activeMessages}
                    messageInput={messageInput}
                    onMessageInputChange={handleInputChange}
                    onSendMessage={handleSendMessage}
                    onFileUpload={uploadChatFile}
                    onDeleteAttachment={deleteAttachment}
                    sending={sending}
                    currentUser={user}
                    typingUsers={typingUsers.map((u) => u.name)}
                    online={online}
                  />
                ) : (
                  <div className="flex h-full min-h-0 items-center justify-center bg-accent px-6">
                    <div className="max-w-md text-center">
                      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020] text-[#ffc107]">
                        <SendHorizontal className="size-6" />
                      </div>
                      <h2 className="mt-5 text-2xl font-semibold text-white">
                        Select a conversation
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-[#8f96a3]">
                        Pick a project thread from the left to review updates, reply to clients, and keep delivery moving.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const FreelancerChat = () => <FreelancerChatContent />;

export default FreelancerChat;

