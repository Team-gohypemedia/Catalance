/** Lesson renderers by type: VideoLesson, ArticleLesson, QuizLesson, AssignmentLesson. */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Check, CheckCircle2, Clock, Hourglass, Link2, ListChecks, Pause, Play, RotateCcw, Send, X, Zap } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { ProgressRing } from "./ProgressRing";
import { Markdown, splitVideoContent } from "./Markdown";

const EASE = [0.22, 1, 0.36, 1];

function SectionLabel({ children, className }) {
  return <p className={cn("mb-3 text-xs font-medium tracking-wide text-subtle uppercase", className)}>{children}</p>;
}

/* ───────────── VIDEO ───────────── */
export function VideoLesson({ lesson, course }) {
  const { points, transcript } = useMemo(() => splitVideoContent(lesson.content), [lesson.content]);
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);
  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-ink">
        {lesson.videoUrl ? (
          <video src={lesson.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full bg-black" aria-label={lesson.title}>
            <track kind="captions" />
          </video>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden text-ink-fg">
            <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(80% 70% at 50% 35%, var(--ink-2) 0%, transparent 75%)" }} />
            <div className="relative flex h-full flex-col justify-between p-5 sm:p-8">
              <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                <span>Lesson video · {formatDuration(lesson.durationMinutes)}</span>
                <span className="hidden sm:inline">{course?.mentor?.name}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={playing ? chapter : "title"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} className="max-w-2xl">
                  {playing && points.length ? (
                    <>
                      <p className="text-xs text-ink-muted">Key point {chapter + 1} of {points.length}</p>
                      <p className="mt-2 text-lg leading-snug font-medium tracking-tight sm:text-2xl">{points[chapter].replace(/`/g, "")}</p>
                    </>
                  ) : (
                    <p className="text-xl leading-tight font-medium tracking-tight sm:text-3xl">{lesson.title}</p>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink-fg text-ink transition-transform hover:scale-[1.03]"
                  aria-label={playing ? "Pause key points" : "Play key points"}
                >
                  {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
                </button>
                <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Key points">
                  {(points.length ? points : [lesson.title]).map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={playing && chapter === i}
                      aria-label={`Key point ${i + 1}`}
                      onClick={() => {
                        setPlaying(true);
                        setChapter(i);
                      }}
                      className="group h-6 flex-1 cursor-pointer py-2.5"
                    >
                      <span className={cn("block h-[3px] rounded-full transition-colors", playing && i <= chapter ? "bg-ink-fg" : "bg-ink-line group-hover:bg-ink-muted")} />
                    </button>
                  ))}
                </div>
                {playing && points.length > 1 && (
                  <button type="button" onClick={() => setChapter((c) => (c + 1) % points.length)} className="hidden cursor-pointer rounded-full border border-ink-line px-3 py-1.5 text-xs text-ink-fg transition-colors hover:bg-ink-2 sm:block">
                    Next point
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {!lesson.videoUrl && <p className="mt-3 text-xs text-subtle">The studio recording is being edited. Step through the key points above and read the transcript below.</p>}

      {points.length > 0 && (
        <section className="mt-10">
          <SectionLabel>Key points</SectionLabel>
          <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {points.map((p, i) => (
              <li key={i} className="flex gap-4 px-5 py-4">
                <span className="w-5 shrink-0 pt-0.5 text-sm text-subtle tabular-nums">{i + 1}</span>
                <Markdown className="min-w-0 flex-1 text-[15px] leading-relaxed [&_p]:m-0">{p}</Markdown>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="mt-10">
        <SectionLabel>Transcript and notes</SectionLabel>
        <Markdown className="text-base sm:text-[17px] [&>*:first-child]:mt-0">{transcript}</Markdown>
      </section>
    </div>
  );
}

/* ───────────── ARTICLE ───────────── */
export function ArticleLesson({ lesson }) {
  const words = lesson.content.split(/\s+/).length;
  return (
    <article>
      <p className="mb-6 flex items-center gap-2 text-sm text-subtle"><Clock className="size-3.5" /> {Math.max(1, Math.round(words / 200))} min read</p>
      <Markdown className="text-base sm:text-[17px] [&>*:first-child]:mt-0">{lesson.content}</Markdown>
    </article>
  );
}

/* ───────────── QUIZ ───────────── */
export function QuizLesson({ lesson, onPassed }) {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const questions = lesson.quiz?.questions || [];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [result, setResult] = useState(null);
  const [started, setStarted] = useState(false);

  const submit = useMutation({
    mutationFn: () => api.post(`/api/lessons/${lesson.id}/quiz`, { answers }),
    onSuccess: (r) => {
      setResult(r);
      if (r.pointsAwarded) {
        refreshUser().catch(() => {});
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
      if (r.passed) onPassed?.(r);
    },
    onError: (e) => toast.error(e.message),
  });

  const reset = () => {
    setAnswers({});
    setRevealed({});
    setResult(null);
    setIndex(0);
    setStarted(true);
  };

  if (!questions.length) return <Markdown>{lesson.content}</Markdown>;

  if (!started) {
    return (
      <div>
        <Markdown className="text-base sm:text-[17px] [&>*:first-child]:mt-0">{lesson.content}</Markdown>
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary"><ListChecks className="size-5" strokeWidth={1.6} /></span>
            <div className="flex-1">
              <p className="text-lg font-medium tracking-tight">{questions.length} questions · pass at 60%</p>
              <p className="mt-1 text-sm text-muted">You see the answer after each question. Retake as often as you like; points come on your first pass.</p>
            </div>
            <Button size="lg" onClick={() => setStarted(true)}>Start quiz</Button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
        <div className="rounded-2xl border border-line bg-surface p-6 text-center sm:p-10">
          <div className="flex flex-col items-center">
            <ProgressRing value={pct} size={112} stroke={6} color={result.passed ? "var(--success)" : "var(--primary)"} track="var(--surface-2)">
              <span className="text-2xl font-medium tracking-tight tabular-nums">{result.score}/{result.total}</span>
              <span className="text-xs text-muted">{pct}%</span>
            </ProgressRing>
            <p className="mt-6 text-2xl font-medium tracking-tight">
              {result.passed ? (pct === 100 ? "A perfect score" : "You passed. Shabaash.") : "Almost there"}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted">
              {result.passed ? "You have this concept. Review any misses below, then move on." : "You need 60% to pass. Read the explanations below and try again."}
            </p>
            {result.pointsAwarded > 0 && (
              <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"><Zap className="size-3" />+{result.pointsAwarded} pts</span>
            )}
            <Button variant="outline" className="mt-6" leftIcon={RotateCcw} onClick={reset}>Retake quiz</Button>
          </div>
        </div>
        <SectionLabel className="mt-10">Review</SectionLabel>
        <ol className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {questions.map((q, i) => {
            const r = result.results.find((x) => x.questionId === q.id);
            const correctText = q.options.find((o) => o.id === r?.correctOptionId)?.text;
            return (
              <li key={q.id} className="flex gap-4 p-5">
                <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", r?.correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
                  {r?.correct ? <Check className="size-3" strokeWidth={2.5} /> : <X className="size-3" strokeWidth={2.5} />}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{i + 1}. {q.prompt}</p>
                  {!r?.correct && <p className="mt-1.5 text-sm text-success">Correct answer: {correctText}</p>}
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{q.explanation}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </motion.div>
    );
  }

  const q = questions[index];
  const chosen = answers[q.id];
  const isRevealed = revealed[q.id];
  const last = index === questions.length - 1;
  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <span className="shrink-0 text-sm text-muted tabular-nums">Question {index + 1} of {questions.length}</span>
        <div className="flex flex-1 gap-1">
          {questions.map((x, i) => (
            <span
              key={x.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < index || revealed[x.id] ? (answers[x.id] === x.correctOptionId ? "bg-success" : "bg-danger") : i === index ? "bg-fg/60" : "bg-surface-3",
              )}
            />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: EASE }}>
          <h2 className="text-xl leading-snug font-medium tracking-tight sm:text-2xl">{q.prompt}</h2>
          <div className="mt-6 space-y-2.5" role="radiogroup" aria-label={q.prompt}>
            {q.options.map((o, oi) => {
              const isChosen = chosen === o.id;
              const isCorrect = o.id === q.correctOptionId;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={isRevealed}
                  onClick={() => {
                    setAnswers((a) => ({ ...a, [q.id]: o.id }));
                    setRevealed((r) => ({ ...r, [q.id]: true }));
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 rounded-xl border bg-surface px-4 py-3.5 text-left text-[15px] transition-colors disabled:cursor-default",
                    !isRevealed && "border-line hover:border-line-strong hover:bg-surface-2/60",
                    isRevealed && isCorrect && "border-success/50 bg-success-soft",
                    isRevealed && isChosen && !isCorrect && "border-danger/50 bg-danger-soft",
                    isRevealed && !isChosen && !isCorrect && "border-line opacity-55",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs text-muted",
                      isRevealed && isCorrect ? "border-success bg-success text-white" : isRevealed && isChosen ? "border-danger bg-danger text-white" : "border-line-strong",
                    )}
                  >
                    {isRevealed && isCorrect ? <Check className="size-3.5" strokeWidth={2.5} /> : isRevealed && isChosen ? <X className="size-3.5" strokeWidth={2.5} /> : String.fromCharCode(65 + oi)}
                  </span>
                  <span className="flex-1">{o.text}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className={cn("mt-5 border-l-2 pl-4 text-sm leading-relaxed", chosen === q.correctOptionId ? "border-success" : "border-warning")}
              >
                <p className="font-medium">{chosen === q.correctOptionId ? "Sahi jawab. That is right." : "Not quite."}</p>
                <p className="mt-1 text-muted">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-8 flex justify-end">
            {last ? (
              <Button size="lg" disabled={!isRevealed} loading={submit.isPending} onClick={() => submit.mutate()}>See my score</Button>
            ) : (
              <Button size="lg" disabled={!isRevealed} onClick={() => setIndex((i) => i + 1)}>Next question</Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ───────────── ASSIGNMENT ───────────── */
export function AssignmentLesson({ lesson }) {
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const a = lesson.assignment || { brief: "", rubric: [], submissionType: "LINK" };
  const subs = useQuery({ queryKey: ["submissions"], queryFn: () => api.get("/api/me/submissions") });
  const mine = (subs.data || []).filter((s) => s.lessonId === lesson.id);
  const latest = mine[0];
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const total = a.rubric.reduce((s, r) => s + r.points, 0);

  const submit = useMutation({
    mutationFn: () => api.post(`/api/lessons/${lesson.id}/submit`, { link: link || undefined, text: text || undefined }),
    onSuccess: () => {
      toast.success("Submitted. Your mentor usually reviews within 48 hours.");
      setLink("");
      setText("");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      refreshUser().catch(() => {});
    },
    onError: (e) => toast.error(e.message),
  });

  const showForm = !latest || editing;
  const reviewed = latest?.status === "REVIEWED";
  return (
    <div>
      <Markdown className="text-base sm:text-[17px] [&>*:first-child]:mt-0">{lesson.content}</Markdown>

      <section className="mt-10 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <SectionLabel className="mb-1">The brief</SectionLabel>
        <Markdown className="text-[15px] sm:text-base [&>*:first-child]:mt-2 [&>*:last-child]:mb-0">{a.brief}</Markdown>
      </section>

      {a.rubric.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <SectionLabel className="mb-0">How it is graded</SectionLabel>
            <span className="text-xs text-muted">{total} points</span>
          </div>
          <ul className="space-y-4">
            {a.rubric.map((r) => (
              <li key={r.criterion}>
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span>{r.criterion}</span>
                  <span className="shrink-0 font-medium tabular-nums">{r.points}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${(r.points / (total || 1)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latest && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={cn("flex size-9 items-center justify-center rounded-full", reviewed ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                {reviewed ? <CheckCircle2 className="size-4.5" /> : <Hourglass className="size-4" />}
              </span>
              <div>
                <p className="font-medium">{reviewed ? "Reviewed by your mentor" : "Submitted, waiting for review"}</p>
                <p className="text-xs text-muted">Sent {formatDate(latest.createdAt)}{mine.length > 1 ? ` · ${mine.length} attempts` : ""}</p>
              </div>
            </div>
            {reviewed && (
              <span className="text-2xl font-medium tracking-tight tabular-nums">{latest.score}<span className="text-sm text-muted">/{latest.maxScore}</span></span>
            )}
          </div>
          {latest.link && (
            <a href={latest.link} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 truncate text-sm text-primary hover:underline">
              <Link2 className="size-4 shrink-0" /> <span className="truncate">{latest.link}</span>
            </a>
          )}
          {latest.text && <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm whitespace-pre-wrap">{latest.text}</p>}
          {latest.feedback && (
            <blockquote className="mt-5 border-l-2 border-success pl-4 text-sm leading-relaxed text-fg/90">{latest.feedback}</blockquote>
          )}
          {!editing && (
            <Button variant="outline" size="sm" className="mt-5" leftIcon={RotateCcw} onClick={() => setEditing(true)}>Submit a new version</Button>
          )}
        </section>
      )}

      {showForm && (
        <form
          className="mt-6 space-y-5 rounded-2xl border border-line bg-surface p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div>
            <p className="text-lg font-medium tracking-tight">Submit your work</p>
            <p className="mt-1 text-sm text-muted">A mentor reviews it, and it becomes verified proof on your Skill Passport.</p>
          </div>
          <Field label={a.submissionType === "LINK" ? "Link to your work" : "Link (optional)"} hint="GitHub, Figma, Google Drive, Behance or a live site. Make sure it is viewable." htmlFor="sub-link">
            <Input id="sub-link" type="url" leftIcon={Link2} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" required={a.submissionType === "LINK"} />
          </Field>
          <Field label={a.submissionType === "TEXT" ? "Your answer" : "Note for your mentor (optional)"} htmlFor="sub-text">
            <Textarea id="sub-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you build? Any decisions you would like feedback on?" required={a.submissionType === "TEXT"} className={a.submissionType === "TEXT" ? "min-h-48" : ""} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <span className="text-xs text-muted">+60 pts on your first submission</span>
            <div className="flex gap-2">
              {editing && <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
              <Button type="submit" leftIcon={Send} loading={submit.isPending}>Submit for review</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
