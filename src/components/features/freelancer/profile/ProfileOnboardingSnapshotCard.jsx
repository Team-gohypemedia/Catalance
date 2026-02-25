import { Card } from "@/components/ui/card";

const ProfileOnboardingSnapshotCard = ({
  workModelLabel,
  availabilityLabel,
  scheduleLabel,
  startTimelineLabel,
  deliveryPolicyLabel,
  communicationPolicyLabel,
  acceptInProgressProjectsLabel,
}) => {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
      <h3 className="text-xl font-bold tracking-tight text-foreground">
        Work Preferences
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        What clients see about your availability and working policies.
      </p>

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
