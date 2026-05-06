// v3 - project color tokens only
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
import { useNavigate } from "react-router-dom";
import FreelancerTopBar from "@/components/features/freelancer/FreelancerTopBar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

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
  { emoji: "📅", title: "Daily Questions", desc: "Answer 5 client-readiness questions every day. Questions reset at UTC midnight." },
  { emoji: "🔥", title: "Streaks", desc: "Complete today's quest to keep your streak alive. Miss a day and it resets to 0. Build streaks to unlock milestone badges." },
  { emoji: "⚡", title: "XP & Level", desc: "Earn XP for every correct answer. Accumulate XP to level up your engagement rank — separate from your project experience level." },
  { emoji: "🪙", title: "Loyalty Coins", desc: "Coins are awarded on completion. Use them to redeem rewards, freeze streaks, or unlock perks in future updates." },
  { emoji: "🔁", title: "Retakes", desc: "You get 2 attempts per day. Use a retake to improve your score — your best result is counted." },
  { emoji: "🏆", title: "Leaderboard", desc: "Top freelancers by total coins are ranked weekly. Climb the board to get priority in hackathons and challenges." },
];

const InfoModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-[28px] border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
              <Info className="size-4 text-primary" />
            </div>
            <h2 className="text-base font-black text-foreground">How Growth Quest Works</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
                <span className="text-2xl leading-none pt-0.5">{item.emoji}</span>
                <div>
                  <p className="text-sm font-black text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
            <p className="text-xs font-semibold text-primary">💡 Tip: Complete your quest every day before midnight UTC to maintain your streak and maximise rewards.</p>
          </div>
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

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-card p-8 sm:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Daily Growth Quest
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight text-foreground sm:text-5xl">
            Play to Gain<br />Knowledge 🚀
          </h1>
          <p className="mt-3 text-sm font-medium text-muted-foreground leading-relaxed">
            5 daily questions · Boost your client readiness · Earn XP &amp; coins
          </p>
          {error && <p className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive w-fit">{error}</p>}
          <button
            type="button"
            onClick={onStartQuest}
            disabled={done}
            className={cn(
              "mt-7 inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-black tracking-wide shadow-md transition-all duration-200 hover:scale-105 active:scale-95",
              done ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {done ? "Completed for Today ✓" : isRetake ? `Retake Quest (${max - used} left)` : "Get Started →"}
          </button>
        </div>
        <div className="absolute -right-10 -top-10 opacity-[0.06] pointer-events-none">
          <Trophy className="size-72 text-primary" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Flame} label="Streak" value={`${streak} 🔥`} sub="days active" />
        <StatCard icon={Zap} label="XP Total" value={xp} sub="experience pts" />
        <StatCard icon={Star} label="Coins" value={coins} sub="loyalty coins" />
        <StatCard icon={Trophy} label="Level" value={`Lv. ${level}`} sub="engagement rank" />
      </div>

      {/* Leaderboard */}
      <div className="rounded-[32px] border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Top Performers</p>
            <h2 className="mt-0.5 text-xl font-black text-foreground">Leaderboard</h2>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="size-5 text-primary" />
          </div>
        </div>
        <div className="space-y-1.5">
          {leaderboard.map((u) => <LeaderRow key={u.rank} {...u} />)}
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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Daily Growth Quest</p>
          <h2 className="mt-0.5 text-xl font-black text-foreground">
            Question <span className="text-primary">{activeIndex + 1}</span>
            <span className="text-muted-foreground"> of {questions.length}</span>
          </h2>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(q.options || []).map((opt, idx) => {
            const selected = selectedAnswers[q.id] === opt.id;
            const label = LABELS[idx] || opt.id.toUpperCase();
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectAnswer(q.id, opt.id)}
                className={cn(
                  "flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-150",
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
  const score = result?.score || {};
  const rewards = result?.rewards || {};
  const answers = Array.isArray(result?.answers) ? result.answers : [];

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-5">
      {/* Score hero */}
      <div className="rounded-[32px] border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[20px] bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-muted-foreground">Quest Completed!</p>
        <p className="mt-2 text-6xl font-black text-foreground">
          {score.correctCount ?? 0}<span className="text-3xl text-muted-foreground"> / {score.questionCount ?? 0}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{score.accuracy ?? 0}% accuracy</p>

        <div className="mt-6 inline-flex gap-8 rounded-2xl border border-border bg-background px-8 py-4">
          <div className="text-center">
            <p className="text-xl font-black text-primary">+{rewards.xpAwarded ?? 0}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">XP</p>
          </div>
          <div className="h-auto w-px bg-border" />
          <div className="text-center">
            <p className="text-xl font-black text-foreground">+{rewards.coinsAwarded ?? 0}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Coins</p>
          </div>
          <div className="h-auto w-px bg-border" />
          <div className="text-center">
            <p className="text-xl font-black text-foreground">{result?.streak?.currentStreak ?? 0} 🔥</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Streak</p>
          </div>
        </div>
      </div>

      {/* Badge */}
      {Array.isArray(result?.unlockedBadges) && result.unlockedBadges.length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/8 px-6 py-4">
          <Trophy className="size-6 text-primary shrink-0" />
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-wider text-muted-foreground">Badge Unlocked!</p>
            <p className="font-black text-foreground">{result.unlockedBadges.map((b) => b.title).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Answer review */}
      <div className="rounded-[28px] border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-black text-foreground">Review Answers</h3>
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {answers.map((a, i) => (
            <div key={a.questionId} className={cn("rounded-2xl border p-4", a.isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5")}>
              <div className="flex gap-3">
                {a.isCorrect
                  ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500 mt-0.5" />
                  : <XCircle className="size-5 shrink-0 text-destructive mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground"><span className="text-muted-foreground mr-2">{i + 1}.</span>{a.questionText}</p>
                  {!a.isCorrect && (
                    <p className="mt-1.5 text-xs font-semibold text-destructive">Correct: <span className="font-black">{String(a.correctOptionId).toUpperCase()}</span></p>
                  )}
                  {a.explanation && (
                    <p className="mt-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-muted-foreground leading-relaxed">{a.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">Next quest unlocks around <span className="text-foreground">{formatReset(nextResetAt)}</span></p>
      <button
        type="button"
        onClick={onBack}
        className="mx-auto flex h-12 items-center gap-2 rounded-full bg-primary px-9 text-sm font-black text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90"
      >
        Back to Dashboard
      </button>
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
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <div className="mb-7 flex items-center gap-3">
          <button
            type="button"
            onClick={() => { if (view === "quiz") setView("dashboard"); else navigate("/freelancer"); }}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {view === "quiz" ? "Back to Dashboard" : "Back to Home"}
          </button>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            title="How does Growth Quest work?"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <Info className="size-4" />
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
