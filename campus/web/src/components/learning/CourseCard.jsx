import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Star } from "lucide-react";
import { cn, formatDuration, formatINR } from "@/lib/utils";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { CalmCover } from "./Cover";
import { LEVEL_LABELS, durationLabel, enrolmentChip, feeParts } from "./catalog-meta";

function Dot() {
  return <span aria-hidden="true" className="size-0.5 rounded-full bg-subtle" />;
}

/** Thin progress line used on cards and rows. */
export function ThinProgress({ value = 0, done = false, className }) {
  return (
    <div className={cn("h-1 overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", done ? "bg-success" : "bg-primary")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/**
 * Catalogue course card (spec §7.3): name + category, level, duration, fee + tax note, one-line outcome,
 * prerequisites, enrolment status and "View course". Pass `course` (contract Course). `to` overrides the link
 * (public pages link to the same course page; it asks guests to sign in).
 */
export function CourseCard({ course, className, index = 0, to }) {
  const enrolled = course.enrollment;
  const chip = enrolmentChip(course);
  const { fee, tax } = feeParts(course);
  const category = course.skill?.category?.name || course.track?.title;
  const prereq = course.requirements?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.03 }}
      className={cn("h-full", className)}
    >
      <Link
        to={to || `/app/courses/${course.id}`}
        aria-label={`View course: ${course.title}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-200 hover:border-line-strong"
      >
        <CalmCover slug={course.track?.slug} className="aspect-[2/1] border-b border-line">
          {enrolled ? (
            <span className={cn("absolute top-3 left-3 rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium", enrolled.completedAt ? "text-success" : "text-fg")}>
              {enrolled.completedAt ? "Completed" : "Enrolled"}
            </span>
          ) : chip ? (
            <Badge tone={chip.tone} className="absolute top-3 left-3">{chip.label}</Badge>
          ) : null}
        </CalmCover>
        <div className="flex flex-1 flex-col p-5">
          <p className="truncate text-xs text-muted">
            {category}
            {course.skill && course.skill.name !== category ? <> · {course.skill.name}</> : null}
          </p>
          <h3 className="mt-1.5 line-clamp-2 min-h-11 text-[17px] leading-snug font-medium tracking-tight text-fg transition-colors group-hover:text-primary">
            {course.title}
          </h3>
          {course.outcome ? <p className="mt-2 line-clamp-2 text-sm text-muted">{course.outcome}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="text-fg">{LEVEL_LABELS[course.level] || course.level}</span>
            {course.durationDays ? (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden="true" /> {durationLabel(course.durationDays)}</span>
              </>
            ) : null}
            {course.ratingsCount ? (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                  {Number(course.rating || 0).toFixed(1)}
                </span>
              </>
            ) : null}
          </div>
          {prereq ? (
            <p className="mt-2 line-clamp-1 text-xs text-subtle">
              <span className="text-muted">Needs:</span> {prereq}
            </p>
          ) : null}
          <div className="mt-auto pt-5">
            <div className="border-t border-line pt-4">
              {enrolled ? (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-fg">{enrolled.completedAt ? "Completed" : "In progress"}</span>
                    <span className="text-muted tabular-nums">{enrolled.progressPercent}%</span>
                  </div>
                  <ThinProgress value={enrolled.progressPercent} done={Boolean(enrolled.completedAt)} />
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-base font-medium tracking-tight text-fg tabular-nums">{fee}</span>
                    {tax && <span className="block text-[11px] text-subtle">{tax}</span>}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                    View course <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Skeleton className="aspect-[2/1] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-6 h-6 w-full" />
      </div>
    </div>
  );
}

/** Compact horizontal course row (dashboard / recommendations). */
export function CourseRow({ course }) {
  return (
    <Link to={`/app/courses/${course.id}`} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2">
      <CalmCover slug={course.track?.slug} size="sm" className="size-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium group-hover:text-primary">{course.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{course.mentor?.name} · {formatDuration(course.durationMinutes)}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Star className="size-3 fill-warning text-warning" aria-hidden="true" />{Number(course.rating || 0).toFixed(1)}</span>
          <span className="font-medium text-fg">{course.isFree ? "Free" : formatINR(course.priceINR)}</span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-primary" aria-hidden="true" />
    </Link>
  );
}
