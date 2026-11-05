import { Link } from "react-router-dom";
import { CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/overlays";
import { cn, formatDate } from "@/lib/utils";

export const cohortStatus = (c) => {
  const start = new Date(c.startDate).getTime();
  const days = Math.round((start - Date.now()) / 86400000);
  if (days > 0) return { label: days === 1 ? "Starts tomorrow" : `Starts in ${days} days`, tone: "sky", upcoming: true };
  return { label: `Live · week ${Math.floor(-days / 7) + 1}`, tone: "success", upcoming: false };
};

/** Small status pill: green dot for live, neutral for upcoming. */
export function CohortStatus({ cohort, className }) {
  const s = cohortStatus(cohort);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", s.upcoming ? "text-muted" : "text-success", className)}>
      <span className={cn("size-1.5 rounded-full", s.upcoming ? "bg-subtle" : "bg-success")} />
      {s.label}
    </span>
  );
}

/** Thin seat meter. `dark` is kept for backwards compatibility and ignored. */
export function SeatsMeter({ membersCount, maxMembers }) {
  const pct = Math.min(100, Math.round((membersCount / Math.max(1, maxMembers)) * 100));
  const left = Math.max(0, maxMembers - membersCount);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted tabular-nums">
          <span className="font-medium text-fg">{membersCount}</span> of {maxMembers} seats taken
        </span>
        <span className={cn("tabular-nums", left === 0 ? "font-medium text-danger" : left <= 5 ? "font-medium text-warning" : "text-subtle")}>
          {left === 0 ? "Full" : `${left} left`}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={membersCount}
        aria-valuemin={0}
        aria-valuemax={maxMembers}
        aria-label="Seats taken"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", left === 0 ? "bg-danger" : left <= 5 ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TrackLabel({ track, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted", className)}>
      <span className="size-1.5 rounded-full" style={{ background: track?.color || "var(--primary)" }} />
      {track?.title || "Cohort"}
    </span>
  );
}

export function CohortCard({ cohort, onJoin, joining }) {
  const status = cohortStatus(cohort);
  const full = cohort.membersCount >= cohort.maxMembers;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition-colors duration-200 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <TrackLabel track={cohort.track} />
        <CohortStatus cohort={cohort} />
      </div>
      <h3 className="mt-4 text-lg leading-snug font-medium tracking-tight">
        <Link to={`/app/cohorts/${cohort.id}`} className="hover:text-primary">
          {cohort.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{cohort.description}</p>
      <div className="mt-5 space-y-2 text-sm text-muted">
        {cohort.leadMentor && (
          <p className="flex items-center gap-2">
            <Avatar name={cohort.leadMentor.name} src={cohort.leadMentor.avatarUrl} size="xs" />
            <span>
              Led by <span className="text-fg">{cohort.leadMentor.name}</span>
            </span>
          </p>
        )}
        <p className="flex items-center gap-2">
          <Clock className="size-4 text-subtle" /> {cohort.schedule}
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 text-subtle" /> {status.upcoming ? "Starts" : "Started"} {formatDate(cohort.startDate, { day: "numeric", month: "short" })}
        </p>
      </div>
      <div className="mt-auto pt-6">
        <SeatsMeter membersCount={cohort.membersCount} maxMembers={cohort.maxMembers} />
        <div className="mt-5 flex gap-2">
          {cohort.isMember ? (
            <Button to={`/app/cohorts/${cohort.id}`} variant="outline" className="flex-1">
              Open cohort
            </Button>
          ) : (
            <>
              <Button className="flex-1" disabled={full} loading={joining} onClick={() => onJoin?.(cohort)}>
                {full ? "Cohort full" : "Join cohort"}
              </Button>
              <Button to={`/app/cohorts/${cohort.id}`} variant="brandOutline">
                Details
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
