import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Info from "lucide-react/dist/esm/icons/info";

import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_STEP_LABEL_CLASS,
} from "../../typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SERVICE_INFO_STEPS } from "./serviceInfoConstants";

/* ──────────────────── Service Info Steps ──────────────────── */

const SERVICE_TITLE_TOOLTIP_MESSAGE =
  "Write a clear title that shows what you can build and the result you deliver, like a website with React or Webflow that helps increase sales.";

export const ServiceTitleTooltip = ({
  ariaLabel = "What should I enter in Service Title?",
  message = SERVICE_TITLE_TOOLTIP_MESSAGE,
}) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="inline-flex size-5 items-center justify-center text-muted-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-center">
        {message}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

/* ──────────────────── Stepper ──────────────────── */

const StepperItem = ({
  step,
  isActive,
  isCompleted,
  onStepChange,
}) => (
  <button
    type="button"
    onClick={() => onStepChange?.(step.id)}
    className={cn(
      "relative flex h-8 sm:h-9 items-center justify-center rounded-full px-4 sm:px-6 text-[13px] sm:text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none",
      isActive
        ? "!text-white keep-white dark:!text-black"
        : "text-muted-foreground hover:text-foreground",
    )}
    aria-current={isActive ? "step" : undefined}
    aria-label={`${step.step}. ${step.label}`}
  >
    {isActive && (
      <motion.div
        layoutId="activeTabOverlay"
        className="absolute inset-0 rounded-full bg-primary shadow-sm"
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )}
    <span className={cn("relative z-10", isActive ? "!text-white keep-white dark:!text-black" : "")}>{step.label}</span>
  </button>
);

export const ServiceInfoStepper = ({
  activeStepId,
  onStepChange,
  steps = SERVICE_INFO_STEPS,
}) => {
  const activeIdx = steps.findIndex((step) => step.id === activeStepId);

  return (
    <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border/80 bg-muted/40 p-1 shadow-sm">
      {steps.map((step, idx) => (
        <StepperItem
          key={step.id}
          step={step}
          isActive={step.id === activeStepId}
          isCompleted={activeIdx >= 0 && idx < activeIdx}
          onStepChange={onStepChange}
        />
      ))}
    </div>
  );
};

/* ──────────────────── Custom Select ──────────────────── */

const ATTACHED_POPUP_MARGIN = 12;
const ATTACHED_POPUP_GAP = 6;
const ATTACHED_POPUP_PREFERRED_LIST_HEIGHT = 320;
const ATTACHED_POPUP_MIN_VISIBLE_LIST_HEIGHT = 140;
const ATTACHED_POPUP_SEARCH_HEADER_HEIGHT = 60;

const calculateAttachedPopupPosition = ({
  triggerElement,
  viewportBottomOffset = 0,
  isSearchable = false,
}) => {
  if (!triggerElement || typeof window === "undefined") {
    return null;
  }

  const rect = triggerElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const margin = ATTACHED_POPUP_MARGIN;
  const gap = ATTACHED_POPUP_GAP;
  const safeViewportBottom =
    viewportHeight - Math.max(0, Number(viewportBottomOffset) || 0);
  const popupChromeHeight = isSearchable ? ATTACHED_POPUP_SEARCH_HEADER_HEIGHT : 0;
  const spaceBelow = Math.max(
    0,
    safeViewportBottom - rect.bottom - margin - gap,
  );
  const spaceAbove = Math.max(0, rect.top - margin - gap);
  const listSpaceBelow = Math.max(0, spaceBelow - popupChromeHeight);
  const listSpaceAbove = Math.max(0, spaceAbove - popupChromeHeight);
  const shouldOpenAbove =
    listSpaceBelow < ATTACHED_POPUP_MIN_VISIBLE_LIST_HEIGHT &&
    listSpaceAbove > listSpaceBelow;
  const nextMaxHeight = Math.min(
    ATTACHED_POPUP_PREFERRED_LIST_HEIGHT,
    Math.max(shouldOpenAbove ? listSpaceAbove : listSpaceBelow, 0),
  );
  const nextWidth = Math.min(rect.width, viewportWidth - margin * 2);
  const nextLeft = Math.min(
    Math.max(rect.left, margin),
    viewportWidth - nextWidth - margin,
  );

  return {
    maxHeight: nextMaxHeight,
    style: shouldOpenAbove
      ? {
          position: "fixed",
          left: `${nextLeft}px`,
          bottom: `${Math.max(viewportHeight - rect.top + gap, margin)}px`,
          width: `${nextWidth}px`,
          visibility: "visible",
          pointerEvents: "auto",
        }
      : {
          position: "fixed",
          left: `${nextLeft}px`,
          top: `${Math.min(rect.bottom + gap, safeViewportBottom - margin)}px`,
          width: `${nextWidth}px`,
          visibility: "visible",
          pointerEvents: "auto",
        },
  };
};

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  hasError = false,
  popupMode = "attached",
  popupClassName = "",
  isSearchable = false,
  searchPlaceholder = "Search...",
  viewportBottomOffset = 0,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachedPopupStyle, setAttachedPopupStyle] = useState({});
  const [attachedPopupMaxHeight, setAttachedPopupMaxHeight] = useState(208);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const normalizedOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options],
  );
  const selectedOption = normalizedOptions.find((option) => option.value === value);
  const isCenteredPopup = popupMode === "centered";
  const filteredOptions = useMemo(() => {
    if (!isSearchable) {
      return normalizedOptions;
    }

    const normalizedQuery = String(searchQuery || "").trim().toLowerCase();
    if (!normalizedQuery) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) =>
      String(option?.label || "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [isSearchable, normalizedOptions, searchQuery]);

  const handleTriggerClick = () => {
    if (!isOpen) {
      const nextPopup = calculateAttachedPopupPosition({
        triggerElement: triggerRef.current,
        viewportBottomOffset,
        isSearchable,
      });

      if (nextPopup) {
        setAttachedPopupStyle(nextPopup.style);
        setAttachedPopupMaxHeight(nextPopup.maxHeight);
      }
    }

    setIsOpen((current) => !current);
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isSearchable) {
      return undefined;
    }

    const frameId = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen, isSearchable]);

  useLayoutEffect(() => {
    if (!isOpen || isCenteredPopup) {
      return undefined;
    }

    let frameId = 0;

    const updatePopupPosition = () => {
      const nextPopup = calculateAttachedPopupPosition({
        triggerElement: triggerRef.current,
        viewportBottomOffset,
        isSearchable,
      });

      if (!nextPopup) {
        return;
      }

      setAttachedPopupStyle(nextPopup.style);
      setAttachedPopupMaxHeight(nextPopup.maxHeight);
    };

    const requestPositionUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePopupPosition);
    };

    requestPositionUpdate();
    window.addEventListener("resize", requestPositionUpdate);
    window.addEventListener("scroll", requestPositionUpdate, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", requestPositionUpdate);
      window.removeEventListener("scroll", requestPositionUpdate, true);
    };
  }, [isCenteredPopup, isOpen, isSearchable, viewportBottomOffset]);

  const popupContent = isOpen ? (
    <>
      <div
        className="fixed inset-0 z-[60]"
        onClick={() => setIsOpen(false)}
      />
      <div
        data-onboarding-popup="true"
        className={cn(
          "z-[70] overflow-hidden rounded-xl border border-border bg-card shadow-xl",
          isCenteredPopup
            ? "fixed left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2"
            : "",
          popupClassName
        )}
        style={isCenteredPopup ? undefined : attachedPopupStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {isSearchable ? (
          <div className="border-b border-border p-2.5">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground/50 placeholder:font-normal [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 [&::placeholder]:font-normal focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        ) : null}
        <div
          className={cn(
            "flex flex-col gap-1 p-1 overflow-y-auto subtle-scrollbar",
            isCenteredPopup ? "max-h-[min(60vh,320px)]" : "",
          )}
          style={isCenteredPopup ? undefined : { maxHeight: `${attachedPopupMaxHeight}px` }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  value === option.value
                    ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(255,199,0,0.25)]"
                    : "border-transparent text-foreground hover:border-border hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="min-w-0 truncate font-medium">{option.label}</span>
                {value === option.value ? (
                  <Check className="ml-1 h-4 w-4 shrink-0 text-primary-foreground" />
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {normalizedOptions.length > 0 ? "No results found" : "No options available"}
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;
 
  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-4 !text-[14px] !leading-5 transition-colors hover:border-border/80 font-normal",
          value ? "text-foreground" : "text-muted-foreground/50",
          hasError
            ? "border-destructive/70 ring-1 ring-destructive/20"
            : isOpen && "border-primary/50 ring-1 ring-primary/20",
          className,
        )}
        aria-invalid={hasError}
      >
        <span className="text-[14px] leading-5 font-normal">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {popupContent && typeof document !== "undefined"
        ? createPortal(popupContent, document.body)
        : popupContent}
    </div>
  );
};

