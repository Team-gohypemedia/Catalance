import { 
  Building2, 
  UserRound, 
  Check, 
  Wallet, 
  Target, 
  Workflow, 
  Users, 
  Calendar, 
  TrendingUp 
} from "lucide-react";

import { cn } from "@/shared/lib/utils";

const FreelancerWorkPreferenceSlide = ({
  selectedWorkPreference,
  onSelectWorkPreference,
}) => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6 py-6 sm:py-10">
      <div className="w-full">
        {/* Heading Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium text-neutral-900 dark:text-white tracking-tight mb-3">
            How Do You Want To Work On <span className="font-serif italic font-light text-primary text-[1.05em] select-none">Catalance?</span>
          </h1>
          <div className="text-sm sm:text-base text-neutral-900/60 dark:text-neutral-400 font-medium">
            Choose the option that best describes you.
          </div>
        </div>

        {/* Option Cards Grid */}
        <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2 w-full mt-2">
          
          {/* Individual Freelancer Option */}
          <button
            type="button"
            onClick={() => onSelectWorkPreference("individual")}
            className={cn(
              "group w-full rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300 relative cursor-pointer",
              selectedWorkPreference === "individual"
                ? "border-primary bg-primary/[0.03] dark:bg-primary/[0.01] shadow-[0_12px_40px_rgba(217,105,42,0.06)] dark:shadow-[0_12px_40px_rgba(249,217,73,0.02)] scale-[1.01]"
                : "border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-primary/40 dark:hover:border-primary/40 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.04)] hover:-translate-y-0.5"
            )}
            aria-pressed={selectedWorkPreference === "individual"}
          >
            {/* Top Row: Icon & Selection indicator */}
            <div className="flex items-start justify-between w-full">
              {/* Icon round container */}
              <div className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 keep-white",
                selectedWorkPreference === "individual"
                  ? "bg-gradient-to-br from-primary to-orange-500 dark:from-primary dark:to-yellow-500 text-white shadow-sm"
                  : "bg-neutral-100/80 dark:bg-neutral-800/60 group-hover:bg-primary/10 group-hover:scale-105"
              )}>
                <UserRound className={cn(
                  "h-5 w-5 sm:h-5.5 sm:w-5.5 transition-all duration-300",
                  selectedWorkPreference === "individual"
                    ? "text-white keep-white"
                    : "text-neutral-900/60 dark:text-neutral-450 group-hover:text-primary"
                )} />
              </div>

              {/* Selection Circle Badge */}
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-250",
                  selectedWorkPreference === "individual"
                    ? "border-primary bg-primary text-white scale-110 keep-white"
                    : "border-neutral-300 dark:border-neutral-700 bg-transparent group-hover:border-primary/50"
                )}
                aria-hidden="true"
              >
                {selectedWorkPreference === "individual" && (
                  <Check className="h-3 w-3 stroke-[3] text-white keep-white" />
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-4 sm:mt-5">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Individual Freelancer
              </h2>
              <div className="text-xs sm:text-sm text-neutral-900/60 dark:text-neutral-400 mt-2 leading-relaxed font-medium">
                Work independently on projects and deliver your expertise.
              </div>
            </div>

            {/* Bottom Tag List */}
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-5">
              {/* Tag 1 */}
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-300",
                selectedWorkPreference === "individual"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-neutral-200/60 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-900/60 dark:text-neutral-400"
              )}>
                <Wallet className={cn(
                  "h-3.5 w-3.5 transition-colors duration-300",
                  selectedWorkPreference === "individual"
                    ? "text-primary"
                    : "text-neutral-900/60 dark:text-neutral-400"
                )} />
                <div className="font-semibold">Set your rates</div>
              </div>

              {/* Tag 2 */}
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-300",
                selectedWorkPreference === "individual"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-neutral-200/60 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-900/60 dark:text-neutral-400"
              )}>
                <Target className={cn(
                  "h-3.5 w-3.5 transition-colors duration-300",
                  selectedWorkPreference === "individual"
                    ? "text-primary"
                    : "text-neutral-900/60 dark:text-neutral-450"
                )} />
                <div className="font-semibold">Choose projects</div>
              </div>

              {/* Tag 3 */}
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-300",
                selectedWorkPreference === "individual"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-neutral-200/60 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-900/60 dark:text-neutral-450"
              )}>
                <Workflow className={cn(
                  "h-3.5 w-3.5 transition-colors duration-300",
                  selectedWorkPreference === "individual"
                    ? "text-primary"
                    : "text-neutral-900/60 dark:text-neutral-450"
                )} />
                <div className="font-semibold">Work your way</div>
              </div>
            </div>
          </button>

          {/* Agency / Studio Option */}
          <button
            type="button"
            onClick={() => onSelectWorkPreference("agency")}
            className={cn(
              "group w-full rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300 relative cursor-pointer",
              selectedWorkPreference === "agency"
                ? "border-primary bg-primary/[0.03] dark:bg-primary/[0.01] shadow-[0_12px_40px_rgba(217,105,42,0.06)] dark:shadow-[0_12px_40px_rgba(249,217,73,0.02)] scale-[1.01]"
                : "border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-primary/40 dark:hover:border-primary/40 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.04)] hover:-translate-y-0.5"
            )}
            aria-pressed={selectedWorkPreference === "agency"}
          >
            {/* Top Row: Icon & Selection indicator */}
            <div className="flex items-start justify-between w-full">
              {/* Icon round container */}
              <div className={cn(
                "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 keep-white",
                selectedWorkPreference === "agency"
                  ? "bg-gradient-to-br from-primary to-orange-500 dark:from-primary dark:to-yellow-500 text-white shadow-sm"
                  : "bg-neutral-100/80 dark:bg-neutral-800/60 group-hover:bg-primary/10 group-hover:scale-105"
              )}>
                <Building2 className={cn(
                  "h-5 w-5 sm:h-5.5 sm:w-5.5 transition-all duration-300",
                  selectedWorkPreference === "agency"
                    ? "text-white keep-white"
                    : "text-neutral-900/60 dark:text-neutral-450 group-hover:text-primary"
                )} />
              </div>

              {/* Selection Circle Badge */}
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-250",
                  selectedWorkPreference === "agency"
                    ? "border-primary bg-primary text-white scale-110 keep-white"
                    : "border-neutral-300 dark:border-neutral-700 bg-transparent group-hover:border-primary/50"
                )}
                aria-hidden="true"
              >
                {selectedWorkPreference === "agency" && (
                  <Check className="h-3 w-3 stroke-[3] text-white keep-white" />
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="mt-4 sm:mt-5">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Agency / Studio
              </h2>
              <div className="text-xs sm:text-sm text-neutral-900/60 dark:text-neutral-400 mt-2 leading-relaxed font-medium">
                Collaborate as a team and deliver exceptional results.
              </div>
            </div>

            {/* Bottom Tag List */}
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-5">
              {/* Tag 1 */}
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-300",
                selectedWorkPreference === "agency"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-neutral-200/60 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-900/60 dark:text-neutral-400"
              )}>
                <Users className={cn(
                  "h-3.5 w-3.5 transition-colors duration-300",
                  selectedWorkPreference === "agency"
                    ? "text-primary"
                    : "text-neutral-900/60 dark:text-neutral-400"
                )} />
                <div className="font-semibold">Team collaboration</div>
              </div>

              {/* Tag 2 */}
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-300",
                selectedWorkPreference === "agency"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-neutral-200/60 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-900/60 dark:text-neutral-400"
              )}>
                <Calendar className={cn(
                  "h-3.5 w-3.5 transition-colors duration-300",
                  selectedWorkPreference === "agency"
                    ? "text-primary"
                    : "text-neutral-900/60 dark:text-neutral-450"
                )} />
                <div className="font-semibold">Manage projects</div>
              </div>

              {/* Tag 3 */}
              <div className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-300",
                selectedWorkPreference === "agency"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-neutral-200/60 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 text-neutral-900/60 dark:text-neutral-450"
              )}>
                <TrendingUp className={cn(
                  "h-3.5 w-3.5 transition-colors duration-300",
                  selectedWorkPreference === "agency"
                    ? "text-primary"
                    : "text-neutral-900/60 dark:text-neutral-450"
                )} />
                <div className="font-semibold">Scale your business</div>
              </div>
            </div>
          </button>

        </div>
      </div>
    </section>
  );
};

export default FreelancerWorkPreferenceSlide;
