import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Award, BookOpen, ClipboardList, Link2, Trophy } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlays";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/campus";
import { CalmCover } from "@/components/learning/Cover";
import { ThinProgress } from "@/components/learning/CourseCard";

function ProgressRow({ enrollment, index }) {
  const c = enrollment.course;
  const done = Boolean(enrollment.completedAt);
  const to = enrollment.lastLessonId && !done ? `/app/courses/${c.id}/learn/${enrollment.lastLessonId}` : `/app/courses/${c.id}`;
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.4 }}>
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <CalmCover slug={c.track?.slug} size="sm" className="size-16 shrink-0 rounded-xl border border-line" />
          <div className="min-w-0">
            <p className="truncate text-xs text-muted">{c.track?.title}</p>
            <Link to={`/app/courses/${c.id}`} className="mt-0.5 line-clamp-1 text-[17px] font-medium tracking-tight hover:text-primary">{c.title}</Link>
            <p className="mt-0.5 truncate text-sm text-muted">{c.mentor?.name} · started {formatDate(enrollment.startedAt, { day: "numeric", month: "short" })}</p>
          </div>
        </div>
        <div className="w-full sm:w-52">
          <div className="mb-2 flex justify-between text-xs text-muted">
            <span>{enrollment.completedLessonIds.length} of {c.lessonsCount} lessons</span>
            <span className={cn("tabular-nums", done ? "text-success" : "text-fg")}>{done ? "Completed" : `${enrollment.progressPercent}%`}</span>
          </div>
          <ThinProgress value={enrollment.progressPercent} done={done} />
        </div>
        <div className="flex shrink-0 gap-2">
          {done && <Button to="/app/certificates" size="sm" variant="ghost" leftIcon={Award}>Certificate</Button>}
          <Button to={to} size="sm" variant={done ? "outline" : "primary"} rightIcon={ArrowRight}>{done ? "Revisit" : "Continue"}</Button>
        </div>
      </div>
    </motion.li>
  );
}

function SubmissionRow({ s, courseTitle }) {
  const reviewed = s.status === "REVIEWED";
  return (
    <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/app/courses/${s.courseId}/learn/${s.lessonId}`} className="font-medium hover:text-primary">{s.lessonTitle}</Link>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs", reviewed ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
            <span className="size-1.5 rounded-full bg-current" />
            {reviewed ? "Reviewed" : "Awaiting review"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">{courseTitle} · submitted {timeAgo(s.createdAt)}</p>
        {s.link && (
          <a href={s.link} target="_blank" rel="noreferrer" className="mt-2 flex max-w-full items-center gap-1.5 truncate text-sm text-primary hover:underline">
            <Link2 className="size-3.5 shrink-0" /> <span className="truncate">{s.link}</span>
          </a>
        )}
        {s.feedback && <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm leading-relaxed text-fg/85">{s.feedback}</p>}
      </div>
      {reviewed && s.score != null && (
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-2xl leading-none font-medium tracking-tight tabular-nums">{s.score}<span className="text-sm text-muted">/{s.maxScore}</span></p>
          <p className="mt-1.5 text-xs text-muted">{formatDate(s.reviewedAt, { day: "numeric", month: "short" })}</p>
        </div>
      )}
    </li>
  );
}

export default function MyLearning() {
  const enrollments = useQuery({ queryKey: ["enrollments"], queryFn: () => api.get("/api/me/enrollments") });
  const submissions = useQuery({ queryKey: ["submissions"], queryFn: () => api.get("/api/me/submissions") });

  const list = enrollments.data || [];
  const inProgress = list.filter((e) => !e.completedAt);
  const completed = list.filter((e) => e.completedAt);
  const subs = submissions.data || [];
  const titles = Object.fromEntries(list.map((e) => [e.courseId, e.course.title]));
  const pending = subs.filter((s) => s.status === "SUBMITTED").length;
  const reviewed = subs.filter((s) => s.status === "REVIEWED" && s.score != null);
  const avg = reviewed.length ? Math.round(reviewed.reduce((a, s) => a + (s.score / (s.maxScore || 100)) * 100, 0) / reviewed.length) : null;

  const stats = [
    { label: "In progress", value: enrollments.isLoading ? "–" : inProgress.length },
    { label: "Completed", value: enrollments.isLoading ? "–" : completed.length },
    { label: "Awaiting review", value: submissions.isLoading ? "–" : pending },
    { label: "Avg. mentor score", value: avg == null ? "–" : `${avg}%` },
  ];

  const rows = (items, emptyProps) =>
    enrollments.isLoading ? (
      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    ) : enrollments.error ? (
      <ErrorState error={enrollments.error} onRetry={enrollments.refetch} />
    ) : items.length === 0 ? (
      <EmptyState {...emptyProps} />
    ) : (
      <ul className="space-y-3">{items.map((e, i) => <ProgressRow key={e.id} enrollment={e} index={i} />)}</ul>
    );

  return (
    <div>
      <PageHeader eyebrow="Learn" title="My learning" description="Your courses, progress and mentor feedback in one place." actions={<Button to="/app/catalog" variant="brandOutline">Explore courses</Button>} />

      <dl className="mb-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("px-5 py-5 sm:px-6", i % 2 === 1 && "border-l border-line", i >= 2 && "border-t border-line lg:border-t-0", i === 2 && "lg:border-l")}>
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="mt-1 text-2xl font-medium tracking-tight tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">In progress{inProgress.length ? ` · ${inProgress.length}` : ""}</TabsTrigger>
          <TabsTrigger value="completed">Completed{completed.length ? ` · ${completed.length}` : ""}</TabsTrigger>
          <TabsTrigger value="submissions">Submissions{subs.length ? ` · ${subs.length}` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="progress">
          {rows(inProgress, { icon: BookOpen, title: "Nothing in progress", description: "Start a free course. The first lesson takes 10 minutes.", action: <Button to="/app/catalog">Explore courses</Button> })}
        </TabsContent>
        <TabsContent value="completed">
          {rows(completed, { icon: Trophy, title: "No completed courses yet", description: "Finish a course to earn a verified certificate and +250 points." })}
        </TabsContent>
        <TabsContent value="submissions">
          {submissions.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          ) : submissions.error ? (
            <ErrorState error={submissions.error} onRetry={submissions.refetch} />
          ) : subs.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No submissions yet" description="Assignments reviewed by mentors become verified proof on your Skill Passport." />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{subs.map((s) => <SubmissionRow key={s.id} s={s} courseTitle={titles[s.courseId] || "Course"} />)}</ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
