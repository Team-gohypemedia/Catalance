import { cn } from "@/shared/lib/utils";

const IN_PROGRESS_PROJECT_OPTIONS = [
  {
    value: true,
    label: "Yes, I Accept In-Progress Projects",
    description:
      "I can take over partially completed projects and continue from the current stage.",
  },
  {
    value: false,
    label: "No, I Prefer New Projects",
    description:
      "I prefer projects that start from scratch so I can manage the full process.",
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
              <p
                className={cn(
                  "text-base font-semibold sm:text-lg",
                  isSelected ? "text-primary" : "text-white",
                )}
              >
                {option.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

export default FreelancerAcceptInProgressProjectsSlide;
