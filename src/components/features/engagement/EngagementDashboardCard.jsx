import React, { useCallback, useEffect, useMemo, useState } from "react";
import Award from "lucide-react/dist/esm/icons/award";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Flame from "lucide-react/dist/esm/icons/flame";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Target from "lucide-react/dist/esm/icons/target";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Clock from "lucide-react/dist/esm/icons/clock";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "@/components/freelancer/freelancer-dashboard/shared.jsx";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";

const formatCountdown = (resetAt) => {
  if (!resetAt) return "Next reset soon";
  const diffMs = new Date(resetAt).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "Ready for today";

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m to reset`;
  return `${hours}h ${minutes}m to reset`;
};

const StatBlock = ({ icon: Icon, label, value, tone = "default", sub }) => (
  <div className="group relative min-w-0 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:bg-white/[0.05] hover:shadow-lg">
    <div className="flex items-center gap-2.5 text-muted-foreground">
      <div className={cn(
        "flex size-7 items-center justify-center rounded-lg transition-colors",
        tone === "yellow" && "bg-[#facc15]/10 text-[#facc15]",
        tone === "emerald" && "bg-emerald-400/10 text-emerald-400",
        tone === "default" && "bg-primary/10 text-primary"
      )}>
        <Icon className="size-3.5" />
      </div>
      <p className="truncate text-[0.65rem] font-black uppercase tracking-[0.15em]">
        {label}
      </p>
    </div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <p className="truncate text-xl font-black text-white">
        {value}
      </p>
      {sub && <p className="text-[0.65rem] font-bold text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const EngagementDashboardCardSkeleton = () => (
  <FreelancerDashboardPanel className="bg-card p-4 sm:p-5">
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <FreelancerDashboardSkeletonBlock className="h-8 w-48 rounded-full" />
        <FreelancerDashboardSkeletonBlock className="h-9 w-36 rounded-[10px]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <FreelancerDashboardSkeletonBlock
            key={item}
            className="h-[84px] rounded-[20px]"
          />
        ))}
      </div>
    </div>
  </FreelancerDashboardPanel>
);

const EngagementDashboardCard = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  const canLoadEngagement =
    String(user?.role || "").toUpperCase() === "FREELANCER" ||
    (Array.isArray(user?.roles) &&
      user.roles.some((role) => String(role).toUpperCase() === "FREELANCER"));

  const loadDashboard = useCallback(async () => {
    if (!authFetch || !canLoadEngagement) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await authFetch("/engagement/dashboard", {
        suppressToast: true,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load Growth Quest.");
      }
      setDashboard(payload?.data || null);
    } catch (err) {
      console.error("Failed to load engagement dashboard", err);
      setError(err?.message || "Growth Quest is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, canLoadEngagement]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const countdown = useMemo(() => {
    void nowTick;
    return formatCountdown(dashboard?.today?.nextResetAt);
  }, [dashboard?.today?.nextResetAt, nowTick]);

  if (!canLoadEngagement) return null;

  if (loading) {
    return <EngagementDashboardCardSkeleton />;
  }

  if (error) {
    return (
      <FreelancerDashboardPanel className="bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.76rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Daily Growth Quest
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={loadDashboard}
          >
            Retry
          </Button>
        </div>
      </FreelancerDashboardPanel>
    );
  }

  const profile = dashboard?.profile || {};
  const today = dashboard?.today || {};
  const levelProgress = dashboard?.levelProgress || {};
  const processSummary = dashboard?.processSummary || {};
  const completed = today.status === "completed";

  const xp = profile.lifetimeXp || 0;
  const xpPct = levelProgress?.percent || 0;

  return (
    <section className="w-full min-w-0">
      <FreelancerDashboardPanel className="relative overflow-hidden bg-card p-5 sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
        
        <div className="relative flex flex-col gap-6">
          {/* Header Row */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-start gap-4 min-w-0">
              <div className="relative flex size-14 shrink-0 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/[0.06]" />
                  <circle
                    cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                    className="text-primary"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - xpPct / 100)}`}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="text-center">
                  <p className="text-[0.6rem] font-black text-white">{xpPct}%</p>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-primary">
                    <Sparkles className="size-3" /> Growth hub
                  </span>
                  {completed && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="size-3" /> Done
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-black leading-tight text-white">
                  Readiness Quest
                </h2>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  Build consistency and unlock premium opportunities.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <div className="flex flex-col items-end gap-1 px-1">
                <p className="text-[0.65rem] font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> {completed ? "Returns in" : "Quest is active"}
                </p>
                <p className="text-xs font-black text-white">{completed ? countdown : `Attempts: ${today?.attemptsUsed || 0}/${today?.maxAttempts || 2}`}</p>
              </div>
              <Button
                type="button"
                className="h-11 rounded-xl bg-primary px-6 font-black text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate("/freelancer/growth-quest")}
              >
                {completed ? "View Progress Hub" : "Start Quest →"}
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            <StatBlock
              icon={Flame}
              label="Streak"
              value={profile.currentStreak || 0}
              sub={profile.currentStreak === 1 ? "day" : "days"}
              tone="yellow"
            />
            <StatBlock
              icon={Award}
              label="Level"
              value={profile.engagementLevelLabel || "Starter"}
            />
            <StatBlock
              icon={Sparkles}
              label="Total XP"
              value={xp}
              tone="emerald"
            />
            <StatBlock
              icon={Target}
              label="Coins"
              value={profile.loyaltyCoins || 0}
            />
          </div>

          {/* Bottom Insights row */}
          <div className="flex flex-col gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-muted-foreground">
                <Trophy className="size-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">
                  {levelProgress?.next?.label
                    ? `Next: ${levelProgress.next.label}`
                    : "Max Level Reached"}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {dashboard?.nextMilestone?.label || "Consistency is key."}
                </p>
              </div>
            </div>
            
            <div className="h-px bg-white/[0.06] lg:h-8 lg:w-px" />

            <div className="flex flex-1 items-center gap-3 lg:px-4">
              <Target className="size-4 shrink-0 text-primary" />
              <p className="text-xs font-medium text-white line-clamp-1">
                {processSummary?.recommendedNextTopic?.label
                  ? `Focus: ${processSummary.recommendedNextTopic.label}`
                  : "Keep completing quests to see insights."}
              </p>
            </div>

            <button 
              onClick={() => navigate("/freelancer/growth-quest")}
              className="text-xs font-black text-primary transition-colors hover:text-primary/80"
            >
              Analyze Hub →
            </button>
          </div>
        </div>
      </FreelancerDashboardPanel>
    </section>
  );
};

export default EngagementDashboardCard;
