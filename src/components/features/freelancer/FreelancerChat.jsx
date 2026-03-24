"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import format from "date-fns/format";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import isSameDay from "date-fns/isSameDay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FreelancerTopBar } from "@/components/features/freelancer/FreelancerTopBar";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Clock4 from "lucide-react/dist/esm/icons/clock-4";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Search from "lucide-react/dist/esm/icons/search";
import Smile from "lucide-react/dist/esm/icons/smile";
import { apiClient, SOCKET_IO_URL, SOCKET_OPTIONS, SOCKET_ENABLED } from "@/shared/lib/api-client";
import { migrateChatConversationStorageKey } from "@/shared/lib/storage-keys";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useSearchParams } from "react-router-dom";
import { extractLabeledLineValue } from "@/shared/lib/labeled-fields";
import { cn } from "@/shared/lib/utils";

const SERVICE_LABEL = "Project Chat";
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const CHAT_EMOJIS = ["😀", "😂", "😊", "😍", "🔥", "👍", "👏", "🙏", "🎉", "✅", "🤝", "💡"];

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

const formatDayDivider = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  return format(date, "MMMM d, yyyy");
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const extractLabeledValue = (value = "", labels = []) =>
  extractLabeledLineValue(value, labels);

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const resolveProjectBusinessName = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.businessName,
    project?.companyName,
    project?.owner?.companyName,
    project?.owner?.businessName,
    project?.owner?.brandName,
    acceptedProposal?.businessName,
    acceptedProposal?.companyName,
    extractLabeledValue(project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Business Name", "Company Name", "Brand Name"],
    ),
  );

const resolveProjectServiceType = (project = {}, acceptedProposal = null) =>
  getFirstNonEmptyText(
    project?.service,
    project?.serviceName,
    project?.serviceKey,
    project?.category,
    acceptedProposal?.service,
    acceptedProposal?.serviceName,
    acceptedProposal?.serviceKey,
    acceptedProposal?.category,
    extractLabeledValue(project?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    extractLabeledValue(
      acceptedProposal?.coverLetter || acceptedProposal?.description || "",
      ["Service Type", "Service", "Category"],
    ),
    project?.title,
  );

const getConversationDisplayTitle = (conversation = {}) =>
  getFirstNonEmptyText(
    conversation?.businessName,
    conversation?.projectTitle,
    conversation?.label,
    conversation?.name,
    "Project chat",
  );

const getConversationDisplaySubtitle = (conversation = {}) => {
  const subtitleParts = [
    getFirstNonEmptyText(conversation?.clientName, conversation?.name),
    getFirstNonEmptyText(conversation?.serviceType, conversation?.label),
  ].filter(Boolean);

  const uniqueParts = subtitleParts.filter(
    (value, index, list) =>
      list.findIndex(
        (candidate) => normalizeComparableText(candidate) === normalizeComparableText(value),
      ) === index,
  );

  return uniqueParts.join(" • ") || "Project chat";
};

const getMessagePreview = (conversation = {}) => {
  if (typeof conversation?.previewText === "string" && conversation.previewText.trim()) {
    return conversation.previewText.trim();
  }

  return getConversationDisplaySubtitle(conversation);
};

const isOwnMessage = (message, currentUser) => {
  if (message?.pending) {
    return true;
  }

  if (
    message?.senderId &&
    currentUser?.id &&
    String(message.senderId) === String(currentUser.id)
  ) {
    return true;
  }

  return String(message?.senderRole || "").toUpperCase() === "FREELANCER";
};

const getMessageRoleLabel = (message, ownMessage) => {
  if (ownMessage) {
    return "Freelancer";
  }

  const senderRole = String(message?.senderRole || "").toUpperCase();
  if (senderRole === "CLIENT") {
    return "Client";
  }

  return "Client";
};

const updateConversationDetails = (list, targetKey, updater) =>
  sortConversations(
    list.map((conversation) => {
      const conversationKey = getConversationKey(conversation);
      if (conversationKey !== targetKey) {
        return conversation;
      }

      return {
        ...conversation,
        ...(typeof updater === "function" ? updater(conversation) : updater),
      };
    }),
  );

const ChatIconButton = ({ className, children, ...props }) => (
  <button
    type="button"
    className={cn(
      "flex size-9 items-center justify-center rounded-full text-[#8f96a3] transition hover:bg-white/[0.03] hover:text-white disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  unreadCount = 0,
  showOnline = false,
}) => {
  const displayTitle = getConversationDisplayTitle(conversation);
  const displaySubtitle = getConversationDisplaySubtitle(conversation);

  return (
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
          <AvatarImage src={conversation.avatar || undefined} alt={displayTitle} />
          <AvatarFallback className="bg-[#2b2b31] text-sm font-semibold text-white">
            {getInitials(displayTitle)}
          </AvatarFallback>
        </Avatar>
        {showOnline ? (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#171717] bg-[#22c55e]" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[0.98rem] font-semibold text-white">{displayTitle}</p>
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
          {displaySubtitle}
        </p>
      </div>

      {unreadCount > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  );
};

const ChatArea = ({
  conversation,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sending,
  currentUser,
  typingUsers,
  online,
  onFileUpload,
  onDeleteAttachment,
  onClearChat,
  isClearingChat = false,
}) => {
  const messagesViewportRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageSearchInputRef = useRef(null);
  const composerInputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastConversationKeyRef = useRef("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const deferredMessageSearch = useDeferredValue(messageSearch);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const conversationTitle = getConversationDisplayTitle(conversation);
  const conversationSubtitle = getConversationDisplaySubtitle(conversation);
  const conversationAvatarLabel = conversationTitle || "Project chat";

  const visibleMessages = useMemo(() => {
    const query = deferredMessageSearch.trim().toLowerCase();

    if (!query) {
      return messages;
    }

    return messages.filter((message) => {
      const haystack = [
        message?.content,
        message?.attachment?.name,
        message?.senderName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredMessageSearch, messages]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    const conversationKey = getConversationKey(conversation);
    const conversationChanged = lastConversationKeyRef.current !== conversationKey;

    if (conversationChanged) {
      lastConversationKeyRef.current = conversationKey;
      shouldAutoScrollRef.current = true;
    }

    if (!viewport || !shouldAutoScrollRef.current) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: conversationChanged ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [conversation, typingUsers.length, visibleMessages.length]);

  useEffect(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessageSearch("");
    setShowMessageSearch(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [conversation?.id, conversation?.serviceKey]);

  useEffect(() => {
    if (showMessageSearch) {
      messageSearchInputRef.current?.focus();
    }
  }, [showMessageSearch]);

  const handleMessagesScroll = useCallback(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= 96;
  }, []);

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const input = composerInputRef.current;
    const currentValue = messageInput || "";
    const selectionStart = input?.selectionStart ?? currentValue.length;
    const selectionEnd = input?.selectionEnd ?? currentValue.length;
    const nextValue =
      `${currentValue.slice(0, selectionStart)}${emoji}${currentValue.slice(selectionEnd)}`;

    onMessageInputChange(nextValue);
    setEmojiPickerOpen(false);

    requestAnimationFrame(() => {
      const nextCaretPosition = selectionStart + emoji.length;
      input?.focus();
      input?.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE) {
      alert("File size must be less than 10MB.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setFilePreview(loadEvent.target?.result || null);
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

  const isImageAttachment = (attachment) =>
    Boolean(
      attachment?.url && (
        attachment.type?.startsWith("image/") ||
        attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      ),
    );

  const renderMessageStatus = (message, ownsMessage, tone = "default") => {
    const textTone = ownsMessage
      ? tone === "default"
        ? "text-[#8b6d14]"
        : "text-primary-foreground/70"
      : tone === "default"
        ? "text-[#7f8795]"
        : "text-[#9ba3af]";

    return (
      <div className={cn("flex items-center gap-1.5 text-[11px]", textTone)}>
        <span>{formatTime(message.createdAt)}</span>
        {ownsMessage ? (
          message.pending ? (
            <Loader2 className="ml-0.5 size-3 animate-spin" />
          ) : message.readAt ? (
            <CheckCheck className="ml-0.5 size-3.5" strokeWidth={2.5} />
          ) : (
            <Check className="ml-0.5 size-3.5" strokeWidth={2.3} />
          )
        ) : null}
      </div>
    );
  };

  const renderImageAttachment = (attachment, messageId, ownsMessage) => {
    const handleDelete = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.confirm("Are you sure you want to delete this attachment?")) {
        await onDeleteAttachment?.(messageId);
      }
    };

    return (
      <div className="group relative overflow-hidden rounded-[10px]">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.name || "Attachment"}
            className="block max-h-[280px] w-full max-w-[320px] rounded-[10px] object-cover"
          />
        </a>

        {ownsMessage && onDeleteAttachment ? (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
            title="Delete attachment"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
    );
  };

  const renderAttachment = (attachment, messageId, ownsMessage) => {
    if (!attachment?.url) return null;

    const handleDelete = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.confirm("Are you sure you want to delete this attachment?")) {
        await onDeleteAttachment?.(messageId);
      }
    };

    if (isImageAttachment(attachment)) {
      return renderImageAttachment(attachment, messageId, ownsMessage);
    }

    return (
      <div className="group relative mt-3">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3 transition hover:border-white/15",
            ownsMessage
              ? "border-black/10 bg-black/10 text-black/80"
              : "border-white/[0.06] bg-white/[0.03] text-[#f1f5f9]",
          )}
        >
          <Paperclip className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {attachment.name || "File attachment"}
            </p>
            {attachment.size ? (
              <p className={cn("text-[11px]", ownsMessage ? "text-black/60" : "text-[#8f96a3]")}>
                {formatFileSize(attachment.size)}
              </p>
            ) : null}
          </div>
        </a>

        {ownsMessage && onDeleteAttachment ? (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
            title="Delete attachment"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-accent">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] bg-accent px-5 py-4 md:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="size-12 border border-white/10">
              <AvatarImage src={conversation?.avatar || undefined} alt={conversationAvatarLabel} />
              <AvatarFallback className="bg-[#2b2b31] text-sm font-semibold text-white">
                {getInitials(conversationAvatarLabel)}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3 rounded-full border-2 border-accent",
                online ? "bg-[#22c55e]" : "bg-[#6b7280]",
              )}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[1.15rem] font-semibold tracking-[-0.3px] text-white">
              {conversationTitle}
            </p>
            <p className={cn("text-sm font-medium", online ? "text-[#facc15]" : "text-[#8f96a3]")}>
              {online ? `${conversationSubtitle} • Online` : conversationSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showMessageSearch ? (
            <Input
              ref={messageSearchInputRef}
              value={messageSearch}
              onChange={(event) => setMessageSearch(event.target.value)}
              placeholder="Search in chat..."
              className="h-9 w-[220px] rounded-[14px] border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white placeholder:text-[#6b7280] focus-visible:ring-0"
            />
          ) : null}

          <ChatIconButton
            aria-label="Search messages"
            onClick={() => {
              if (showMessageSearch && !messageSearch) {
                setShowMessageSearch(false);
                return;
              }

              setShowMessageSearch(true);
            }}
          >
            <Search className="size-4.5" />
          </ChatIconButton>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className="flex size-9 items-center justify-center rounded-full text-[#8f96a3] transition hover:bg-white/[0.03] hover:text-white"
              aria-label="More actions"
            >
              <MoreVertical className="size-4.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-[16px] border-white/[0.08] bg-[#1c1c1c] p-1.5 text-white"
            >
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  void onClearChat?.();
                }}
                disabled={isClearingChat}
                className="rounded-[12px] px-3 py-2 text-sm text-[#fca5a5] focus:bg-white/[0.05] focus:text-[#fecaca] data-[disabled]:opacity-50"
              >
                {isClearingChat ? "Clearing..." : "Clear chat"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        ref={messagesViewportRef}
        onScroll={handleMessagesScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-accent px-2 py-6 md:px-2.5 lg:px-3 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.16] [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 pb-4">
          {visibleMessages.map((message, index) => {
            const ownMessage = isOwnMessage(message, currentUser);
            const deleted = message.deleted || message.isDeleted;
            const imageAttachment = isImageAttachment(message.attachment);
            const previousMessage = visibleMessages[index - 1];
            const previousOwnMessage = previousMessage
              ? isOwnMessage(previousMessage, currentUser)
              : null;
            const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
            const previousDate = previousMessage?.createdAt
              ? new Date(previousMessage.createdAt)
              : null;
            const showDateDivider = !previousDate || !isSameDay(messageDate, previousDate);
            const roleLabel = getMessageRoleLabel(message, ownMessage);
            const previousRoleLabel = previousMessage
              ? getMessageRoleLabel(previousMessage, previousOwnMessage)
              : "";
            const showRoleLabel =
              showDateDivider ||
              !previousMessage ||
              ownMessage !== previousOwnMessage ||
              roleLabel !== previousRoleLabel;

            return (
              <React.Fragment key={message.id || `${message.createdAt || index}-${index}`}>
                {showDateDivider ? (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full border border-white/[0.06] bg-[#1a1a1a] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f8795]">
                      {formatDayDivider(messageDate)}
                    </span>
                  </div>
                ) : null}

                <div className={cn("flex items-end gap-3", ownMessage ? "justify-end" : "justify-start")}>
                  {!ownMessage ? (
                    <Avatar className="hidden size-8 shrink-0 self-end border border-white/10 sm:flex">
                      <AvatarImage src={conversation?.avatar || undefined} alt={conversationAvatarLabel} />
                      <AvatarFallback className="bg-[#2b2b31] text-[11px] font-semibold text-white">
                        {getInitials(conversationAvatarLabel)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}

                  <div
                    className={cn(
                      "flex max-w-[88%] flex-col md:max-w-[74%]",
                      ownMessage ? "items-end" : "items-start",
                    )}
                  >
                    {showRoleLabel ? (
                      <p
                        className={cn(
                          "mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          ownMessage ? "text-right text-[#facc15]" : "text-left text-[#94a3b8]",
                        )}
                      >
                        {roleLabel}
                      </p>
                    ) : null}

                    <div className="flex max-w-full flex-col gap-3">
                      {deleted ? (
                        <div
                          className={cn(
                            "w-fit max-w-full rounded-[20px] px-6 py-4 shadow-[0_18px_45px_-38px_rgba(0,0,0,0.8)]",
                            ownMessage
                              ? "min-w-[96px] rounded-[14px] rounded-br-none bg-primary text-primary-foreground"
                              : "min-w-[96px] rounded-[14px] rounded-bl-none border border-white/[0.06] bg-[#1d1d1d] text-[#8f96a3]",
                          )}
                        >
                          <div className="flex items-start gap-2 text-sm italic">
                            <Clock4 className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span>
                              {ownMessage
                                ? "You deleted this message."
                                : "This message was deleted."}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {imageAttachment ? (
                            <div
                              className={cn(
                                "w-fit max-w-full overflow-hidden rounded-[14px] p-1.5 shadow-[0_18px_45px_-38px_rgba(0,0,0,0.8)]",
                                ownMessage
                                  ? "rounded-br-none bg-primary text-primary-foreground"
                                  : "rounded-bl-none border border-white/[0.06] bg-[#1d1d1d]",
                              )}
                            >
                              {renderImageAttachment(message.attachment, message.id, ownMessage)}

                              <div
                                className={cn(
                                  "flex items-end gap-2 px-1 pb-0 pt-1.5",
                                  message.content ? "justify-between" : "justify-end",
                                )}
                              >
                                {message.content ? (
                                  <p
                                    className={cn(
                                      "min-w-0 flex-1 whitespace-pre-wrap text-[0.98rem] leading-7",
                                      ownMessage ? "text-primary-foreground" : "text-[#f1f5f9]",
                                    )}
                                    style={{
                                      overflowWrap: "break-word",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {message.content}
                                  </p>
                                ) : null}

                                {renderMessageStatus(message, ownMessage, "inline")}
                              </div>
                            </div>
                          ) : null}

                          {message.content && !imageAttachment ? (
                            <div
                              className={cn(
                                "w-fit max-w-full shadow-[0_18px_45px_-38px_rgba(0,0,0,0.8)]",
                                ownMessage
                                  ? "min-w-[96px] rounded-[12px] rounded-br-none bg-primary px-2.5 py-2 text-primary-foreground"
                                  : "min-w-[96px] rounded-[12px] rounded-bl-none border border-white/[0.06] bg-[#1d1d1d] px-2.5 py-2 text-[#f1f5f9]",
                              )}
                            >
                              <div className="flex max-w-full items-end gap-2">
                                <p
                                  className="min-w-0 whitespace-pre-wrap text-[0.96rem] leading-5.5"
                                  style={{
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {message.content}
                                </p>
                                <div className="shrink-0 self-end">
                                  {renderMessageStatus(message, ownMessage, "inline")}
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {message.attachment && !imageAttachment
                            ? renderAttachment(message.attachment, message.id, ownMessage)
                            : null}
                        </>
                      )}
                    </div>

                    {(deleted || (message.attachment && !message.content && !imageAttachment)) ? (
                      <div className={cn("mt-1.5 px-1", ownMessage ? "flex justify-end" : "")}>
                        {renderMessageStatus(message, ownMessage)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {typingUsers.length > 0 && !deferredMessageSearch.trim() ? (
            <div className="flex justify-start">
              <div className="rounded-[20px] border border-white/[0.06] bg-[#1d1d1d] px-4 py-3 text-sm text-[#8f96a3]">
                {typingUsers[0]} {typingUsers.length > 1 ? "and others are" : "is"} typing...
              </div>
            </div>
          ) : null}

          {deferredMessageSearch.trim() && visibleMessages.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-semibold text-white">No matching messages</p>
                <p className="mt-1 text-xs text-[#8f96a3]">
                  Try a different search term in this conversation.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-accent px-4 py-4 md:px-6">
        {selectedFile ? (
          <div className="mb-4 flex items-center gap-3 rounded-[22px] border border-white/[0.06] bg-accent px-4 py-3">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="size-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] text-[#ffc107]">
                <Paperclip className="size-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{selectedFile.name}</p>
              <p className="text-xs text-[#8f96a3]">{formatFileSize(selectedFile.size)}</p>
            </div>

            <button
              type="button"
              onClick={clearFile}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#8f96a3] transition hover:border-white/20 hover:text-white"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />

          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger
              aria-label="Emoji picker"
              disabled={sending || uploading}
              className="flex size-9 items-center justify-center rounded-full text-[#8f96a3] transition hover:bg-white/[0.03] hover:text-white disabled:pointer-events-none disabled:opacity-50"
            >
              <Smile className="size-5" />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={12}
              className="w-[240px] rounded-[18px] border-white/[0.08] bg-[#1c1c1c] p-3 text-white"
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f96a3]">
                Insert emoji
              </div>
              <div className="grid grid-cols-6 gap-2">
                {CHAT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-white/[0.06]"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <ChatIconButton
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
          >
            <Paperclip className="size-5" />
          </ChatIconButton>

          <div className="flex min-h-[52px] flex-1 items-center gap-3 rounded-[22px] border border-white/[0.08] bg-accent px-4">
            <Input
              ref={composerInputRef}
              value={messageInput}
              onChange={(event) => onMessageInputChange(event.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="h-12 rounded-none border-0 bg-transparent px-0 text-[15px] text-white shadow-none placeholder:text-[#6b7280] focus-visible:ring-0 dark:bg-transparent"
              disabled={sending || uploading}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            className="flex size-12 items-center justify-center rounded-full bg-[#ffc107] text-[#141414] transition hover:bg-[#ffd54f] disabled:cursor-not-allowed disabled:bg-[#ffc107]/60"
            disabled={(sending || uploading) || (!messageInput.trim() && !selectedFile)}
            aria-label="Send message"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <SendHorizontal className="size-5" />
            )}
          </button>
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
  const [clearingChat, setClearingChat] = useState(false);
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
          const clientName = owner.fullName || owner.name || owner.email || "Client";
          const businessName = resolveProjectBusinessName(item.project, item);
          const serviceType = resolveProjectServiceType(item.project, item) || SERVICE_LABEL;
          const displayBusinessName = businessName ? toDisplayTitleCase(businessName) : "";

          uniq.push({
            id: projectId, // Use projectId as the conversation id
            clientId: owner.id,
            name: clientName,
            clientName,
            avatar: owner.avatar,
            businessName: displayBusinessName,
            label: serviceType,
            serviceType,
            serviceKey: sharedKey,
            projectTitle: displayBusinessName || item.project?.title || serviceType || "Client Project",
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
      const storageKey = migrateChatConversationStorageKey(
        selectedConversation.serviceKey || selectedConversation.id,
      );
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

    const storageKey = migrateChatConversationStorageKey(
      selectedConversation.serviceKey || selectedConversation.id,
    );
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

  const handleClearChat = useCallback(async () => {
    if (!conversationId) return;

    const confirmed = window.confirm(
      "Clear all messages in this conversation? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setClearingChat(true);

    try {
      const response = await authFetch(`/chat/conversations/${conversationId}/messages`, {
        method: "DELETE",
        skipLogoutOn401: true,
      });

      if (!response.ok) {
        throw new Error(`Clear chat failed (status ${response.status})`);
      }

      setMessages([]);
      setTypingUsers([]);

      if (selectedConversationKey) {
        setConversations((previous) =>
          updateConversationDetails(previous, selectedConversationKey, {
            previewText: "No messages yet",
            unreadCount: 0,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to clear chat:", error);
      alert("Failed to clear chat. Please try again.");
    } finally {
      setClearingChat(false);
    }
  }, [authFetch, conversationId, selectedConversationKey]);

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
        conversation.clientName,
        conversation.businessName,
        conversation.serviceType,
        conversation.projectTitle,
        conversation.label,
        getConversationDisplaySubtitle(conversation),
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
                        Try a different client name, business name, or service type.
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
                    conversation={selectedConversation}
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
                    onClearChat={handleClearChat}
                    isClearingChat={clearingChat}
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

