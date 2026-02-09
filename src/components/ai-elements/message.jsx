"use client";

import {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
} from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import { Streamdown } from "streamdown";

export const Message = ({ className, from, ...props }) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export const MessageContent = ({ children, className, ...props }) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const MessageActions = ({ className, children, ...props }) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

const MessageBranchContext = createContext(null);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error("MessageBranch components must be used within MessageBranch");
  }

  return context;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState([]);

  const handleBranchChange = (newBranch) => {
    setCurrentBranch(newBranch);
    if (onBranchChange) {
      onBranchChange(newBranch);
    }
  };

  const goToPrevious = () => {
    const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const goToNext = () => {
    const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  };

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div className={cn("grid w-full gap-2 [&>div]:pb-0", className)} {...props} />
    </MessageBranchContext.Provider>
  );
};

export const MessageBranchContent = ({ children, ...props }) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [branches.length, childrenArray, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch?.key ?? index}
      {...props}
    >
      {branch}
    </div>
  ));
};

export const MessageBranchSelector = ({ className, ...props }) => {
  const { totalBranches } = useMessageBranch();

  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md",
        className
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export const MessageBranchPrevious = ({ children, ...props }) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export const MessageBranchNext = ({ children, className, ...props }) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      className={className}
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export const MessageBranchPage = ({ className, ...props }) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export const MessageResponse = memo(
  ({ className, ...props }) => (
    <Streamdown
      className={cn(
        "size-full text-[14px] leading-6 text-foreground",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_p]:mb-3 [&_p:last-child]:mb-0",
        "[&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground",
        "[&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
        "[&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/50 [&_pre]:p-3",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mb-2 [&_li:last-child]:mb-0",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
        "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5",
        className
      )}
      plugins={{ code, mermaid, math, cjk }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MessageResponse.displayName = "MessageResponse";

const CARET = "|";

export const MessageResponseTyping = memo(
  ({
    children,
    className,
    isEnabled = false,
    speed = 28,
    onComplete,
    ...props
  }) => {
    const text = typeof children === "string" ? children : "";
    const prefersReducedMotion = useMemo(() => {
      if (typeof window === "undefined") return false;
      return window.matchMedia?.("(prefers-reduced-motion: reduce)")
        ?.matches;
    }, []);
    const tokens = useMemo(() => {
      if (!text) return [];
      return text.split(/(\s+)/);
    }, [text]);
    const [visibleText, setVisibleText] = useState(
      isEnabled ? "" : text,
    );
    const [isDone, setIsDone] = useState(!isEnabled);
    const timeoutRef = useRef(null);
    const doneRef = useRef(false);

    useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      doneRef.current = false;
      if (!isEnabled || prefersReducedMotion || tokens.length === 0) {
        setVisibleText(text);
        setIsDone(true);
        return;
      }

      let index = 0;
      setVisibleText("");
      setIsDone(false);

      const step = () => {
        index += 1;
        setVisibleText(tokens.slice(0, index).join(""));
        if (index < tokens.length) {
          timeoutRef.current = setTimeout(step, speed);
        } else {
          setIsDone(true);
          if (!doneRef.current) {
            doneRef.current = true;
            if (onComplete) onComplete();
          }
        }
      };

      timeoutRef.current = setTimeout(step, speed);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [isEnabled, prefersReducedMotion, speed, text, tokens, onComplete]);

    const output = isEnabled && !isDone ? `${visibleText}${CARET}` : text;

    return (
      <MessageResponse className={className} {...props}>
        {output}
      </MessageResponse>
    );
  },
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isEnabled === nextProps.isEnabled,
);

MessageResponseTyping.displayName = "MessageResponseTyping";

export const MessageToolbar = ({ className, children, ...props }) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
