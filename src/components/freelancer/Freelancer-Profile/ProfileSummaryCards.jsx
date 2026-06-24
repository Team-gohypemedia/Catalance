import { useState } from "react";
import { Card } from "@/components/ui/card";
const ProfileSummaryCards = ({
  profileCompletionPercent,
  completedCompletionSections,
  partialCompletionSections,
  profileCompletionCriteriaLength,
  profileCompletionMessage,
  profileCompletionMissingDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const completion = Math.min(
    100,
    Math.max(0, Number(profileCompletionPercent) || 0)
  );
  const bubbleLeftPercent = Math.min(96, Math.max(4, completion));
  const progressMessage =
    profileCompletionMessage ||
    "You're nearly there, add a few more details to complete your profile.";
  const visibleMissingDetails = Array.isArray(profileCompletionMissingDetails)
    ? (isExpanded ? profileCompletionMissingDetails : profileCompletionMissingDetails.slice(0, 4))
    : [];
  const hiddenMissingCount = Math.max(
    0,
    (Array.isArray(profileCompletionMissingDetails)
      ? profileCompletionMissingDetails.length
    : 0) - (isExpanded ? profileCompletionMissingDetails.length : 4)
  );

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-5">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full opacity-[0.06] blur-2xl"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--primary)), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative pt-9">
        <div className="relative">
          <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div
            className="absolute -top-8 z-10 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${bubbleLeftPercent}%` }}
          >
            <span
              className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm"
              style={{
                boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)",
              }}
            >
              {completion}%
            </span>
            <span
              className="-mt-1.5 h-2.5 w-2.5 rotate-45"
              style={{ background: "hsl(var(--primary))" }}
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
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">
            Missing details
          </p>
          <ul className="mt-2 space-y-3">
            {visibleMissingDetails.map((item, index) => {
              const content = (
                <>
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/10 ring-4 ring-primary/20/10"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground">
                      {item.detail}
                    </p>
                  </div>
                </>
              );

              return (
                <li key={`${item.label}-${index}`}>
                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="group flex w-full gap-3 rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex gap-3 px-2 py-1.5 -mx-2">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {hiddenMissingCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="mt-2 text-[11px] font-medium text-primary/80 hover:text-primary transition-colors cursor-pointer text-left"
            >
              +{hiddenMissingCount} more detail{hiddenMissingCount === 1 ? "" : "s"} to complete
            </button>
          ) : isExpanded && Array.isArray(profileCompletionMissingDetails) && profileCompletionMissingDetails.length > 4 ? (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="mt-2 text-[11px] font-medium text-primary/80 hover:text-primary transition-colors cursor-pointer text-left"
            >
              Show fewer details
            </button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};

export default ProfileSummaryCards;

