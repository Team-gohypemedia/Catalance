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
  variant = "default",
}) => {
  const isSidebar = variant === "sidebar";
  const preferenceItems = [
    {
      label: "Work Style",
      value: workModelLabel,
    },
    {
      label: "Weekly Availability",
      value: availabilityLabel,
      detail:
        scheduleLabel === "Not set yet" ? "Schedule: Not set yet" : scheduleLabel,
    },
    {
      label: "Start Time",
      value: startTimelineLabel,
    },
  ];
  const policyItems = [
    {
      label: "Delivery Terms",
      value: deliveryPolicyLabel,
    },
    {
      label: "Communication Terms",
      value: communicationPolicyLabel,
    },
    {
      label: "Take Over Ongoing Projects",
      value: acceptInProgressProjectsLabel,
    },
  ];

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
          onClick={() => openFullProfileEditor("workPreferences")}
          title="Edit work preferences"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      {isSidebar ? (
        <div className="mt-4 space-y-3">
          {preferenceItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-background/40 px-4 py-3"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {item.value}
              </p>
              {item.detail ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              ) : null}
            </div>
          ))}

          <div className="space-y-2 border-t border-border/60 pt-3">
            {policyItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5"
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {preferenceItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-background/40 px-4 py-3"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {item.value}
                </p>
                {item.detail ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.detail}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {policyItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5"
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default ProfileOnboardingSnapshotCard;
