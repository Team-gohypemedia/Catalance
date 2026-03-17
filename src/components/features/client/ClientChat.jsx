"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import format from "date-fns/format";
import isSameDay from "date-fns/isSameDay";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";
import { useSearchParams } from "react-router-dom";
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
import Check from "lucide-react/dist/esm/icons/check";
import CheckCheck from "lucide-react/dist/esm/icons/check-check";
import Clock4 from "lucide-react/dist/esm/icons/clock-4";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Search from "lucide-react/dist/esm/icons/search";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import Smile from "lucide-react/dist/esm/icons/smile";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ClientDashboardFooter from "@/components/features/client/ClientDashboardFooter";
import ClientWorkspaceHeader from "@/components/features/client/ClientWorkspaceHeader";
import { useAuth } from "@/shared/context/AuthContext";
import { useNotifications } from "@/shared/context/NotificationContext";
import {
  apiClient,
  SOCKET_ENABLED,
  SOCKET_IO_URL,
  SOCKET_OPTIONS,
} from "@/shared/lib/api-client";
import { hasUnlockedProjectChat } from "@/shared/lib/project-chat-access";
import { cn } from "@/shared/lib/utils";

const SERVICE_LABEL = "Project Chat";
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const PDF_FILE_REGEX = /\.pdf(?:$|[?#])/i;
const CHAT_EMOJIS = ["😀", "😂", "😊", "😍", "🔥", "👍", "👏", "🙏", "🎉", "✅", "🤝", "💡"];
const pdfPreviewCache = new Map();
let pdfPreviewLibraryPromise = null;

const loadPdfPreviewLibrary = async () => {
  if (!pdfPreviewLibraryPromise) {
    pdfPreviewLibraryPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfjsModule, workerModule]) => {
      const pdfjsLib = pdfjsModule.default ?? pdfjsModule;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default ?? workerModule;
      return pdfjsLib;
    });
  }

  return pdfPreviewLibraryPromise;
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PdfAttachmentPreview = React.memo(function PdfAttachmentPreview({
  attachment,
}) {
  const [previewState, setPreviewState] = useState(() => {
    if (attachment?.url && pdfPreviewCache.has(attachment.url)) {
      return pdfPreviewCache.get(attachment.url);
    }

    return {
      previewSrc: null,
      error: false,
      loading: Boolean(attachment?.url),
    };
  });

  useEffect(() => {
    if (!attachment?.url) {
      setPreviewState({ previewSrc: null, error: true, loading: false });
      return undefined;
    }

    const cachedPreview = pdfPreviewCache.get(attachment.url);
    if (cachedPreview) {
      setPreviewState(cachedPreview);
      return undefined;
    }

    let cancelled = false;

    const renderPdfPreview = async () => {
      try {
        const pdfjsLib = await loadPdfPreviewLibrary();
        const response = await fetch(attachment.url);

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF preview: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
        }).promise;
        const firstPage = await pdf.getPage(1);
        const initialViewport = firstPage.getViewport({ scale: 1 });
        const scale = Math.min(1.4, 320 / initialViewport.width);
        const viewport = firstPage.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas rendering is not available");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await firstPage.render({
          canvasContext: context,
          viewport,
        }).promise;

        const nextState = {
          previewSrc: canvas.toDataURL("image/jpeg", 0.92),
          error: false,
          loading: false,
        };

        pdfPreviewCache.set(attachment.url, nextState);

        if (!cancelled) {
          setPreviewState(nextState);
        }
      } catch (error) {
        console.error("Failed to render PDF preview:", error);

        const nextState = {
          previewSrc: null,
          error: true,
          loading: false,
        };

        pdfPreviewCache.set(attachment.url, nextState);

        if (!cancelled) {
          setPreviewState(nextState);
        }
      }
    };

    void renderPdfPreview();

    return () => {
      cancelled = true;
    };
  }, [attachment?.url]);

  return (
    <div className="relative overflow-hidden rounded-[8px] bg-white">
      {previewState.previewSrc ? (
        <img
          src={previewState.previewSrc}
          alt={attachment?.name || "PDF preview"}
          className="block h-[168px] w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-[168px] w-full items-center justify-center bg-white px-6 text-center">
          <div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e11d48] text-xs font-bold tracking-[0.14em] text-white">
              PDF
            </div>
            <p className="text-sm font-semibold text-[#14532d]">
              {previewState.loading ? "Generating preview..." : "Preview unavailable"}
            </p>
            <p className="mt-1 text-xs text-[#4b5563]">
              {previewState.error
                ? "Open the file to view the full document."
                : "Preparing the first page of the PDF."}
            </p>
          </div>
        </div>
      )}

      {previewState.loading ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-black/12 via-black/0 px-3 py-2">
          <Loader2 className="size-4 animate-spin text-[#14532d]" />
        </div>
      ) : null}
    </div>
  );
});

const filterAssistantMessages = (list = []) =>
  list.filter((message) => message?.role !== "assistant");

const getConversationKey = (conversation) =>
  conversation?.serviceKey || conversation?.id || null;

const getTimestampValue = (value) => {
  if (!value) return 0;

  const timestamp =
    typeof value === "number" ? value : new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortConversations = (list = []) =>
  [...list].sort((left, right) => (right.lastActivity || 0) - (left.lastActivity || 0));

const formatTime = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDayDivider = (value) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  return format(date, "MMMM d, yyyy");
};

const getDisplayName = (user) =>
  user?.fullName || user?.name || user?.email?.split("@")[0] || "Client";

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

const getMessagePreview = (item = {}) => {
  if (typeof item?.content === "string" && item.content.trim()) {
    return item.content.trim();
  }

  if (typeof item?.previewText === "string" && item.previewText.trim()) {
    return item.previewText.trim();
  }

  if (item?.attachment?.name) {
    return `Attachment: ${item.attachment.name}`;
  }

  if (typeof item?.projectTitle === "string" && item.projectTitle.trim()) {
    return item.projectTitle.trim();
  }

  if (typeof item?.label === "string" && item.label.trim()) {
    return item.label.trim();
  }

  return "Open the conversation to continue the project discussion.";
};

const hasConversationHistory = (conversation = {}) =>
  Boolean(
    conversation?.lastMessage ||
      Number(conversation?.messageCount || 0) > 0,
  );

const getFirstNonEmptyText = (...values) => {
  for (const value of values.flat()) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
};

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractLabeledValue = (value = "", labels = []) => {
  const source = String(value || "");
  if (!source) return "";

  for (const label of labels) {
    const match = source.match(
      new RegExp(`${escapeRegExp(label)}[:\\s\\-\\n\\u2022]*([^\\n]+)`, "i"),
    );
    const extracted = match?.[1]?.trim();
    if (extracted) return extracted;
  }

  return "";
};

const normalizeComparableText = (value = "") =>
  String(value || "").trim().toLowerCase();

const toDisplayTitleCase = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (match, prefix, char) => `${prefix}${char.toUpperCase()}`);

const getAcceptedProjectProposal = (project = {}) =>
  Array.isArray(project?.proposals)
    ? project.proposals.find(
        (proposal) => String(proposal?.status || "").toUpperCase() === "ACCEPTED",
      ) || null
    : null;

const resolveConversationBusinessName = (item = {}) =>
  getFirstNonEmptyText(
    item?.project?.businessName,
    item?.project?.companyName,
    item?.proposalContext?.businessName,
    item?.proposalContext?.companyName,
    item?.businessName,
    item?.companyName,
    extractLabeledValue(item?.project?.description || "", [
      "Business Name",
      "Company Name",
      "Brand Name",
    ]),
    extractLabeledValue(
      item?.coverLetter || item?.content || item?.summary || item?.description || "",
      ["Business Name", "Company Name", "Brand Name"],
    ),
  );

const resolveConversationServiceLabel = (item = {}) =>
  getFirstNonEmptyText(
    item?.project?.service,
    item?.project?.serviceName,
    item?.project?.serviceKey,
    item?.project?.category,
    item?.proposalContext?.serviceName,
    item?.proposalContext?.serviceType,
    item?.serviceName,
    item?.serviceType,
    item?.category,
    extractLabeledValue(item?.project?.description || "", [
      "Service Type",
      "Service",
      "Category",
    ]),
    extractLabeledValue(
      item?.coverLetter || item?.content || item?.summary || item?.description || "",
      ["Service Type", "Service", "Category"],
    ),
    item?.project?.title,
  );

const resolveConversationAvatarSrc = (item = {}) =>
  getFirstNonEmptyText(
    item?.project?.logo,
    item?.project?.image,
    item?.project?.imageUrl,
    item?.project?.thumbnail,
    item?.project?.coverImage,
    item?.project?.coverUrl,
    item?.project?.bannerImage,
    item?.project?.heroImage,
  );

const getConversationDisplayTitle = (conversation = {}) => {
  if (typeof conversation?.projectTitle === "string" && conversation.projectTitle.trim()) {
    return conversation.projectTitle.trim();
  }

  if (typeof conversation?.label === "string" && conversation.label.trim()) {
    return conversation.label.trim();
  }

  if (typeof conversation?.name === "string" && conversation.name.trim()) {
    return conversation.name.trim();
  }

  return "Project chat";
};

const getConversationDisplaySubtitle = (conversation = {}) => {
  const title = getConversationDisplayTitle(conversation);
  const serviceLabel = getFirstNonEmptyText(
    conversation?.projectServiceLabel,
    conversation?.label,
  );

  if (serviceLabel && normalizeComparableText(serviceLabel) !== normalizeComparableText(title)) {
    return serviceLabel;
  }

  if (typeof conversation?.name === "string" && conversation.name.trim()) {
    return conversation.name.trim();
  }

  return serviceLabel || "Project chat";
};

const getMessageSignature = (message = {}) =>
  [
    String(message?.content || "").trim(),
    message?.attachment?.name || "",
    message?.attachment?.url || "",
  ].join("::");

const normalizeName = (value) => String(value || "").trim().toLowerCase();

const matchesCurrentUserName = (message, currentUser) => {
  const senderName = normalizeName(message?.senderName);
  if (!senderName) {
    return false;
  }

  const candidates = [
    currentUser?.fullName,
    currentUser?.name,
    currentUser?.email,
    currentUser?.email ? currentUser.email.split("@")[0] : "",
  ]
    .map(normalizeName)
    .filter(Boolean);

  return candidates.includes(senderName);
};

const mergePendingIdentity = (incomingMessage, pendingMessage) => {
  if (!pendingMessage) {
    return incomingMessage;
  }

  return {
    ...incomingMessage,
    senderId: pendingMessage.senderId || incomingMessage.senderId,
    senderRole: pendingMessage.senderRole || incomingMessage.senderRole,
    senderName: pendingMessage.senderName || incomingMessage.senderName,
    role: pendingMessage.role || incomingMessage.role,
  };
};

const isFreelancerMessage = (message, conversation) => {
  const senderRole = String(message?.senderRole || "").toUpperCase();

  if (
    message?.senderId &&
    conversation?.freelancerId &&
    String(message.senderId) === String(conversation.freelancerId)
  ) {
    return true;
  }

  if (senderRole === "FREELANCER") {
    return true;
  }

  const senderName = normalizeName(message?.senderName);
  const freelancerName = normalizeName(conversation?.name);

  if (senderName && freelancerName && senderName === freelancerName) {
    return true;
  }

  return false;
};

const isOwnMessage = (message, currentUser, conversation) => {
  const senderRole = String(message?.senderRole || "").toUpperCase();

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

  if (message?.senderId && currentUser?.id) {
    return false;
  }

  if (matchesCurrentUserName(message, currentUser)) {
    return true;
  }

  if (isFreelancerMessage(message, conversation)) {
    return false;
  }

  if (
    senderRole === "CLIENT" &&
    (message?.senderId || normalizeName(message?.senderName))
  ) {
    return true;
  }

  if (senderRole === "FREELANCER" || senderRole === "PROJECT_MANAGER") {
    return false;
  }

  return false;
};

const formatRoleLabel = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const getMessageRoleLabel = (message, ownMessage, conversation) => {
  if (ownMessage) {
    return "Client";
  }

  const senderRole = String(message?.senderRole || "").toUpperCase();
  if (senderRole === "PROJECT_MANAGER") {
    return "Project Manager";
  }

  if (senderRole === "CLIENT") {
    return "Client";
  }

  if (senderRole === "FREELANCER" || isFreelancerMessage(message, conversation)) {
    return "Freelancer";
  }

  if (senderRole) {
    return formatRoleLabel(senderRole);
  }

  return "Project Manager";
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
      "flex size-9 items-center justify-center rounded-full text-[#8f96a3] transition hover:bg-white/[0.03] hover:text-white",
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
  chatUnlocked = false,
}) => {
  const messagesViewportRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageSearchInputRef = useRef(null);
  const composerInputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastConversationKeyRef = useRef("");
  const conversationTitle = getConversationDisplayTitle(conversation);
  const conversationSubtitle = getConversationDisplaySubtitle(conversation);
  const conversationAvatarLabel = conversationTitle || "Project chat";
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const deferredMessageSearch = useDeferredValue(messageSearch);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

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
    if (!chatUnlocked) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (!chatUnlocked) {
      return;
    }

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
    if (!chatUnlocked) {
      return;
    }

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
      return;
    }

    setFilePreview(null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!chatUnlocked || (!messageInput.trim() && !selectedFile) || uploading) {
      return;
    }

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

  const isPdfAttachment = (attachment) =>
    Boolean(
      attachment?.url && (
        String(attachment.type || "").toLowerCase().includes("application/pdf") ||
        PDF_FILE_REGEX.test(String(attachment.name || "")) ||
        PDF_FILE_REGEX.test(String(attachment.url || ""))
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

  const renderPdfAttachment = (message, ownsMessage) => {
    const attachment = message?.attachment;

    if (!attachment?.url) return null;

    const handleDelete = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.confirm("Are you sure you want to delete this attachment?")) {
        await onDeleteAttachment?.(message.id);
      }
    };

    const pdfMeta = ["PDF", formatFileSize(attachment.size)]
      .filter(Boolean)
      .join(" • ");

    return (
      <div
        className={cn(
          "group w-full max-w-[340px] overflow-hidden shadow-[0_18px_45px_-38px_rgba(0,0,0,0.8)]",
          ownsMessage
            ? "rounded-[12px] rounded-br-none bg-primary text-primary-foreground"
            : "rounded-[12px] rounded-bl-none border border-white/[0.06] bg-[#1d1d1d] text-[#f1f5f9]",
        )}
      >
        <div className="relative p-1.5">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <PdfAttachmentPreview attachment={attachment} />
          </a>

          {ownsMessage && onDeleteAttachment ? (
            <button
              type="button"
              onClick={handleDelete}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
              title="Delete attachment"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3 px-3 pb-2 pt-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#e11d48] text-[10px] font-bold tracking-[0.18em] text-white">
            PDF
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "break-words text-sm font-semibold leading-5",
                ownsMessage ? "text-primary-foreground" : "text-[#f8fafc]",
              )}
            >
              {attachment.name || "PDF attachment"}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xs",
                ownsMessage ? "text-primary-foreground/75" : "text-[#9ba3af]",
              )}
            >
              {pdfMeta}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-end gap-2 px-3 pb-2.5",
            message.content ? "justify-between" : "justify-end",
          )}
        >
          {message.content ? (
            <p
              className={cn(
                "min-w-0 flex-1 whitespace-pre-wrap text-[0.96rem] leading-5.5",
                ownsMessage ? "text-primary-foreground" : "text-[#f1f5f9]",
              )}
              style={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              {message.content}
            </p>
          ) : null}

          <div className="shrink-0 self-end">
            {renderMessageStatus(message, ownsMessage, "inline")}
          </div>
        </div>

        <div
          className={cn(
            "grid grid-cols-2 border-t",
            ownsMessage ? "border-black/10" : "border-white/[0.06]",
          )}
        >
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center px-3 py-2.5 text-sm font-semibold transition",
              ownsMessage
                ? "text-primary-foreground hover:bg-black/8"
                : "text-[#34d399] hover:bg-white/[0.03]",
            )}
          >
            Open
          </a>
          <a
            href={attachment.url}
            download={attachment.name || true}
            className={cn(
              "flex items-center justify-center border-l px-3 py-2.5 text-sm font-semibold transition",
              ownsMessage
                ? "border-black/10 text-primary-foreground hover:bg-black/8"
                : "border-white/[0.06] text-[#34d399] hover:bg-white/[0.03]",
            )}
          >
            Save as...
          </a>
        </div>
      </div>
    );
  };

  const renderAttachment = (attachment, messageId, ownsMessage) => {
    if (!attachment?.url) return null;

    const isImage = isImageAttachment(attachment);

    const handleDelete = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (window.confirm("Are you sure you want to delete this attachment?")) {
        await onDeleteAttachment?.(messageId);
      }
    };

    if (isImage) return renderImageAttachment(attachment, messageId, ownsMessage);

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
            const ownMessage = isOwnMessage(message, currentUser, conversation);
            const deleted = message.deleted || message.isDeleted;
            const imageAttachment = isImageAttachment(message.attachment);
            const pdfAttachment = isPdfAttachment(message.attachment);
            const previousMessage = visibleMessages[index - 1];
            const previousOwnMessage = previousMessage
              ? isOwnMessage(previousMessage, currentUser, conversation)
              : null;
            const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
            const previousDate = previousMessage?.createdAt
              ? new Date(previousMessage.createdAt)
              : null;
            const showDateDivider = !previousDate || !isSameDay(messageDate, previousDate);
            const roleLabel = getMessageRoleLabel(message, ownMessage, conversation);
            const previousRoleLabel = previousMessage
              ? getMessageRoleLabel(previousMessage, previousOwnMessage, conversation)
              : "";
            const showRoleLabel =
              showDateDivider || !previousMessage || ownMessage !== previousOwnMessage || roleLabel !== previousRoleLabel;

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
                          {pdfAttachment ? renderPdfAttachment(message, ownMessage) : null}

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

                          {message.content && !imageAttachment && !pdfAttachment ? (
                            <div
                              className={cn(
                                "w-fit max-w-full shadow-[0_18px_45px_-38px_rgba(0,0,0,0.8)]",
                                ownMessage
                                  ? "min-w-[96px] rounded-[12px] rounded-br-none bg-primary px-2.5 py-2 text-primary-foreground"
                                  : "min-w-[96px] rounded-[12px] rounded-bl-none border border-white/[0.06] bg-[#1d1d1d] px-2.5 py-2 text-[#f1f5f9]",
                                imageAttachment && "max-w-[min(100%,32rem)]",
                              )}
                            >
                              <div className="flex max-w-full items-end gap-2">
                                <p
                                  className={cn(
                                    "min-w-0 whitespace-pre-wrap",
                                    ownMessage ? "text-[0.96rem] leading-5.5" : "text-[0.96rem] leading-5.5",
                                  )}
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

                          {message.attachment && !imageAttachment && !pdfAttachment
                            ? renderAttachment(message.attachment, message.id, ownMessage)
                            : null}
                        </>
                      )}
                    </div>

                    {!imageAttachment && !pdfAttachment && (deleted || (message.attachment && !message.content)) ? (
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
        {!chatUnlocked ? (
          <div className="mb-4 rounded-[18px] border border-[#5a3b0d] bg-[#2f1e05] px-4 py-3 text-sm text-[#f4d37c]">
            Chat will unlock after the initial 20% payment is completed.
          </div>
        ) : null}

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
              disabled={!chatUnlocked || sending || uploading}
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
            disabled={!chatUnlocked || sending || uploading}
          >
            <Paperclip className="size-5" />
          </ChatIconButton>

          <div className="flex min-h-[52px] flex-1 items-center gap-3 rounded-[22px] border border-white/[0.08] bg-accent px-4">
            <Input
              ref={composerInputRef}
              value={messageInput}
              onChange={(event) => onMessageInputChange(event.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                chatUnlocked
                  ? "Type your message..."
                  : "Chat unlocks after the initial 20% payment."
              }
              className="h-12 rounded-none border-0 bg-transparent px-0 text-[15px] text-white shadow-none placeholder:text-[#6b7280] focus-visible:ring-0 dark:bg-transparent"
              disabled={!chatUnlocked || sending || uploading}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            className="flex size-12 items-center justify-center rounded-full bg-[#ffc107] text-[#141414] transition hover:bg-[#ffd54f] disabled:cursor-not-allowed disabled:bg-[#ffc107]/60"
            disabled={!chatUnlocked || (sending || uploading) || (!messageInput.trim() && !selectedFile)}
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

const ClientChat = () => {
  const { user, authFetch, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { socket: notificationSocket, unreadCount } = useNotifications();
  const [searchParams] = useSearchParams();
  const requestedProjectId = useMemo(
    () => searchParams.get("projectId"),
    [searchParams],
  );

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
  const deferredConversationSearch = useDeferredValue(conversationSearch);
  const [typingUsers, setTypingUsers] = useState([]);
  const [online, setOnline] = useState(false);
  const [hasLockedAcceptedProjects, setHasLockedAcceptedProjects] = useState(false);
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const drafts = useRef({});

  const selectedConversationFallbackKey = getConversationKey(selectedConversation);
  const activeConversation = useMemo(() => {
    if (!selectedConversationFallbackKey) {
      return null;
    }

    return (
      conversations.find(
        (conversation) =>
          getConversationKey(conversation) === selectedConversationFallbackKey,
      ) || null
    );
  }, [conversations, selectedConversationFallbackKey]);

  const selectedConversationKey = getConversationKey(activeConversation);
  const selectedConversationChatUnlocked = Boolean(activeConversation?.chatUnlocked);
  const headerDisplayName = useMemo(() => getDisplayName(user), [user]);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setTypingUsers([]);
    setOnline(false);
  }, [selectedConversationKey]);

  useEffect(() => {
    if (!selectedConversationKey) {
      setMessageInput("");
      return;
    }

    setMessageInput(drafts.current[selectedConversationKey] || "");
  }, [selectedConversationKey]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !selectedConversationChatUnlocked) return;

    try {
      let payload;

      if (token && isAuthenticated && authFetch) {
        const response = await authFetch(`/chat/conversations/${conversationId}/messages`, {
          method: "GET",
          skipLogoutOn401: true,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch messages (status ${response.status})`);
        }

        payload = await response.json().catch(() => null);
      } else {
        payload = await apiClient.fetchChatMessages(conversationId);
      }

      const nextMessages = filterAssistantMessages(
        payload?.data?.messages || payload?.messages || [],
      );

      setMessages(nextMessages);

      const latestMessage = nextMessages[nextMessages.length - 1];
      if (latestMessage && selectedConversationKey) {
        setConversations((previous) =>
          updateConversationDetails(previous, selectedConversationKey, {
            previewText: getMessagePreview(latestMessage),
            lastActivity: getTimestampValue(latestMessage.createdAt) || Date.now(),
            unreadCount: 0,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [authFetch, conversationId, isAuthenticated, selectedConversationChatUnlocked, selectedConversationKey, token]);

  const emitTyping = useCallback(() => {
    if (!useSocket || !socketRef.current || !conversationId || !selectedConversationChatUnlocked) return;

    const payload = {
      conversationId,
      typing: true,
      userId: user?.id || socketRef.current.id,
      userName: user?.fullName || user?.name || user?.email || "Someone",
    };

    socketRef.current.emit("chat:typing", payload);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", {
        ...payload,
        typing: false,
      });
    }, 1500);
  }, [conversationId, selectedConversationChatUnlocked, useSocket, user?.email, user?.fullName, user?.id, user?.name]);

  const startPolling = useCallback(() => {
    stopPolling();
    void fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
  }, [fetchMessages, stopPolling]);

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      if (!authFetch || !token || !isAuthenticated || authLoading) {
        setHasLockedAcceptedProjects(false);
        setLoading(false);
        return;
      }

      try {
        const [proposalsResponse, projectsResponse, chatConversationsResponse] = await Promise.all([
          authFetch("/proposals?as=owner", {
            skipLogoutOn401: true,
          }),
          authFetch("/projects", {
            skipLogoutOn401: true,
          }),
          authFetch("/chat/conversations", {
            skipLogoutOn401: true,
          }),
        ]);

        if (
          proposalsResponse.status === 401 ||
          projectsResponse.status === 401 ||
          chatConversationsResponse.status === 401
        ) {
          if (!cancelled) {
            setConversations([]);
            setSelectedConversation(null);
          }
          return;
        }

        if (!proposalsResponse.ok || !projectsResponse.ok || !chatConversationsResponse.ok) {
          throw new Error(
            `Failed to load chat sources (${proposalsResponse.status}/${projectsResponse.status}/${chatConversationsResponse.status})`,
          );
        }

        const [proposalsPayload, projectsPayload, chatConversationsPayload] = await Promise.all([
          proposalsResponse.json().catch(() => null),
          projectsResponse.json().catch(() => null),
          chatConversationsResponse.json().catch(() => null),
        ]);
        const items = Array.isArray(proposalsPayload?.data) ? proposalsPayload.data : [];
        const projects = Array.isArray(projectsPayload?.data) ? projectsPayload.data : [];
        const chatConversations = Array.isArray(chatConversationsPayload?.data)
          ? chatConversationsPayload.data
          : [];
        const projectsById = new Map(
          projects
            .filter((project) => project?.id)
            .map((project) => [String(project.id), project]),
        );
        const conversationsByService = new Map(
          chatConversations
            .filter((conversation) => conversation?.service)
            .map((conversation) => [conversation.service, conversation]),
        );
        const uniqueConversations = [];
        const seen = new Set();
        let foundLockedAcceptedProject = false;

        for (const item of items) {
          if (item.status !== "ACCEPTED") continue;

          const projectId = item.project?.id || item.projectId;
          if (!projectId) continue;

          const projectRecord = projectsById.get(String(projectId)) || null;
          const mergedProject = projectRecord
            ? {
                ...(item.project || {}),
                ...projectRecord,
                paymentPlan: projectRecord.paymentPlan || item.project?.paymentPlan,
                proposals: Array.isArray(projectRecord.proposals)
                  ? projectRecord.proposals
                  : item.project?.proposals,
              }
            : item.project || null;

          const acceptedProposal = getAcceptedProjectProposal(mergedProject) || item;
          const freelancerId =
            item.freelancer?.id ||
            acceptedProposal?.freelancer?.id ||
            item.freelancerId ||
            acceptedProposal?.freelancerId;

          if (!freelancerId || freelancerId === user?.id) continue;

          const serviceKey = `CHAT:${projectId}:${user?.id}:${freelancerId}`;
          const conversationMeta = conversationsByService.get(serviceKey) || null;
          const conversationSource = {
            ...item,
            freelancer: item.freelancer || acceptedProposal?.freelancer || null,
            proposalContext: acceptedProposal,
            project: mergedProject,
          };

          const chatUnlocked = hasUnlockedProjectChat(mergedProject);
          if (!chatUnlocked) {
            foundLockedAcceptedProject = true;
            continue;
          }

          const projectStatus = String(mergedProject?.status || "").toUpperCase();
          if (projectStatus === "COMPLETED" && !hasConversationHistory(conversationMeta)) {
            continue;
          }

          if (seen.has(serviceKey)) continue;
          seen.add(serviceKey);
          const businessName = resolveConversationBusinessName(conversationSource);
          const serviceLabel =
            resolveConversationServiceLabel(conversationSource) || SERVICE_LABEL;
          const projectTitle = businessName ? toDisplayTitleCase(businessName) : serviceLabel;
          const projectAvatar = resolveConversationAvatarSrc(conversationSource);
          const previewSource = conversationMeta?.lastMessage
            ? conversationMeta.lastMessage
            : { projectTitle: projectTitle || "Project conversation" };

          uniqueConversations.push({
            id: conversationMeta?.id || projectId,
            projectId,
            conversationId: conversationMeta?.id || null,
            freelancerId,
            name:
              conversationSource.freelancer?.fullName ||
              conversationSource.freelancer?.name ||
              conversationSource.freelancer?.email ||
              acceptedProposal?.freelancerName ||
              "Freelancer",
            avatar: projectAvatar,
            label: serviceLabel,
            projectTitle: projectTitle || SERVICE_LABEL,
            projectServiceLabel: serviceLabel,
            previewText: getMessagePreview(previewSource),
            chatUnlocked,
            serviceKey,
            lastActivity: getTimestampValue(
              conversationMeta?.lastMessage?.createdAt ||
                conversationMeta?.updatedAt ||
                item.lastActivity ||
                acceptedProposal?.updatedAt ||
                mergedProject?.updatedAt ||
                item.updatedAt ||
                item.createdAt,
            ),
            unreadCount: 0,
            messageCount: Number(conversationMeta?.messageCount || 0),
            lastMessage: conversationMeta?.lastMessage || null,
          });
        }

        const finalList = sortConversations(uniqueConversations);

        if (!cancelled) {
          setHasLockedAcceptedProjects(foundLockedAcceptedProject);
          setConversations(finalList);
          setSelectedConversation((current) => {
            const currentKey = getConversationKey(current);
            if (currentKey) {
              const matchedCurrent = finalList.find(
                (conversation) => getConversationKey(conversation) === currentKey,
              );
              if (matchedCurrent) return matchedCurrent;
            }

            if (requestedProjectId) {
              const requestedConversation = finalList.find(
                (conversation) => String(conversation.projectId || conversation.id) === String(requestedProjectId),
              );
              if (requestedConversation) return requestedConversation;
              return null;
            }

            return finalList[0] || null;
          });
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        if (!cancelled) {
          setHasLockedAcceptedProjects(false);
          setConversations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [authFetch, authLoading, isAuthenticated, requestedProjectId, token, user?.id]);

  useEffect(() => {
    if (!activeConversation || !selectedConversationChatUnlocked) {
      setConversationId(null);
      return;
    }

    let cancelled = false;

    const ensureConversation = async () => {
      const baseKey = getConversationKey(activeConversation);
      const storageKey = `markify:chatConversationId:${baseKey}`;

      try {
        if (activeConversation?.conversationId) {
          setConversationId(activeConversation.conversationId);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, activeConversation.conversationId);
          }
          return;
        }

        const storedId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey)
            : null;

        if (storedId) {
          setConversationId(storedId);
          return;
        }

        if (!authFetch || !token || !isAuthenticated) {
          return;
        }

        const response = await authFetch("/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service:
              activeConversation.serviceKey ||
              activeConversation.label ||
              SERVICE_LABEL,
            projectTitle:
              activeConversation.projectTitle ||
              activeConversation.label ||
              SERVICE_LABEL,
          }),
          skipLogoutOn401: true,
        });

        if (response.status === 401) {
          return;
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

    void ensureConversation();

    return () => {
      cancelled = true;
    };
  }, [activeConversation, authFetch, isAuthenticated, selectedConversationChatUnlocked, token]);

  useEffect(() => {
    if (!conversationId || !activeConversation || !selectedConversationChatUnlocked) return;

    const storageKey = `markify:chatConversationId:${getConversationKey(activeConversation)}`;
    const socket = useSocket && SOCKET_IO_URL ? io(SOCKET_IO_URL, SOCKET_OPTIONS) : null;
    socketRef.current = socket;

    if (!socket) {
      startPolling();
      return () => stopPolling();
    }

    socket.emit("chat:join", {
      conversationId,
      service:
        activeConversation.serviceKey ||
        activeConversation.label ||
        SERVICE_LABEL,
      senderId: user?.id || null,
    });

    socket.on("chat:joined", (payload) => {
      if (payload?.conversationId) {
        setConversationId(payload.conversationId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, payload.conversationId);
        }
        socket.emit("chat:read", {
          conversationId: payload.conversationId,
          userId: user?.id,
        });
      }
    });

    socket.on("chat:read_receipt", ({ conversationId: receiptId, readAt }) => {
      if (receiptId !== conversationId) return;

      setMessages((previous) =>
        previous.map((message) =>
          isOwnMessage(message, user)
            ? { ...message, readAt: readAt || new Date().toISOString() }
            : message,
        ),
      );
    });

    socket.on("chat:history", (history = []) => {
      const sortedMessages = filterAssistantMessages(history).sort(
        (left, right) =>
          new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime(),
      );

      setMessages(sortedMessages);

      const latestMessage = sortedMessages[sortedMessages.length - 1];
      if (latestMessage && selectedConversationKey) {
        setConversations((previous) =>
          updateConversationDetails(previous, selectedConversationKey, {
            previewText: getMessagePreview(latestMessage),
            lastActivity: getTimestampValue(latestMessage.createdAt) || Date.now(),
            unreadCount: 0,
          }),
        );
      }
    });

    socket.on("chat:message", (message) => {
      if (message?.role === "assistant") {
        setSending(false);
        return;
      }

      setMessages((previous) => {
        const pendingMessage = previous.find(
          (existing) =>
            existing.pending &&
            getMessageSignature(existing) === getMessageSignature(message),
        );
        const filtered = previous.filter((existing) => existing !== pendingMessage);
        const nextMessage = mergePendingIdentity(message, pendingMessage);

        return [...filtered, nextMessage];
      });

      setSending(false);

      if (selectedConversationKey) {
        setConversations((previous) =>
          updateConversationDetails(previous, selectedConversationKey, {
            previewText: getMessagePreview(message),
            lastActivity: getTimestampValue(message.createdAt) || Date.now(),
            unreadCount: 0,
          }),
        );
      }

      if (message.conversationId === conversationId && message.senderId !== user?.id) {
        socket.emit("chat:read", { conversationId, userId: user?.id });
      }
    });

    socket.on("chat:error", (payload) => {
      console.error("Socket error:", payload);
      setSending(false);
    });

    socket.on("chat:typing", ({ conversationId: typingConversationId, typing, userId, userName }) => {
      if (!typingConversationId || typingConversationId !== conversationId) return;
      if (userId && user?.id && String(userId) === String(user.id)) return;

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
    });

    socket.on("chat:presence", ({ conversationId: presenceConversationId, online: onlineList = [] }) => {
      if (!presenceConversationId || presenceConversationId !== conversationId) return;

      const selfId = user?.id;
      const someoneElseOnline = onlineList.some((id) =>
        selfId ? String(id) !== String(selfId) : true,
      );

      setOnline(someoneElseOnline);
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
  }, [
    activeConversation,
    conversationId,
    selectedConversationChatUnlocked,
    selectedConversationKey,
    startPolling,
    stopPolling,
    useSocket,
    user,
  ]);

  useEffect(() => {
    if (!notificationSocket) return;

    const handleNotification = (data) => {
      if (data.type !== "chat" || !data.data?.service) {
        return;
      }

      const activeKey = getConversationKey(selectedConversation);

      setConversations((previous) =>
        sortConversations(
          previous.map((conversation) => {
            const conversationKey = getConversationKey(conversation);
            if (conversation.serviceKey !== data.data.service) {
              return conversation;
            }

            const isActive = conversationKey === activeKey;

            return {
              ...conversation,
              lastActivity: Date.now(),
              unreadCount: isActive ? 0 : (conversation.unreadCount || 0) + 1,
            };
          }),
        ),
      );
    };

    notificationSocket.on("notification:new", handleNotification);

    return () => {
      notificationSocket.off("notification:new", handleNotification);
    };
  }, [notificationSocket, selectedConversation]);

  const uploadChatFile = async (file) => {
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
  };

  const deleteAttachment = async (messageId) => {
    try {
      const response = await authFetch(`/upload/chat/${messageId}`, {
        method: "DELETE",
        skipLogoutOn401: true,
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      const result = await response.json().catch(() => null);

      setMessages((previous) =>
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
  };

  const handleSendMessage = (attachment = null) => {
    const trimmedMessage = messageInput.trim();

    if ((!trimmedMessage && !attachment) || !conversationId || !selectedConversationChatUnlocked) {
      return;
    }

    const pendingMessage = {
      conversationId,
      content: trimmedMessage,
      service:
        selectedConversation?.serviceKey ||
        selectedConversation?.label ||
        SERVICE_LABEL,
      senderId: user?.id || null,
      senderRole: user?.role || "CLIENT",
      senderName: user?.fullName || user?.name || user?.email || "Client",
      skipAssistant: true,
      attachment: attachment || undefined,
      role: "user",
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, pendingMessage]);
    setMessageInput("");
    setSending(true);

    if (selectedConversationKey) {
      setConversations((previous) =>
        updateConversationDetails(previous, selectedConversationKey, {
          previewText: getMessagePreview(pendingMessage),
          lastActivity: Date.now(),
          unreadCount: 0,
        }),
      );
    }

    if (useSocket && socketRef.current) {
      socketRef.current.emit("chat:message", pendingMessage);
      return;
    }

    const sender =
      token && isAuthenticated && authFetch
        ? authFetch(`/chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...pendingMessage,
              conversationId,
            }),
            skipLogoutOn401: true,
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error(`Send failed (status ${response.status})`);
            }

            const payload = await response.json().catch(() => null);
            return payload?.data?.message || payload?.message || pendingMessage;
          })
        : apiClient
            .sendChatMessage({
              ...pendingMessage,
              conversationId,
            })
            .then((payload) => payload?.data?.message || payload?.message || pendingMessage);

    sender
      .then((userMessage) => {
        setMessages((previous) => {
          const matchedPending = previous.find(
            (message) =>
              message.pending &&
              getMessageSignature(message) === getMessageSignature(pendingMessage),
          );
          const filtered = previous.filter((message) => message !== matchedPending);
          const nextMessage = mergePendingIdentity(userMessage, matchedPending);

          return [...filtered, nextMessage];
        });
      })
      .catch((error) => {
        console.error("Failed to send message via HTTP:", error);
      })
      .finally(() => setSending(false));
  };

  const handleClearChat = useCallback(async () => {
    if (!conversationId || !authFetch) {
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

  const handleConversationSelect = useCallback(
    (conversation) => {
      if (selectedConversationKey) {
        drafts.current[selectedConversationKey] = messageInput;
      }

      const nextKey = getConversationKey(conversation);

      if (!conversation?.chatUnlocked) {
        return;
      }

      setSelectedConversation(conversation);
      setConversations((previous) =>
        previous.map((item) =>
          getConversationKey(item) === nextKey ? { ...item, unreadCount: 0 } : item,
        ),
      );
    },
    [messageInput, selectedConversationKey],
  );

  const handleInputChange = (value) => {
    setMessageInput(value);
    emitTyping();
  };

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
    <div className="min-h-screen bg-[#212121] text-[#f1f5f9]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col px-4 pt-5 sm:px-6 lg:px-[40px] xl:w-[85%] xl:max-w-none">
        <ClientWorkspaceHeader
          profile={{
            avatar: user?.avatar,
            name: headerDisplayName,
            initial: getInitials(headerDisplayName),
          }}
          activeWorkspaceKey="messages"
          unreadCount={unreadCount}
          primaryActionLabel="Create Proposal"
          primaryActionTo="/client/proposal"
        />

        <main className="flex min-h-0 flex-1 flex-col pb-12">
          <h1 className="sr-only">Messages</h1>

          <section className="mt-7 flex min-h-0 flex-1">
            <div className="flex h-[calc(100vh-13.5rem)] min-h-[720px] w-full flex-col overflow-hidden rounded-[28px] border border-white/[0.05] bg-accent lg:flex-row">
              <aside className="flex w-full shrink-0 flex-col border-b border-white/[0.06] bg-accent lg:w-[360px] lg:border-b-0 lg:border-r lg:border-white/[0.06]">
                <div className="px-6 pb-5 pt-7">
                  <p className="text-[1.05rem] font-semibold text-white">
                    Messages
                  </p>
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
                            onSelect={() => handleConversationSelect(conversation)}
                            unreadCount={conversation.unreadCount}
                            showOnline={isActive && online}
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
                        Try a different name or project title.
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
                      <div className="rounded-full border border-white/[0.06] bg-[#202020] p-4 text-[#ffc107]">
                        <SendHorizontal className="size-5" />
                      </div>
                      <p className="mt-4 text-base font-semibold text-white">
                        {hasLockedAcceptedProjects ? "Chats unlock after kickoff payment" : "No conversations yet"}
                      </p>
                      <p className="mt-2 text-sm text-[#8f96a3]">
                        {hasLockedAcceptedProjects
                          ? "Accepted projects will appear here after the initial 20% payment is completed."
                          : "Accepted project collaborations will appear here automatically."}
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {activeConversation ? (
                  <ChatArea
                    conversation={activeConversation}
                    messages={messages}
                    messageInput={messageInput}
                    onMessageInputChange={handleInputChange}
                    onSendMessage={handleSendMessage}
                    onFileUpload={uploadChatFile}
                    onDeleteAttachment={deleteAttachment}
                    sending={sending}
                    currentUser={user}
                    typingUsers={typingUsers.map((item) => item.name)}
                    online={online}
                    onClearChat={handleClearChat}
                    isClearingChat={clearingChat}
                    chatUnlocked={selectedConversationChatUnlocked}
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
                        Pick a project thread from the left to review updates, reply to
                        freelancers, and keep delivery moving.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <ClientDashboardFooter variant="workspace" />
      </div>
    </div>
  );
};

export default ClientChat;
