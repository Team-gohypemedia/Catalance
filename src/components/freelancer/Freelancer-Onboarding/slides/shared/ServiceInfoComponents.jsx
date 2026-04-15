import { useState } from "react";
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

const StepperItem = ({ step, isActive, isCompleted }) => (
  <div className="flex flex-1 items-center">
    <button
      type="button"
      className={cn(
        "relative flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(250,204,21,0.25)]"
          : isCompleted
            ? "bg-white/10 text-white"
            : "bg-transparent text-white/40"
      )}
    >
      <span className="text-xs font-bold">{step.step}</span>
      <span className="hidden sm:inline">{step.label}</span>
    </button>
  </div>
);

export const ServiceInfoStepper = ({ activeStepId }) => (
  <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-card p-1">
    {SERVICE_INFO_STEPS.map((step, idx) => {
      const activeIdx = SERVICE_INFO_STEPS.findIndex(
        (s) => s.id === activeStepId
      );
      return (
        <StepperItem
          key={step.id}
          step={step}
          isActive={step.id === activeStepId}
          isCompleted={idx < activeIdx}
        />
      );
    })}
  </div>
);

/* ──────────────────── Custom Select ──────────────────── */

export const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
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
          <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl shadow-black/40">
            <div className="max-h-52 overflow-y-auto">
            {options.map((option) => (
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
            ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
