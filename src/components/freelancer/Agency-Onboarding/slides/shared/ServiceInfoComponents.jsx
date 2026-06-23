import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Check from "lucide-react/dist/esm/icons/check";

import { cn } from "@/shared/lib/utils";
import {
  ONBOARDING_STEP_LABEL_CLASS,
} from "../../typography";

/* ──────────────────── Service Info Steps ──────────────────── */

export const SERVICE_INFO_STEPS = [
  { id: "quickInfo", label: "Quick Info", step: 1 },
  { id: "caseStudy", label: "Case Study", step: 2 },
  { id: "preview", label: "Preview", step: 3 },
];

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
    {isCompleted && (
      <span className="relative z-10 mr-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
        <Check className="size-2.5 stroke-[3.5]" />
      </span>
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
      if (!triggerRef.current || typeof window === "undefined") {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
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

      setAttachedPopupStyle(
        shouldOpenAbove
          ? {
              position: "fixed",
              left: `${nextLeft}px`,
              bottom: `${Math.max(viewportHeight - rect.top + gap, margin)}px`,
              width: `${nextWidth}px`,
            }
          : {
              position: "fixed",
              left: `${nextLeft}px`,
              top: `${Math.min(rect.bottom + gap, safeViewportBottom - margin)}px`,
              width: `${nextWidth}px`,
            },
      );
      setAttachedPopupMaxHeight(nextMaxHeight);
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
              className="h-10 w-full rounded-lg border border-input bg-card px-3 !text-[14px] !leading-5 text-foreground outline-none transition-colors placeholder:!text-[14px] placeholder:!leading-5 placeholder:text-muted-foreground [&::placeholder]:!text-[14px] [&::placeholder]:!leading-5 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        ) : null}
        <div
          className={cn(
            "overflow-y-auto subtle-scrollbar",
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
                  "flex w-full items-center px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
                  value === option.value
                    ? "bg-primary/10 text-primary"
                    : "text-foreground"
                )}
              >
                {option.label}
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
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-4 !text-[14px] !leading-5 transition-colors",
          value ? "text-foreground" : "text-muted-foreground",
          hasError
            ? "border-destructive/70 ring-1 ring-destructive/20"
            : isOpen && "border-primary/50 ring-1 ring-primary/20",
        )}
        aria-invalid={hasError}
      >
        <span className="text-[14px] leading-5">{selectedOption?.label || placeholder}</span>
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
