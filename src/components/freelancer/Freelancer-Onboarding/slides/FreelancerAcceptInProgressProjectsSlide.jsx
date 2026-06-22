import { cn } from "@/shared/lib/utils";

const IN_PROGRESS_PROJECT_OPTIONS = [
  {
    value: true,
    label: "Yes, I can continue existing projects.",
  },
  {
    value: false,
    label: "No, I only take projects from scratch.",
  },
];

const FreelancerAcceptInProgressProjectsSlide = ({
  slide,
  acceptInProgressProjectsValue,
  onAcceptInProgressProjectsChange,
}) => {
  const title = slide?.title || "Do You Accept Ongoing Projects?";

  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 sm:min-h-[70vh] sm:px-6 mt-[20px] sm:mt-0">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-balance text-3xl font-medium tracking-[-0.035em] text-primary sm:text-4xl lg:text-[40px] lg:leading-[1.06]">
            {title}
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
                    : "border-border hover:border-border/80",
                )}
                aria-pressed={isSelected}
              >
                <p
                  className={cn(
                    "text-base font-normal sm:text-base",
                    isSelected ? "text-primary" : "text-foreground",
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
};

export default FreelancerAcceptInProgressProjectsSlide;
