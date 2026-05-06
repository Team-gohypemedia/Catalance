import React, { useCallback, useEffect, useMemo, useState } from "react";
import Award from "lucide-react/dist/esm/icons/award";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Flame from "lucide-react/dist/esm/icons/flame";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Target from "lucide-react/dist/esm/icons/target";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FreelancerDashboardPanel,
  FreelancerDashboardSkeletonBlock,
} from "@/components/freelancer/freelancer-dashboard/shared.jsx";
import { useAuth } from "@/shared/context/AuthContext";
import { cn } from "@/shared/lib/utils";

const formatCountdown = (resetAt) => {
  if (!resetAt) return "Next reset soon";
  const diffMs = new Date(resetAt).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "Next quest is ready";

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m to reset`;
  return `${hours}h ${minutes}m to reset`;
};

const StatBlock = ({ icon: Icon, label, value, tone = "default" }) => (
  <div className="min-w-0 rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon
        className={cn(
          "size-4",
          tone === "yellow" && "text-[#facc15]",
          tone === "emerald" && "text-emerald-300",
        )}
      />
      <p className="truncate text-[0.72rem] font-medium uppercase tracking-[0.12em]">
        {label}
      </p>
    </div>
    <p className="mt-2 truncate text-[1.35rem] font-semibold leading-none text-white">
      {value}
    </p>
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
            className="h-[78px] rounded-[14px]"
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

  return (
    <section className="w-full min-w-0">
      <FreelancerDashboardPanel className="bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex size-9 items-center justify-center rounded-[12px] bg-[#facc15]/12 text-[#facc15]">
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.76rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Daily Growth Quest
                  </p>
                  <h2 className="mt-1 text-xl font-semibold leading-tight text-white">
                    Client readiness practice
                  </h2>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Five quick questions to keep your client communication, scope, and delivery habits sharp.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <Button
                type="button"
                className="h-11 rounded-[10px] bg-[#facc15] px-5 font-semibold text-black hover:bg-[#fde047]"
                onClick={() => navigate("/freelancer/growth-quest")}
              >
                {completed ? (
                  <span className="flex items-center gap-2">View Growth Hub <ArrowRight className="size-4" /></span>
                ) : (
                  <span className="flex items-center gap-2">Go to Growth Quest <ArrowRight className="size-4" /></span>
                )}
              </Button>
              <div className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/[0.08] px-4 text-sm text-muted-foreground">
                {completed ? countdown : `Attempts: ${today?.attemptsUsed || 0}/${today?.maxAttempts || 2}`}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatBlock
              icon={Flame}
              label="Streak"
              value={`${profile.currentStreak || 0} day${profile.currentStreak === 1 ? "" : "s"}`}
              tone="yellow"
            />
            <StatBlock
              icon={Award}
              label="Level"
              value={profile.engagementLevelLabel || "Starter"}
            />
            <StatBlock
              icon={Sparkles}
              label="XP"
              value={`${profile.lifetimeXp || 0} XP`}
              tone="emerald"
            />
            <StatBlock
              icon={Target}
              label="Coins"
              value={`${profile.loyaltyCoins || 0}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">
                  {levelProgress?.next?.label
                    ? `Progress to ${levelProgress.next.label}`
                    : "Top engagement level"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {levelProgress?.percent ?? 0}%
                </p>
              </div>
              <Progress
                value={levelProgress?.percent || 0}
                className="mt-2 h-2 bg-white/[0.08]"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {dashboard?.nextMilestone?.label || "Keep the daily habit going."}
              </p>
            </div>

            <div className="flex min-w-0 items-start gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.03] p-3.5">
              <CheckCircle2
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  completed ? "text-emerald-300" : "text-muted-foreground",
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {completed ? "Today's quest completed" : "Today's quest is open"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {processSummary?.recommendedNextTopic?.label
                    ? `Next focus: ${processSummary.recommendedNextTopic.label}.`
                    : "Your focus area will appear after a few completions."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </FreelancerDashboardPanel>
    </section>
  );
};

export default EngagementDashboardCard;
