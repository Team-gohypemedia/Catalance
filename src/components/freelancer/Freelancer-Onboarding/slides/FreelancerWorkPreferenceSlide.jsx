import Building2 from "lucide-react/dist/esm/icons/building-2";
import UserRound from "lucide-react/dist/esm/icons/user-round";

import { cn } from "@/shared/lib/utils";

const FreelancerWorkPreferenceSlide = ({
  selectedWorkPreference,
  onSelectWorkPreference,
}) => {
  return (
    <section className="mx-auto flex min-h-[68vh] w-full max-w-5xl flex-col items-center justify-center px-4 text-center sm:min-h-[70vh] sm:px-6">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.03em] text-primary sm:text-4xl">
          How Do You Want To Work On Catalance?
        </h1>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onSelectWorkPreference("individual")}
            className={cn(
              "relative w-full rounded-[22px] border px-5 py-4 text-center transition-all duration-200",
              "bg-card",
              selectedWorkPreference === "individual"
                ? "border-primary ring-1 ring-primary/25"
                : "border-white/10 hover:border-white/20"
            )}
            aria-pressed={selectedWorkPreference === "individual"}
          >
            <div
              className={cn(
                "absolute left-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-[18px] border",
                selectedWorkPreference === "individual"
                  ? "border-primary text-primary"
                  : "border-white/10 text-[#d4d4d4]"
              )}
            >
              <UserRound className="h-6 w-6" />
            </div>

            <div className="mx-auto flex min-h-14 w-full max-w-[520px] flex-col items-center justify-center px-14 text-center sm:px-16">
              <h2
                className={cn(
                  "text-lg font-semibold",
                  selectedWorkPreference === "individual"
                    ? "text-primary"
                    : "text-white"
                )}
              >
                Individual Freelancer
              </h2>
              <p className="mt-1 text-base text-muted-foreground">
                Working independently on projects
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectWorkPreference("agency")}
            className={cn(
              "relative w-full rounded-[22px] border px-5 py-4 text-center transition-all duration-200",
              "bg-card",
              selectedWorkPreference === "agency"
                ? "border-primary ring-1 ring-primary/25"
                : "border-white/10 hover:border-white/20"
            )}
            aria-pressed={selectedWorkPreference === "agency"}
          >
            <div
              className={cn(
                "absolute left-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-[18px] border",
                selectedWorkPreference === "agency"
                  ? "border-primary text-primary"
                  : "border-white/10 text-[#d4d4d4]"
              )}
            >
              <Building2 className="h-6 w-6" />
            </div>

            <div className="mx-auto flex min-h-14 w-full max-w-[520px] flex-col items-center justify-center px-14 text-center sm:px-16">
              <h2
                className={cn(
                  "text-lg font-semibold",
                  selectedWorkPreference === "agency"
                    ? "text-primary"
                    : "text-white"
                )}
              >
                Agency / Studio
              </h2>
              <p className="mt-1 text-base text-muted-foreground">
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
