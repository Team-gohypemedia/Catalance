import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";

import { cn } from "@/shared/lib/utils";

const IN_PROGRESS_PROJECT_OPTIONS = [
  {
    value: true,
    label: "Yes, I Accept In-Progress Projects",
    description:
      "I can take over partially completed projects and continue from the current stage.",
    Icon: CheckCircle2,
  },
  {
    value: false,
    label: "No, I Prefer New Projects",
    description:
      "I prefer projects that start from scratch so I can manage the full process.",
    Icon: XCircle,
  },
];

const FreelancerAcceptInProgressProjectsSlide = ({
  acceptInProgressProjectsValue,
  onAcceptInProgressProjectsChange,
}) => (
  <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:min-h-[70vh] sm:px-6">
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-primary sm:text-4xl lg:text-[3rem] lg:leading-[1.06]">
          Do You Accept Projects That Are Already In Progress Or Partially Completed?
        </h1>
      </div>

      <div className="space-y-4">
        {IN_PROGRESS_PROJECT_OPTIONS.map((option) => {
          const isSelected = acceptInProgressProjectsValue === option.value;
          const Icon = option.Icon;

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onAcceptInProgressProjectsChange(option.value)}
              className={cn(
                "w-full rounded-2xl border bg-card px-5 py-4 text-center transition-all duration-200",
                isSelected
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-white/10 hover:border-white/20",
              )}
              aria-pressed={isSelected}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "rounded-full border p-1.5",
                    isSelected
                      ? "border-primary text-primary"
                      : "border-white/10 text-white/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <p
                  className={cn(
                    "text-base font-semibold sm:text-lg",
                    isSelected ? "text-primary" : "text-white",
                  )}
                >
                  {option.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

export default FreelancerAcceptInProgressProjectsSlide;
