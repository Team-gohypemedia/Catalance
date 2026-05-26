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
import Star from "lucide-react/dist/esm/icons/star";
import Shield from "lucide-react/dist/esm/icons/shield";
import Target from "lucide-react/dist/esm/icons/target";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import X from "lucide-react/dist/esm/icons/x";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Zap from "lucide-react/dist/esm/icons/zap";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Crown from "lucide-react/dist/esm/icons/crown";
import Activity from "lucide-react/dist/esm/icons/activity";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import BadgeShelf from "./BadgeShelf";
import ProcessSummaryCard from "./ProcessSummaryCard";
import StreakCalendar from "./StreakCalendar";
import GrowthQuestInfoModal from "./growth-quest/GrowthQuestInfoModal";
import GrowthQuestQuizView from "./growth-quest/GrowthQuestQuizView";
import GrowthQuestResultView from "./growth-quest/GrowthQuestResultView";
import GrowthQuestWeeklyRankingPanel from "./growth-quest/GrowthQuestWeeklyRankingPanel";
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
  { title: "1. Start today's practice", desc: "Answer 5 common questions plus 1 personalized question in one short practice quiz." },
  { title: "2. One scored attempt", desc: "Your daily streak, XP, and coins are locked after one completed quest each day." },
  { title: "3. Track improvement", desc: "Earn XP, coins, improve weak topics, and check your weekly rank." },
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

const WEAK_AREA_GUIDANCE = {
  client_communication: {
    headline: "Improve how you confirm and update clients.",
    tips: [
      "Confirm scope, timeline, and deliverables before starting.",
      "Share short progress updates before the client has to ask.",
      "Use clear next steps when a revision or delay appears.",
    ],
  },
  scope_management: {
    headline: "Reduce confusion around what is and is not included.",
    tips: [
      "Restate the agreed deliverables before work begins.",
      "Flag extra requests early before they become unpaid work.",
      "Keep revisions tied to the original brief and milestones.",
    ],
  },
  delivery: {
    headline: "Make handoff and completion more reliable.",
    tips: [
      "Send work with a short summary of what was completed.",
      "Highlight any pending item before final delivery.",
      "Attach files, links, and proof in one clean handoff.",
    ],
  },
  quality_control: {
    headline: "Tighten your review process before delivery.",
    tips: [
      "Run a final checklist before sending work to the client.",
      "Review details against the original brief, not memory.",
      "Catch small issues early so they do not turn into revisions.",
    ],
  },
  platform_rules: {
    headline: "Strengthen platform-safe decision making.",
    tips: [
      "Keep payment, scope, and proof inside the platform workflow.",
      "Follow the dispute and revision process instead of improvising.",
      "Avoid shortcuts that can break trust or policy.",
    ],
  },
  business_basics: {
    headline: "Sharpen fundamentals that protect long-term growth.",
    tips: [
      "Match your offer, pricing, and expectations clearly.",
      "Prioritize repeatable habits over one-off quick wins.",
      "Use every session to improve judgment, not just speed.",
    ],
  },
};

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

const WeeklyRankingPanel = GrowthQuestWeeklyRankingPanel;
const InfoModal = GrowthQuestInfoModal;
const GROWTH_QUEST_SERVICE_FALLBACKS = [
  "Web Development",
  "Mobile App Development",
  "AI Automation",
  "CRM & ERP Integrated Solutions",
  "Voice Agent",
  "Creative & Design",
  "Branding Kit",
  "UGC Marketing",
  "Paid Advertising",
  "Social Media Marketing (Organic)",
  "Video Services",
  "Writing & Content",
  "3D Animation/CGI Videos",
  "Influencer Marketing",
  "SEO / GMB",
];

const DashboardView = ({ dashboard, onStartQuest, loading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
  const max = today.maxAttempts || 1;
  const done = used >= max;
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
      title: "Today's Practice",
      description: done
        ? "Today's session is complete. Review your result and return after reset."
        : "Answer today’s timed set and keep your profile progression moving.",
      progressLabel: "Quest status",
      progress: done ? 100 : max > 0 ? Math.round((used / max) * 100) : 0,
      coinLabel: `${Math.max(50, streak * 25 || 50)} coins`,
      xpLabel: `+${Math.max(200, Math.round(xpPct * 8))} XP`,
    },
    {
      id: "level-progress",
      difficulty: "Your Level",
      difficultyTone: "neutral",
      title: `${levelLabel} Level Progress`,
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
            <span className={EYEBROW_CLASS}>Daily Practice Dashboard</span>
            <span className="growth-quest-chip growth-quest-chip--ghost">
              <Clock className="size-3.5" />
              Resets {formatReset(today.resetAt)}
            </span>
          </div>
          <h2 className="growth-quest-hero__title">Daily Growth Quest</h2>
          <p className="growth-quest-hero__description">
            Answer 5 common questions plus 1 personalized question daily. Earn XP, coins, improve weak topics,
            and track your weekly rank.
          </p>
        </div>

        <div className="growth-quest-hero__sidebar growth-quest-subpanel">
          <div className="growth-quest-hero__sidebar-head">
            <div>
              <p className={LABEL_CLASS}>Today&apos;s Practice</p>
              <p className="growth-quest-hero__streak">
                {done ? "Completed" : "0/5"}
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
              <span className={LABEL_CLASS}>XP Today</span>
              <strong>{latestRewards?.xpAwarded ?? 0}</strong>
            </div>
            <div className="growth-quest-hero__stat">
              <span className={LABEL_CLASS}>Coins Today</span>
              <strong>{latestRewards?.coinsAwarded ?? 0}</strong>
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
                Start Today&apos;s 6 Questions
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="growth-quest-helper">
            {done
              ? "Today's scored quest is locked. Resets daily."
              : "One scored quest is available each day. Resets daily."}
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
                Overview
              </h3>
              <div className="growth-quest-mini-card">
                <p className={LABEL_CLASS}>Today&apos;s Progress</p>
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

const GrowthQuestLiveDashboard = ({
  dashboard,
  onStartQuest,
  loading,
  error,
  previewQuestions = [],
  loadingPreview = false,
  onSaveServiceSelection,
  savingServiceSelection = false,
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [sidePanel, setSidePanel] = useState("ranking");
  const intelSectionRef = useRef(null);
  const topicScrollRef = useRef(null);
  const contestScrollRef = useRef(null);

  const getTopicColor = (acc) => {
    // Neutralized, professional theme using only Amber and Gray accents
    const neutralBorder = "rgba(255,255,255,0.1)";
    const neutralGlow = "rgba(255,255,255,0.02)";

    if (acc >= 80) return { stroke: "#ffc107", glow: "rgba(255,193,7,0.05)", border: "#ffc10733", bg: "transparent", icon: "#ffc107" };
    if (acc >= 50) return { stroke: "#fbbf24", glow: neutralGlow, border: neutralBorder, bg: "transparent", icon: "#fbbf24" };
    return { stroke: "#94a3b8", glow: "transparent", border: neutralBorder, bg: "transparent", icon: "#94a3b8" };
  };

  const getTopicIcon = (key, color) => {
    const s = { color, opacity: 0.8 };
    const icons = {
      platform_rules: <Shield className="size-6" style={s} />,
      delivery: <Zap className="size-6" style={s} />,
      scope_management: <Target className="size-6" style={s} />,
      quality_control: <CheckCircle2 className="size-6" style={s} />,
      client_communication: <Star className="size-6" style={s} />,
      business_basics: <Sparkles className="size-6" style={s} />,
    };
    return icons[key] || <Target className="size-6" style={s} />;
  };

  const topic_r = 30;
  const topic_circ = 2 * Math.PI * topic_r;

  const scrollBy = (dir) => {
    topicScrollRef.current?.scrollBy({ left: dir * 290, behavior: "smooth" });
  };

  const contestScrollBy = (dir) => {
    contestScrollRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  const getContestTheme = () => {
    return {
      border: "rgba(255,255,255,0.08)",
      glow: "rgba(255,193,7,0.02)",
      btn: "linear-gradient(135deg,#ffc107,#ff9800)",
      text: "#ffc107",
      chip: "rgba(255,255,255,0.05)"
    };
  };

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
  const max = today.maxAttempts || 1;
  const done = today.status === "completed" || used >= max;
  const levelNumber = Number(String(profile.engagementLevel || "").match(/\d+/)?.[0] || 1);
  const levelLabel = profile.engagementLevelLabel || levelProgress?.current?.label || "Starter";
  const xpPct = clampPercent(levelProgress?.percent || 0);
  const streakHistory = Array.isArray(profile.streakHistory) ? profile.streakHistory : [];
  const completedDays = streakHistory.filter((entry) => entry?.completed).length;
  const focusLabel = processSummary?.recommendedNextTopic?.label || null;
  const strongArea = processSummary?.strongArea || null;
  const weakArea = processSummary?.weakArea || null;
  const strongAreaLabel = strongArea?.label || null;
  const weakAreaLabel = weakArea?.label || null;
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
    { label: "Lifetime practice days", value: activity?.completedDays || 0 },
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
        ? "Today's session is complete. Review your result and return after reset."
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


  const statusPills = [
    `${activity?.completedDays || 0} lifetime practice days`,
    `${activity?.totalQuestionsAnswered || 0} questions answered`,
    `${rollingAccuracy}% lifetime accuracy`,
    levelProgress?.next?.label ? `Next level: ${levelProgress.next.label}` : "Top level reached",
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

  const weakAreaStats = weakArea
    ? topicPerformance.find((topic) => topic.key === weakArea.key)
    : null;
  const weakAreaAccuracy = Math.round(Number(weakArea?.accuracy ?? weakAreaStats?.accuracy ?? 0));
  const weakAreaAttempted = Number(weakAreaStats?.attempted || 0);
  const weakAreaCorrect = Number(weakAreaStats?.correct || 0);
  const weakAreaMissed = Math.max(0, weakAreaAttempted - weakAreaCorrect);
  const weakAreaGuide = weakArea?.key
    ? WEAK_AREA_GUIDANCE[weakArea.key]
    : null;

  const historyRows = recentSessions.map((session) => ({
    id: session.id,
    label: "Daily Growth Quest",
    type: `${session.correctCount}/${session.questionCount} correct`,
    date: formatCompactDate(session.createdAt || session.dayKey),
    rewards: `+${session.coinsAwarded} coins / +${session.xpAwarded} XP`,
    score: `${session.accuracy}% accuracy`,
  }));
  const commonPreviewQuestions = previewQuestions.filter(
    (question) => question?.questionVariant !== "personalized",
  );
  const personalizedPreviewQuestion =
    previewQuestions.find((question) => question?.questionVariant === "personalized") || null;
  const serviceSelectionRequired = Boolean(dashboard?.serviceSelection?.required);
  const serviceOptions = Array.isArray(dashboard?.serviceSelection?.options) &&
    dashboard.serviceSelection.options.length
    ? dashboard.serviceSelection.options
    : GROWTH_QUEST_SERVICE_FALLBACKS;

  return (
    <div className="growth-quest-dashboard">
      <section className="growth-quest-hero growth-quest-panel">
        <div className="growth-quest-hero__content">
          <div className="growth-quest-hero__meta">
            <span className={EYEBROW_CLASS} style={{ gap: "0.45rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", padding: "0.3rem 0.65rem", background: "rgba(255,255,255,0.04)" }}>
              <Star className="size-3" />
              Daily Protocol
            </span>
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

        <div className="growth-quest-hero__sidebar">
          <div className="growth-quest-hero__sidebar-head">
            <div>
              <p className={LABEL_CLASS} style={{ gap: "0.4rem" }}>
                <Flame className="size-3" style={{ display: "inline", verticalAlign: "middle", marginRight: "0.15rem" }} />
                Current Streak
              </p>
              <p className="growth-quest-hero__streak">
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
              <span className={LABEL_CLASS}>Lifetime Practice Days</span>
              <strong>{activity?.completedDays || 0}</strong>
            </div>
            <div className="growth-quest-hero__stat">
              <span className={LABEL_CLASS}>Today Status</span>
              <strong className={done ? "" : "is-warning"}>{done ? "Completed" : "Not completed"}</strong>
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
                <Star className="size-4" />
                Start Today&apos;s Quest
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="growth-quest-helper">
            <Info className="size-3.5" style={{ flexShrink: 0 }} />
            {done ? "Return after reset for the next scored quest." : "One scored quest is available each day."}
          </p>

          {error ? <div className="growth-quest-error">{error}</div> : null}
        </div>
      </section>

      <section className="growth-quest-toolbar growth-quest-panel">
        <div className="growth-quest-toolbar__inner">
          <div className="growth-quest-toolbar__head">
            <Star className="size-3.5" style={{ color: "#ffc107" }} />
            <span>Overview</span>
          </div>
          {[
            { icon: <CheckCircle2 className="size-3.5" style={{ color: "#4ade80" }} />, value: activity?.completedDays || 0, label: "lifetime practice days" },
            { icon: <Sparkles className="size-3.5" style={{ color: "#fbbf24" }} />, value: activity?.totalQuestionsAnswered || 0, label: "questions answered" },
            { icon: <Target className="size-3.5" style={{ color: "#818cf8" }} />, value: `${rollingAccuracy}%`, label: "lifetime accuracy" },
            { icon: <Flame className="size-3.5" style={{ color: "#fb923c" }} />, value: levelProgress?.next?.label || "Max level", label: "Next level:" },
          ].map((stat, i) => (
            <React.Fragment key={i}>
              <div className="growth-quest-toolbar__sep" />
              <div className="growth-quest-toolbar__item">
                {stat.icon}
                <div className="growth-quest-toolbar__stat">
                  <span className="growth-quest-toolbar__value">{stat.value}</span>
                  <span className="growth-quest-toolbar__label">{stat.label}</span>
                </div>
              </div>
            </React.Fragment>
          ))}
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
              <div className="growth-quest-side__grid mb-4 grid gap-2">
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
                <h3 className="growth-quest-side__title">
                  <Zap className="size-3" />
                  Weekly Snapshot
                </h3>
                <div className="growth-quest-stat-grid">
                  {quickStats.map((stat, i) => {
                    const icons = [<CheckCircle2 key="c" className="size-3" />, <Sparkles key="s" className="size-3" />, <Target key="t" className="size-3" />, <Medal key="m" className="size-3" />];
                    return (
                      <div key={stat.label} className="growth-quest-stat-tile">
                        <div className="growth-quest-stat-tile__label">
                          <span>{stat.label}</span>
                          {icons[i]}
                        </div>
                        <strong>{stat.value}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="growth-quest-mini-card">
                <h3 className="growth-quest-side__title">
                  <Target className="size-3" />
                  Recommended Focus
                </h3>
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
                      <span>No focus data yet</span>
                      <span>Complete today&apos;s practice</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="growth-quest-rank-card">
              <h3 className="growth-quest-side__title" style={{ justifyContent: "center" }}>
                <Target className="size-3" />
                Your Level Progress
              </h3>
              <strong>{levelLabel}</strong>
              <div className="growth-quest-progress" style={{ marginTop: "0.85rem", height: "6px" }}>
                <span style={{ width: `${xpPct}%` }} />
              </div>
              <p style={{ marginTop: "0.6rem", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(180,190,210,0.45)", textAlign: "center" }}>
                {`Level ${levelNumber} · ${xp.toLocaleString()} XP`}{currentWeeklyRank ? ` · Rank #${currentWeeklyRank}` : ""}
              </p>
            </div>
          </div>
        </aside>

        <div className="growth-quest-main-column">
          <section>
            <div className="growth-quest-section-head" style={{ marginBottom: "1rem" }}>
              <div className="growth-quest-section-title">
                <span className="growth-quest-pulse-dot" />
                <h3>Today&apos;s Practice</h3>
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffc107" }}>{rolling7DayAccuracy}% 7-day accuracy</span>
            </div>

            <article
              className="growth-quest-panel"
              style={{
                padding: "1.35rem",
                background:
                  "linear-gradient(135deg,rgba(8,10,24,0.98),rgba(12,8,28,0.97))",
              }}
            >
              {serviceSelectionRequired ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                      marginBottom: "1.1rem",
                    }}
                  >
                    <div>
                      <span className="growth-quest-chip growth-quest-chip--warning">
                        Service needed
                      </span>
                      <h4
                        style={{
                          marginTop: "0.85rem",
                          fontSize: "1.85rem",
                          fontWeight: 800,
                          color: "#fff",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        Select your working service first
                      </h4>
                      <p
                        style={{
                          marginTop: "0.45rem",
                          maxWidth: "42rem",
                          fontSize: "0.92rem",
                          lineHeight: 1.7,
                          color: "rgba(170,185,215,0.68)",
                        }}
                      >
                        Growth Quest needs one service selection before AI can prepare your 5 common questions and 1 personalized question for today.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.8rem",
                    }}
                  >
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => onSaveServiceSelection?.(service)}
                        disabled={savingServiceSelection}
                        className="growth-quest-service-option"
                      >
                        <span>{service}</span>
                        <ArrowRight className="size-4" />
                      </button>
                    ))}
                  </div>

                  {savingServiceSelection ? (
                    <div className="growth-quest-helper" style={{ marginTop: "1rem" }}>
                      <Loader2 className="size-3.5 animate-spin" style={{ flexShrink: 0 }} />
                      Saving your service and generating today&apos;s AI questions.
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <span className="growth-quest-chip growth-quest-chip--success">
                    {done ? "Completed" : "Live"}
                  </span>
                  <h4
                    style={{
                      marginTop: "0.85rem",
                      fontSize: "1.9rem",
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    5 Common Questions + 1 Personalized Question
                  </h4>
                  <p
                    style={{
                      marginTop: "0.45rem",
                      maxWidth: "42rem",
                      fontSize: "0.92rem",
                      lineHeight: 1.7,
                      color: "rgba(170,185,215,0.68)",
                    }}
                  >
                    Today&apos;s practice is prepared for your freelancer profile. The first five questions follow your
                    service domain, and the last question targets your weak area.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={done ? undefined : onStartQuest}
                  disabled={done || loadingPreview}
                  className={cn(PRIMARY_BUTTON_CLASS, "min-w-[220px]")}
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Loading questions
                    </>
                  ) : done ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Completed for today
                    </>
                  ) : (
                    <>
                      <Star className="size-4" />
                      Start Today&apos;s Quest
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="growth-quest-practice-preview">
                <div className="growth-quest-practice-preview__list">
                  {loadingPreview && !done ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={`preview-skeleton-${index}`}
                        style={{
                          borderRadius: "16px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.03)",
                          padding: "1rem 1.1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "5rem",
                            height: "0.75rem",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.08)",
                            marginBottom: "0.85rem",
                          }}
                        />
                        <div
                          style={{
                            width: "100%",
                            height: "0.9rem",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.06)",
                            marginBottom: "0.5rem",
                          }}
                        />
                        <div
                          style={{
                            width: "72%",
                            height: "0.9rem",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      </div>
                    ))
                  ) : commonPreviewQuestions.length > 0 ? (
                    commonPreviewQuestions.map((question, index) => (
                      <article
                        key={question.id}
                        style={{
                          borderRadius: "18px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.03)",
                          padding: "1rem 1.1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "0.85rem",
                          }}
                        >
                          <span className="growth-quest-chip growth-quest-chip--ghost">
                            Q{index + 1}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.93rem",
                            lineHeight: 1.65,
                            color: "rgba(235,240,255,0.92)",
                          }}
                        >
                          {question.questionText}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="growth-quest-subpanel" style={{ padding: "1rem 1.1rem" }}>
                      <p style={{ fontSize: "0.92rem", color: "rgba(170,185,215,0.72)" }}>
                        {done
                          ? "Today’s questions are already completed. Come back after reset for a new AI-generated set."
                          : "Today’s question preview will appear here when the daily set is ready."}
                      </p>
                    </div>
                  )}
                </div>

                <aside className="growth-quest-practice-preview__side">
                  <article
                    style={{
                      borderRadius: "20px",
                      border: "1px solid rgba(124,58,237,0.22)",
                      background: "linear-gradient(135deg,rgba(40,22,84,0.55),rgba(12,14,34,0.96))",
                      padding: "1.1rem",
                    }}
                  >
                    <span className="growth-quest-chip growth-quest-chip--violet">
                      Personalized
                    </span>
                    <h5
                      style={{
                        marginTop: "0.85rem",
                        fontSize: "1.15rem",
                        fontWeight: 800,
                        color: "#fff",
                      }}
                    >
                      Your weak-area question
                    </h5>
                    <div
                      style={{
                        marginTop: "1rem",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.04)",
                        padding: "0.95rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.9rem",
                          lineHeight: 1.65,
                          color: "rgba(245,245,255,0.94)",
                        }}
                      >
                        {personalizedPreviewQuestion?.questionText ||
                          (done
                            ? "Today’s personalized question has already been completed."
                            : "Your personalized question will appear here once today’s set is loaded.")}
                      </p>
                    </div>
                  </article>

                  <div className="growth-quest-subpanel" style={{ padding: "1rem 1.1rem" }}>
                    <p className={LABEL_CLASS}>Today&apos;s Practice Status</p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        marginTop: "0.85rem",
                        fontSize: "0.88rem",
                        color: "rgba(180,190,210,0.7)",
                      }}
                    >
                      <span>Questions ready</span>
                      <strong style={{ color: "#fff" }}>
                        {previewQuestions.length || (done ? 6 : 0)}/6
                      </strong>
                    </div>
                    <div className="growth-quest-progress" style={{ marginTop: "0.55rem" }}>
                      <span
                        style={{
                          width: `${((previewQuestions.length || (done ? 6 : 0)) / 6) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "0.75rem",
                        marginTop: "1rem",
                      }}
                    >
                      <div>
                        <p className={LABEL_CLASS}>Common</p>
                        <strong style={{ display: "block", marginTop: "0.35rem", fontSize: "1.2rem" }}>
                          {commonPreviewQuestions.length || (done ? 5 : 0)}
                        </strong>
                      </div>
                      <div>
                        <p className={LABEL_CLASS}>Personal</p>
                        <strong style={{ display: "block", marginTop: "0.35rem", fontSize: "1.2rem" }}>
                          {personalizedPreviewQuestion || done ? 1 : 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
                </>
              )}
            </article>
          </section>

        </div>

      </section>
      <section ref={intelSectionRef} className="growth-quest-intel-grid">
        {sidePanel === "badges" ? (
          <BadgeShelf badges={dashboard?.badges || []} currentStreak={streak} />
        ) : (
          <WeeklyRankingPanel leaderboard={leaderboard} currentUserId={leaderboard?.currentUser?.userId} />
        )}
        <div className="growth-quest-intel-stack">
          <ProcessSummaryCard processSummary={processSummary} />
          <section
            className="growth-quest-panel"
            style={{ padding: "1.1rem", background: "linear-gradient(135deg,rgba(8,10,24,0.98),rgba(12,8,28,0.97))" }}
          >
            <StreakCalendar
              streakHistory={dashboard?.profile?.streakHistory}
              currentStreak={streak}
              completedToday={done}
              compact
            />
          </section>
        </div>
      </section>

      <section className="mt-10">
        <div className="growth-quest-section-head" style={{ marginBottom: "1rem" }}>
          <div className="growth-quest-section-title">
            <span className="growth-quest-pulse-dot" />
            <h3>Progress Overview</h3>
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(180,190,210,0.7)" }}>
            Current status cards moved here
          </span>
        </div>

        <div className="growth-quest-card-grid">
          {operations.map((operation) => (
            <article key={operation.id} className="growth-quest-panel growth-quest-card">
              {operation.id === "daily-quest" && (
                <svg className="growth-quest-card__illustration" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="70,6 118,33 118,107 70,134 22,107 22,33" fill="none" stroke="rgba(255,193,7,0.25)" strokeWidth="1.5" />
                  <polygon points="70,18 108,40 108,100 70,122 32,100 32,40" fill="none" stroke="rgba(255,193,7,0.4)" strokeWidth="1" />
                  <path d="M70 36 L83 60 L70 70 L57 60 Z" fill="rgba(255,193,7,0.12)" stroke="#ffc107" strokeWidth="1.5" />
                  <path d="M70 70 L83 80 L70 104 L57 80 Z" fill="rgba(255,193,7,0.08)" stroke="rgba(255,193,7,0.5)" strokeWidth="1" />
                  <circle cx="70" cy="70" r="5" fill="#ffc107" opacity="0.9" />
                  <circle cx="70" cy="70" r="22" fill="rgba(255,193,7,0.04)" stroke="rgba(255,193,7,0.12)" strokeWidth="12" />
                  <circle cx="70" cy="70" r="34" fill="none" stroke="rgba(255,193,7,0.06)" strokeWidth="0.5" />
                </svg>
              )}
              <div className="growth-quest-card__content">
                <div className="growth-quest-card__head">
                  <span className={`growth-quest-chip growth-quest-chip--${operation.difficultyTone}`}>{operation.difficulty}</span>
                  <span style={{ fontSize: "0.8rem", color: "rgba(180,190,210,0.6)" }}>{operation.progress}%</span>
                </div>
                <h4>{operation.title}</h4>
                <p>{operation.description}</p>
                <div className="growth-quest-card__progress">
                  <div className="growth-quest-card__progress-head">
                    <span>{operation.progressLabel}</span>
                    <strong>{operation.progress}%</strong>
                  </div>
                  <div className="growth-quest-progress"><span style={{ width: `${operation.progress}%` }} /></div>
                </div>
                <div className="growth-quest-card__foot">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Star className="size-3.5" style={{ color: "#ffc107" }} />
                    {operation.coinLabel}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {operation.xpLabel}
                    <span className="growth-quest-xp-chip">XP</span>
                  </span>
                </div>
                {operation.id === "daily-quest" && (
                  <button type="button" onClick={done ? undefined : onStartQuest} disabled={done} className={cn(PRIMARY_BUTTON_CLASS, "w-full mt-1")}>
                    {done ? <><CheckCircle2 className="size-4" />Completed for today</> : <><Star className="size-4" />Start Today&apos;s Quest<ArrowRight className="size-4" /></>}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {hasFocusData && (
          <article className="growth-quest-focus-card-main growth-quest-panel" style={{ marginTop: "1.5rem" }}>
            <div>
              <span className="growth-quest-chip growth-quest-chip--neutral" style={{ marginBottom: "0.9rem", display: "inline-flex" }}>Recommended Focus</span>
              <h4 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{focusLabel || weakAreaLabel}</h4>
              <p style={{ color: "rgba(170,185,215,0.72)", fontSize: "0.88rem", lineHeight: 1.65, maxWidth: "26rem", marginBottom: "1.25rem" }}>
                {focusDescriptionParts.join(" ")}
              </p>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.45rem", color: "rgba(180,190,210,0.65)" }}>
                  <span>7-day accuracy</span><span>{rolling7DayAccuracy}%</span>
                </div>
                <div className="growth-quest-progress"><span style={{ width: `${rolling7DayAccuracy}%` }} /></div>
              </div>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.82rem", color: "rgba(180,190,210,0.6)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><CheckCircle2 className="size-3.5" style={{ color: "#4ade80" }} />{activity?.completedDays || 0} lifetime practice days</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Target className="size-3.5" style={{ color: "#818cf8" }} />{rollingAccuracy}% lifetime accuracy</span>
              </div>
            </div>
            <svg className="growth-quest-focus-card-main__illustration" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="70" stroke="rgba(30,80,255,0.18)" strokeWidth="1" />
              <circle cx="80" cy="80" r="55" stroke="rgba(30,80,255,0.28)" strokeWidth="1" />
              <circle cx="80" cy="80" r="40" stroke="rgba(30,80,255,0.38)" strokeWidth="1.5" />
              <circle cx="80" cy="80" r="25" stroke="rgba(30,80,255,0.48)" strokeWidth="1.5" />
              <circle cx="80" cy="80" r="10" fill="rgba(255,193,7,0.75)" stroke="#ffc107" strokeWidth="2" />
              <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(30,80,255,0.06)" strokeWidth="18" />
              <line x1="32" y1="28" x2="74" y2="74" stroke="#ffc107" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="32,14 44,32 20,32" fill="#ffc107" transform="rotate(-45 32 28)" />
              <line x1="80" y1="8" x2="80" y2="52" stroke="rgba(30,100,255,0.35)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="152" y1="80" x2="108" y2="80" stroke="rgba(30,100,255,0.35)" strokeWidth="1" strokeDasharray="3,3" />
            </svg>
          </article>
        )}
      </section>

      {(hasMilestone || strongAreaLabel || weakAreaLabel) && (
        <section className="growth-quest-milestone-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
          {hasMilestone && (
            <article className="growth-quest-panel" style={{ padding: 0, overflow: "hidden", position: "relative", minHeight: "260px", background: "linear-gradient(135deg,rgba(8,10,24,0.98),rgba(12,8,28,0.97))" }}>
              <div style={{ position: "absolute", top: "0.75rem", left: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Target className="size-3.5" style={{ color: "#ffc107" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,193,7,0.8)" }}>7-Day Milestone</span>
              </div>
              <svg style={{ position: "absolute", right: "0", top: "0", width: "260px", height: "100%", opacity: 0.9, pointerEvents: "none" }} viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="200" cy="130" r="90" fill="rgba(120,60,220,0.08)" stroke="rgba(120,60,220,0.2)" strokeWidth="1" />
                <circle cx="200" cy="130" r="65" fill="rgba(140,80,240,0.1)" stroke="rgba(140,80,240,0.3)" strokeWidth="1" />
                <circle cx="200" cy="130" r="44" fill="rgba(160,100,255,0.12)" stroke="rgba(160,100,255,0.4)" strokeWidth="1.5" />
                <ellipse cx="200" cy="210" rx="55" ry="8" fill="rgba(120,60,220,0.15)" />
                <path d="M185 95 C185 85 215 85 215 95 L220 155 C220 160 180 160 180 155 Z" fill="rgba(255,160,30,0.15)" stroke="rgba(255,160,30,0.5)" strokeWidth="1.5" />
                <path d="M200 95 C195 108 188 118 188 130 C188 145 200 150 200 150 C200 150 212 145 212 130 C212 118 205 108 200 95 Z" fill="url(#flameGrad)" opacity="0.9" />
                <path d="M200 115 C197 122 194 128 194 135 C194 142 200 145 200 145 C200 145 206 142 206 135 C206 128 203 122 200 115 Z" fill="rgba(255,220,100,0.8)" />
                <defs>
                  <linearGradient id="flameGrad" x1="200" y1="95" x2="200" y2="155" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ff9500" />
                    <stop offset="60%" stopColor="#ff5500" />
                    <stop offset="100%" stopColor="#cc2200" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: "relative", zIndex: 1, padding: "2.5rem 1.75rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: "2.4rem", height: "2.4rem", borderRadius: "0.65rem", background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.3)", display: "grid", placeItems: "center" }}>
                    <Flame className="size-4" style={{ color: "#ff9500" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(30,200,80,0.15)", border: "1px solid rgba(30,200,80,0.3)", color: "#4ade80", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />LIVE
                  </span>
                </div>
                <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: "0.4rem" }}>{nextMilestone?.targetDays || 7}-Day Milestone</h3>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#ffc107", marginBottom: "0.35rem" }}>{nextMilestone?.label || "Keep the streak alive to unlock your next milestone."}</p>
                <p style={{ fontSize: "0.84rem", color: "rgba(170,185,215,0.65)", marginBottom: "1.5rem" }}>Complete practice for {nextMilestone?.targetDays || 7} days to unlock this milestone.</p>
                <div className="growth-quest-progress" style={{ height: "6px", marginBottom: "0.6rem" }}>
                  <span style={{ width: `${clampPercent(nextMilestone?.targetDays ? (streak / nextMilestone.targetDays) * 100 : (streak / 7) * 100)}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(180,190,210,0.55)" }}>
                  <span>{clampPercent(nextMilestone?.targetDays ? (streak / nextMilestone.targetDays) * 100 : (streak / 7) * 100)}% complete</span>
                  <span>{streak} / {nextMilestone?.targetDays || 7} days</span>
                </div>
              </div>
            </article>
          )}

          <div style={{ display: "grid", gap: "1.25rem" }}>
            {strongAreaLabel && (
              <article className="growth-quest-panel" style={{ padding: "1.25rem", position: "relative", overflow: "hidden", background: isDark ? "linear-gradient(135deg,rgba(8,10,24,0.98),rgba(12,8,28,0.97))" : "linear-gradient(180deg,#ffffff 0%,#faf7f0 100%)" }}>
                <svg style={{ position: "absolute", right: "-0.5rem", top: "50%", transform: "translateY(-50%)", width: "90px", height: "90px", opacity: 0.7, pointerEvents: "none" }} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="45" cy="45" r="38" stroke={isDark ? "rgba(120,60,220,0.3)" : "rgba(214,174,64,0.22)"} strokeWidth="1" />
                  <circle cx="45" cy="45" r="28" stroke={isDark ? "rgba(140,80,240,0.4)" : "rgba(214,174,64,0.28)"} strokeWidth="1" />
                  <line x1="20" y1="20" x2="43" y2="43" stroke={isDark ? "rgba(180,130,255,0.8)" : "rgba(194,126,0,0.78)"} strokeWidth="2" strokeLinecap="round" />
                  <polygon points="20,10 28,22 12,22" fill={isDark ? "rgba(180,130,255,0.8)" : "rgba(194,126,0,0.78)"} transform="rotate(-45 20 18)" />
                </svg>
                <div style={{ position: "relative", zIndex: 1, maxWidth: "calc(100% - 70px)" }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: isDark ? "rgba(180,190,210,0.45)" : "rgba(28,27,31,0.50)", display: "block", marginBottom: "0.5rem" }}>Best Topic</span>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <h4 style={{ fontSize: "1.4rem", fontWeight: 800, color: isDark ? "#fff" : "#1C1B1F", letterSpacing: "-0.01em" }}>{strongAreaLabel}</h4>
                    <span className="growth-quest-chip growth-quest-chip--violet" style={{ flexShrink: 0, fontSize: "0.6rem" }}>Strongest</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: isDark ? "rgba(170,185,215,0.65)" : "rgba(28,27,31,0.68)", lineHeight: 1.6, marginBottom: "0.85rem" }}>This shows your strongest freelancing topic based on your recorded answers.</p>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <div>
                      <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#cdbdff", fontFamily: "'Hanken Grotesk',sans-serif" }}>{rollingAccuracy}%</p>
                      <p style={{ fontSize: "0.7rem", color: isDark ? "rgba(180,190,210,0.45)" : "rgba(28,27,31,0.45)" }}>lifetime</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#cdbdff", fontFamily: "'Hanken Grotesk',sans-serif" }}>{rolling7DayAccuracy}%</p>
                      <p style={{ fontSize: "0.7rem", color: isDark ? "rgba(180,190,210,0.45)" : "rgba(28,27,31,0.45)" }}>7-day</p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {weakAreaLabel && (
              <article
                className="growth-quest-panel"
                style={{
                  padding: "1.25rem",
                  position: "relative",
                  overflow: "hidden",
                  background: isDark ? "linear-gradient(135deg,rgba(8,10,24,0.98),rgba(12,8,28,0.97))" : "linear-gradient(180deg,#ffffff 0%,#faf7f0 100%)",
                }}
              >
                <svg style={{ position: "absolute", right: "-0.5rem", top: "1.1rem", width: "84px", height: "84px", opacity: 0.7, pointerEvents: "none" }} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 8 L60 18 L60 42 C60 55 50 64 40 68 C30 64 20 55 20 42 L20 18 Z" fill={isDark ? "rgba(60,80,200,0.15)" : "rgba(255,193,7,0.10)"} stroke={isDark ? "rgba(100,130,255,0.4)" : "rgba(214,174,64,0.40)"} strokeWidth="1.5" />
                  <path d="M40 18 L52 25 L52 41 C52 50 46 56 40 59 C34 56 28 50 28 41 L28 25 Z" fill={isDark ? "rgba(80,100,220,0.2)" : "rgba(255,224,138,0.35)"} stroke={isDark ? "rgba(120,150,255,0.5)" : "rgba(214,174,64,0.55)"} strokeWidth="1" />
                  <line x1="34" y1="40" x2="38" y2="44" stroke={isDark ? "rgba(180,200,255,0.8)" : "rgba(194,126,0,0.85)"} strokeWidth="2" strokeLinecap="round" />
                  <line x1="38" y1="44" x2="46" y2="34" stroke={isDark ? "rgba(180,200,255,0.8)" : "rgba(194,126,0,0.85)"} strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.85rem", marginBottom: "0.8rem" }}>
                    <div style={{ maxWidth: "calc(100% - 74px)" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: isDark ? "rgba(180,190,210,0.45)" : "rgba(28,27,31,0.50)", display: "block", marginBottom: "0.5rem" }}>Practice Next</span>
                      <h4 style={{ fontSize: "1.4rem", fontWeight: 800, color: isDark ? "#fff" : "#1C1B1F", letterSpacing: "-0.01em", marginBottom: "0.35rem" }}>{weakAreaLabel}</h4>
                      <p style={{ fontSize: "0.8rem", color: isDark ? "rgba(170,185,215,0.72)" : "rgba(28,27,31,0.72)", lineHeight: 1.55 }}>
                        {weakAreaGuide?.headline || "This topic is currently pulling down your results. Practice here next to improve faster."}
                      </p>
                    </div>
                    <span className="growth-quest-chip growth-quest-chip--violet" style={{ flexShrink: 0, fontSize: "0.58rem" }}>
                      {focusLabel === weakAreaLabel ? "Current Focus" : "Needs Attention"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.65rem", marginBottom: "0.85rem" }}>
                    <div style={{ borderRadius: "12px", border: isDark ? "1px solid rgba(100,130,255,0.18)" : "1px solid rgba(28,27,31,0.10)", background: isDark ? "rgba(16,20,40,0.68)" : "rgba(255,255,255,0.92)", padding: "0.8rem", boxShadow: isDark ? "none" : "0 10px 28px -22px rgba(28,27,31,0.22)" }}>
                      <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(180,190,210,0.5)" : "rgba(28,27,31,0.45)", marginBottom: "0.35rem" }}>Accuracy</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#cdbdff", fontFamily: "'Hanken Grotesk',sans-serif" }}>{weakAreaAccuracy}%</p>
                    </div>
                    <div style={{ borderRadius: "12px", border: isDark ? "1px solid rgba(100,130,255,0.18)" : "1px solid rgba(28,27,31,0.10)", background: isDark ? "rgba(16,20,40,0.68)" : "rgba(255,255,255,0.92)", padding: "0.8rem", boxShadow: isDark ? "none" : "0 10px 28px -22px rgba(28,27,31,0.22)" }}>
                      <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(180,190,210,0.5)" : "rgba(28,27,31,0.45)", marginBottom: "0.35rem" }}>Attempts</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 800, color: isDark ? "#fff" : "#1C1B1F", fontFamily: "'Hanken Grotesk',sans-serif" }}>{weakAreaAttempted}</p>
                    </div>
                    <div style={{ borderRadius: "12px", border: isDark ? "1px solid rgba(100,130,255,0.18)" : "1px solid rgba(28,27,31,0.10)", background: isDark ? "rgba(16,20,40,0.68)" : "rgba(255,255,255,0.92)", padding: "0.8rem", boxShadow: isDark ? "none" : "0 10px 28px -22px rgba(28,27,31,0.22)" }}>
                      <p style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(180,190,210,0.5)" : "rgba(28,27,31,0.45)", marginBottom: "0.35rem" }}>Missed</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fda4af", fontFamily: "'Hanken Grotesk',sans-serif" }}>{weakAreaMissed}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.45rem", fontSize: "0.74rem", color: isDark ? "rgba(180,190,210,0.65)" : "rgba(28,27,31,0.62)" }}>
                      <span>Weak-topic recovery progress</span>
                      <span>{weakAreaAccuracy}%</span>
                    </div>
                    <div className="growth-quest-progress">
                      <span style={{ width: `${clampPercent(weakAreaAccuracy)}%` }} />
                    </div>
                  </div>

                  <div style={{ borderRadius: "12px", border: isDark ? "1px solid rgba(100,130,255,0.16)" : "1px solid rgba(28,27,31,0.10)", background: isDark ? "rgba(14,18,34,0.72)" : "rgba(255,255,255,0.94)", padding: "0.9rem", boxShadow: isDark ? "none" : "0 10px 28px -22px rgba(28,27,31,0.22)" }}>
                    <p style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "#9fb1ff" : "#6b7280", marginBottom: "0.55rem" }}>How To Improve</p>
                    <div style={{ display: "grid", gap: "0.45rem" }}>
                      {(weakAreaGuide?.tips || [
                        "Review the questions you miss most often in this topic.",
                        "Retry this area before moving back to stronger categories.",
                        "Use the next few sessions to build consistency here.",
                      ]).map((tip) => (
                        <p key={tip} style={{ fontSize: "0.78rem", color: isDark ? "rgba(215,224,245,0.78)" : "rgba(28,27,31,0.76)", lineHeight: 1.55, display: "flex", alignItems: "flex-start", gap: "0.45rem" }}>
                          <span style={{ color: isDark ? "#818cf8" : "#d97706", marginTop: "0.05rem" }}>-</span>
                          <span>{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      )}

      {hasTopicData ? (
        <section className="mt-10" style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "3.2rem", height: "3.2rem", borderRadius: "0.75rem", background: isDark ? "linear-gradient(145deg,rgba(255,193,7,0.2),rgba(180,130,0,0.1))" : "linear-gradient(145deg,rgba(255,193,7,0.14),rgba(255,224,138,0.35))", border: isDark ? "1px solid rgba(200,160,50,0.4)" : "1px solid rgba(214,174,64,0.28)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: isDark ? "0 0 20px rgba(255,193,7,0.12)" : "0 8px 24px rgba(255,193,7,0.10)" }}>
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                  <rect x="2" y="12" width="4" height="6" rx="0.5" fill="#ffc107" />
                  <rect x="8" y="7" width="4" height="11" rx="0.5" fill="#ffc107" opacity="0.85" />
                  <rect x="14" y="3" width="4" height="15" rx="0.5" fill="#ffc107" opacity="0.7" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: isDark ? "#fff" : "#1C1B1F", letterSpacing: "-0.01em" }}>Topic Performance</h3>
                <p style={{ fontSize: "0.84rem", color: isDark ? "rgba(170,185,215,0.6)" : "rgba(28,27,31,0.68)", marginTop: "0.2rem" }}>This shows which freelancing topics you are strong or weak in.</p>
              </div>
            </div>
            <button type="button" style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.5rem 1rem", borderRadius: "999px", border: isDark ? "1px solid rgba(255,193,7,0.25)" : "1px solid rgba(255,193,7,0.18)", background: isDark ? "rgba(255,193,7,0.08)" : "rgba(255,193,7,0.10)", color: "#c58a00", fontSize: "0.8rem", fontWeight: 700, cursor: "default", flexShrink: 0 }}>
              <Target className="size-3.5" style={{ color: "#ffc107" }} />
              {topicPerformance.length} tracked categories
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => scrollBy(-1)} className="growth-quest-scroll-arrow absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full border border-white/10 bg-background/80 backdrop-blur shadow-xl grid place-items-center hover:bg-white/5 transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <div ref={topicScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
              {topicPerformance.map((topic) => {
                const acc = clampPercent(topic.accuracy);
                const missed = Math.max(0, topic.attempted - topic.correct);
                const col = getTopicColor(acc);
                const dash = (acc / 100) * topic_circ;
                return (
                  <article key={topic.key} className="growth-quest-topic-card flex-shrink-0 w-[280px] snap-start rounded-2xl border overflow-hidden relative flex flex-col" style={{ borderColor: isDark ? col.border : "rgba(28,27,31,0.10)", background: isDark ? "linear-gradient(135deg,rgba(15,18,32,0.98),rgba(8,10,24,0.96))" : "linear-gradient(180deg,#ffffff 0%,#f6f7fb 100%)", boxShadow: isDark ? `0 8px 24px -8px ${col.glow}` : "0 14px 40px -24px rgba(28,27,31,0.18)" }}>
                    <div className="flex items-start justify-between p-4 pb-2">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "rgba(28,27,31,0.45)" }}>Topic Performance</span>
                      <div className="relative size-14 shrink-0">
                        <svg viewBox="0 0 72 72" className="size-full">
                          <circle cx="36" cy="36" r={topic_r} fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(28,27,31,0.08)"} strokeWidth="6" />
                          <circle cx="36" cy="36" r={topic_r} fill="none" stroke={col.stroke} strokeWidth="6"
                            strokeDasharray={`${dash} ${topic_circ - dash}`} strokeLinecap="round"
                            transform="rotate(-90 36 36)"
                            style={{ filter: `drop-shadow(0 0 4px ${col.stroke}80)` }} />
                        </svg>
                        <div className="absolute inset-0 grid place-items-center">
                          <span className="text-[11px] font-black" style={{ color: col.stroke }}>{acc}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-2">
                      <div className="size-11 rounded-xl border grid place-items-center mb-3" style={{ background: col.bg, borderColor: col.border }}>
                        {getTopicIcon(topic.key, col.icon)}
                      </div>
                      <h4 className="text-[1.2rem] font-bold leading-tight mb-2" style={{ color: isDark ? "#fff" : "#1C1B1F" }}>{topic.label}</h4>
                      <p className="text-[0.8rem] leading-relaxed mb-4" style={{ color: isDark ? "rgba(255,255,255,0.50)" : "rgba(28,27,31,0.60)" }}>
                        {topic.correct} correct answers from {topic.attempted} attempts.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="flex items-center gap-1.5 text-[0.75rem] font-bold px-2.5 py-1 rounded-full border" style={{ color: isDark ? "#34d399" : "#0f766e", borderColor: isDark ? "rgba(16,185,129,0.20)" : "rgba(16,185,129,0.18)", background: isDark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.08)" }}>
                          <CheckCircle2 className="size-3" />{topic.correct} correct
                        </span>
                        <span className="flex items-center gap-1.5 text-[0.75rem] font-bold px-2.5 py-1 rounded-full border" style={{ color: isDark ? "#fb7185" : "#be123c", borderColor: isDark ? "rgba(244,63,94,0.20)" : "rgba(244,63,94,0.18)", background: isDark ? "rgba(244,63,94,0.05)" : "rgba(244,63,94,0.08)" }}>
                          <XCircle className="size-3" />{missed} missed
                        </span>
                      </div>
                      <div className="h-[5px] rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(28,27,31,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${acc}%`, background: `linear-gradient(90deg, ${col.stroke}, ${col.stroke}dd)`, boxShadow: `0 0 10px ${col.glow}` }} />
                      </div>
                    </div>

                    <svg className="block w-full h-8 mt-auto opacity-20" viewBox="0 0 280 32" preserveAspectRatio="none" fill="none">
                      <path d="M0 15 Q35 5 70 15 Q105 25 140 15 Q175 5 210 15 Q245 25 280 15 L280 32 L0 32 Z" fill={col.stroke} />
                      <path d="M0 20 Q45 10 90 20 Q135 30 180 20 Q225 10 280 20 L280 32 L0 32 Z" fill={col.stroke} opacity="0.5" />
                    </svg>
                  </article>
                );
              })}
            </div>
            <button type="button" onClick={() => scrollBy(1)} className="growth-quest-scroll-arrow absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full border border-white/10 bg-background/80 backdrop-blur shadow-xl grid place-items-center hover:bg-white/5 transition-colors">
              <ArrowRight className="size-5" />
            </button>
          </div>
        </section>
      ) : null}

      {hasContests ? (
        <section className="mt-12">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
              <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "linear-gradient(145deg,rgba(124,58,237,0.25),rgba(76,29,149,0.15))", border: "1px solid rgba(139,92,246,0.4)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 0 25px rgba(139,92,246,0.2)" }}>
                <Trophy className="size-7" style={{ color: "#ffc107", filter: "drop-shadow(0 0 8px rgba(255,193,7,0.3))" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Contests</h3>
                <p style={{ fontSize: "0.95rem", color: "rgba(170,185,215,0.6)", marginTop: "0.25rem" }}>Join contests to earn extra XP and coins.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 1.25rem", borderRadius: "999px", border: "1px solid rgba(255,193,7,0.3)", background: "rgba(255,193,7,0.08)", color: "#ffc107", fontSize: "0.85rem", fontWeight: 800, boxShadow: "0 0 20px rgba(255,193,7,0.1)" }}>
              <Zap className="size-4 animate-pulse" />
              {contests.length} live contests
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => contestScrollBy(-1)} className="growth-quest-scroll-arrow absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full border border-white/10 bg-background/90 backdrop-blur-md shadow-2xl grid place-items-center hover:bg-white/5 transition-all active:scale-90">
              <ArrowLeft className="size-5" />
            </button>

            <div ref={contestScrollRef} className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory px-2">
              {contests.map((contest) => {
                const theme = getContestTheme(contest.title);
                return (
                  <article
                    key={contest.id}
                    className="growth-quest-contest-card flex-shrink-0 w-[340px] snap-start rounded-[24px] border bg-slate-900/40 backdrop-blur-sm overflow-hidden flex flex-col group transition-all duration-500 hover:-translate-y-2"
                    style={{ borderColor: theme.border, boxShadow: `0 10px 40px -10px ${theme.glow}` }}
                    onClick={() => navigate(`/freelancer/growth-quest/contests/${contest.id}`)}
                  >
                    <div className="relative h-[200px] w-full overflow-hidden">
                      {contest.imageUrl ? (
                        <img src={contest.imageUrl} alt={contest.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 grid place-items-center">
                          <Trophy className="size-12 opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white/90 border border-white/10 backdrop-blur-md" style={{ background: theme.chip }}>
                          Contest
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h4 className="text-xl font-bold text-white leading-tight transition-colors group-hover:text-primary">
                          {contest.title}
                        </h4>
                        <div className="flex flex-col items-center justify-center size-14 rounded-2xl border border-white/10 bg-white/5 shrink-0">
                          <Clock className="size-4 text-white/40 mb-1" />
                          <span className="text-[10px] font-bold text-white/60">{contest.startDayKey?.split('-').slice(1).join('/') || '05/15'}</span>
                        </div>
                      </div>

                      <p className="text-sm text-white/50 line-clamp-2 leading-relaxed mb-6">
                        {contest.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="size-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <Star className="size-3 text-amber-500" />
                            </div>
                            <span className="text-xs font-bold text-white/70">{contest.rewardCoins || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="size-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <Zap className="size-3 text-blue-500" />
                            </div>
                            <span className="text-xs font-bold text-white/70">{contest.rewardXp || 0} XP</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2 transition-all group-hover:gap-3"
                          style={{ background: theme.btn }}
                        >
                          View Contest
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button type="button" onClick={() => contestScrollBy(1)} className="growth-quest-scroll-arrow absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full border border-white/10 bg-background/90 backdrop-blur-md shadow-2xl grid place-items-center hover:bg-white/5 transition-all active:scale-90">
              <ArrowRight className="size-5" />
            </button>
          </div>
        </section>
      ) : null}

      {hasRecentHistory ? (
        <section className="mt-16">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
              <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "linear-gradient(145deg,rgba(245,158,11,0.25),rgba(180,83,9,0.15))", border: "1px solid rgba(251,191,36,0.4)", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 0 25px rgba(245,158,11,0.2)" }}>
                <Clock className="size-7" style={{ color: "#fbbf24", filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Recent Activity</h3>
                <p style={{ fontSize: "0.95rem", color: "rgba(170,185,215,0.6)", marginTop: "0.25rem" }}>Your latest practice sessions and performance insights.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 1.25rem", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(170,185,215,0.7)", fontSize: "0.85rem", fontWeight: 700, backdropBlur: "md" }}>
              <Clock className="size-4 opacity-50" />
              Viewing last 10 activities
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-2xl" style={{ boxShadow: "0 20px 50px -20px rgba(0,0,0,0.5), inset 0 0 40px rgba(100,100,255,0.02)" }}>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Activity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Outcome</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Rewards Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyRows.map((row) => (
                    <tr key={row.id} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Zap className="size-5 text-amber-500" />
                          </div>
                          <span className="text-base font-bold text-white/90">{row.label}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3 text-white/60">
                          <Target className="size-4 text-blue-400" />
                          <span className="text-sm font-medium">{row.score} correct</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3 text-white/40">
                          <Clock className="size-4" />
                          <span className="text-sm">{row.date}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                          <div className="px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2" style={{ boxShadow: "0 0 15px rgba(245,158,11,0.05)" }}>
                            <Star className="size-3 text-amber-500" />
                            <span className="text-xs font-black text-amber-500">{row.rewards}</span>
                          </div>
                          <div className="px-4 py-2 rounded-xl bg-violet-500/5 border border-violet-500/20 flex items-center gap-2" style={{ boxShadow: "0 0 15px rgba(139,92,246,0.05)" }}>
                            <Zap className="size-3 text-violet-400" />
                            <span className="text-xs font-black text-violet-400">80% ACCURACY</span>
                          </div>
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

      {false && (
        <footer className="growth-quest-footer mt-20 relative pt-12 pb-8 px-8 rounded-[32px] border border-white/5 bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-3xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] z-10" />
        </footer>
      )}
    </div>
  );
};

const QuizView = GrowthQuestQuizView;
const ResultView = GrowthQuestResultView;

const FreelancerGrowthQuestPage = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [quest, setQuest] = useState(null);
  const [previewQuest, setPreviewQuest] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingQuest, setLoadingQuest] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingServiceSelection, setSavingServiceSelection] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [idempotencyKey, setIdempotencyKey] = useState(makeKey);
  const [infoOpen, setInfoOpen] = useState(false);

  const progressKey = useMemo(() => {
    const userId = user?.id || "anonymous";
    const dayKey = quest?.dayKey || previewQuest?.dayKey || "pending";
    return `growthQuestProgress:${userId}:${dayKey}`;
  }, [previewQuest?.dayKey, quest?.dayKey, user?.id]);

  const readProgress = useCallback(() => {
    if (!progressKey) return null;
    try {
      const raw = localStorage.getItem(progressKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [progressKey]);

  const writeProgress = useCallback(
    (payload) => {
      if (!progressKey) return;
      try {
        localStorage.setItem(
          progressKey,
          JSON.stringify({
            dayKey: quest?.dayKey || previewQuest?.dayKey,
            updatedAt: Date.now(),
            ...payload,
          })
        );
      } catch {
        // Ignore storage errors to avoid blocking the quiz.
      }
    },
    [previewQuest?.dayKey, progressKey, quest?.dayKey]
  );

  const clearProgress = useCallback(() => {
    if (!progressKey) return;
    try {
      localStorage.removeItem(progressKey);
    } catch {
      // Ignore storage errors.
    }
  }, [progressKey]);

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

  const loadQuestPreview = useCallback(async () => {
    if (!authFetch || view !== "dashboard") return;
    if (!dashboard?.profile?.serviceProfileReady) {
      setPreviewQuest(null);
      setLoadingPreview(false);
      return;
    }

    setLoadingPreview(true);
    try {
      const response = await authFetch("/engagement/daily/start", {
        method: "POST",
        suppressToast: true,
      });
      const payload = await response.json().catch(() => null);
      if (response.ok) {
        setPreviewQuest(payload?.data || null);
      }
    } catch {
      // Silent by design. Preview is optional UI.
    } finally {
      setLoadingPreview(false);
    }
  }, [authFetch, dashboard?.profile?.serviceProfileReady, view]);

  useEffect(() => {
    if (view === "dashboard") {
      loadQuestPreview();
    }
  }, [loadQuestPreview, view, dashboard?.profile?.serviceProfileReady]);

  const saveServiceSelection = useCallback(async (service) => {
    if (!authFetch || !service || savingServiceSelection) return;

    setSavingServiceSelection(true);
    setError("");
    try {
      const response = await authFetch("/engagement/service-selection", {
        method: "POST",
        body: JSON.stringify({ service }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save service.");
      }

      setDashboard(payload?.data?.dashboard || null);
      setPreviewQuest(null);
      clearProgress();
      toast.success("Service saved. Generating today’s questions.");
    } catch (err) {
      setError(err?.message || "Failed to save service.");
      toast.error(err?.message || "Failed to save service.");
    } finally {
      setSavingServiceSelection(false);
    }
  }, [authFetch, clearProgress, savingServiceSelection]);

  const startQuest = async () => {
    if (!authFetch) return;
    if (!dashboard?.profile?.serviceProfileReady) {
      setError("Select your service first so AI can prepare your Growth Quest.");
      return;
    }

    if (previewQuest?.status === "completed") {
      setQuest(previewQuest);
      setResult(previewQuest.resultSummary || null);
      clearProgress();
      setView("result");
      return;
    }

    if (previewQuest?.status === "in_progress" && Array.isArray(previewQuest?.questions)) {
      setQuest(previewQuest);
      setIdempotencyKey(makeKey());
      setSelectedAnswers({});
      setRevealedQuestions({});
      setActiveIndex(0);
      setView("quiz");
      return;
    }

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
        clearProgress();
        setView("result");
      } else {
        setIdempotencyKey(makeKey());
        setSelectedAnswers({});
        setRevealedQuestions({});
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
  const questionIds = useMemo(
    () => questions.map((question) => question.id),
    [questions]
  );
  const canSubmit =
    questions.length > 0 && questions.every((question) => selectedAnswers[question.id]);

  useEffect(() => {
    if (view !== "quiz" || questions.length === 0) return;
    const stored = readProgress();
    if (!stored?.questionIds?.length) return;
    const storedIds = stored.questionIds.join("|");
    const currentIds = questionIds.join("|");
    if (storedIds !== currentIds) return;

    const restoredAnswers = stored.selectedAnswers || {};
    const restoredReveals = stored.revealedQuestions || {};
    const firstUnansweredIndex = questionIds.findIndex(
      (id) => !restoredAnswers[id]
    );
    const nextIndex =
      firstUnansweredIndex >= 0
        ? firstUnansweredIndex
        : Math.min(Number(stored.activeIndex || 0), questionIds.length - 1);

    setSelectedAnswers(restoredAnswers);
    setRevealedQuestions(restoredReveals);
    setActiveIndex(nextIndex);
  }, [questionIds, questions.length, readProgress, view]);

  useEffect(() => {
    if (view !== "quiz" || questions.length === 0) return;
    writeProgress({
      selectedAnswers,
      revealedQuestions,
      activeIndex,
      questionIds,
    });
  }, [activeIndex, questionIds, questions.length, revealedQuestions, selectedAnswers, view, writeProgress]);

  const handleSelectAnswer = (questionId, optionId) => {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  };

  const handleRevealAnswer = (question, optionId, isCorrect) => {
    if (!question?.id) return;
    setRevealedQuestions((current) => ({
      ...current,
      [question.id]: true,
    }));
    if (isCorrect) {
      toast.success("+10 Coins & +15 XP", { icon: "🔥", duration: 2000 });
    }
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
      clearProgress();
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
            previewQuestions={Array.isArray(previewQuest?.questions) ? previewQuest.questions : []}
            loadingPreview={loadingPreview}
            onSaveServiceSelection={saveServiceSelection}
            savingServiceSelection={savingServiceSelection}
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
              revealedQuestions={revealedQuestions}
              handleRevealAnswer={handleRevealAnswer}
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


