"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Download from "lucide-react/dist/esm/icons/download";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

const ConversationContext = createContext(null);

const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "Conversation components must be used within <Conversation />",
    );
  }
  return context;
};

const isNearBottom = (element, threshold = 48) =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

export const Conversation = ({
  children,
  className,
  contextRef,
  ...props
}) => {
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = (behavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setIsAtBottom(isNearBottom(el));
    };
    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ containerRef, isAtBottom, scrollToBottom }),
    [isAtBottom],
  );

  useEffect(() => {
    if (contextRef && typeof contextRef === "object") {
      contextRef.current = contextValue;
    }
  }, [contextRef, contextValue]);

  return (
    <ConversationContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative size-full overflow-y-auto", className)}
        {...props}
      >
        {typeof children === "function" ? children(contextValue) : children}
      </div>
    </ConversationContext.Provider>
  );
};

export const ConversationContent = ({ className, children, ...props }) => {
  const { containerRef, isAtBottom, scrollToBottom } = useConversation();
  const lastHeightRef = useRef(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nextHeight = el.scrollHeight;
    const grew = nextHeight > lastHeightRef.current;
    lastHeightRef.current = nextHeight;
    if (isAtBottom && grew) {
      scrollToBottom("auto");
    }
  }, [children, containerRef, isAtBottom, scrollToBottom]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {children}
    </div>
  );
};

export const ConversationEmptyState = ({
  title = "Start a conversation",
  description = "Type a message below to begin chatting.",
  icon,
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "flex min-h-[220px] w-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground",
      className,
    )}
    {...props}
  >
    {icon ? <div className="text-muted-foreground">{icon}</div> : null}
    <div className="text-base font-semibold text-foreground">{title}</div>
    <p className="max-w-sm">{description}</p>
    {children}
  </div>
);

export const ConversationScrollButton = ({ className, ...props }) => {
  const { isAtBottom, scrollToBottom } = useConversation();
  if (isAtBottom) return null;

  return (
    <div
      className={cn(
        "sticky bottom-4 z-10 flex w-full justify-center pointer-events-none",
        className,
      )}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => scrollToBottom("smooth")}
        className="pointer-events-auto rounded-full shadow-lg shadow-black/40"
        {...props}
      >
        <ChevronDown className="size-4" />
        <span className="sr-only">Scroll to latest</span>
      </Button>
    </div>
  );
};

const defaultMessageFormatter = (message, index) => {
  if (!message) return "";
  const role = message.role === "assistant" ? "Assistant" : "User";
  const content = typeof message.content === "string" ? message.content : "";
  return `${index + 1}. ${role}: ${content}`;
};

export const messagesToMarkdown = (messages = [], formatter) => {
  const format = formatter || defaultMessageFormatter;
  return (messages || [])
    .map((message, index) => format(message, index))
    .filter(Boolean)
    .join("\n\n");
};

export const ConversationDownload = ({
  messages = [],
  filename = "conversation.md",
  formatMessage,
  className,
  ...props
}) => {
  const handleDownload = () => {
    if (typeof window === "undefined") return;
    const markdown = messagesToMarkdown(messages, formatMessage);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleDownload}
      className={cn("absolute right-4 top-4", className)}
      {...props}
    >
      <Download className="size-4" />
      <span className="sr-only">Download conversation</span>
    </Button>
  );
};

