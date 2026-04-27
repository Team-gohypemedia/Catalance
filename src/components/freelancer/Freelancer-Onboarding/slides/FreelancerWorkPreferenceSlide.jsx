import Building2 from "lucide-react/dist/esm/icons/building-2";
import UserRound from "lucide-react/dist/esm/icons/user-round";

import { cn } from "@/shared/lib/utils";

const FreelancerWorkPreferenceSlide = ({
  selectedWorkPreference,
  onSelectWorkPreference,
}) => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            How Do You Want To Work On Catalance?
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectWorkPreference("individual")}
            className={cn(
              "group w-full rounded-[22px] border bg-card p-5 text-left transition-all duration-200",
              "bg-card",
              selectedWorkPreference === "individual"
                ? "border-primary ring-1 ring-primary/25"
                : "border-white/10 hover:border-primary"
            )}
            aria-pressed={selectedWorkPreference === "individual"}
          >
            <div className="flex items-start justify-between">
              <UserRound
                className={cn(
                  "h-7 w-7",
                  selectedWorkPreference === "individual"
                    ? "text-primary"
                    : "text-[#d4d4d4]"
                )}
              />

              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-200",
                  selectedWorkPreference === "individual"
                    ? "border-primary"
                    : "border-white/35 group-hover:border-primary"
                )}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-opacity duration-200",
                    selectedWorkPreference === "individual"
                      ? "bg-primary opacity-100"
                      : "bg-primary opacity-0 group-hover:opacity-100"
                  )}
                />
              </span>
            </div>

            <div className="mt-5 space-y-1">
              <h2
                className={cn(
                  "text-xl sm:text-2xl font-semibold leading-tight",
                  selectedWorkPreference === "individual"
                    ? "text-primary"
                    : "text-white"
                )}
              >
                Individual Freelancer
              </h2>
              <p className="text-base text-muted-foreground">
                Working independently on projects
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectWorkPreference("agency")}
            className={cn(
              "group w-full rounded-[22px] border bg-card p-5 text-left transition-all duration-200",
              "bg-card",
              selectedWorkPreference === "agency"
                ? "border-primary ring-1 ring-primary/25"
                : "border-white/10 hover:border-primary"
            )}
            aria-pressed={selectedWorkPreference === "agency"}
          >
            <div className="flex items-start justify-between">
              <Building2
                className={cn(
                  "h-7 w-7",
                  selectedWorkPreference === "agency"
                    ? "text-primary"
                    : "text-[#d4d4d4]"
                )}
              />

              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-200",
                  selectedWorkPreference === "agency"
                    ? "border-primary"
                    : "border-white/35 group-hover:border-primary"
                )}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-opacity duration-200",
                    selectedWorkPreference === "agency"
                      ? "bg-primary opacity-100"
                      : "bg-primary opacity-0 group-hover:opacity-100"
                  )}
                />
              </span>
            </div>

            <div className="mt-5 space-y-1">
              <h2
                className={cn(
                  "text-xl sm:text-2xl font-semibold leading-tight",
                  selectedWorkPreference === "agency"
                    ? "text-primary"
                    : "text-white"
                )}
              >
                Agency / Studio
              </h2>
              <p className="text-base text-muted-foreground">
                Team of professionals
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default FreelancerWorkPreferenceSlide;
