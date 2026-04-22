import { useEffect, useMemo, useRef, useState } from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";

import { cn } from "@/shared/lib/utils";

/* ──────────────────── Service Info Steps ──────────────────── */

export const SERVICE_INFO_STEPS = [
  { id: "overview", label: "Overview", step: 1 },
  { id: "pricing", label: "Pricing", step: 2 },
  { id: "visuals", label: "Add Visuals", step: 3 },
  { id: "caseStudy", label: "Case-Study", step: 4 },
  { id: "preview", label: "Preview", step: 5 },
];

/* ──────────────────── Stepper ──────────────────── */

const StepperItem = ({
  step,
  isActive,
  isCompleted,
  onStepChange,
}) => (
  <div
    className={cn(
      "flex min-w-0 items-center transition-[flex] duration-300 ease-out",
      isActive ? "flex-[2.3]" : "flex-[0.9]",
      "sm:flex-1",
    )}
  >
    <button
      type="button"
      onClick={() => onStepChange?.(step.id)}
      className={cn(
        "relative flex h-9 w-full min-w-0 items-center rounded-full border text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10",
        isActive
          ? "justify-center gap-0 border-primary bg-primary px-3 text-primary-foreground shadow-[0_0_16px_rgba(250,204,21,0.22)] sm:gap-2 sm:px-4"
          : isCompleted
            ? "justify-center gap-0 border-white/10 bg-white/10 px-2 text-white hover:border-white/20 hover:bg-white/15 sm:gap-2 sm:px-4"
            : "justify-center gap-0 border-white/8 bg-white/[0.03] px-2 text-white/55 hover:border-white/15 hover:bg-white/[0.06] hover:text-white/75 sm:gap-2 sm:px-4",
      )}
      aria-current={isActive ? "step" : undefined}
      aria-label={`${step.step}. ${step.label}`}
    >
      <span className="hidden shrink-0 text-xs font-bold sm:inline">{step.step}</span>
      <span
        className={cn(
          "min-w-0 text-center opacity-100 transition-[opacity,color] duration-300 ease-out",
          isActive
            ? "max-w-none whitespace-nowrap text-primary-foreground"
            : "max-w-full truncate text-inherit",
        )}
      >
        {step.label}
      </span>
    </button>
  </div>
);

export const ServiceInfoStepper = ({ activeStepId, onStepChange }) => {
  const activeIdx = SERVICE_INFO_STEPS.findIndex((step) => step.id === activeStepId);

  return (
    <div className="flex w-full items-center gap-1 overflow-hidden rounded-full border border-white/10 bg-card p-1">
      {SERVICE_INFO_STEPS.map((step, idx) => (
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

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  popupMode = "attached",
  popupClassName = "",
  isSearchable = false,
  searchPlaceholder = "Search...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachedPopupStyle, setAttachedPopupStyle] = useState({});
  const [attachedPopupMaxHeight, setAttachedPopupMaxHeight] = useState(208);
  const triggerRef = useRef(null);
  const normalizedOptions = Array.isArray(options) ? options : [];
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
      const margin = 12;
      const gap = 6;
      const minVisibleHeight = 140;
      const preferredMaxHeight = 320;
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - margin - gap);
      const spaceAbove = Math.max(0, rect.top - margin - gap);
      const shouldOpenAbove =
        spaceBelow < minVisibleHeight && spaceAbove > spaceBelow;
      const nextMaxHeight = Math.max(
        Math.min(
          preferredMaxHeight,
          shouldOpenAbove ? spaceAbove : spaceBelow,
        ),
        120,
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
              top: `${Math.min(rect.bottom + gap, viewportHeight - margin)}px`,
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
  }, [isCenteredPopup, isOpen]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-card px-4 text-sm transition-colors",
          value ? "text-white" : "text-white/40",
          isOpen && "border-primary/50 ring-1 ring-primary/20"
        )}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-white/40 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              "z-50 overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40",
              isCenteredPopup
                ? "fixed left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2"
                : "",
              popupClassName
            )}
            style={isCenteredPopup ? undefined : attachedPopupStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {isSearchable ? (
              <div className="border-b border-white/8 p-2.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-white/10 bg-card px-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
            ) : null}
            <div
              className={cn(
                "overflow-y-auto",
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
                      "flex w-full items-center px-4 py-3 text-left text-sm transition-colors hover:bg-white/5",
                      value === option.value
                        ? "bg-primary/10 text-primary"
                        : "text-white/80"
                    )}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-white/45">
                  {normalizedOptions.length > 0 ? "No results found" : "No options available"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
