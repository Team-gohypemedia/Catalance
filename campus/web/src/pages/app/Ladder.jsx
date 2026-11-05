import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, BookOpen, Briefcase, Check, FolderKanban, Gift, GraduationCap, Lock, Rocket, Sparkles, Target, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api/client";
import { cn, formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { ErrorState, PageHeader } from "@/components/ui/campus";

const STAGE_ICON = { LEARN: BookOpen, PRACTICE: Target, MICRO_GIG: Briefcase, REAL_PROJECT: Rocket, HIRED: Trophy };

const CTAS = {
  LEARN: [
    { label: "Explore courses", to: "/app/catalog" },
    { label: "Ask the AI Tutor", to: "/app/tutor", variant: "brandOutline" },
  ],
  PRACTICE: [
    { label: "Continue learning", to: "/app/learn" },
    { label: "Take a quiz", to: "/app/learn", variant: "brandOutline" },
  ],
  MICRO_GIG: [
    { label: "Find a micro-gig", to: "/app/gigs" },
    { label: "Add to portfolio", to: "/app/portfolio", variant: "brandOutline" },
  ],
  REAL_PROJECT: [
    { label: "Browse real projects", to: "/app/gigs" },
    { label: "Book a mentor", to: "/app/mentors", variant: "brandOutline" },
  ],
  HIRED: [
    { label: "Polish your passport", to: "/app/portfolio", icon: FolderKanban },
    { label: "Climb the leaderboard", to: "/app/leaderboard", variant: "brandOutline" },
  ],
};

const fmtReq = (r, v) => (/₹/.test(r.label) ? formatINR(v) : formatNumber(v));
const stageState = (s, currentStage) => (s.completed ? "done" : s.stage === currentStage || s.unlocked ? "current" : "locked");

function Requirement({ req, showBar }) {
  const pct = Math.min(100, Math.round((req.current / req.target) * 100));
  return (
    <li>
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className={cn("flex items-start gap-2.5", req.done ? "text-fg" : "text-muted")}>
          <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", req.done ? "bg-primary text-primary-fg" : "border border-line-strong")}>
            {req.done && <Check className="size-2.5" strokeWidth={3} />}
          </span>
          {req.label}
        </span>
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {fmtReq(req, Math.min(req.current, req.target))} / {fmtReq(req, req.target)}
        </span>
      </div>
      {showBar && (
        <div className="mt-2 ml-6.5 h-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
      )}
    </li>
  );
}

function StepMarker({ state, n }) {
  return (
    <span
      className={cn(
        "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
        state === "done" && "bg-primary text-primary-fg",
        state === "current" && "border-2 border-primary bg-surface text-primary",
        state === "locked" && "border border-line bg-surface text-subtle",
      )}
    >
      {state === "done" ? <Check className="size-4" strokeWidth={2.5} /> : state === "locked" ? <Lock className="size-3.5" /> : n}
    </span>
  );
}

function Step({ stage, state, last, index }) {
  const Icon = STAGE_ICON[stage.key] || Sparkles;
  const doneReqs = stage.requirements.filter((r) => r.done).length;
  const isCurrent = state === "current";

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="relative flex gap-4 pb-6 last:pb-0 sm:gap-6"
    >
      {!last && <span aria-hidden="true" className={cn("absolute top-9 bottom-0 left-[17.5px] w-px", state === "done" ? "bg-primary" : "bg-line")} />}
      <StepMarker state={state} n={stage.stage} />

      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl border bg-surface p-5 sm:p-6",
          isCurrent ? "border-primary/40 shadow-sm" : "border-line",
          state === "locked" && "bg-transparent",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-muted">
              <Icon className="size-3.5" strokeWidth={1.75} /> Stage {stage.stage}
              <span className="text-line-strong">·</span>
              {state === "done" && <span className="text-fg">Completed</span>}
              {isCurrent && <span className="font-medium text-primary">In progress, {doneReqs} of {stage.requirements.length}</span>}
              {state === "locked" && <span>Locked</span>}
            </p>
            <h3 className={cn("mt-1.5 text-lg font-medium tracking-tight sm:text-xl", state === "locked" ? "text-muted" : "text-fg")}>{stage.title}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">{stage.description}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", isCurrent ? "border-primary/30 bg-primary-soft text-primary" : "border-line text-muted")}>
            <Gift className="size-3.5" strokeWidth={1.75} /> {stage.reward}
          </span>
        </div>

        {state !== "done" ? (
          <ul className={cn("mt-5 space-y-3.5 border-t border-line pt-5", state === "locked" && "opacity-80")}>
            {stage.requirements.map((r) => (
              <Requirement key={r.label} req={r} showBar={isCurrent} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-4 text-xs text-muted">
            {stage.requirements.map((r) => (
              <span key={r.label} className="inline-flex items-center gap-1.5">
                <Check className="size-3 text-primary" strokeWidth={2.5} /> {r.label}
              </span>
            ))}
          </p>
        )}

        {isCurrent && CTAS[stage.key] && (
          <div className="mt-6 flex flex-wrap gap-2">
            {CTAS[stage.key].map((c) => (
              <Button key={c.label} to={c.to} size="sm" variant={c.variant || "primary"} rightIcon={c.variant ? undefined : ArrowRight}>
                {c.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  );
}

function LadderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-2xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-6">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-40 flex-1 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export default function Ladder() {
  const { user, refreshUser } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["ladder"], queryFn: () => api.get("/api/ladder") });
  const celebrated = useRef(false);

  // the server may promote the user when it recomputes the ladder
  useEffect(() => {
    if (!data || !user || celebrated.current) return;
    if (data.currentStage > (user.ladderStage || 1)) {
      celebrated.current = true;
      toast.success(`Level up. You're now on Stage ${data.currentStage}.`);
      refreshUser().catch(() => {});
    }
  }, [data, user, refreshUser]);

  const current = data?.stages.find((s) => s.stage === data.currentStage);
  const next = data?.stages.find((s) => s.stage === data.currentStage + 1);
  const totalReqs = data?.stages.reduce((n, s) => n + s.requirements.length, 0) || 1;
  const doneReqs = data?.stages.reduce((n, s) => n + s.requirements.filter((r) => r.done || s.completed).length, 0) || 0;
  const overall = Math.round((doneReqs / totalReqs) * 100);
  const todo = current?.requirements.filter((r) => !r.done) || [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Earn ladder"
        title="From first lesson to first paycheck"
        description="Five stages. Each one unlocks real money and real clients."
        actions={<Button to="/app/gigs" variant="brandOutline" rightIcon={ArrowRight}>Open gig board</Button>}
      />

      {isLoading ? (
        <LadderSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          {/* Summary */}
          <section className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-sm text-muted">Your position</p>
                <h2 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">
                  Stage {data.currentStage} of 5, <em className="accent">{current?.title}</em>
                </h2>
                <div className="mt-6 flex gap-1" aria-label={`Stage ${data.currentStage} of 5`}>
                  {data.stages.map((s) => {
                    const w = s.completed ? 100 : s.stage === data.currentStage ? Math.max(6, (s.requirements.filter((r) => r.done).length / s.requirements.length) * 100) : 0;
                    return (
                      <div key={s.stage} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.8, delay: s.stage * 0.08 }} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
                  <span>{overall}% of the ladder complete</span>
                  <span>{formatINR(user?.lifetimeEarnedINR || 0)} earned so far</span>
                </div>
              </div>

              <div className="md:border-l md:border-line md:pl-8">
                <p className="text-sm text-muted">{next ? `To unlock ${next.title}` : "Final stage"}</p>
                {todo.length ? (
                  <ul className="mt-3 space-y-2.5">
                    {todo.map((r) => (
                      <li key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-fg">{r.label}</span>
                        <span className="shrink-0 text-xs text-muted tabular-nums">{fmtReq(r, r.target - Math.min(r.current, r.target))} to go</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-fg">Everything here is complete. {next ? "Your next stage unlocks on your next visit." : "Partner companies can now fast-track you."}</p>
                )}
                {current && (
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                    <Gift className="size-3.5 text-primary" strokeWidth={1.75} /> {current.reward}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Stepper */}
          <ol className="mt-8 sm:mt-10">
            {data.stages.map((s, i) => (
              <Step key={s.stage} stage={s} state={stageState(s, data.currentStage)} last={i === data.stages.length - 1} index={i} />
            ))}
          </ol>

          {/* How money works */}
          <section className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: GraduationCap, title: "Practice first", body: "Gigs here are practice tasks. Client projects come as offers after you are verified, and are not guaranteed." },
              { icon: Briefcase, title: "Mentor-checked work", body: "Every gig has a mentor who reviews your work before the client sees it. No ghosting, no unpaid revisions." },
              { icon: Trophy, title: "Ranked and scouted", body: "Points from every stage move you up the season leaderboard, where partner companies scout for interns and hires." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-primary"><c.icon className="size-4.5" strokeWidth={1.75} /></span>
                <h3 className="mt-4 text-base font-medium">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
