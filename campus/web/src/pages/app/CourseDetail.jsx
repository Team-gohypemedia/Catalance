import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock, Compass, Globe, Hammer, LifeBuoy, Lock, PlayCircle, ShieldCheck, Star } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDate, formatDuration, formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/overlays";
import { EmptyState, ErrorState } from "@/components/ui/campus";
import { LANGUAGE_SHORT, LESSON_TYPES } from "@/components/learning/meta";
import { COURSE_STATUS, LEVEL_CONTENT, LEVEL_LABELS, enrolmentChip, feeParts, timeCommitment } from "@/components/learning/catalog-meta";
import { EnrolButton } from "@/components/payments/EnrolButton";
import { CourseAssessmentPanel } from "@/components/assessment/CourseAssessmentPanel";
import { NoGuarantee } from "@/components/marketing/NoGuarantee";
import { usePlatformConfig } from "@/lib/platform";
import { CalmCover } from "@/components/learning/Cover";
import { ThinProgress } from "@/components/learning/CourseCard";

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

function SectionTitle({ children, aside }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-xl font-medium tracking-tight sm:text-2xl">{children}</h2>
      {aside}
    </div>
  );
}

function SyllabusModule({ module, index, courseId, enrolled, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const mins = module.lessons.reduce((s, l) => s + l.durationMinutes, 0);
  const done = module.lessons.filter((l) => l.completed).length;
  const allDone = enrolled && done === module.lessons.length;
  return (
    <div className="border-b border-line last:border-b-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/50 sm:px-6 sm:py-5">
        <span className="w-6 shrink-0 text-sm text-subtle tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{module.title}</span>
          <span className="mt-0.5 block text-xs text-muted">
            {module.lessons.length} lessons · {formatDuration(mins)}
            {enrolled && ` · ${done} of ${module.lessons.length} done`}
          </span>
        </span>
        {allDone && <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Module complete" />}
        <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden pb-2">
            {module.lessons.map((l) => {
              const meta = LESSON_TYPES[l.type];
              const canOpen = enrolled || l.isPreview;
              const row = (
                <>
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", l.completed ? "bg-success-soft text-success" : "text-subtle")}>
                    {l.completed ? <Check className="size-3.5" strokeWidth={2.4} /> : <meta.icon className="size-4" strokeWidth={1.6} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{l.title}</span>
                  {l.isPreview && !enrolled && <span className="hidden text-xs text-primary sm:inline">Preview</span>}
                  <span className="shrink-0 text-xs text-subtle tabular-nums">{formatDuration(l.durationMinutes)}</span>
                  {!canOpen && <Lock className="size-3.5 shrink-0 text-subtle" aria-label="Locked" />}
                </>
              );
              return (
                <li key={l.id}>
                  {canOpen ? (
                    <Link to={`/app/courses/${courseId}/learn/${l.id}`} className="flex items-center gap-3 py-2.5 pr-5 pl-12 transition-colors hover:bg-surface-2/60 sm:pr-6 sm:pl-14">{row}</Link>
                  ) : (
                    <div className="flex items-center gap-3 py-2.5 pr-5 pl-12 text-muted sm:pr-6 sm:pl-14">{row}</div>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeeBlock({ course }) {
  const { fee, tax } = feeParts(course);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="text-4xl font-medium tracking-tight tabular-nums">{fee}</p>
        {tax && <span className="text-sm text-muted">{tax}</span>}
      </div>
      {!course.isFree && course.priceWithGstINR ? (
        <p className="mt-1 text-xs text-muted">{formatINR(course.priceWithGstINR)} total, paid in full before you start.</p>
      ) : null}
    </div>
  );
}

function closedReason(course) {
  if (course.status === "FULL" || course.seatsLeft === 0) return "This course is full right now.";
  if (course.status === "PAUSED") return "Enrolment is paused for now.";
  if (course.enrolmentOpensAt && new Date(course.enrolmentOpensAt) > new Date()) return `Enrolment opens ${formatDate(course.enrolmentOpensAt)}.`;
  return "Enrolment is closed.";
}

function ClosedNote({ course }) {
  return (
    <div className="mt-6 rounded-xl border border-line bg-surface-2/60 p-4">
      <p className="text-sm text-muted">{closedReason(course)} Ask us to tell you when it opens.</p>
      <Button to="/contact" variant="brandOutline" size="sm" className="mt-3">
        Contact support
      </Button>
    </div>
  );
}

function EnrollCard({ course, resumeTo, onEnrolled, maxAttempts }) {
  const e = course.enrollment;
  const chip = enrolmentChip(course);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="p-6">
        {e ? (
          <>
            <p className="text-sm text-muted">{e.completedAt ? "Completed" : "Your progress"}</p>
            <p className="mt-1 text-4xl font-medium tracking-tight tabular-nums">{e.progressPercent}%</p>
            <ThinProgress value={e.progressPercent} done={Boolean(e.completedAt)} className="mt-4 h-1.5" />
            <p className="mt-2 text-xs text-muted">
              {e.completedLessonIds.length} of {course.lessonsCount} lessons done
            </p>
            <Button to={resumeTo} size="lg" className="mt-6 w-full" rightIcon={ArrowRight}>
              {e.completedAt ? "Revisit course" : e.progressPercent ? "Continue" : "Start"}
            </Button>
            {e.completedAt && (
              <Button to="/app/certificates" variant="brandOutline" size="lg" className="mt-2 w-full" leftIcon={BadgeCheck}>
                Course certificate
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-2">
              {chip && <Badge tone={chip.tone}>{chip.label}</Badge>}
              {course.enrolmentClosesAt && course.enrolmentOpen ? <span className="text-xs text-muted">Closes {formatDate(course.enrolmentClosesAt)}</span> : null}
            </div>
            <FeeBlock course={course} />
            {course.enrolmentOpen ? (
              <div className="mt-6">
                <EnrolButton course={course} enrollment={course.enrollment} onEnrolled={onEnrolled} />
              </div>
            ) : (
              <ClosedNote course={course} />
            )}
          </>
        )}
      </div>
      <ul className="space-y-3 border-t border-line px-6 py-5 text-sm text-muted">
        {course.durationDays ? (
          <li className="flex items-center gap-3">
            <CalendarDays className="size-4 shrink-0 text-subtle" strokeWidth={1.6} /> {course.durationDays} days{timeCommitment(course) ? ` · ${timeCommitment(course)}` : ""}
          </li>
        ) : null}
        <li className="flex items-center gap-3">
          <PlayCircle className="size-4 shrink-0 text-subtle" strokeWidth={1.6} /> {course.lessonsCount} lessons · {formatDuration(course.durationMinutes)}
        </li>
        <li className="flex items-center gap-3">
          <ClipboardCheck className="size-4 shrink-0 text-subtle" strokeWidth={1.6} /> Final assessment{maxAttempts > 1 ? `, ${maxAttempts - 1} reassessment included` : ""}
        </li>
        <li className="flex items-center gap-3">
          <ShieldCheck className="size-4 shrink-0 text-subtle" strokeWidth={1.6} /> Get verified when you pass
        </li>
      </ul>
    </div>
  );
}

function Bullets({ items, icon: Icon = Check }) {
  return (
    <ul className="grid gap-x-8 gap-y-4 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2 sm:p-8">
      {items.map((w) => (
        <li key={w} className="flex gap-3 text-[15px] leading-relaxed">
          <Icon className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} />
          <span>{w}</span>
        </li>
      ))}
    </ul>
  );
}

const cleanModuleTitle = (t = "") => t.replace(/^module\s*\d+\s*[:.\-–]\s*/i, "");

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, refreshUser } = useAuth();
  const config = usePlatformConfig();
  const { data: course, isLoading, error, refetch } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api.get(`/api/courses/${courseId}`),
    retry: (n, e) => e?.status !== 404 && n < 2,
  });

  const lessons = course?.modules?.flatMap((m) => m.lessons) || [];
  const enrollment = course?.enrollment;
  const resumeLesson = enrollment ? lessons.find((l) => !l.completed) || lessons.find((l) => l.id === enrollment.lastLessonId) || lessons[0] : lessons[0];
  const resumeTo = course && resumeLesson ? `/app/courses/${course.id}/learn/${resumeLesson.id}` : undefined;

  const onEnrolled = () => {
    qc.invalidateQueries({ queryKey: ["course", courseId] });
    qc.invalidateQueries({ queryKey: ["enrollments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["courses"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    refreshUser().catch(() => {});
    toast.success("You're enrolled. Start your first lesson.");
    if (lessons[0]) navigate(`/app/courses/${course.id}/learn/${lessons[0].id}`);
  };

  if (isLoading) return <DetailSkeleton />;
  if (error?.status === 404)
    return (
      <EmptyState
        icon={Compass}
        title="Course not available"
        description="It may be unpublished or archived. Explore the open courses instead."
        action={<Button to="/app/catalog">Explore courses</Button>}
      />
    );
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const typeCounts = lessons.reduce((acc, l) => ({ ...acc, [l.type]: (acc[l.type] || 0) + 1 }), {});
  const maxAttempts = config.assessment?.maxAttempts ?? 2;
  const enrollCard = <EnrollCard course={course} resumeTo={resumeTo} onEnrolled={onEnrolled} maxAttempts={maxAttempts} />;
  const category = course.skill?.category;
  const levelInfo = LEVEL_CONTENT[course.level];
  const learn = (course.modules || []).map((m) => cleanModuleTitle(m.title)).filter(Boolean).slice(0, 6);
  const statusMeta = COURSE_STATUS[course.status];
  const isStaffView = user && (user.role === "ADMIN" || user.id === course.mentorId);
  const chip = enrolmentChip(course);
  const { fee, tax } = feeParts(course);

  return (
    <div className="pb-28 lg:pb-0">
      <Link to="/app/catalog" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-4" /> All courses
      </Link>

      {["DRAFT", "ARCHIVED"].includes(course.status) && isStaffView && (
        <div className="mt-4 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-muted" role="status">
          <span className="font-medium text-fg">{statusMeta?.label}.</span> {statusMeta?.hint}
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <div className="min-w-0">
          {/* Hero */}
          <header>
            <div className="flex items-center gap-3">
              <CalmCover slug={course.track?.slug} size="xs" className="size-10 shrink-0 rounded-xl border border-line" />
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm text-muted">
                {category ? (
                  <Link to={`/app/catalog?category=${category.slug}`} className="hover:text-fg">
                    {category.name}
                  </Link>
                ) : (
                  <span>{course.track?.title}</span>
                )}
                {course.skill && (
                  <>
                    <span aria-hidden="true" className="text-subtle">/</span>
                    <Link to={`/app/catalog?skill=${course.skill.slug}`} className="hover:text-fg">
                      {course.skill.name}
                    </Link>
                  </>
                )}
                <span aria-hidden="true" className="text-subtle">/</span>
                <span>{LEVEL_LABELS[course.level] || course.level}</span>
              </div>
            </div>
            <h1 className="mt-6 text-3xl leading-[1.1] font-medium tracking-tight text-balance sm:text-5xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{course.outcome || course.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted">
              {course.mentor && (
                <Link to={`/app/mentors/${course.mentor.id}`} className="flex items-center gap-2 text-fg hover:text-primary">
                  <Avatar name={course.mentor.name} src={course.mentor.avatarUrl} size="sm" />
                  {course.mentor.name}
                </Link>
              )}
              {course.ratingsCount ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                  <span className="text-fg">{Number(course.rating || 0).toFixed(1)}</span> ({formatNumber(course.ratingsCount || 0)})
                </span>
              ) : null}
              {course.durationDays ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" strokeWidth={1.6} /> {course.durationDays} days
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" strokeWidth={1.6} /> {timeCommitment(course) || formatDuration(course.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-4" strokeWidth={1.6} /> {(course.languages || []).map((l) => LANGUAGE_SHORT[l] || l).join(", ")}
              </span>
            </div>
          </header>

          {/* Enrol card on mobile */}
          <div className="mt-8 lg:hidden">{enrollCard}</div>

          <div className="mt-14 space-y-14">
            {learn.length > 0 && (
              <section>
                <SectionTitle>What you will learn</SectionTitle>
                <Bullets items={learn} />
              </section>
            )}

            <section>
              <SectionTitle>What you will make</SectionTitle>
              {course.whatYouBuild?.length > 0 && <Bullets items={course.whatYouBuild.slice(0, 6)} icon={Hammer} />}
              {levelInfo && (
                <div className="mt-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
                  <p className="text-sm text-muted">{LEVEL_LABELS[course.level]} level</p>
                  <p className="mt-1 text-[15px] leading-relaxed">{levelInfo.focus}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">You finish with: {levelInfo.output}</p>
                </div>
              )}
            </section>

            {(course.whoFor || course.requirements?.length > 0) && (
              <section>
                <SectionTitle>Who this is for</SectionTitle>
                {course.whoFor && <p className="max-w-[68ch] text-base leading-relaxed text-fg/90 sm:text-[17px]">{course.whoFor}</p>}
                {course.requirements?.length > 0 && (
                  <>
                    <p className="mt-6 mb-3 text-sm font-medium">Before you start</p>
                    <ul className="space-y-2.5">
                      {course.requirements.map((r) => (
                        <li key={r} className="flex gap-3 text-[15px] text-fg/90">
                          <span className="mt-2.5 size-1 shrink-0 rounded-full bg-subtle" aria-hidden="true" /> {r}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}

            {course.description && (
              <section>
                <SectionTitle>About this course</SectionTitle>
                <p className="max-w-[68ch] text-base leading-relaxed text-fg/90 sm:text-[17px]">{course.description}</p>
              </section>
            )}

            <section>
              <SectionTitle
                aside={
                  <p className="text-sm text-muted">
                    {Object.entries(typeCounts)
                      .map(([t, n]) => `${n} ${(LESSON_TYPES[t]?.label || t).toLowerCase()}${n > 1 ? "s" : ""}`)
                      .join(" · ")}
                  </p>
                }
              >
                Syllabus
              </SectionTitle>
              <p className="-mt-3 mb-5 text-sm text-muted">
                {course.modules.length} modules · {lessons.length} lessons · {formatDuration(course.durationMinutes)}
              </p>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                {course.modules.map((m, i) => (
                  <SyllabusModule key={m.id} module={m} index={i} courseId={course.id} enrolled={Boolean(enrollment)} defaultOpen={i === 0 || m.lessons.some((l) => l.id === resumeLesson?.id)} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Fee and payment</SectionTitle>
              <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <FeeBlock course={course} />
                <ul className="mt-5 space-y-2.5 text-sm text-muted">
                  <li>{course.isFree ? "This course is free." : "Pay the full fee before you start. GST is added at checkout."}</li>
                  <li>The fee includes the final assessment{maxAttempts > 1 ? ` and ${maxAttempts - 1} reassessment` : ""}.</li>
                  <li>
                    Refunds follow the{" "}
                    <Link to="/legal/refund" className="text-fg underline underline-offset-2 hover:text-primary">
                      refund policy
                    </Link>
                    .
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <SectionTitle>Assessment and verification</SectionTitle>
              <CourseAssessmentPanel course={course} enrollment={enrollment} />
              <div className="mt-4 rounded-2xl border border-line bg-surface p-6 sm:p-8">
                <p className="font-medium">Project eligibility</p>
                <p className="mt-1.5 text-sm text-muted">Verified learners can be shortlisted for relevant Catalance projects. You can accept or decline any offer.</p>
                <NoGuarantee className="mt-3" />
              </div>
            </section>

            {course.mentor && (
              <section>
                <SectionTitle>Your instructor</SectionTitle>
                <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
                  <Avatar name={course.mentor.name} src={course.mentor.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-medium tracking-tight">{course.mentor.name}</p>
                    <p className="mt-0.5 text-sm text-muted">{course.mentor.headline}</p>
                  </div>
                  <Button to={`/app/mentors/${course.mentor.id}`} variant="brandOutline" rightIcon={ArrowRight}>
                    View profile
                  </Button>
                </div>
              </section>
            )}

            <section>
              <SectionTitle>Questions</SectionTitle>
              <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary">
                    <LifeBuoy className="size-4.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">Need help before you enrol?</p>
                    <p className="mt-0.5 text-sm break-words text-muted">
                      Read the FAQs or write to{" "}
                      <a href={`mailto:${config.support?.email}`} className="text-fg hover:text-primary">
                        {config.support?.email}
                      </a>
                      .
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button to="/faqs" variant="outline">
                    FAQs
                  </Button>
                  <Button to="/contact" variant="brandOutline">
                    Contact
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">{enrollCard}</div>
        </aside>
      </div>

      {/* Mobile sticky CTA: one primary action */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {enrollment ? (
              <>
                <p className="text-xs text-muted">{enrollment.progressPercent}% complete</p>
                <ThinProgress value={enrollment.progressPercent} done={Boolean(enrollment.completedAt)} className="mt-1.5" />
              </>
            ) : (
              <>
                <p className="text-lg leading-none font-medium tabular-nums">{fee}</p>
                <p className="mt-1 text-[11px] text-muted">{tax || chip?.label}</p>
              </>
            )}
          </div>
          {enrollment ? (
            <Button to={resumeTo} rightIcon={ArrowRight}>
              Continue
            </Button>
          ) : course.enrolmentOpen ? (
            <div className="shrink-0">
              <EnrolButton course={course} enrollment={enrollment} onEnrolled={onEnrolled} />
            </div>
          ) : (
            chip && <Badge tone={chip.tone}>{chip.label}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
