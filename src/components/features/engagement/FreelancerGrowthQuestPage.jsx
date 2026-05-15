import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import Flame from "lucide-react/dist/esm/icons/flame";
import Info from "lucide-react/dist/esm/icons/info";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Medal from "lucide-react/dist/esm/icons/medal";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
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
import "./FreelancerGrowthQuestPage.css";

const PAGE_CLASS = "growth-quest-page";
const CARD_CLASS = "growth-quest-panel";
const SUBTLE_CARD_CLASS = "growth-quest-subpanel";
const PRIMARY_BUTTON_CLASS = "growth-quest-button growth-quest-button--primary";
const SECONDARY_BUTTON_CLASS = "growth-quest-button growth-quest-button--secondary";
const EYEBROW_CLASS = "growth-quest-eyebrow";
const LABEL_CLASS = "growth-quest-label";
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

const clampPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const formatCompactDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDayKey = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "Pending";
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (value) =>
  String(value || "You")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const WeeklyRankingPanel = ({ leaderboard, currentUserId }) => {
  const entries = Array.isArray(leaderboard?.entries) ? leaderboard.entries : [];
  const currentUser = leaderboard?.currentUser || null;
  const visibleEntries = currentUser
    ? [
        ...entries.slice(0, 3),
        ...entries.filter(
          (entry, index) =>
            index >= 3 &&
            (entry.userId === currentUserId ||
              Math.abs(Number(entry.rank || 0) - Number(currentUser.rank || 0)) <= 1),
        ),
      ].filter((entry, index, array) => array.findIndex((item) => item.userId === entry.userId) === index)
    : entries;

  return (
    <div className="rounded-[18px] border border-[#332917] bg-[linear-gradient(180deg,rgba(16,13,8,0.98),rgba(11,9,6,0.98))] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl border border-[#4e4127] bg-[#18130b]">
          <Medal className="size-5 text-[#d3be92]" />
        </div>
        <div>
          <h3 className="text-[1.65rem] font-bold tracking-tight text-[#f3ead5]">Weekly Ranking</h3>
          <p className="mt-1 text-sm leading-6 text-[#a99c84]">
            Compete for weekly XP rank. Contest rewards and Growth Quest activity both count here.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-[18px] border border-[#332917] bg-[#161107]">
        <div className="grid grid-cols-[92px_minmax(0,1fr)_120px] gap-3 border-b border-[#2d2413] px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8f846b]">
          <span>Rank</span>
          <span>Freelancer</span>
          <span className="text-right">Coins Earned</span>
        </div>

        <div className="space-y-2 p-3">
          {visibleEntries.length ? (
            visibleEntries.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  "grid grid-cols-[92px_minmax(0,1fr)_120px] items-center gap-3 rounded-[14px] border px-4 py-4 transition-colors",
                  entry.userId === currentUserId
                    ? "border-[#b89f68] bg-[linear-gradient(90deg,rgba(184,159,104,0.1),rgba(184,159,104,0.025))] shadow-[inset_3px_0_0_#b89f68]"
                    : "border-[#342a17] bg-[#20180c]",
                )}
              >
                <div className="text-2xl font-bold text-[#ead7a6]">{entry.rank}</div>
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase",
                      entry.userId === currentUserId
                        ? "border-[#b89f68] bg-[#262014] text-[#e2d0a4]"
                        : "border-[#5a4418] bg-[#171107] text-[#d8c7a1]",
                    )}
                  >
                    {getInitials(entry.userId === currentUserId ? "You" : entry.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#f0e6cf]">
                      {entry.userId === currentUserId ? "You" : entry.fullName}
                    </p>
                    <p className="mt-1 text-xs text-[#9f9278]">{entry.engagementLevelLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#f1d48b]">{entry.weeklyCoins.toLocaleString()}</p>
                  <p className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-[#7d725d]">CO</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#3a2d11] bg-[#1a1409] p-5 text-sm text-[#a99c84]">
              Weekly rankings will appear after freelancers start earning XP this week.
            </div>
          )}
        </div>
      </div>

      {currentUser ? (
        <div className="mt-4 rounded-[14px] border border-[#332917] bg-[#171208] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8f846b]">Your weekly totals</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#f0e6cf]">
            <span>Rank #{currentUser.rank}</span>
            <span>{currentUser.weeklyXp.toLocaleString()} XP</span>
            <span>{currentUser.weeklyCoins.toLocaleString()} coins</span>
            <span>{currentUser.contestWins} contest wins</span>
          </div>
        </div>
      ) : null}
    </div>
  );
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
  const streakHistory = Array.isArray(profile.streakHistory) ? profile.streakHistory : [];
  const completedDays = streakHistory.filter((entry) => entry?.completed).length;
  const weeklyEfficiency = clampPercent((completedDays / 7) * 100 || (streak > 0 ? streak * 12 : 0));
  const operations = [
    {
      id: "daily-quest",
      difficulty: done ? "Complete" : used > 0 ? "In Progress" : "Live",
      difficultyTone: done ? "success" : used > 0 ? "warning" : "success",
      title: "Daily Freelancer Practice",
      description: done
        ? "Today’s session is complete. Review your result and return after reset."
        : "Answer today’s timed set and keep your profile progression moving.",
      progressLabel: "Quest status",
      progress: done ? 100 : max > 0 ? Math.round((used / max) * 100) : 0,
      coinLabel: `${Math.max(50, streak * 25 || 50)} coins`,
      xpLabel: `+${Math.max(200, Math.round(xpPct * 8))} XP`,
    },
    {
      id: "level-progress",
      difficulty: "Level Track",
      difficultyTone: "neutral",
      title: `${levelLabel} Progression`,
      description: nextThreshold
        ? `You need ${Math.max(0, nextThreshold - xp)} XP to unlock level ${levelNumber + 1}.`
        : "Top tier reached. Maintain your streak to protect position and rewards.",
      progressLabel: "Level completion",
      progress: xpPct,
      coinLabel: `${coins} balance`,
      xpLabel: nextThreshold ? `${nextThreshold - xp} XP left` : "Max level",
    },
  ];
  const availableContracts = [
    {
      id: "review-flow",
      category: "Skill Building",
      tier: "Easy",
      title: "Review Yesterday’s Answers",
      description:
        "Use the answer review and explanations to sharpen pattern recognition for tomorrow.",
      rewardCoins: 150,
      rewardXp: 500,
    },
    {
      id: "process-check",
      category: "Live Contract",
      tier: done ? "Ready" : "Medium",
      title: "Maintain Delivery Consistency",
      description:
        "Sustain your streak, protect momentum, and move toward the next engagement tier.",
      rewardCoins: 400,
      rewardXp: 1800,
    },
  ];
  const historyRows = [
    {
      id: "today",
      label: done ? "Daily Freelancer Practice" : "Today's Quest Pending",
      type: "Daily Protocol",
      date: done ? "Today" : formatCompactDate(today.resetAt || Date.now()),
      rewards: done ? `+${Math.max(50, streak * 25 || 50)} / +${Math.max(200, Math.round(xpPct * 8))} XP` : "Locked until completion",
    },
    {
      id: "streak",
      label: `${streak}-Day Streak Milestone`,
      type: "Progress Track",
      date: streak > 0 ? "Current" : "Start today",
      rewards: `${coins} coins banked`,
    },
    {
      id: "level",
      label: `${levelLabel} Rank Progress`,
      type: "Level Track",
      date: nextThreshold ? `${Math.max(0, nextThreshold - xp)} XP remaining` : "Completed",
      rewards: `Level ${levelNumber}`,
    },
  ];
  const searchPlaceholder = "Search parameters...";
  const filters = ["All Categories", "Skill Building", "Live Contracts", "Speed Trials"];
  const boosterRows = [
    { label: "Focus", value: done ? "Secured" : "01h 12m", tone: "success" },
    { label: "XP x1.5", value: nextThreshold ? "22h 45m" : "Active", tone: "violet" },
  ];

  return (
    <div className="growth-quest-dashboard">
      <section className="growth-quest-hero growth-quest-panel">
        <div className="growth-quest-hero__content">
          <div className="growth-quest-hero__meta">
            <span className={EYEBROW_CLASS}>Daily Protocol</span>
            <span className="growth-quest-chip growth-quest-chip--ghost">
              <Clock className="size-3.5" />
              Resets {formatReset(today.resetAt)}
            </span>
          </div>
          <h2 className="growth-quest-hero__title">Freelancer Practice</h2>
          <p className="growth-quest-hero__description">
            Maintain your operational edge. Complete today&apos;s simulation to sustain your
            momentum bonus.
          </p>
        </div>

        <div className="growth-quest-hero__sidebar growth-quest-subpanel">
          <div className="growth-quest-hero__sidebar-head">
            <div>
              <p className={LABEL_CLASS}>Current Streak</p>
              <p className="growth-quest-hero__streak">
                <Flame className="size-5" />
                {streak} Days
              </p>
            </div>
            <div className="growth-quest-attempts-ring">
              <span className={LABEL_CLASS}>Attempts</span>
              <strong>
                {used}/{max}
              </strong>
            </div>
          </div>

          <div className="growth-quest-hero__stats">
            <div className="growth-quest-hero__stat">
              <span className={LABEL_CLASS}>Completed days</span>
              <strong>{activity?.completedDays || 0}</strong>
            </div>
            <div className="growth-quest-hero__stat">
              <span className={LABEL_CLASS}>Questions answered</span>
              <strong>{activity?.totalQuestionsAnswered || 0}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartQuest}
            disabled={done}
            className={cn(PRIMARY_BUTTON_CLASS, "growth-quest-hero__cta")}
          >
            {done ? (
              <>
                <CheckCircle2 className="size-4" />
                Completed for today
              </>
            ) : (
              <>
                Start Today&apos;s Quest
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="growth-quest-helper">
            {isRetake ? `${max - used} retake remaining today.` : "Best attempt counts."}
          </p>

          {error ? <div className="growth-quest-error">{error}</div> : null}
        </div>
      </section>

      <section className="growth-quest-toolbar growth-quest-panel py-3">
        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-primary/80">Live Pulse</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex flex-wrap gap-6">
            {filters.slice(1).map((filter) => (
              <div key={filter} className="flex items-center gap-2 text-xs text-muted-foreground/80 hover:text-foreground transition-colors cursor-default">
                <Info className="size-3 text-primary/60" />
                <span>{filter} protocol active</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="growth-quest-grid">
        <aside className="growth-quest-side">
          <div className="growth-quest-panel growth-quest-side__panel">
            <div>
              <h3 className="growth-quest-side__title">
                <Sparkles className="size-4" />
                Quick Stats
              </h3>
              <div className="growth-quest-mini-card">
                <p className={LABEL_CLASS}>Weekly snapshot</p>
                <div className="growth-quest-stat-grid">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="growth-quest-stat-tile">
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="growth-quest-mini-card">
                <p className={LABEL_CLASS}>Active Boosters</p>
                <div className="growth-quest-boosters">
                  {boosterRows.map((booster) => (
                    <div key={booster.label} className="growth-quest-booster-row">
                      <span className={`tone-${booster.tone}`}>{booster.label}</span>
                      <span>{booster.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="growth-quest-rank-card">
              <p className={LABEL_CLASS}>Rank Progress</p>
              <strong>{levelLabel}</strong>
              <div className="growth-quest-progress">
                <span style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>
        </aside>

        <div className="growth-quest-main-column">
          <section>
            <div className="growth-quest-section-head">
              <div className="growth-quest-section-title">
                <span className="growth-quest-pulse-dot" />
                <h3>Active Operations</h3>
              </div>
              <button type="button" className="growth-quest-inline-link">
                View Dashboard
                <ArrowRight className="size-4" />
              </button>
            </div>

            <div className="growth-quest-card-grid">
              {operations.map((operation) => (
                <article key={operation.id} className="growth-quest-panel growth-quest-card">
                  <div className="growth-quest-card__head">
                    <span className={`growth-quest-chip growth-quest-chip--${operation.difficultyTone}`}>
                      {operation.difficulty}
                    </span>
                    <button type="button" className="growth-quest-dots" aria-label="More actions">
                      <span />
                      <span />
                      <span />
                    </button>
                  </div>

                  <div>
                    <h4>{operation.title}</h4>
                    <p>{operation.description}</p>
                  </div>

                  <div className="growth-quest-card__progress">
                    <div className="growth-quest-card__progress-head">
                      <span>{operation.progressLabel}</span>
                      <strong>{operation.progress}%</strong>
                    </div>
                    <div className="growth-quest-progress">
                      <span style={{ width: `${operation.progress}%` }} />
                    </div>
                  </div>

                  <div className="growth-quest-card__foot">
                    <span>{operation.coinLabel}</span>
                    <span>{operation.xpLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="growth-quest-section-head growth-quest-section-head--with-line">
              <h3>Available Contracts</h3>
              <div className="growth-quest-nav-pills">
                <button type="button" aria-label="Previous">
                  <ArrowLeft className="size-4" />
                </button>
                <button type="button" aria-label="Next">
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>

            <div className="growth-quest-card-grid">
              {availableContracts.map((contract) => (
                <article key={contract.id} className="growth-quest-panel growth-quest-contract">
                  <div className="growth-quest-contract__head">
                    <div>
                      <p className="growth-quest-contract__category">{contract.category}</p>
                      <h4>{contract.title}</h4>
                    </div>
                    <span className="growth-quest-chip growth-quest-chip--ghost">{contract.tier}</span>
                  </div>
                  <p className="growth-quest-contract__description">{contract.description}</p>
                  <div className="growth-quest-contract__rewards">
                    <span>+{contract.rewardCoins}</span>
                    <span>+{contract.rewardXp} XP</span>
                  </div>
                  <button type="button" className="growth-quest-button growth-quest-button--outline">
                    Accept Quest
                    <Target className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          </section>

        </div>

        <aside className="growth-quest-rewards">
          <div className="growth-quest-panel growth-quest-rewards__panel">
            <div className="growth-quest-rewards__section">
              <h3 className="growth-quest-side__title">
                <Gem className="size-4" />
                Premium Rewards
              </h3>
              <div className="growth-quest-premium-card">
                <div className="growth-quest-premium-card__badge">Featured</div>
                <div className="growth-quest-premium-card__icon">
                  <Gem className="size-5" />
                </div>
                <h4>Go Pro Access</h4>
                <p>Unrestricted quests, faster support, custom branding, and 2x XP multipliers.</p>
                <button type="button" className={cn(PRIMARY_BUTTON_CLASS, "growth-quest-button--soft")}>
                  Upgrade Now
                </button>
              </div>
            </div>

            <div className="growth-quest-epic-card">
              <p className={LABEL_CLASS}>Partner Ops</p>
              <div className="growth-quest-epic-card__head">
                <h4>Project: Growth Core V3</h4>
                <span className="growth-quest-chip growth-quest-chip--violet">Epic</span>
              </div>
              <p>Lead the next-gen engagement loop and keep momentum systems sharp.</p>
              <div className="growth-quest-contract__rewards">
                <span>5k+</span>
                <span>25k XP</span>
              </div>
            </div>

            <div className="growth-quest-partner-box">
              <p>Want to list your quest here?</p>
              <button type="button" className="growth-quest-inline-link">
                Apply for Partnership
              </button>
            </div>

            <div className="mt-2">
              <StreakCalendar
                streakHistory={dashboard?.profile?.streakHistory}
                currentStreak={streak}
                completedToday={done}
              />
            </div>
          </div>
        </aside>
      </section>

      <section className="growth-quest-intel-grid">
        <BadgeShelf badges={dashboard?.profile?.badges || []} currentStreak={streak} />
        <ProcessSummaryCard processSummary={dashboard?.processSummary} />
      </section>

      {hasRecentHistory ? (
        <section>
        <div className="growth-quest-section-title growth-quest-history-title">
          <Clock className="size-4" />
          <h3>Recent History</h3>
        </div>
        <div className="growth-quest-panel growth-quest-history">
          <table>
            <thead>
              <tr>
                <th>Quest Name</th>
                <th>Type</th>
                <th>Completion Date</th>
                <th>Rewards</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.type}</td>
                  <td>{row.date}</td>
                  <td>{row.rewards}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="growth-quest-history__footer">
            <button type="button" className="growth-quest-inline-link">
              View Full History
            </button>
          </div>
        </div>
        </section>
      ) : null}
    </div>
  );
};

const GrowthQuestLiveDashboard = ({ dashboard, onStartQuest, loading, error }) => {
  const navigate = useNavigate();
  const [sidePanel, setSidePanel] = useState("ranking");
  const intelSectionRef = useRef(null);
  const handleSidePanelSelect = useCallback((panel) => {
    setSidePanel(panel);
    window.requestAnimationFrame(() => {
      intelSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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
  const levelProgress = dashboard?.levelProgress || {};
  const nextMilestone = dashboard?.nextMilestone || {};
  const processSummary = dashboard?.processSummary || {};
  const activity = dashboard?.activity || {};
  const topicPerformance = Array.isArray(dashboard?.topicPerformance)
    ? dashboard.topicPerformance
    : [];
  const contests = Array.isArray(dashboard?.contests) ? dashboard.contests : [];
  const leaderboard = dashboard?.leaderboard || {};
  const recentSessions = Array.isArray(dashboard?.recentSessions)
    ? dashboard.recentSessions
    : [];
  const streak = profile.currentStreak || 0;
  const coins = profile.loyaltyCoins || 0;
  const xp = profile.totalXP || profile.lifetimeXp || profile.xp || 0;
  const used = today.attemptsUsed || 0;
  const max = today.maxAttempts || 2;
  const done = today.status === "completed" || used >= max;
  const isRetake = used > 0 && !done;
  const levelNumber = Number(String(profile.engagementLevel || "").match(/\d+/)?.[0] || 1);
  const levelLabel = profile.engagementLevelLabel || levelProgress?.current?.label || "Starter";
  const xpPct = clampPercent(levelProgress?.percent || 0);
  const streakHistory = Array.isArray(profile.streakHistory) ? profile.streakHistory : [];
  const completedDays = streakHistory.filter((entry) => entry?.completed).length;
  const focusLabel = processSummary?.recommendedNextTopic?.label || null;
  const strongAreaLabel = processSummary?.strongArea?.label || null;
  const weakAreaLabel = processSummary?.weakArea?.label || null;
  const rollingAccuracy = processSummary?.rollingAccuracy ?? activity?.lifetimeAccuracy ?? 0;
  const rolling7DayAccuracy = processSummary?.rolling7DayAccuracy ?? rollingAccuracy;
  const latestRewards = today?.resultSummary?.rewardsAwarded || {};
  const currentWeeklyRank = profile.currentWeeklyRank || leaderboard?.currentUser?.rank || null;
  const hasFocusData = Boolean(focusLabel || strongAreaLabel || weakAreaLabel);
  const hasTopicData = topicPerformance.length > 0;
  const hasContests = contests.length > 0;
  const hasRecentHistory = recentSessions.length > 0;
  const hasMilestone = Boolean(nextMilestone?.targetDays);
  const focusDescriptionParts = [
    weakAreaLabel ? `Recommended focus is ${weakAreaLabel}.` : null,
    strongAreaLabel ? `Strongest area is ${strongAreaLabel}.` : null,
  ].filter(Boolean);
  const quickStats = [
    { label: "Completed days", value: activity?.completedDays || 0 },
    { label: "Questions answered", value: activity?.totalQuestionsAnswered || 0 },
    { label: "7-day accuracy", value: `${rolling7DayAccuracy}%` },
    { label: "Weekly rank", value: currentWeeklyRank ? `#${currentWeeklyRank}` : "Unranked" },
  ];
  const unlockedBadgesCount = (Array.isArray(dashboard?.badges) ? dashboard.badges : []).filter(
    (badge) => badge?.earned,
  ).length;

  const operations = [
    {
      id: "daily-quest",
      difficulty: done ? "Complete" : used > 0 ? "In Progress" : "Live",
      difficultyTone: done ? "success" : used > 0 ? "warning" : "success",
      title: "Daily Freelancer Practice",
      description: done
        ? "Today’s session is complete. Review your result and return after reset."
        : "Answer today’s timed set and keep your profile progression moving.",
      progressLabel: "Quest status",
      progress: done ? 100 : max > 0 ? Math.round((used / max) * 100) : 0,
      coinLabel: `${latestRewards?.coinsAwarded ?? 0} latest coins`,
      xpLabel: `${latestRewards?.xpAwarded ?? 0} latest XP`,
    },
    {
      id: "level-progress",
      difficulty: "Level Track",
      difficultyTone: "neutral",
      title: `${levelLabel} Progression`,
      description: levelProgress?.next?.label
        ? `You need ${levelProgress?.xpToNext || 0} XP to unlock ${levelProgress.next.label}.`
        : "Top tier reached. Maintain your streak to protect position and rewards.",
      progressLabel: "Level completion",
      progress: xpPct,
      coinLabel: `${coins} balance`,
      xpLabel: levelProgress?.next?.label
        ? `${levelProgress?.xpToNext || 0} XP left`
        : "Max level",
    },
  ];

  if (hasFocusData) {
    operations.push({
      id: "focus-track",
      difficulty: "Learning Focus",
      difficultyTone: "violet",
      title: focusLabel || weakAreaLabel || strongAreaLabel,
      description:
        focusDescriptionParts.join(" ") || "Performance insights from your completed Growth Quests.",
      progressLabel: "7-day accuracy",
      progress: rolling7DayAccuracy,
      coinLabel: `${activity?.completedDays || 0} completed days`,
      xpLabel: `${rollingAccuracy}% lifetime accuracy`,
    });
  }

  const statusPills = [
    `${activity?.completedDays || 0} completed days`,
    `${activity?.totalQuestionsAnswered || 0} questions answered`,
    `${rollingAccuracy}% lifetime accuracy`,
    levelProgress?.next?.label ? `Next: ${levelProgress.next.label}` : "Top tier reached",
  ];

  const boosterRows = [
    focusLabel ? { label: "Focus", value: focusLabel, tone: "success" } : null,
    nextMilestone?.label
      ? {
          label: "Next milestone",
          value: nextMilestone.label,
          tone: "violet",
        }
      : null,
  ].filter(Boolean);

  const historyRows = recentSessions.map((session) => ({
    id: session.id,
    label: "Daily Growth Quest",
    type: `${session.correctCount}/${session.questionCount} correct`,
    date: formatCompactDate(session.createdAt || session.dayKey),
    rewards: `+${session.coinsAwarded} coins / +${session.xpAwarded} XP`,
    score: `${session.accuracy}% accuracy`,
  }));

  return (
    <div className="growth-quest-dashboard">
      <section className="growth-quest-hero growth-quest-panel">
        <div className="growth-quest-hero__content">
          <div className="growth-quest-hero__meta">
            <span className={EYEBROW_CLASS}>Daily Protocol</span>
            <span className="growth-quest-chip growth-quest-chip--ghost">
              <Clock className="size-3.5" />
              Resets {formatReset(today.nextResetAt)}
            </span>
          </div>
          <h2 className="growth-quest-hero__title">Freelancer Practice</h2>
          <p className="growth-quest-hero__description">
            Maintain your operational edge. Complete today&apos;s simulation to sustain your
            momentum bonus.
          </p>
        </div>

        <div className="growth-quest-hero__sidebar growth-quest-subpanel">
          <div className="growth-quest-hero__sidebar-head">
            <div>
              <p className={LABEL_CLASS}>Current Streak</p>
              <p className="growth-quest-hero__streak">
                <Flame className="size-5" />
                {streak} Days
              </p>
            </div>
            <div className="growth-quest-attempts-ring">
              <span className={LABEL_CLASS}>Attempts</span>
              <strong>
                {used}/{max}
              </strong>
            </div>
          </div>

          <div className="growth-quest-hero__stats">
            <div className="growth-quest-hero__stat">
              <span className={LABEL_CLASS}>Completed days</span>
              <strong>{activity?.completedDays || 0}</strong>
            </div>
            <div className="growth-quest-hero__stat">
              <span className={LABEL_CLASS}>Questions answered</span>
              <strong>{activity?.totalQuestionsAnswered || 0}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartQuest}
            disabled={done}
            className={cn(PRIMARY_BUTTON_CLASS, "growth-quest-hero__cta")}
          >
            {done ? (
              <>
                <CheckCircle2 className="size-4" />
                Completed for today
              </>
            ) : (
              <>
                Start Today&apos;s Quest
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="growth-quest-helper">
            {isRetake ? `${max - used} retake remaining today.` : "Best attempt counts."}
          </p>

          {error ? <div className="growth-quest-error">{error}</div> : null}
        </div>
      </section>

      <section className="growth-quest-toolbar growth-quest-panel py-3 shadow-lg ring-1 ring-white/5">
        <div className="flex flex-wrap items-center gap-6 px-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-primary/90">Monitor</span>
          </div>
          <div className="h-4 w-px bg-white/15 hidden md:block" />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {statusPills.map((pill, index) => (
              <div key={pill} className="flex items-center gap-2.5 text-xs group cursor-default">
                <span className="p-1 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                  {index === 0 && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                  {index === 1 && <Sparkles className="size-3.5 text-amber-400" />}
                  {index === 2 && <Target className="size-3.5 text-indigo-400" />}
                  {index === 3 && <Flame className="size-3.5 text-rose-400" />}
                </span>
                <span className="font-medium text-muted-foreground/90 group-hover:text-foreground transition-colors">{pill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="growth-quest-grid">
        <aside className="growth-quest-side">
          <div className="growth-quest-panel growth-quest-side__panel">
            <div>
              <h3 className="growth-quest-side__title">
                <Sparkles className="size-4" />
                Quick Stats
              </h3>
              <div className="mb-4 grid gap-2">
                <button
                  type="button"
                    onClick={() => handleSidePanelSelect("ranking")}
                  className={cn(
                    "growth-quest-side-toggle",
                    sidePanel === "ranking" && "growth-quest-side-toggle--active",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Medal className="size-4" />
                    Ranking
                  </span>
                  <span>{currentWeeklyRank ? `#${currentWeeklyRank}` : "--"}</span>
                </button>
                <button
                  type="button"
                    onClick={() => handleSidePanelSelect("badges")}
                  className={cn(
                    "growth-quest-side-toggle",
                    sidePanel === "badges" && "growth-quest-side-toggle--active",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="size-4" />
                    Badges
                  </span>
                  <span>{unlockedBadgesCount}</span>
                </button>
              </div>
              <div className="growth-quest-mini-card">
                <p className={LABEL_CLASS}>Weekly snapshot</p>
                <div className="growth-quest-stat-grid">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="growth-quest-stat-tile">
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="growth-quest-mini-card">
                <p className={LABEL_CLASS}>Live Metrics</p>
                <div className="growth-quest-boosters">
                  {boosterRows.length > 0 ? (
                    boosterRows.map((booster) => (
                      <div key={booster.label} className="growth-quest-booster-row">
                        <span className={`tone-${booster.tone}`}>{booster.label}</span>
                        <span>{booster.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="growth-quest-booster-row">
                      <span>No live metrics yet</span>
                      <span>Complete a quest</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="growth-quest-rank-card border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-1.5 rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <Target className="size-3.5 text-primary" />
                </div>
                <p className={LABEL_CLASS}>Current Rank</p>
              </div>
              <strong className="text-2xl tracking-tight text-foreground">{levelLabel}</strong>
              <div className="growth-quest-progress mt-4 h-2 bg-white/5">
                <span className="relative overflow-hidden" style={{ width: `${xpPct}%` }}>
                  <span
                    className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{ backgroundSize: "200% 100%" }}
                  ></span>
                </span>
              </div>
              <p className="growth-quest-helper mt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {`Level ${levelNumber} · ${xp.toLocaleString()} XP`}
                {currentWeeklyRank ? ` · Rank #${currentWeeklyRank}` : " · Weekly rank pending"}
              </p>
            </div>
          </div>
        </aside>

        <div className="growth-quest-main-column">
          <section>
            <div className="growth-quest-section-head">
              <div className="growth-quest-section-title">
                <span className="growth-quest-pulse-dot" />
                <h3>Active Operations</h3>
              </div>
              <span className="growth-quest-inline-link">{rolling7DayAccuracy}% 7-day accuracy</span>
            </div>

            <div className="growth-quest-card-grid">
              {operations.map((operation) => (
                <article key={operation.id} className="growth-quest-panel growth-quest-card">
                  <div className="growth-quest-card__head">
                    <span className={`growth-quest-chip growth-quest-chip--${operation.difficultyTone}`}>
                      {operation.difficulty}
                    </span>
                    <span className="growth-quest-inline-link">{operation.progress}%</span>
                  </div>

                  <div>
                    <h4>{operation.title}</h4>
                    <p>{operation.description}</p>
                  </div>

                  <div className="growth-quest-card__progress">
                    <div className="growth-quest-card__progress-head">
                      <span>{operation.progressLabel}</span>
                      <strong>{operation.progress}%</strong>
                    </div>
                    <div className="growth-quest-progress">
                      <span style={{ width: `${operation.progress}%` }} />
                    </div>
                  </div>

                  <div className="growth-quest-card__foot">
                    <span>{operation.coinLabel}</span>
                    <span>{operation.xpLabel}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

        </div>


        <aside className="growth-quest-rewards">
          <div className="growth-quest-panel growth-quest-rewards__panel">
            {hasMilestone ? (
              <div className="growth-quest-rewards__section">
              <h3 className="growth-quest-side__title">
                <Target className="size-4" />
                Progress Snapshot
              </h3>
              <div className="growth-quest-premium-card">
                <div className="growth-quest-premium-card__badge">Live</div>
                <div className="growth-quest-premium-card__icon">
                  <Flame className="size-5" />
                </div>
                <h4>{nextMilestone?.targetDays || 0}-Day Milestone</h4>
                <p>
                  {nextMilestone?.label || "Keep the streak alive to unlock your next milestone."}
                </p>
                <div className="growth-quest-progress">
                  <span
                    style={{
                      width: `${clampPercent(
                        nextMilestone?.targetDays ? (streak / nextMilestone.targetDays) * 100 : 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            ) : null}

            {strongAreaLabel ? (
              <div className="growth-quest-epic-card">
              <p className={LABEL_CLASS}>Performance Intel</p>
              <div className="growth-quest-epic-card__head">
                <h4>{strongAreaLabel}</h4>
                <span className="growth-quest-chip growth-quest-chip--violet">Strongest</span>
              </div>
              <p>Best performing category based on your recorded Growth Quest answers.</p>
              <div className="growth-quest-contract__rewards">
                <span>{rollingAccuracy}% lifetime</span>
                <span>{rolling7DayAccuracy}% 7-day</span>
              </div>
            </div>
            ) : null}

            {weakAreaLabel ? (
              <div className="growth-quest-partner-box">
              <p>{weakAreaLabel}</p>
              <span className="growth-quest-inline-link">Recommended next focus</span>
            </div>
            ) : null}

            <div className="mt-2">
              <StreakCalendar
                streakHistory={dashboard?.profile?.streakHistory}
                currentStreak={streak}
                completedToday={done}
              />
            </div>
          </div>
        </aside>
      </section>

      <section ref={intelSectionRef} className="growth-quest-intel-grid">
        {sidePanel === "badges" ? (
          <BadgeShelf badges={dashboard?.badges || []} currentStreak={streak} />
        ) : (
          <WeeklyRankingPanel
            leaderboard={leaderboard}
            currentUserId={leaderboard?.currentUser?.userId}
          />
        )}
        <ProcessSummaryCard processSummary={processSummary} />
      </section>

      {hasTopicData ? (
        <section className="mt-8">
          <div className="growth-quest-section-head growth-quest-section-head--with-line mb-4">
            <h3>Topic Performance</h3>
            <span className="growth-quest-inline-link">
              {topicPerformance.length} tracked categories
            </span>
          </div>

          <div className="growth-quest-scroll-wrapper">
            <div className="growth-quest-scroll-row">
            {topicPerformance.map((topic) => (
              <article key={topic.key} className="growth-quest-panel growth-quest-contract">
                <div className="growth-quest-contract__head">
                  <div>
                    <p className="growth-quest-contract__category">Performance Area</p>
                    <h4>{topic.label}</h4>
                  </div>
                  <span className="growth-quest-chip growth-quest-chip--ghost">
                    {topic.accuracy}%
                  </span>
                </div>
                <p className="growth-quest-contract__description">
                  {topic.correct} correct answers from {topic.attempted} attempts.
                </p>
                <div className="growth-quest-contract__rewards">
                  <span className="text-emerald-400/80">{topic.correct} correct</span>
                  <span className="text-rose-400/80">{topic.attempted - topic.correct} missed</span>
                </div>
                <div className="growth-quest-progress">
                  <span style={{ width: `${clampPercent(topic.accuracy)}%` }} />
                </div>
              </article>
            ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasContests ? (
        <section className="mt-8">
          <div className="growth-quest-section-head growth-quest-section-head--with-line mb-4">
            <h3>Admin Contests</h3>
            <span className="growth-quest-inline-link">{contests.length} live contests</span>
          </div>

          <div className="growth-quest-scroll-wrapper">
            <div className="growth-quest-scroll-row">
            {contests.map((contest) => (
              <article
                key={contest.id}
                className="growth-quest-panel growth-quest-contract cursor-pointer group"
                onClick={() => navigate(`/freelancer/growth-quest/contests/${contest.id}`)}
              >
                {(contest.imageUrl) && (
                  <div className="growth-quest-contract__image">
                    <img src={contest.imageUrl} alt={contest.title} loading="lazy" />
                  </div>
                )}
                
                <div className="growth-quest-contract__head">
                  <div>
                    <p className="growth-quest-contract__category">{contest.category}</p>
                    <h4>{contest.title}</h4>
                  </div>
                  <span className="growth-quest-chip growth-quest-chip--ghost">
                    {contest.startDayKey}
                    {contest.endDayKey ? ` to ${contest.endDayKey}` : ""}
                  </span>
                </div>
                <p className="growth-quest-contract__description line-clamp-2">{contest.description}</p>
                <div className="growth-quest-contract__rewards">
                  <span className="text-primary/70">
                    {contest.rewardCoins || 0} coins · {contest.rewardXp || 0} XP
                  </span>
                  <span className="font-bold flex items-center gap-1">
                    {contest.ctaLabel || "View Contest"}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasRecentHistory ? (
        <section className="mt-12">
          <div className="growth-quest-section-head mb-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock className="size-5" />
              </div>
              <h3>Recent History</h3>
            </div>
            <span className="growth-quest-inline-link">Viewing last 10 activities</span>
          </div>
          
          <div className="growth-quest-panel growth-quest-history-list">
            <div className="overflow-x-auto">
              <table className="growth-quest-table">
                <thead>
                  <tr>
                    <th>Quest Identity</th>
                    <th>Outcome</th>
                    <th>Date Recorded</th>
                    <th>Yield & Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-500/60">
                            <Zap className="size-4" />
                          </div>
                          <span className="font-semibold text-white/90 whitespace-nowrap">{row.label}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-white/60">
                          <Target className="size-3.5" />
                          <span>{row.type}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-white/40 text-xs">{row.date}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="growth-quest-chip growth-quest-chip--warning text-[10px] py-1">
                            {row.rewards}
                          </span>
                          <span className="growth-quest-chip growth-quest-chip--violet text-[10px] py-1">
                            {row.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Footer ─── */}
      <footer className="growth-quest-footer">
        <div className="growth-quest-footer__grid">
          <div className="growth-quest-footer__brand">
            <div className="growth-quest-footer__logo">
              <Flame className="size-5" />
            </div>
            <div>
              <h4>Growth Quest Engine</h4>
              <p>Daily skill-building protocol designed to keep you sharp, consistent, and client-ready.</p>
            </div>
          </div>

          <div className="growth-quest-footer__col">
            <p className="growth-quest-footer__col-title">Your Progress</p>
            <ul>
              <li>Complete 1 quest per day</li>
              <li>Earn XP &amp; loyalty coins</li>
              <li>Track category accuracy</li>
              <li>Maintain your streak</li>
            </ul>
          </div>

          <div className="growth-quest-footer__col">
            <p className="growth-quest-footer__col-title">How It Works</p>
            <ul>
              <li>5 questions per session</li>
              <li>Resets daily at midnight UTC</li>
              <li>Best attempt score counts</li>
              <li>Badges unlock at milestones</li>
            </ul>
          </div>

          <div className="growth-quest-footer__col">
            <p className="growth-quest-footer__col-title">Level System</p>
            <ul>
              <li>Starter → Apprentice</li>
              <li>Apprentice → Skilled</li>
              <li>Skilled → Professional</li>
              <li>Professional → Expert</li>
            </ul>
          </div>
        </div>

        <div className="growth-quest-footer__bottom">
          <span>© {new Date().getFullYear()} Catalance · Growth Quest System</span>
          <span className="growth-quest-footer__pulse">
            <span className="growth-quest-pulse-dot" />
            Engine Active
          </span>
        </div>
      </footer>
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

      <main className="growth-quest-shell">
        {view !== "dashboard" ? (
          <div className="growth-quest-topbar growth-quest-topbar--compact">
            <div className="growth-quest-topbar__meta">
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
                {view === "quiz" ? "Growth Quest Session" : "Quest Review"}
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
        ) : null}

        {view === "dashboard" ? (
          <GrowthQuestLiveDashboard
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
