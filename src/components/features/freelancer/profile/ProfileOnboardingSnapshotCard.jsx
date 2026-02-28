import { Card } from "@/components/ui/card";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import { Button } from "@/components/ui/button";

const ProfileOnboardingSnapshotCard = ({
  workModelLabel,
  availabilityLabel,
  scheduleLabel,
  startTimelineLabel,
  deliveryPolicyLabel,
  communicationPolicyLabel,
  acceptInProgressProjectsLabel,
  openFullProfileEditor,
}) => {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Work Preferences
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            What clients see about your availability and working policies.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={openFullProfileEditor}
          title="Edit full profile details"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Work Style
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {workModelLabel}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Weekly Availability
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {availabilityLabel}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {scheduleLabel === "Not set yet" ? "Schedule: Not set yet" : scheduleLabel}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Start Time
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {startTimelineLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">Delivery Terms</span>
          <span className="text-sm font-semibold text-foreground">
            {deliveryPolicyLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            Communication Terms
          </span>
          <span className="text-sm font-semibold text-foreground">
            {communicationPolicyLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            Take Over Ongoing Projects
          </span>
          <span className="text-sm font-semibold text-foreground">
            {acceptInProgressProjectsLabel}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProfileOnboardingSnapshotCard;
