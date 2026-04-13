import React, {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import Clock4 from "lucide-react/dist/esm/icons/clock-4";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical";
import Paperclip from "lucide-react/dist/esm/icons/paperclip";
import Search from "lucide-react/dist/esm/icons/search";
import SendHorizontal from "lucide-react/dist/esm/icons/send-horizontal";
import Smile from "lucide-react/dist/esm/icons/smile";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { cn } from "@/shared/lib/utils";
import {
  CHAT_EMOJIS,
  formatDayDivider,
  formatFileSize,
  formatTime,
  getConversationDisplayTitle,
  getConversationKey,
  getConversationMemberLabel,
  getInitials,
  getMessageRoleLabel,
  isOwnMessage,
  MAX_ATTACHMENT_SIZE,
  PDF_FILE_REGEX,
} from "../utils";

const PdfAttachmentPreview = lazy(() => import("./PdfAttachmentPreview"));

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

const ChatArea = React.memo(function ChatArea({
  conversation,
  messages,
  loadingMessages,
  onSendMessage,
  sending,
  currentUser,
  typingUsers,
  online,
  onTyping,
  onFileUpload,
  onDeleteAttachment,
  onClearChat,
  isClearingChat = false,
  chatUnlocked = false,
  drafts,
  mobileView = false,
  onBack,
}) {
  const messagesViewportRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageSearchInputRef = useRef(null);
  const composerInputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastConversationKeyRef = useRef("");
  const conversationKey = getConversationKey(conversation);
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const deferredMessageSearch = useDeferredValue(messageSearch);

  const conversationTitle = getConversationDisplayTitle(conversation);
  const conversationMembers = getConversationMemberLabel(
    conversation,
    currentUser,
  );

  const visibleMessages = useMemo(() => {
    const query = deferredMessageSearch.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) =>
      [message?.content, message?.attachment?.name, message?.senderName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredMessageSearch, messages]);

  useEffect(() => {
    setMessageInput(drafts?.getDraft?.(conversationKey) || "");
    setSelectedFile(null);
    setFilePreview(null);
    setMessageSearch("");
    setShowMessageSearch(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [conversationKey, drafts]);

  useEffect(() => {
    if (showMessageSearch) {
      messageSearchInputRef.current?.focus();
    }
  }, [showMessageSearch]);

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    const conversationChanged = lastConversationKeyRef.current !== conversationKey;

    if (conversationChanged) {
      lastConversationKeyRef.current = conversationKey;
      shouldAutoScrollRef.current = true;
    }

    if (!viewport || !shouldAutoScrollRef.current) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: conversationChanged ? "auto" : "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversationKey, typingUsers.length, visibleMessages.length]);

  const handleMessagesScroll = useCallback(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= 96;
  }, []);

  const handleInputChange = useCallback(
    (value) => {
      setMessageInput(value);
      drafts?.setDraft?.(conversationKey, value);
      onTyping?.();
    },
    [conversationKey, drafts, onTyping],
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSend = useCallback(async () => {
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
    }

    const sent = await onSendMessage?.({
      text: messageInput,
      attachment,
    });

    if (sent !== false) {
      clearFile();
      handleInputChange("");
    }
  }, [
    chatUnlocked,
    clearFile,
    handleInputChange,
    messageInput,
    onFileUpload,
    onSendMessage,
    selectedFile,
    uploading,
  ]);

  const isImageAttachment = useCallback(
    (attachment) =>
      Boolean(
        attachment?.url &&
          (attachment.type?.startsWith("image/") ||
            attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)),
      ),
    [],
  );

  const isPdfAttachment = useCallback(
    (attachment) =>
      Boolean(
        attachment?.url &&
          (String(attachment.type || "").toLowerCase().includes("application/pdf") ||
            PDF_FILE_REGEX.test(String(attachment.name || "")) ||
            PDF_FILE_REGEX.test(String(attachment.url || ""))),
      ),
    [],
  );

  const handleFileSelect = useCallback(
    (event) => {
      if (!chatUnlocked) return;
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_ATTACHMENT_SIZE) {
        alert("File size must be less than 10MB.");
        return;
      }

      setSelectedFile(file);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (loadEvent) =>
          setFilePreview(loadEvent.target?.result || null);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    },
    [chatUnlocked],
  );

  const renderStatus = useCallback((message, ownsMessage) => {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px]",
          ownsMessage ? "text-primary-foreground/70" : "text-[#8f96a3]",
        )}
      >
        <span>{formatTime(message.createdAt)}</span>
        {ownsMessage ? (
          message.pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : message.readAt ? (
            <CheckCheck className="size-3.5" strokeWidth={2.5} />
          ) : (
            <Check className="size-3.5" strokeWidth={2.3} />
          )
        ) : null}
      </div>
    );
  }, []);

  const renderAttachmentBlock = useCallback(
    (message, ownsMessage) => {
      const attachment = message?.attachment;
      if (!attachment?.url) return null;

      const handleDelete = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (window.confirm("Are you sure you want to delete this attachment?")) {
          await onDeleteAttachment?.(message.id);
        }
      };

      if (isImageAttachment(attachment)) {
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
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        );
      }

      if (isPdfAttachment(attachment)) {
        return (
          <div className="group relative max-w-[340px] overflow-hidden rounded-[12px] border border-white/[0.06] bg-[#1d1d1d] p-1.5">
            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
              <Suspense
                fallback={
                  <div className="flex h-[168px] items-center justify-center rounded-[8px] bg-white">
                    <Loader2 className="size-4 animate-spin text-[#14532d]" />
                  </div>
                }
              >
                <PdfAttachmentPreview attachment={attachment} />
              </Suspense>
            </a>
            {ownsMessage && onDeleteAttachment ? (
              <button
                type="button"
                onClick={handleDelete}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#e11d48] text-[10px] font-bold tracking-[0.18em] text-white">
                PDF
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#f8fafc]">
                  {attachment.name || "PDF attachment"}
                </p>
                <p className="text-xs text-[#9ba3af]">
                  {["PDF", formatFileSize(attachment.size)].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="group relative">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3",
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
                <p className="text-[11px] text-[#8f96a3]">
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
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      );
    },
    [isImageAttachment, isPdfAttachment, onDeleteAttachment],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-card",
          mobileView ? "px-4 py-3" : "px-5 py-4 md:px-7",
        )}
      >
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          {mobileView ? (
            <button
              type="button"
              onClick={onBack}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white transition hover:bg-white/[0.06]"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <div className="relative shrink-0">
            <Avatar className={cn("border border-white/10", mobileView ? "size-11" : "size-12")}>
              <AvatarImage src={conversation?.avatar || undefined} alt={conversationTitle} />
              <AvatarFallback className="bg-[#2b2b31] text-sm font-semibold text-white">
                {getInitials(conversationTitle)}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                online ? "bg-[#22c55e]" : "bg-[#6b7280]",
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-semibold tracking-[-0.3px] text-white",
                mobileView ? "text-[1rem]" : "text-[1.15rem]",
              )}
            >
              {conversationTitle}
            </p>
            <p className="truncate text-[13px] text-muted-foreground">
              {conversationMembers}
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
              className={cn(
                "h-9 rounded-[14px] border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white placeholder:text-[#6b7280] focus-visible:ring-0",
                mobileView
                  ? "w-[38vw] min-w-[116px] max-w-[180px]"
                  : "w-[220px]",
              )}
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
            <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-full text-[#8f96a3] transition hover:bg-white/[0.03] hover:text-white">
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
        className="relative min-h-0 flex-1 overflow-y-scroll bg-card px-3 py-6 [scrollbar-gutter:stable] [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/[0.16] [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {loadingMessages ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center py-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#1a1a1a]/95 px-4 py-1.5 text-xs text-[#9ba3af] backdrop-blur">
              <Loader2 className="size-3.5 animate-spin" />
              Loading conversation...
            </div>
          </div>
        ) : null}
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 pb-4">
          {visibleMessages.map((message, index) => {
            const ownsMessage = isOwnMessage(message, currentUser, conversation);
            const previousMessage = visibleMessages[index - 1];
            const previousOwnMessage = previousMessage
              ? isOwnMessage(previousMessage, currentUser, conversation)
              : null;
            const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
            const previousDate = previousMessage?.createdAt ? new Date(previousMessage.createdAt) : null;
            const showDateDivider =
              !previousDate || messageDate.toDateString() !== previousDate.toDateString();
            const roleLabel = getMessageRoleLabel(message, ownsMessage, conversation);
            const previousRoleLabel = previousMessage
              ? getMessageRoleLabel(previousMessage, previousOwnMessage, conversation)
              : "";
            const showRoleLabel =
              showDateDivider ||
              !previousMessage ||
              ownsMessage !== previousOwnMessage ||
              roleLabel !== previousRoleLabel;

            return (
              <React.Fragment key={message.id || `${message.createdAt || index}-${index}`}>
                {showDateDivider ? (
                  <div className="flex justify-center py-2">
                    <span className="inline-flex h-7 items-center justify-center rounded-full border border-white/[0.06] bg-[#1a1a1a] px-4 text-center text-[11px] font-semibold uppercase leading-none tracking-[0.18em] text-muted-foreground">
                      {formatDayDivider(messageDate)}
                    </span>
                  </div>
                ) : null}
                <div className={cn("flex items-end gap-3", ownsMessage ? "justify-end" : "justify-start")}>
                  {!ownsMessage ? (
                    <Avatar className="hidden size-8 shrink-0 self-end border border-white/10 sm:flex">
                      <AvatarImage src={conversation?.avatar || undefined} alt={conversationTitle} />
                      <AvatarFallback className="bg-[#2b2b31] text-[11px] font-semibold text-white">
                        {getInitials(conversationTitle)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className={cn("flex max-w-[88%] flex-col md:max-w-[74%]", ownsMessage ? "items-end" : "items-start")}>
                    {showRoleLabel ? (
                      <p className={cn("mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em]", ownsMessage ? "text-right text-[#facc15]" : "text-left text-[#94a3b8]")}>
                        {roleLabel}
                      </p>
                    ) : null}
                    {message.deleted || message.isDeleted ? (
                      <div className={cn("rounded-[14px] border px-4 py-3 text-sm italic", ownsMessage ? "border-black/10 bg-primary text-primary-foreground" : "border-white/[0.06] bg-[#1d1d1d] text-[#8f96a3]")}>
                        <div className="flex items-start gap-2">
                          <Clock4 className="mt-0.5 size-4 shrink-0 opacity-70" />
                          <span>{ownsMessage ? "You deleted this message." : "This message was deleted."}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={cn("rounded-[14px] border px-3 py-2 shadow-[0_18px_45px_-38px_rgba(0,0,0,0.8)]", ownsMessage ? "border-black/10 bg-primary text-primary-foreground" : "border-white/[0.06] bg-[#1d1d1d] text-[#f1f5f9]")}>
                        {message.attachment ? renderAttachmentBlock(message, ownsMessage) : null}
                        {message.content ? (
                          <p className="mt-2 whitespace-pre-wrap text-[0.96rem] leading-6" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
                            {message.content}
                          </p>
                        ) : null}
                        <div className="mt-2 flex justify-end">
                          {renderStatus(message, ownsMessage)}
                        </div>
                      </div>
                    )}
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
        </div>
      </div>

      <div
        className={cn(
          "border-t border-white/[0.06] bg-card py-4 md:px-6",
          mobileView ? "px-3" : "px-4",
        )}
      >
        {!chatUnlocked ? (
          <div className="mb-4 rounded-[18px] border border-[#5a3b0d] bg-[#2f1e05] px-4 py-3 text-sm text-[#f4d37c]">
            Chat will unlock after the initial 20% payment is completed.
          </div>
        ) : null}
        {selectedFile ? (
          <div className="mb-4 flex items-center gap-3 rounded-[22px] border border-white/[0.06] bg-card px-4 py-3">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="size-14 rounded-2xl object-cover" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] text-[#ffc107]">
                <Paperclip className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-white/20 hover:text-white"
            >
              Remove
            </button>
          </div>
        ) : null}
        <div className={cn("flex items-center", mobileView ? "gap-1" : "gap-3")}>
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
              className={cn(
                "flex items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/[0.03] hover:text-white disabled:pointer-events-none disabled:opacity-50",
                mobileView ? "size-7" : "size-9",
              )}
            >
              <Smile className={mobileView ? "size-4.5" : "size-5"} />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={12}
              className="w-[240px] rounded-[18px] border-white/[0.08] bg-[#1c1c1c] p-3 text-white"
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Insert emoji
              </div>
              <div className="grid grid-cols-6 gap-2">
                {CHAT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      const input = composerInputRef.current;
                      const currentValue = messageInput || "";
                      const selectionStart = input?.selectionStart ?? currentValue.length;
                      const selectionEnd = input?.selectionEnd ?? currentValue.length;
                      const nextValue = `${currentValue.slice(0, selectionStart)}${emoji}${currentValue.slice(selectionEnd)}`;
                      handleInputChange(nextValue);
                      setEmojiPickerOpen(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-white/[0.06]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {!mobileView ? (
            <ChatIconButton
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={!chatUnlocked || sending || uploading}
              className="size-9 !text-muted-foreground"
            >
              <Paperclip className="size-5" />
            </ChatIconButton>
          ) : null}
          <div
            className={cn(
              "flex min-w-0 flex-1 items-center rounded-[22px] border border-white/[0.08] bg-card",
              mobileView ? "h-11 gap-1 px-2" : "h-12 gap-3 px-4",
            )}
          >
            {mobileView ? (
              <button
                type="button"
                aria-label="Attach file"
                onClick={() => fileInputRef.current?.click()}
                disabled={!chatUnlocked || sending || uploading}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/[0.03] hover:text-white disabled:pointer-events-none disabled:opacity-50"
              >
                <Paperclip className="size-4.5" />
              </button>
            ) : null}
            <Input
              ref={composerInputRef}
              value={messageInput}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={chatUnlocked ? "Type your message..." : "Chat unlocks after the initial 20% payment."}
              className={cn(
                "min-w-0 h-full flex-1 rounded-none border-0 bg-transparent px-0 text-[15px] text-white shadow-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent",
              )}
              disabled={!chatUnlocked || sending || uploading}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            className={cn(
              "flex items-center justify-center rounded-full bg-[#ffc107] text-[#141414] transition hover:bg-[#ffd54f] disabled:cursor-not-allowed disabled:bg-[#ffc107]/60",
              mobileView ? "size-11" : "size-12",
            )}
            disabled={!chatUnlocked || sending || uploading || (!messageInput.trim() && !selectedFile)}
          >
            {uploading ? (
              <Loader2 className={cn("animate-spin", mobileView ? "size-4.5" : "size-5")} />
            ) : (
              <SendHorizontal className={mobileView ? "size-4.5" : "size-5"} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatArea;
