import React, { useState } from "react";
import { Briefcase, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const IN_PROGRESS_PROJECT_OPTIONS = [
  {
    value: true,
    title: "Yes, I can continue existing projects.",
    subtitle: "I'm open to both ongoing and new projects.",
    icon: Briefcase,
    isOrangeIcon: true,
  },
  {
    value: false,
    title: "No, I only take projects from scratch.",
    subtitle: "I prefer starting fresh with new projects.",
    icon: FileText,
    isOrangeIcon: false,
  },
];

const FreelancerAcceptInProgressProjectsSlide = ({
  slide,
  acceptInProgressProjectsValue,
  onAcceptInProgressProjectsChange,
}) => {
  const [selectedVal, setSelectedVal] = useState(null);

  const handleSelect = (val) => {
    setSelectedVal(val);
    onAcceptInProgressProjectsChange?.(val);
  };

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-2xl flex-col items-center justify-center px-4 sm:min-h-[72vh] sm:px-6 py-4 mt-[10px] sm:mt-0">
      <div className="w-full max-w-md space-y-3 sm:space-y-4 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 dark:border-primary/30 bg-amber-500/10 dark:bg-primary/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-primary shadow-2xs">
          <span>✨</span>
          <span>One last step!</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Do You Accept
            <br />
            <span className="text-[#f97316] dark:text-primary">Ongoing Projects?</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            This helps us match you with the right opportunities on Catalance.
          </p>
        </div>

        {/* 3D Mascot Character (Enlarged) */}
        <div className="relative mx-auto my-1 w-56 sm:w-64 md:w-72 h-56 sm:h-64 md:h-72 flex items-center justify-center">
          <div className="absolute inset-4 rounded-full bg-gradient-to-b from-amber-400/25 via-orange-400/10 to-transparent dark:from-primary/20 dark:via-primary/5 dark:to-transparent blur-2xl pointer-events-none" />
          <img
            src="/assets/onboarding/ongoing-projects-mascot.png"
            alt="Ongoing Projects Mascot"
            className="relative z-10 w-full h-full object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Options */}
        <div className="space-y-3 pt-1 text-left">
          {IN_PROGRESS_PROJECT_OPTIONS.map((option) => {
            const isSelected = selectedVal === option.value;
            const IconComponent = option.icon;

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "group relative flex w-full items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 cursor-pointer select-none",
                  isSelected
                    ? "border-orange-400/90 dark:border-primary bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white dark:from-primary/15 dark:via-primary/10 dark:to-card dark:bg-card shadow-sm ring-2 ring-orange-400/20 dark:ring-primary/25"
                    : "border-slate-200/90 dark:border-border bg-card dark:bg-card hover:border-slate-300 dark:hover:border-primary/40 shadow-2xs",
                )}
                aria-pressed={isSelected}
              >
                {/* Left Icon Badge */}
                <div
                  className={cn(
                    "flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                    option.isOrangeIcon
                      ? "bg-gradient-to-tr from-orange-500/20 to-amber-400/25 dark:from-primary/20 dark:to-amber-400/20 text-orange-600 dark:text-primary"
                      : "bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground",
                  )}
                >
                  <IconComponent className="size-5 sm:size-5.5 stroke-[2.2]" />
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    {option.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground leading-snug">
                    {option.subtitle}
                  </p>
                </div>

                {/* Right Arrow Button */}
                <div
                  className={cn(
                    "flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full transition-all",
                    isSelected
                      ? "bg-gradient-to-r from-[#f97316] to-[#ea580c] dark:from-primary dark:to-primary text-white dark:text-primary-foreground shadow-sm"
                      : "bg-slate-100 dark:bg-muted text-slate-400 dark:text-muted-foreground group-hover:bg-slate-200 dark:group-hover:bg-accent group-hover:text-slate-700 dark:group-hover:text-foreground",
                  )}
                >
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FreelancerAcceptInProgressProjectsSlide;
