import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import Flame from "lucide-react/dist/esm/icons/flame";
import Info from "lucide-react/dist/esm/icons/info";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Target from "lucide-react/dist/esm/icons/target";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import X from "lucide-react/dist/esm/icons/x";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Zap from "lucide-react/dist/esm/icons/zap";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import BadgeShelf from "./BadgeShelf";
import ProcessSummaryCard from "./ProcessSummaryCard";
import StreakCalendar from "./StreakCalendar";

const PAGE_CLASS =
  "min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(255,193,7,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08),transparent_40%),linear-gradient(180deg,rgba(10,10,11,0.98),rgba(10,10,11,1))] text-foreground selection:bg-primary/30";
const CARD_CLASS =
  "rounded-[16px] border border-white/[0.06] bg-black/40 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)] transition-all duration-300";
const SUBTLE_CARD_CLASS = 
  "rounded-[12px] border border-white/[0.04] bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04]";
const PRIMARY_BUTTON_CLASS =
  "relative inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-primary to-amber-500 px-5 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,193,7,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none";
const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-foreground backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary disabled:opacity-40";
const EYEBROW_CLASS =
  "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground";
const LABEL_CLASS =
  "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground";
const LABELS = ["A", "B", "C", "D", "E"];

const HOW_IT_WORKS = [
  { title: "1. Start", desc: "Open the daily quest and answer the questions." },
  { title: "2. Submit", desc: "Finish the set in a few minutes." },
  { title: "3. Earn", desc: "Get XP, coins, and streak progress." },
];
const PROGRESS_SECTIONS = [
  {
    title: "Daily goal",
    desc: "Complete today’s questions and keep your streak moving.",
  },
  {
    title: "Profile growth",
    desc: "Earn XP and coins that reflect regular activity on the platform.",
  },
  {
    title: "Learning loop",
    desc: "Use the review section to understand mistakes and improve tomorrow.",
  },
];
const SKILL_BREAKDOWN = [
  { label: "Execution", value: 85, barClass: "bg-emerald-500" },
  { label: "Strategy", value: 65, barClass: "bg-primary" },
  { label: "Knowledge", value: 40, barClass: "bg-amber-500" },
];

const makeKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `gq-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatReset = (resetAt) => {
  if (!resetAt) return "UTC midnight";
  const d = new Date(resetAt);
  return Number.isNaN(d.getTime())
    ? "UTC midnight"
    : d.toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });
};

const InfoModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className={cn(CARD_CLASS, "relative z-10 w-full max-w-xl overflow-hidden")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={EYEBROW_CLASS}>Growth Quest Guide</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                Simple daily progress
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Answer the daily questions, submit once, and track your streak,
                XP, and coins in one place.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(SECONDARY_BUTTON_CLASS, "h-10 w-10 px-0 py-0")}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-3">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.title} className={cn(SUBTLE_CARD_CLASS, "p-4")}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-primary/12 text-xs font-semibold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[6px] border border-primary/20 bg-primary/8 px-4 py-3">
            <p className="text-sm leading-6 text-primary">
              Resets at <span className="font-semibold text-foreground">00:00 UTC</span>.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/[0.08] px-6 py-4">
          <Button onClick={onClose} className={cn(PRIMARY_BUTTON_CLASS, "min-w-36")}>
            Got it, thanks
          </Button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className={cn(CARD_CLASS, "p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_10px_30px_-10px_rgba(255,193,7,0.15)] group")}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={cn(LABEL_CLASS, "group-hover:text-primary/80 transition-colors")}>{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
          {value}
        </p>
        {sub ? <p className="mt-1 text-xs font-medium text-muted-foreground">{sub}</p> : null}
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
        <Icon className="size-5 text-primary" />
      </div>
    </div>
  </div>
);

const LeaderRow = ({ rank, name, coins, isYou }) => {
  const isTop3 = rank <= 3;
  const rankColors = {
    1: "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950",
    2: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
    3: "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50"
  };

  return (
    <div
      className={cn(
        SUBTLE_CARD_CLASS,
        "flex items-center gap-3 px-4 py-3 group hover:border-primary/20",
        isYou && "border-primary/40 bg-primary/10 shadow-[inset_0_0_20px_rgba(255,193,7,0.05)]",
      )}
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[8px] text-xs font-bold shadow-sm",
        isTop3 ? rankColors[rank] : "bg-white/[0.05] text-muted-foreground"
      )}>
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            isYou ? "text-primary" : "text-foreground",
          )}
        >
          {name}
        </p>
        <p className="text-[0.7rem] font-medium text-muted-foreground">{coins} coins</p>
      </div>
      {isTop3 ? <Star className={cn("size-4", rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : "text-amber-600")} /> : null}
    </div>
  );
};

const DashboardView = ({ dashboard, onStartQuest, loading, error }) => {
  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm">Loading your Growth Quest.</p>
        </div>
      </div>
    );
  }

  const profile = dashboard?.profile || {};
  const today = dashboard?.today || {};
  const streak = profile.currentStreak || 0;
  const coins = profile.loyaltyCoins || 0;
  const xp = profile.totalXP || profile.lifetimeXp || profile.xp || 0;
  const used = today.attemptsUsed || 0;
  const max = today.maxAttempts || 2;
  const done = used >= max;
  const isRetake = used > 0 && !done;
  const levelThresholds = [0, 200, 600, 1500, 3500];
  const levelNames = [
    "Starter",
    "Active Learner",
    "Skilled Contributor",
    "Pro Contributor",
    "Gold Contributor",
  ];
  const currentLevelIdx = levelThresholds.reduce(
    (acc, threshold, index) => (xp >= threshold ? index : acc),
    0,
  );
  const nextThreshold = levelThresholds[currentLevelIdx + 1] ?? null;
  const prevThreshold = levelThresholds[currentLevelIdx] ?? 0;
  const levelNumber = Number(
    profile.level ||
      String(profile.engagementLevel || "").match(/\d+/)?.[0] ||
      currentLevelIdx + 1,
  );
  const levelLabel =
    profile.engagementLevelLabel || levelNames[currentLevelIdx] || "Starter";
  const xpPct = nextThreshold
    ? Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
    : 100;
  const leaderboard = [
    { rank: 1, name: "Alex R.", coins: 4250 },
    { rank: 2, name: "Sam K.", coins: 3840 },
    { rank: 3, name: "Jordan M.", coins: 3210 },
    { rank: 12, name: "You", coins, isYou: true },
  ];

  return (
    <div className="space-y-6">
      <section className={cn(CARD_CLASS, "overflow-hidden")}>
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-white/[0.08] p-6 lg:border-b-0 lg:border-r">
            <p className={EYEBROW_CLASS}>Daily Freelancer Practice</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              One small daily quest to keep your profile active.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
              Answer a few questions, submit your quest, and earn progress for the day.
            </p>

            <div className="mt-6">
              <StreakCalendar
                streakHistory={dashboard?.profile?.streakHistory}
                currentStreak={streak}
                completedToday={done}
              />
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={LABEL_CLASS}>Today</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {done ? "Today's quest is complete" : "Ready for today's session"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary/10">
                <Target className="size-4 text-primary" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-3")}>
                <p className={LABEL_CLASS}>Attempts</p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {used}/{max}
                </p>
              </div>
              <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-3")}>
                <p className={LABEL_CLASS}>Reset</p>
                <p className="mt-1 text-base font-semibold text-foreground">UTC midnight</p>
              </div>
              <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-3")}>
                <p className={LABEL_CLASS}>Time</p>
                <p className="mt-1 text-base font-semibold text-foreground">About 5 minutes</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartQuest}
              disabled={done}
              className={cn(PRIMARY_BUTTON_CLASS, "mt-5 w-full justify-center")}
            >
              {done ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Completed for today
                </>
              ) : (
                <>
                  Start Growth Quest
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            <p className="mt-3 text-sm text-muted-foreground">
              {isRetake
                ? `${max - used} retake remaining today.`
                : "Best attempt counts."}
            </p>

            {error ? (
              <div className="mt-4 rounded-[6px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Zap} label="Level" value={`L${levelNumber}`} sub={levelLabel} />
        <StatCard icon={Flame} label="Streak" value={`${streak} days`} sub="Daily consistency" />
        <StatCard icon={Star} label="Coins" value={coins} sub="Reward balance" />
        <StatCard
          icon={Trophy}
          label="Progress"
          value={`${xpPct}%`}
          sub={nextThreshold ? `${nextThreshold - xp} XP to next level` : "Top tier reached"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className={cn(CARD_CLASS, "p-6")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={EYEBROW_CLASS}>Progress Overview</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Your progress today
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  A simple view of your current level, XP progress, and estimated strengths.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary/20 to-primary/5 shadow-[0_0_15px_rgba(255,193,7,0.15)]">
                <Zap className="size-5 text-primary drop-shadow-[0_0_8px_rgba(255,193,7,0.8)]" />
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
              <div className={cn(SUBTLE_CARD_CLASS, "p-5")}>
                <p className={LABEL_CLASS}>Total XP</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
                  {xp}
                </p>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/40 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-primary transition-all duration-1000 ease-out"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {nextThreshold
                    ? `${nextThreshold - xp} XP until level ${levelNumber + 1}`
                    : "You have reached the top listed level."}
                </p>
              </div>

              <div className={cn(SUBTLE_CARD_CLASS, "p-5")}>
                <div className="flex items-center justify-between gap-3">
                  <p className={LABEL_CLASS}>Skill Breakdown</p>
                  <span className="text-xs text-muted-foreground">Recent estimate</span>
                </div>
                <div className="mt-5 space-y-4">
                  {SKILL_BREAKDOWN.map((skill) => (
                    <div key={skill.label}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-foreground">{skill.label}</span>
                        <span className="text-sm text-muted-foreground">{skill.value}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40 shadow-inner">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000 ease-out", skill.barClass.replace('bg-', 'bg-gradient-to-r from-transparent to-'))}
                          style={{ width: `${skill.value}%`, backgroundColor: skill.barClass.includes('emerald') ? '#10b981' : skill.barClass.includes('amber') ? '#f59e0b' : '#ffc107' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <BadgeShelf
            badges={dashboard?.profile?.badges || []}
            currentStreak={streak}
          />

          <ProcessSummaryCard processSummary={dashboard?.processSummary} />
        </div>

        <div className={cn(CARD_CLASS, "p-6")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={EYEBROW_CLASS}>Leaderboard</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Weekly ranking
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A quick look at how your consistency compares with other freelancers.
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary/10">
              <Trophy className="size-4 text-primary" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {leaderboard.map((entry) => (
              <LeaderRow key={entry.rank} {...entry} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const QuizView = ({
  questions,
  activeIndex,
  setActiveIndex,
  selectedAnswers,
  handleSelectAnswer,
  onSubmit,
  submitting,
  canSubmit,
  error,
}) => {
  const question = questions[activeIndex];

  if (!question) return null;

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={EYEBROW_CLASS}>Daily Growth Quest</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Question {activeIndex + 1}
              <span className="text-muted-foreground"> of {questions.length}</span>
            </h2>
          </div>
          <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-3")}>
            <p className={LABEL_CLASS}>Category</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {question.categoryLabel || "Client Readiness"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {questions.map((entry, index) => {
            const answered = Boolean(selectedAnswers[entry.id]);
            const active = index === activeIndex;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "rounded-[6px] border px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : answered
                      ? "border-primary/20 bg-background text-foreground"
                      : "border-white/[0.08] bg-background/40 text-muted-foreground hover:border-primary/20",
                )}
              >
                <span className="font-medium">Question {index + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className={cn(SUBTLE_CARD_CLASS, "p-5 sm:p-6")}>
            <p className="text-lg font-medium leading-8 text-foreground">
              {question.questionText}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(question.options || []).map((option, index) => {
                const selected = selectedAnswers[question.id] === option.id;
                const label = LABELS[index] || option.id.toUpperCase();

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectAnswer(question.id, option.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-[6px] border px-4 py-4 text-left transition-colors",
                      selected
                        ? "border-primary/40 bg-primary/10"
                        : "border-white/[0.08] bg-card hover:border-primary/20 hover:bg-white/[0.02]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-xs font-semibold",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        "text-sm leading-6",
                        selected ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[6px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {answeredCount}/{questions.length} answered
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              disabled={activeIndex === 0}
              className={SECONDARY_BUTTON_CLASS}
            >
              <ArrowLeft className="size-4" />
              Previous
            </button>

            {activeIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((index) => Math.min(questions.length - 1, index + 1))
                }
                className={PRIMARY_BUTTON_CLASS}
              >
                Next
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || submitting}
                className={PRIMARY_BUTTON_CLASS}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submit Quest"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultView = ({ result, nextResetAt, onBack }) => {
  const score = result?.scoreSummary || result?.score || {};
  const rewards = result?.rewardsAwarded || result?.rewards || {};
  const answers = Array.isArray(result?.questionResults)
    ? result.questionResults
    : Array.isArray(result?.answers)
      ? result.answers
      : [];
  const questionCount = score.questionCount || answers.length || 5;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className={EYEBROW_CLASS}>Quest Completed</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {score.correctCount ?? 0}
              <span className="ml-2 text-2xl text-muted-foreground sm:text-3xl">
                / {questionCount}
              </span>
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-white/[0.08] bg-background/60 px-3 py-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              {score.accuracy ?? 0}% accuracy
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Quick summary of today&apos;s result.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-4")}>
              <p className={LABEL_CLASS}>XP Earned</p>
              <p className="mt-2 text-2xl font-semibold text-primary">
                +{rewards.xpAwarded ?? 0}
              </p>
            </div>
            <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-4")}>
              <p className={LABEL_CLASS}>Coins Earned</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                +{rewards.coinsAwarded ?? 0}
              </p>
            </div>
            <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-4")}>
              <p className={LABEL_CLASS}>Current Streak</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-foreground">
                {result?.streak?.currentStreak ?? 0}
                <Flame className="size-4 text-primary" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {Array.isArray(result?.unlockedBadges) && result.unlockedBadges.length > 0 ? (
        <section className="rounded-[6px] border border-primary/20 bg-primary/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-primary/15">
              <Trophy className="size-4 text-primary" />
            </div>
            <div>
              <p className={LABEL_CLASS}>New Milestone</p>
              <p className="mt-1 text-base font-medium text-foreground">
                {result.unlockedBadges.map((badge) => badge.title || badge.key).join(", ")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The badge has been added to your profile.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={cn(CARD_CLASS, "p-6 sm:p-8")}>
        <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={EYEBROW_CLASS}>Answer Review</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Review answers
            </h3>
          </div>
          <div className={cn(SUBTLE_CARD_CLASS, "px-4 py-2 text-sm text-muted-foreground")}>
            {answers.filter((answer) => answer.isCorrect).length}/{answers.length} correct
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={cn(
                "rounded-[6px] border px-4 py-4",
                answer.isCorrect
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-destructive/20 bg-destructive/[0.04]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]",
                    answer.isCorrect
                      ? "bg-emerald-500/12 text-emerald-500"
                      : "bg-destructive/12 text-destructive",
                  )}
                >
                  {answer.isCorrect ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <span className="pt-0.5 text-sm text-muted-foreground">{index + 1}.</span>
                    <p className="text-sm font-medium leading-6 text-foreground">
                      {answer.questionText}
                    </p>
                  </div>

                  {!answer.isCorrect ? (
                    <div className="mt-3 inline-flex rounded-[6px] border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                      Correct answer: {String(answer.correctOptionId).toUpperCase()}
                    </div>
                  ) : null}

                  {answer.explanation ? (
                    <div className={cn(SUBTLE_CARD_CLASS, "mt-4 px-4 py-3")}>
                      <div className="flex items-center gap-2">
                        <Info className="size-3.5 text-muted-foreground" />
                        <p className={LABEL_CLASS}>Why this matters</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {answer.explanation}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="mx-auto flex items-center gap-2 rounded-[6px] border border-white/[0.08] bg-card px-4 py-3 text-sm text-muted-foreground">
          <Clock className="size-4" />
          Next quest unlocks at{" "}
          <span className="font-medium text-foreground">{formatReset(nextResetAt)}</span>
        </div>

        <button type="button" onClick={onBack} className={cn(PRIMARY_BUTTON_CLASS, "w-full")}>
          Back to Growth Hub
          <ArrowRight className="size-4" />
        </button>
      </section>
    </div>
  );
};

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
  const [infoOpen, setInfoOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!authFetch) return;

    setLoadingDashboard(true);

    try {
      const response = await authFetch("/engagement/dashboard", {
        suppressToast: true,
      });
      const payload = await response.json().catch(() => null);

      if (response.ok) {
        setDashboard(payload?.data || null);
      }
    } catch {
      // Silent by design. The page handles empty state presentation.
    } finally {
      setLoadingDashboard(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (view === "dashboard") {
      loadDashboard();
    }
  }, [loadDashboard, view]);

  const startQuest = async () => {
    if (!authFetch) return;

    setLoadingQuest(true);
    setError("");

    try {
      const response = await authFetch("/engagement/daily/start", {
        method: "POST",
        suppressToast: true,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to start quest.");
      }

      const data = payload?.data || {};
      setQuest(data);

      if (data.status === "completed") {
        setResult(data.resultSummary || null);
        setView("result");
      } else {
        setIdempotencyKey(makeKey());
        setSelectedAnswers({});
        setActiveIndex(0);
        setView("quiz");
      }
    } catch (err) {
      setError(err?.message || "Quest unavailable.");
    } finally {
      setLoadingQuest(false);
    }
  };

  const questions = useMemo(
    () => (Array.isArray(quest?.questions) ? quest.questions : []),
    [quest?.questions],
  );
  const canSubmit =
    questions.length > 0 && questions.every((question) => selectedAnswers[question.id]);

  const handleSelectAnswer = (questionId, optionId) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!authFetch || !canSubmit || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await authFetch("/engagement/daily/submit", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey,
          answers: questions.map((question) => ({
            questionId: question.id,
            selectedOptionId: selectedAnswers[question.id],
          })),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to submit.");
      }

      const data = payload?.data || {};
      setQuest(data);
      setResult(data.resultSummary || null);
      setView("result");
      toast.success("Growth Quest completed.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.message || "Submission failed.");
      toast.error(err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={PAGE_CLASS}>
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />

      <main className="mx-auto w-full max-w-[1240px] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (view === "quiz") {
                    setView("dashboard");
                    return;
                  }

                  navigate("/");
                }}
                className={SECONDARY_BUTTON_CLASS}
              >
                <ArrowLeft className="size-4" />
                {view === "quiz" ? "Cancel quest" : "Back"}
              </button>
              <p className={EYEBROW_CLASS}>
                {view === "quiz"
                  ? "Growth Quest Session"
                  : view === "result"
                    ? "Quest Review"
                    : "Freelancer Growth Hub"}
              </p>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Growth Quest
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
              Simple daily questions, quick progress, and one clear action.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className={SECONDARY_BUTTON_CLASS}
            title="How Growth Quest works"
          >
            <Info className="size-4" />
            How it works
          </button>
        </div>

        {view === "dashboard" ? (
          <DashboardView
            dashboard={dashboard}
            loading={loadingDashboard}
            error={error}
            onStartQuest={startQuest}
          />
        ) : null}

        {view === "quiz" ? (
          loadingQuest ? (
            <div className="flex min-h-[420px] items-center justify-center">
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
        ) : null}

        {view === "result" ? (
          <ResultView
            result={result}
            nextResetAt={quest?.nextResetAt}
            onBack={() => setView("dashboard")}
          />
        ) : null}
      </main>
    </div>
  );
};

export default FreelancerGrowthQuestPage;
