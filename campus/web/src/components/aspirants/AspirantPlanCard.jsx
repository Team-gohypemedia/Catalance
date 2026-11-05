/**
 * Dashboard "Aspirant plan" card: daily minutes ring, next 15-min lesson, skills from prep, bridge tracks,
 * and a private, client-side age-limit planner. plan = dashboard.aspirantPlan; aspirant = user.aspirant.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, CalendarClock, Info, Landmark, Lock, PlayCircle, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import { BRIDGE_TRACKS, bridgeIcon, eligibilityFor } from "./data";
import { ProgressRing } from "@/components/learning/ProgressRing";

const reveal = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.4 } };

function AgePlanner({ aspirant }) {
  const e = eligibilityFor(aspirant);
  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-bg p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarClock className="size-3.5" /> Eligibility planner
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] text-muted">
          <Lock className="size-3" /> Only you see this
        </span>
      </div>

      {!e ? (
        <div className="mt-4 flex flex-1 flex-col">
          <p className="text-base font-medium tracking-tight">Plan with your age limit in mind</p>
          <p className="mt-1 text-sm text-muted">Add your birth year and we'll show roughly how many years of eligibility you have for {aspirant?.examName || "your exam"}. It stays private.</p>
          <Button to="/app/profile#aspirant" variant="outline" size="sm" className="mt-4 self-start" rightIcon={ArrowRight}>
            Add birth year in Profile
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          {e.yearsLeft > 0 ? (
            <>
              <p className="text-3xl leading-none font-medium tracking-tight">
                ≈ {e.yearsLeft} <span className="text-base font-normal text-muted">year{e.yearsLeft === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-1.5 text-sm text-muted">of eligibility left for {aspirant.examName} (general category; check your official notification).</p>
              <div className="mt-3 flex flex-wrap gap-1" aria-hidden="true">
                {Array.from({ length: Math.min(e.yearsLeft, 12) }).map((_, i) => (
                  <span key={i} className="h-1.5 w-5 rounded-full bg-primary/40" />
                ))}
              </div>
              <p className="mt-3 text-sm">
                {e.yearsLeft <= 2
                  ? "A good time to build your backup in parallel, so every option stays open."
                  : "Plenty of runway. 45 minutes a day now means a ready backup whenever you want it."}
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium tracking-tight">You may have reached the usual general-category limit for {aspirant.examName}.</p>
              <p className="mt-1.5 text-sm text-muted">
                Many categories get age relaxations, and other exams have higher limits. Check your official notification. Whatever you decide, the skills you build here stay yours.
              </p>
            </>
          )}
          {e.attemptsNote && <p className="mt-2 text-xs text-muted">{e.attemptsNote}</p>}
          <Link to="/aspirants#switch" className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary hover:underline">
            Plan the switch <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
      <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[11px] leading-snug text-subtle">
        <Info className="mt-px size-3 shrink-0" />
        Approximate upper age limits (e.g. SSC CGL 32, IBPS PO 30, UPSC 32, RRB NTPC 33). Limits vary by post and year; OBC, SC/ST, PwBD and others get relaxations.
      </p>
    </div>
  );
}

export function AspirantPlanCard({ plan, aspirant }) {
  const daily = plan.dailyMinutes || aspirant?.dailyMinutes || 45;
  const done = Math.max(0, plan.todayDoneMinutes || 0);
  const left = Math.max(0, daily - done);
  const finished = done >= daily;
  const tracks = plan.bridgeTracks?.length ? plan.bridgeTracks : BRIDGE_TRACKS;
  const skills = plan.skillsFromPrep || [];
  const next = plan.nextLesson;
  const years = plan.prepYears ?? aspirant?.prepYears ?? 0;

  return (
    <motion.section {...reveal} aria-labelledby="aspirant-plan-title" className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Landmark className="size-3.5" strokeWidth={1.75} />
            Aspirant plan · {plan.examName || aspirant?.examName || "Govt exam"}
          </p>
          <h2 id="aspirant-plan-title" className="mt-2 text-2xl leading-tight font-medium tracking-tight sm:text-3xl">
            Taiyari bhi, <em className="accent">career bhi.</em>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            {years ? `${years} year${years === 1 ? "" : "s"} of prep already count.` : "Your preparation already counts."} {daily} minutes a day builds the backup.
            {plan.weekDoneMinutes ? ` This week: ${formatDuration(plan.weekDoneMinutes)}.` : ""}
          </p>
        </div>
        <Button to="/app/profile#aspirant" variant="outline" size="sm" leftIcon={Settings2} className="self-start sm:self-auto">
          Edit plan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_1fr_1fr] lg:gap-8">
        {/* Today + next lesson */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div role="img" aria-label={`${done} of ${daily} minutes`}>
              <ProgressRing value={Math.round((done / Math.max(1, daily)) * 100)} size={96} stroke={7} color={finished ? "var(--success)" : "var(--primary)"}>
                <span className="text-xl leading-none font-medium tracking-tight tabular-nums">{done}</span>
                <span className="mt-1 text-[10px] text-muted">of {daily} min</span>
              </ProgressRing>
            </div>
            <div className="min-w-0">
              <p className="font-medium">{finished ? "Done for today. Shabaash." : `${left} min to go today`}</p>
              <p className="mt-1 text-sm text-muted">{finished ? "Now back to your prep. Your backup is growing." : "One short lesson fits between two prep sessions."}</p>
            </div>
          </div>
          {next ? (
            <div className="rounded-xl border border-line p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <PlayCircle className="size-3.5" strokeWidth={1.75} /> Next {next.durationMinutes ? `${next.durationMinutes}-min` : ""} lesson
              </p>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium">{next.lessonTitle}</p>
              <p className="truncate text-xs text-muted">{next.courseTitle}</p>
              <Button to={`/app/courses/${next.courseId}/learn/${next.lessonId}`} size="sm" className="mt-3 w-full sm:w-auto" rightIcon={ArrowRight}>
                Resume lesson
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line-strong p-4">
              <p className="text-sm font-medium">Start your first bridge lesson</p>
              <p className="mt-0.5 text-xs text-muted">Each one opens with an “Exam link” to what you already know.</p>
              <Button to="/app/catalog" variant="outline" size="sm" className="mt-3" rightIcon={ArrowRight}>
                Choose a bridge track
              </Button>
            </div>
          )}
        </div>

        {/* Skills from prep + bridge tracks */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Sparkles className="size-3.5" strokeWidth={1.75} /> Skills from your prep
            </p>
            {skills.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <li key={`${s.subject}-${s.skill}`}>
                    <Link
                      to={s.trackSlug ? `/app/catalog?track=${encodeURIComponent(s.trackSlug)}` : "/app/catalog"}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="font-normal text-muted">{s.subject}</span>
                      <ArrowRight className="size-3 text-subtle" aria-label="becomes" />
                      {s.skill}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Add your strong subjects in <Link to="/app/profile#aspirant" className="font-medium text-primary hover:underline">Profile</Link> to see the skills you already half-know.
              </p>
            )}
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <BookOpenCheck className="size-3.5" strokeWidth={1.75} /> Bridge tracks
            </p>
            <ul className="mt-2 divide-y divide-line">
              {tracks.slice(0, 3).map((t) => {
                const Icon = bridgeIcon(t);
                return (
                  <li key={t.slug}>
                    <Link to={`/app/catalog?track=${encodeURIComponent(t.slug)}`} className="group flex items-center gap-3 py-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors group-hover:text-primary">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium transition-colors group-hover:text-primary">{t.title}</span>
                        {t.bridgeFrom?.length > 0 && <span className="block truncate text-xs text-muted">From {t.bridgeFrom.slice(0, 2).join(" & ")}</span>}
                      </span>
                      <ArrowRight className={cn("size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5")} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Private planner */}
        <AgePlanner aspirant={aspirant} />
      </div>
    </motion.section>
  );
}
