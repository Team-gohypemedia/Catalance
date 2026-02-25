import { Card } from "@/components/ui/card";

const ProfileSummaryCards = ({
  profileCompletionPercent,
  completedCompletionSections,
  partialCompletionSections,
  profileCompletionCriteriaLength,
  profileCompletionMessage,
  profileCompletionMissingDetails,
}) => {
  const completion = Math.min(
    100,
    Math.max(0, Number(profileCompletionPercent) || 0)
  );
  const bubbleLeftPercent = Math.min(96, Math.max(4, completion));
  const progressMessage =
    profileCompletionMessage ||
    "You're nearly there, add a few more details to complete your profile.";
  const visibleMissingDetails = Array.isArray(profileCompletionMissingDetails)
    ? profileCompletionMissingDetails.slice(0, 4)
    : [];
  const hiddenMissingCount = Math.max(
    0,
    (Array.isArray(profileCompletionMissingDetails)
      ? profileCompletionMissingDetails.length
      : 0) - visibleMissingDetails.length
  );

  const isComplete = completion >= 90;

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-5">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full opacity-[0.06] blur-2xl"
        style={{
          background: isComplete
            ? "radial-gradient(ellipse, #10b981, transparent)"
            : "radial-gradient(ellipse, hsl(var(--primary)), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative pt-9">
        <div className="relative">
          <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${completion}%`,
                background: isComplete
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : "linear-gradient(90deg, hsl(var(--primary)), #8b5cf6, #6366f1)",
              }}
            />
          </div>

          <div
            className="absolute -top-8 z-10 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${bubbleLeftPercent}%` }}
          >
            <span
              className="rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm"
              style={{
                background: isComplete
                  ? "linear-gradient(135deg, #10b981, #34d399)"
                  : "linear-gradient(135deg, hsl(var(--primary)), #8b5cf6)",
                color: "white",
                boxShadow: isComplete
                  ? "0 2px 8px rgba(16,185,129,0.3)"
                  : "0 2px 8px hsl(var(--primary) / 0.3)",
              }}
            >
              {completion}%
            </span>
            <span
              className="-mt-1.5 h-2.5 w-2.5 rotate-45"
              style={{
                background: isComplete ? "#34d399" : "#8b5cf6",
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <p
        className="mt-5 text-lg font-semibold leading-snug text-foreground"
        style={{ textWrap: "balance" }}
      >
        {progressMessage}
      </p>

      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
        {completedCompletionSections}/{profileCompletionCriteriaLength} profile
        sections completed
        {Number(partialCompletionSections) > 0
          ? ` | ${partialCompletionSections} in progress`
          : ""}
      </p>

      {visibleMissingDetails.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-background/50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Missing details
          </p>
          <ul className="mt-2 space-y-2">
            {visibleMissingDetails.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
          {hiddenMissingCount > 0 ? (
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
              +{hiddenMissingCount} more detail{hiddenMissingCount === 1 ? "" : "s"} to complete
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};

export default ProfileSummaryCards;

