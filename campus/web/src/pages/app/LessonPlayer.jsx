import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Lock, PanelLeft, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { ErrorState } from "@/components/ui/campus";
import { LESSON_TYPES } from "@/components/learning/meta";
import { Celebration } from "@/components/learning/Celebration";
import { ThinProgress } from "@/components/learning/CourseCard";
import { ArticleLesson, AssignmentLesson, QuizLesson, VideoLesson } from "@/components/learning/LessonViews";
import { TutorComposer, TutorMark, TutorMessages, useTutorChat } from "@/components/learning/tutor";
import { EnrolButton } from "@/components/payments/EnrolButton";
import { usePlatformConfig } from "@/lib/platform";

const EASE = [0.22, 1, 0.36, 1];

/* ───────────── Syllabus sidebar ───────────── */
function Syllabus({ course, currentId, onNavigate }) {
  const enrolled = Boolean(course.enrollment);
  const activeRef = useRef(null);
  const navRef = useRef(null);
  useEffect(() => {
    const el = activeRef.current;
    const nav = navRef.current;
    if (el && nav) nav.scrollTop = el.offsetTop - nav.clientHeight / 2 + el.clientHeight / 2;
  }, [currentId]);
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link to={`/app/courses/${course.id}`} className="line-clamp-2 text-[15px] leading-snug font-medium tracking-tight hover:text-primary">{course.title}</Link>
        {course.enrollment && (
          <div className="mt-4">
            <ThinProgress value={course.enrollment.progressPercent} done={Boolean(course.enrollment.completedAt)} />
            <p className="mt-2 text-xs text-muted">
              {course.enrollment.completedLessonIds.length} of {course.lessonsCount} lessons · {course.enrollment.progressPercent}%
            </p>
          </div>
        )}
      </div>
      <nav ref={navRef} className="scrollbar-none relative flex-1 overflow-y-auto px-3 pb-6" aria-label="Course syllabus">
        {course.modules.map((m, mi) => (
          <div key={m.id} className="mt-4 first:mt-1">
            <p className="px-2 pb-1.5 text-xs text-subtle">
              Module {mi + 1} · <span className="text-muted">{m.title}</span>
            </p>
            <ul className="space-y-0.5">
              {m.lessons.map((l) => {
                const meta = LESSON_TYPES[l.type];
                const active = l.id === currentId;
                const locked = !enrolled && !l.isPreview;
                return (
                  <li key={l.id} ref={active ? activeRef : undefined}>
                    <Link
                      to={locked ? "#" : `/app/courses/${course.id}/learn/${l.id}`}
                      onClick={(e) => {
                        if (locked) e.preventDefault();
                        else onNavigate?.();
                      }}
                      aria-current={active ? "page" : undefined}
                      aria-disabled={locked}
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg",
                        locked && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border",
                          l.completed ? "border-success bg-success text-white" : active ? "border-primary text-primary" : "border-line-strong text-subtle",
                        )}
                      >
                        {l.completed ? <Check className="size-2.5" strokeWidth={3} /> : locked ? <Lock className="size-2.5" /> : active ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("line-clamp-2 leading-snug", active && "font-medium")}>{l.title}</span>
                        <span className="mt-0.5 block text-xs text-subtle">{meta.label} · {formatDuration(l.durationMinutes)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

/* ───────────── Tutor side panel ───────────── */
const QUICK_ASKS = ["Summarise this lesson", "Explain it like I'm new to this", "Give me a practice task", "Where is this used in real gigs?"];

function TutorPanel({ lesson, course, onClose }) {
  const { user } = useAuth();
  const language = user?.language || "en";
  const context = useMemo(() => ({ courseId: course.id, lessonId: lesson.id }), [course.id, lesson.id]);
  const { messages, pending, error, send, clear } = useTutorChat({ language, context });
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);
  useEffect(() => {
    clear();
  }, [lesson.id, clear]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <TutorMark />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">AI tutor</p>
          <p className="truncate text-xs text-muted">{lesson.title}</p>
        </div>
        <button type="button" onClick={onClose} className="cursor-pointer rounded-full p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close tutor">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div>
            <p className="text-sm leading-relaxed text-muted">Ask anything about this lesson. I know what it covers, and Hinglish chalega.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK_ASKS.map((q) => (
                <button key={q} type="button" onClick={() => send(q)} className="cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-left text-sm text-muted transition-colors hover:border-line-strong hover:text-fg">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <TutorMessages messages={messages} pending={pending} userName={user?.name} language={language} compact />
        )}
        {error && <p className="mt-3 text-sm text-danger">{error.message}</p>}
        <div ref={endRef} />
      </div>
      <div className="p-3">
        <TutorComposer onSend={send} pending={pending} language={language} placeholder="Ask about this lesson" compact />
      </div>
    </div>
  );
}

/* ───────────── Page ───────────── */
export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);
  // AI tutor and points are off by default (spec §2): hide the tutor and show completion without points
  const { flags } = usePlatformConfig();
  const showTutor = flags.aiTutor;
  const showPoints = flags.gamification;

  const courseQuery = useQuery({ queryKey: ["course", courseId], queryFn: () => api.get(`/api/courses/${courseId}`) });
  const lessonQuery = useQuery({ queryKey: ["lesson", lessonId], queryFn: () => api.get(`/api/lessons/${lessonId}`), retry: (n, e) => e?.status !== 403 && e?.status !== 404 && n < 2 });
  const subsQuery = useQuery({ queryKey: ["submissions"], queryFn: () => api.get("/api/me/submissions"), enabled: lessonQuery.data?.type === "ASSIGNMENT" });

  const course = courseQuery.data;
  const lesson = lessonQuery.data;
  const flat = course?.modules?.flatMap((m) => m.lessons) || [];
  const summary = flat.find((l) => l.id === lessonId);
  const completed = Boolean(summary?.completed);
  const module = course?.modules?.find((m) => m.lessons.some((l) => l.id === lessonId));
  const moduleIndex = course?.modules?.findIndex((m) => m.id === module?.id) ?? -1;
  const index = flat.findIndex((l) => l.id === lessonId);

  useEffect(() => {
    setQuizPassed(false);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  }, [lessonId]);

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), celebration.big ? 3600 : 2400);
    return () => clearTimeout(t);
  }, [celebration]);

  const complete = useMutation({
    mutationFn: () => api.post(`/api/lessons/${lessonId}/complete`),
    onSuccess: (res) => {
      qc.setQueryData(["course", courseId], (c) =>
        c
          ? {
              ...c,
              enrollment: res.enrollment,
              modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (res.enrollment.completedLessonIds.includes(l.id) ? { ...l, completed: true } : l)) })),
            }
          : c,
      );
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      if (res.pointsAwarded) refreshUser().catch(() => {});
      if (res.certificate) {
        qc.invalidateQueries({ queryKey: ["certificates"] });
        qc.invalidateQueries({ queryKey: ["notifications"] });
        setCelebration({ big: true, points: showPoints ? res.pointsAwarded : undefined, title: "Course complete", subtitle: "Next: take the final assessment to get your skill verified." });
        toast.success("Course complete. Your certificate is ready.", { action: { label: "View", onClick: () => navigate("/app/certificates") } });
        return;
      }
      if (res.pointsAwarded && showPoints) setCelebration({ points: res.pointsAwarded, title: "Lesson complete", subtitle: lesson?.nextLessonId ? "On to the next one" : undefined });
      if (lesson?.nextLessonId) navigate(`/app/courses/${courseId}/learn/${lesson.nextLessonId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  // free and paid enrolment both go through EnrolButton (checkout + consent for paid courses, spec §10)
  const onEnrolled = () => {
    qc.invalidateQueries({ queryKey: ["course", courseId] });
    qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
    qc.invalidateQueries({ queryKey: ["enrollments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const enrolled = Boolean(course?.enrollment);
  const hasSubmission = (subsQuery.data || []).some((s) => s.lessonId === lessonId);
  const blockedReason =
    !enrolled ? "Enroll to track progress" : lesson?.type === "QUIZ" && !completed && !quizPassed ? "Pass the quiz to continue" : lesson?.type === "ASSIGNMENT" && !completed && !hasSubmission ? "Submit your work to continue" : null;

  const goNext = () => {
    if (completed) {
      if (lesson?.nextLessonId) navigate(`/app/courses/${courseId}/learn/${lesson.nextLessonId}`);
      else navigate(`/app/courses/${courseId}`);
      return;
    }
    complete.mutate();
  };

  /* states */
  if (courseQuery.error) return <div className="p-4 sm:p-8"><ErrorState error={courseQuery.error} onRetry={courseQuery.refetch} /></div>;
  if (courseQuery.isLoading) {
    return (
      <div className="flex">
        <div className="hidden w-80 shrink-0 space-y-3 border-r border-line p-5 lg:block">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
        </div>
        <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-12 sm:px-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const meta = lesson ? LESSON_TYPES[lesson.type] : summary ? LESSON_TYPES[summary.type] : null;
  const locked = lessonQuery.error?.status === 403;
  const pct = course.enrollment?.progressPercent ?? 0;

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)]">
      <Celebration show={Boolean(celebration)} points={celebration?.points} title={celebration?.title} subtitle={celebration?.subtitle} />

      {/* Desktop sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-hidden border-r border-line bg-surface lg:block"
          >
            <div className="h-full w-80">
              <Syllabus course={course} currentId={lessonId} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-sm border-r border-line bg-surface lg:hidden" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.3, ease: EASE }}>
              <button type="button" onClick={() => setDrawerOpen(false)} className="absolute top-4 right-3 z-10 cursor-pointer rounded-full p-2 text-muted hover:bg-surface-2" aria-label="Close syllabus">
                <X className="size-4" />
              </button>
              <div className="h-full pr-8">
                <Syllabus course={course} currentId={lessonId} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* minimal top bar */}
        <div className="sticky top-16 z-20 border-b border-line bg-bg/85 backdrop-blur-xl">
          <div className="flex h-12 items-center gap-1 px-2 sm:px-4">
            <button type="button" onClick={() => setDrawerOpen(true)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg lg:hidden" aria-label="Open syllabus">
              <PanelLeft className="size-4.5" strokeWidth={1.6} />
            </button>
            <button type="button" onClick={() => setSidebarOpen((o) => !o)} className="hidden cursor-pointer rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg lg:block" aria-label={sidebarOpen ? "Hide syllabus" : "Show syllabus"}>
              <PanelLeft className="size-4.5" strokeWidth={1.6} />
            </button>
            <Link to={`/app/courses/${course.id}`} className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-fg sm:flex">
              <ArrowLeft className="size-4" /> Course
            </Link>
            <p className="min-w-0 flex-1 truncate px-2 text-center text-sm text-muted">
              <span className="tabular-nums">{index + 1} / {flat.length}</span>
              <span className="hidden md:inline"> · {course.title}</span>
            </p>
            {course.enrollment && <span className="hidden pr-2 text-xs text-subtle tabular-nums sm:inline">{pct}%</span>}
            {showTutor && (
              <Button size="sm" variant={tutorOpen ? "secondary" : "ghost"} leftIcon={Sparkles} onClick={() => setTutorOpen((o) => !o)} disabled={!lesson} className="font-medium">
                <span className="hidden sm:inline">Ask AI tutor</span>
                <span className="sm:hidden">Tutor</span>
              </Button>
            )}
          </div>
          {course.enrollment && (
            <div className="h-0.5 w-full bg-transparent">
              <div className={cn("h-full transition-[width] duration-700", course.enrollment.completedAt ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
          {locked ? (
            <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center sm:px-12 sm:py-16">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted"><Lock className="size-5" strokeWidth={1.6} /></span>
              <h1 className="mt-6 text-2xl font-medium tracking-tight sm:text-3xl">{summary?.title || "This lesson is locked"}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">Enrol to unlock every lesson, quiz and assignment.</p>
              <div className="mt-8 flex justify-center">
                <EnrolButton course={course} enrollment={course.enrollment} onEnrolled={onEnrolled} />
              </div>
            </div>
          ) : lessonQuery.error ? (
            <ErrorState error={lessonQuery.error} onRetry={lessonQuery.refetch} />
          ) : lessonQuery.isLoading || !lesson ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="mt-6 aspect-video w-full rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <motion.div key={lesson.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
              <header className="mb-10">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                  {moduleIndex >= 0 && <span>Module {moduleIndex + 1}</span>}
                  <span aria-hidden="true" className="text-subtle">·</span>
                  <span className="inline-flex items-center gap-1.5"><meta.icon className="size-3.5" strokeWidth={1.8} /> {meta.label}</span>
                  <span aria-hidden="true" className="text-subtle">·</span>
                  <span>{formatDuration(lesson.durationMinutes)}</span>
                  {completed && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs text-success"><Check className="size-3" strokeWidth={2.5} /> Done</span>}
                  {lesson.isPreview && !enrolled && <span className="ml-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">Free preview</span>}
                </p>
                <h1 className="mt-4 text-3xl leading-[1.15] font-medium tracking-tight text-balance sm:text-[2.5rem]">{lesson.title}</h1>
              </header>

              {lesson.type === "VIDEO" && <VideoLesson lesson={lesson} course={course} />}
              {lesson.type === "ARTICLE" && <ArticleLesson lesson={lesson} />}
              {lesson.type === "QUIZ" && <QuizLesson lesson={lesson} onPassed={() => setQuizPassed(true)} />}
              {lesson.type === "ASSIGNMENT" && <AssignmentLesson lesson={lesson} />}

              {/* quiet tutor nudge */}
              {showTutor && !tutorOpen && (
                <button
                  type="button"
                  onClick={() => setTutorOpen(true)}
                  className="group mt-14 flex w-full cursor-pointer items-center gap-3 rounded-xl px-1 py-2 text-left text-sm text-muted transition-colors hover:text-fg"
                >
                  <TutorMark />
                  <span className="flex-1">Stuck somewhere? Ask the AI tutor about this lesson, in your language.</span>
                  <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" />
                </button>
              )}

              {/* Footer nav */}
              <div className={cn("flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between", tutorOpen ? "mt-14" : "mt-6")}>
                <Button variant="ghost" leftIcon={ChevronLeft} disabled={!lesson.prevLessonId} onClick={() => navigate(`/app/courses/${courseId}/learn/${lesson.prevLessonId}`)}>
                  Previous
                </Button>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  {enrolled ? (
                    <Button size="lg" onClick={goNext} loading={complete.isPending} disabled={Boolean(blockedReason)} rightIcon={completed ? ChevronRight : Check}>
                      {completed ? (lesson.nextLessonId ? "Next lesson" : "Back to course") : lesson.nextLessonId ? "Complete and continue" : "Complete course"}
                    </Button>
                  ) : (
                    <EnrolButton course={course} enrollment={course.enrollment} onEnrolled={onEnrolled} />
                  )}
                  {enrolled && blockedReason && <p className="text-center text-xs text-subtle sm:text-right">{blockedReason}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tutor panel: side column on xl, overlay drawer below */}
      <AnimatePresence>
        {showTutor && tutorOpen && lesson && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/30 xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTutorOpen(false)} />
            <motion.aside
              initial={{ x: "100%", opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.6 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-line shadow-lg xl:sticky xl:top-16 xl:z-10 xl:h-[calc(100dvh-4rem)] xl:w-96 xl:shrink-0 xl:shadow-none"
            >
              <TutorPanel lesson={lesson} course={course} onClose={() => setTutorOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
