// v4 - premium redesign with badge shelf and process summary
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Flame from "lucide-react/dist/esm/icons/flame";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Zap from "lucide-react/dist/esm/icons/zap";
import Target from "lucide-react/dist/esm/icons/target";
import Info from "lucide-react/dist/esm/icons/info";
import X from "lucide-react/dist/esm/icons/x";
import Clock from "lucide-react/dist/esm/icons/clock";
import { useNavigate } from "react-router-dom";
import FreelancerTopBar from "@/components/features/freelancer/FreelancerTopBar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import BadgeShelf from "./BadgeShelf";
import ProcessSummaryCard from "./ProcessSummaryCard";

const makeKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `gq-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatReset = (resetAt) => {
  if (!resetAt) return "UTC midnight";
  const d = new Date(resetAt);
  return Number.isNaN(d.getTime()) ? "UTC midnight" : d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
};

/* ── Info Modal ───────────────────────────────────────── */
const HOW_IT_WORKS = [
  { emoji: "📅", title: "Daily Questions", desc: "Complete 5 client-readiness questions every day to sharpen your professional habits." },
  { emoji: "🔥", title: "Streaks", desc: "Build consistency to unlock exclusive milestone badges and bonus rewards. Don't miss a day!" },
  { emoji: "⚡", title: "XP & Level", desc: "Level up your engagement rank as you earn XP. High levels signal reliability to potential clients." },
  { emoji: "🪙", title: "Loyalty Coins", desc: "Earn coins to redeem perks, freeze streaks, or access premium platform features." },
  { emoji: "🔁", title: "Smart Retakes", desc: "Improve your score with up to 2 attempts daily. Your highest score is always the one that counts." },
  { emoji: "🏆", title: "Leaderboard", desc: "Compete with top freelancers. High rankings earn priority access to challenges and events." },
];

const InfoModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-border/50 px-8 py-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Growth Quest Guide</h2>
            <p className="text-xs font-medium text-muted-foreground mt-1">Master the engagement system</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground hover:scale-105 active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative max-h-[70vh] overflow-y-auto px-8 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.title} className="group flex flex-col gap-3 rounded-[24px] border border-border/50 bg-background/50 p-5 transition-all hover:border-primary/20 hover:bg-background">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-2xl transition-transform group-hover:scale-110">
                  {item.emoji}
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{item.title}</p>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs">💡</div>
            <p className="text-[0.7rem] font-bold leading-relaxed text-primary">
              Pro Tip: Questions reset at <span className="font-black underline">00:00 UTC</span>. Set a daily reminder to maintain your streak and maximize your rewards!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-8 py-5 flex justify-end">
          <Button 
            onClick={onClose}
            className="rounded-full px-8 font-black bg-primary text-primary-foreground"
          >
            Got it, thanks!
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Stat Card ─────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="flex flex-col gap-3 rounded-[24px] border border-border bg-card p-5 transition-transform hover:-translate-y-0.5">
    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
      <Icon className="size-4 text-primary" />
    </div>
    <div>
      <p className="text-[0.7rem] font-black uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-black tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

/* ── Leaderboard Row ───────────────────────────────────── */
const LeaderRow = ({ rank, name, coins, isYou }) => {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors", isYou ? "bg-primary/10 ring-1 ring-primary/30" : "bg-background hover:bg-card")}>
      <span className="w-7 text-center text-lg">{medals[rank - 1] || `#${rank}`}</span>
      <div className="flex-1 min-w-0">
        <p className={cn("truncate text-sm font-bold", isYou ? "text-primary" : "text-foreground")}>{name}</p>
        <p className="text-xs text-muted-foreground">{coins} coins</p>
      </div>
      {rank <= 3 && <Star className="size-3.5 text-primary" />}
    </div>
  );
};

/* ── Dashboard View ────────────────────────────────────── */
const DashboardView = ({ dashboard, onStartQuest, loading, error }) => {
  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading your quest…</p>
      </div>
    </div>
  );

  const profile = dashboard?.profile || {};
  const today = dashboard?.today || {};
  const streak = profile.currentStreak || 0;
  const coins = profile.loyaltyCoins || 0;
  const xp = profile.totalXP || 0;
  const level = profile.level || 1;
  const used = today.attemptsUsed || 0;
  const max = today.maxAttempts || 2;
  const done = used >= max;
  const isRetake = used > 0 && !done;

  const leaderboard = [
    { rank: 1, name: "Alex R.", coins: 4250 },
    { rank: 2, name: "Sam K.", coins: 3840 },
    { rank: 3, name: "Jordan M.", coins: 3210 },
    { rank: 12, name: "You", coins, isYou: true },
  ];

  /* XP level progress */
  const levelThresholds = [0, 200, 600, 1500, 3500];
  const levelNames = ["Starter", "Active Learner", "Skilled Contributor", "Pro Contributor", "Gold Contributor"];
  const currentLevelIdx = levelThresholds.reduce((acc, t, i) => (xp >= t ? i : acc), 0);
  const nextThreshold = levelThresholds[currentLevelIdx + 1] ?? null;
  const prevThreshold = levelThresholds[currentLevelIdx] ?? 0;
  const xpPct = nextThreshold
    ? Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Left Column: Progress & Profile (LeetCode side card inspired) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="relative overflow-hidden rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="absolute -right-12 -top-12 opacity-[0.03] pointer-events-none rotate-12">
            <Trophy className="size-64 text-primary" />
          </div>

          <div className="relative mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-4xl shadow-inner">
              {currentLevelIdx >= 4 ? "👑" : currentLevelIdx >= 2 ? "🔥" : "🌱"}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Growth Hub</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider text-primary">
                Level {level} · {levelNames[currentLevelIdx]}
              </span>
            </div>
            <p className="mt-4 max-w-[240px] text-xs font-medium leading-relaxed text-muted-foreground">
              Complete quests to unlock higher level projects and platform rewards.
            </p>
          </div>

          <div className="mb-10 flex flex-col items-center">
            <div className="relative flex size-44 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" width="176" height="176" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r="80" fill="none" stroke="currentColor" strokeWidth="12" className="text-border/50" />
                <circle
                  cx="88" cy="88" r="80" fill="none" stroke="currentColor" strokeWidth="12"
                  className="text-primary"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 80}`}
                  strokeDashoffset={`${2 * Math.PI * 80 * (1 - xpPct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
              </svg>
              <div className="text-center">
                <p className="text-4xl font-black tracking-tighter text-foreground">{xp}</p>
                <p className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">Total XP</p>
              </div>
            </div>
            {nextThreshold && (
              <p className="mt-4 text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground">
                <span className="text-foreground">{nextThreshold - xp} XP</span> until next level
              </p>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-background border border-border">
                  <Flame className="size-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Streak</p>
                  <p className="text-sm font-black text-foreground">{streak} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-background border border-border">
                  <Star className="size-4 text-[#facc15]" />
                </div>
                <div>
                  <p className="text-[0.65rem] font-black uppercase tracking-wider text-muted-foreground">Coins</p>
                  <p className="text-sm font-black text-foreground">{coins}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartQuest}
              disabled={done}
              className={cn(
                "group relative mt-4 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl text-base font-black shadow-lg transition-all active:scale-[0.98]",
                done 
                  ? "cursor-not-allowed bg-muted text-muted-foreground" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]"
              )}
            >
              {!done && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
              {done ? (
                <><CheckCircle2 className="size-5" /> Completed</>
              ) : (
                <>Get Started <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
            <p className="text-center text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              {isRetake ? `${max - used} retakes remaining` : "~5 mins · Resets at UTC midnight"}
            </p>
          </div>
        </div>

        {/* Skill Breakdown (LeetCode "Difficulty" breakdown inspired) */}
        <div className="rounded-3xl border border-border bg-card/50 p-6">
          <h3 className="mb-4 text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground text-center">Your Skillset</h3>
          <div className="space-y-3">
            {[
              { label: "Execution", value: 85, color: "text-emerald-500" },
              { label: "Strategy", value: 65, color: "text-primary" },
              { label: "Knowledge", value: 40, color: "text-orange-500" },
            ].map((skill) => (
              <div key={skill.label} className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-foreground">{skill.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-border overflow-hidden">
                    <div className={cn("h-full rounded-full bg-current", skill.color)} style={{ width: `${skill.value}%` }} />
                  </div>
                  <span className={cn("text-[0.65rem] font-black w-8 text-right", skill.color)}>{skill.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Achievements & Insights (LeetCode problem list inspired) */}
      <div className="lg:col-span-7 space-y-6">
        <BadgeShelf badges={dashboard?.profile?.badges || []} currentStreak={streak} />
        <ProcessSummaryCard processSummary={dashboard?.processSummary} />
        
        {/* Weekly Leaderboard */}
        <div className="rounded-[32px] border border-border bg-card p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-foreground">Community</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Weekly Leaderboard</h2>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
              <Trophy className="size-6 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            {leaderboard.map((u) => <LeaderRow key={u.rank} {...u} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Option Labels ─────────────────────────────────────── */
const LABELS = ["A", "B", "C", "D", "E"];

/* ── Quiz View ─────────────────────────────────────────── */
const QuizView = ({ questions, activeIndex, setActiveIndex, selectedAnswers, handleSelectAnswer, onSubmit, submitting, canSubmit, error }) => {
  const q = questions[activeIndex];
  if (!q) return null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <p className="whitespace-nowrap text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Daily Growth Quest</p>
          <h2 className="mt-0.5 whitespace-nowrap text-xl font-black text-foreground">
            Question <span className="text-primary">{activeIndex + 1}</span>
            <span className="text-muted-foreground"> of {questions.length}</span>
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
          {q.categoryLabel || "Client Readiness"}
        </span>
      </div>

      {/* Segment progress bar */}
      <div className="mb-6 flex gap-1.5">
        {questions.map((qq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all",
              selectedAnswers[qq.id] ? "bg-primary" : i === activeIndex ? "bg-primary/40" : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Card */}
      <div className="rounded-[28px] border border-border bg-card p-6 sm:p-8">
        <p className="text-lg font-bold leading-relaxed text-foreground">{q.questionText}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:items-stretch">
          {(q.options || []).map((opt, idx) => {
            const selected = selectedAnswers[q.id] === opt.id;
            const label = LABELS[idx] || opt.id.toUpperCase();
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectAnswer(q.id, opt.id)}
                className={cn(
                  "flex h-full w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-150",
                  selected
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border bg-background hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                <span className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {label}
                </span>
                <span className={cn("text-sm font-semibold leading-snug", selected ? "text-foreground" : "text-muted-foreground")}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="size-4" /> Previous
          </button>
          {activeIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow transition-all hover:scale-105 hover:bg-primary/90"
            >
              Next <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full px-6 text-sm font-black shadow transition-all hover:scale-105",
                canSubmit && !submitting
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground hover:scale-100"
              )}
            >
              {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : "Submit Quest ✓"}
            </button>
          )}
        </div>
      </div>

      {/* Question nav dots */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {questions.map((qq, i) => {
          const answered = !!selectedAnswers[qq.id];
          const active = i === activeIndex;
          return (
            <button
              key={qq.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "flex size-8 items-center justify-center rounded-xl text-xs font-black transition-all",
                active && !answered && "border-2 border-primary bg-primary/10 text-primary scale-110",
                !active && !answered && "bg-card text-muted-foreground border border-border hover:border-primary/30",
                answered && !active && "bg-primary/15 text-primary border border-primary/30",
                answered && active && "bg-primary text-primary-foreground scale-110"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Result View ───────────────────────────────────────── */
const ResultView = ({ result, nextResetAt, onBack }) => {
  const score = result?.scoreSummary || {};
  const rewards = result?.rewardsAwarded || {};
  const answers = Array.isArray(result?.questionResults) ? result.questionResults : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="relative flex flex-col items-center overflow-hidden rounded-[32px] border border-border bg-card p-8 text-center shadow-xl sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 transition-transform hover:scale-110 duration-500">
          <CheckCircle2 className="size-10 text-primary" />
        </div>
        
        <p className="text-[0.8rem] font-black uppercase tracking-[0.25em] text-muted-foreground">Quest Completed!</p>
        <h2 className="mt-4 text-7xl font-black tracking-tighter text-foreground sm:text-8xl">
          {score.correctCount ?? 0}<span className="text-3xl font-bold text-muted-foreground sm:text-4xl">/5</span>
        </h2>
        <div className="mt-2 flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {score.accuracy ?? 0}% accuracy
          </p>
        </div>

        {/* Rewards Grid */}
        <div className="mt-10 grid w-full grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background/40 py-4 transition-all hover:bg-background/60">
            <p className="text-2xl font-black text-primary">+{rewards.xpAwarded ?? 0}</p>
            <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">XP</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background/40 py-4 transition-all hover:bg-background/60">
            <p className="text-2xl font-black text-foreground">+{rewards.coinsAwarded ?? 0}</p>
            <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">Coins</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background/40 py-4 transition-all hover:bg-background/60">
            <p className="text-2xl font-black text-foreground">{result?.streak?.currentStreak ?? 0}</p>
            <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
               Streak <Flame className="size-3 text-[#facc15]" />
            </p>
          </div>
        </div>
      </div>

      {/* Badge unlocked celebration */}
      {Array.isArray(result?.unlockedBadges) && result.unlockedBadges.length > 0 && (
        <div className="group flex items-center gap-5 rounded-[28px] border border-primary/30 bg-primary/10 px-8 py-5 shadow-lg shadow-primary/5 transition-all hover:bg-primary/15">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-4xl shadow-inner group-hover:scale-110 transition-transform">🏆</div>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.15em] text-primary">Milestone Achieved!</p>
            <p className="mt-1 truncate text-lg font-black leading-tight text-foreground">
              {result.unlockedBadges.map((b) => b.title || b.key).join(", ")}
            </p>
            <p className="text-xs font-bold text-primary/70">Badge added to your profile.</p>
          </div>
        </div>
      )}

      {/* Answer review */}
      <div className="rounded-[32px] border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-foreground">Review Answers</h3>
            <p className="text-xs font-bold text-muted-foreground">Deepen your professional readiness</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            {answers.filter((a) => a.isCorrect).length}/{answers.length} correct
          </div>
        </div>

        <div className="space-y-4 max-h-[520px] overflow-y-auto subtle-scrollbar pr-2">
          {answers.map((a, i) => (
            <div key={a.questionId} className={cn(
              "group relative overflow-hidden rounded-[24px] border p-5 transition-all",
              a.isCorrect 
                ? "border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]" 
                : "border-destructive/20 bg-destructive/[0.02] hover:bg-destructive/[0.05]"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-black transition-transform group-hover:scale-110",
                  a.isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                )}>
                  {a.isCorrect ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm font-black text-muted-foreground">{i + 1}.</span>
                    <p className="text-sm font-bold leading-relaxed text-foreground">
                      {a.questionText}
                    </p>
                  </div>
                  {!a.isCorrect && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-wider text-destructive">
                      Correct: {String(a.correctOptionId).toUpperCase()}
                    </div>
                  )}
                  {a.explanation && (
                    <div className="mt-4 rounded-2xl border border-border/50 bg-background/50 px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="size-3 text-muted-foreground" />
                        <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">Why this matters</p>
                      </div>
                      <p className="text-[0.8rem] font-medium leading-relaxed text-muted-foreground">
                        {a.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-4">
        <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-card/50 py-3 px-6 mx-auto">
          <Clock className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Next Quest Unlocks: <span className="font-black text-foreground ml-1">{formatReset(nextResetAt)}</span>
          </p>
        </div>
        
        <button
          type="button"
          onClick={onBack}
          className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 text-base font-black text-primary-foreground shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          Back to Dashboard <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

/* ── Page ──────────────────────────────────────────────── */
const FreelancerGrowthQuestPage = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [quest, setQuest] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingQuest, setLoadingQuest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [idempotencyKey, setIdempotencyKey] = useState(makeKey);

  const loadDashboard = useCallback(async () => {
    if (!authFetch) return;
    setLoadingDashboard(true);
    try {
      const res = await authFetch("/engagement/dashboard", { suppressToast: true });
      const payload = await res.json().catch(() => null);
      if (res.ok) setDashboard(payload?.data || null);
    } catch { /* silent */ } finally { setLoadingDashboard(false); }
  }, [authFetch]);

  useEffect(() => { if (view === "dashboard") loadDashboard(); }, [view, loadDashboard]);

  const startQuest = async () => {
    if (!authFetch) return;
    setLoadingQuest(true);
    setError("");
    try {
      const res = await authFetch("/engagement/daily/start", { method: "POST", suppressToast: true });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Failed to start quest.");
      const data = payload?.data || {};
      setQuest(data);
      if (data.status === "completed") { setResult(data.resultSummary || null); setView("result"); }
      else { setIdempotencyKey(makeKey()); setSelectedAnswers({}); setActiveIndex(0); setView("quiz"); }
    } catch (err) { setError(err?.message || "Quest unavailable."); }
    finally { setLoadingQuest(false); }
  };

  const questions = useMemo(() => Array.isArray(quest?.questions) ? quest.questions : [], [quest?.questions]);
  const canSubmit = questions.length > 0 && questions.every((q) => selectedAnswers[q.id]);
  const handleSelectAnswer = (qId, optId) => setSelectedAnswers((prev) => ({ ...prev, [qId]: optId }));

  const handleSubmit = async () => {
    if (!authFetch || !canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await authFetch("/engagement/daily/submit", {
        method: "POST",
        body: JSON.stringify({ idempotencyKey, answers: questions.map((q) => ({ questionId: q.id, selectedOptionId: selectedAnswers[q.id] })) }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Failed to submit.");
      const data = payload?.data || {};
      setQuest(data); setResult(data.resultSummary || null); setView("result");
      toast.success("Growth Quest completed! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err?.message || "Submission failed."); toast.error(err?.message || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <FreelancerTopBar />
      <main className="mx-auto w-full max-w-[1200px] px-5 pb-16 pt-8 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { if (view === "quiz") setView("dashboard"); else navigate("/freelancer"); }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-black text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:scale-105 active:scale-95 shadow-sm"
            >
              <ArrowLeft className="size-4" />
              {view === "quiz" ? "Cancel Quest" : "Back Home"}
            </button>
            <div className="h-4 w-px bg-border" />
            <p className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-muted-foreground">
              {view === "quiz" ? "Growth Quiz" : view === "result" ? "Quest Review" : "Growth Hub"}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            title="How does Growth Quest work?"
            className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-black text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:scale-105 active:scale-95 shadow-sm"
          >
            <Info className="size-4" />
            <span className="hidden sm:inline">How it works</span>
          </button>
        </div>

        {view === "dashboard" && <DashboardView dashboard={dashboard} loading={loadingDashboard} error={error} onStartQuest={startQuest} />}

        {view === "quiz" && (
          loadingQuest ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <QuizView
              questions={questions}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              selectedAnswers={selectedAnswers}
              handleSelectAnswer={handleSelectAnswer}
              onSubmit={handleSubmit}
              submitting={submitting}
              canSubmit={canSubmit}
              error={error}
            />
          )
        )}

        {view === "result" && <ResultView result={result} nextResetAt={quest?.nextResetAt} onBack={() => setView("dashboard")} />}
      </main>
    </div>
  );
};

export default FreelancerGrowthQuestPage;
