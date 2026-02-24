import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ProfileSummaryCards = ({
  openFullProfileEditor,
  onboardingRoleLabel,
  onboardingAvailability,
  normalizeValueLabel,
  profileDetails,
}) => {
  return (
    <>
      <Card className="p-6 md:p-7 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="text-primary">
              <Briefcase className="w-5 h-5" />
            </span>
            Onboarding Snapshot
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            onClick={openFullProfileEditor}
          >
            Edit All Details
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 min-h-[108px] flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Work Model
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{onboardingRoleLabel}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 min-h-[108px] flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Availability
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {normalizeValueLabel(onboardingAvailability.hoursPerWeek) || "Not set"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {normalizeValueLabel(onboardingAvailability.workingSchedule) ||
                "Schedule not set"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 min-h-[108px] flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Start Timeline
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {normalizeValueLabel(onboardingAvailability.startTimeline) || "Not set"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <span className="rounded-lg border border-border/50 bg-secondary/70 px-3 py-2 text-xs font-medium text-secondary-foreground flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Delivery Policy</span>
            <span>{profileDetails?.deliveryPolicyAccepted ? "Accepted" : "Not set"}</span>
          </span>
          <span className="rounded-lg border border-border/50 bg-secondary/70 px-3 py-2 text-xs font-medium text-secondary-foreground flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Communication Policy</span>
            <span>
              {profileDetails?.communicationPolicyAccepted ? "Accepted" : "Not set"}
            </span>
          </span>
          <span className="rounded-lg border border-border/50 bg-secondary/70 px-3 py-2 text-xs font-medium text-secondary-foreground flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Accept In-Progress Projects</span>
            <span>
              {normalizeValueLabel(profileDetails?.acceptInProgressProjects) || "Not set"}
            </span>
          </span>
        </div>
      </Card>
    </>
  );
};

export default ProfileSummaryCards;

