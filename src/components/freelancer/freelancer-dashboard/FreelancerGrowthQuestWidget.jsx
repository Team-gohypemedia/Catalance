import React from "react";
import { useNavigate } from "react-router-dom";
import Flame from "lucide-react/dist/esm/icons/flame";
import Zap from "lucide-react/dist/esm/icons/zap";
import IndianRupee from "lucide-react/dist/esm/icons/indian-rupee";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { cn } from "@/shared/lib/utils";
import { FreelancerDashboardPanel } from "./shared.jsx";

const FreelancerGrowthQuestWidget = ({ engagementDetails, className = "" }) => {
  const navigate = useNavigate();

  // Extract info with safe fallbacks
  const profile = engagementDetails?.profile || {};
  const today = engagementDetails?.today || {};

  const currentStreak = Number(profile.currentStreak || 0);
  const xpBalance = Number(profile.xp || 0);
  const coinsBalance = Number(profile.loyaltyCoins || 0);
  const weeklyRank = profile.currentWeeklyRank || null;

  const isCompleted = today.status === "completed";

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-6">
        <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
          Growth Quest
        </h2>
      </div>

      <FreelancerDashboardPanel className="flex flex-col p-5 bg-card overflow-hidden relative">
        {/* Visual background elements */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#D9692A]/5 dark:bg-[#F9D949]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar inside the card with streak */}
        <div className="flex items-center justify-between border-b border-border/55 dark:border-white/[0.04] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#D9692A]/10 text-[#D9692A] dark:bg-[#F9D949]/10 dark:text-[#F9D949]">
              <Trophy className="size-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-foreground">Daily Challenge</h3>
              <p className="text-[10px] text-muted-foreground">Keep your streak alive!</p>
            </div>
          </div>

          {/* Streak Flame */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/25">
            <Flame className="size-4 animate-pulse fill-orange-500" />
            <span className="text-xs font-extrabold tracking-tight">{currentStreak} Day{currentStreak === 1 ? "" : "s"}</span>
          </div>
        </div>

        {/* Account stats grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 dark:border-white/[0.04]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Zap className="size-4 fill-amber-500" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block leading-tight">Total XP</span>
              <span className="text-sm font-bold text-foreground leading-none">{xpBalance}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 dark:border-white/[0.04]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <IndianRupee className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block leading-tight">Coins</span>
              <span className="text-sm font-bold text-foreground leading-none">{coinsBalance}</span>
            </div>
          </div>
        </div>

        {/* Dynamic CTA button */}
        <div className="mt-4">
          {isCompleted ? (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-[#52D49C] text-xs font-bold transition-all duration-200">
              <CheckCircle className="size-4 shrink-0" />
              <span>Practice Completed Today</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/freelancer/growth-quest")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#D9692A] text-white hover:bg-[#C25820] dark:bg-[#F9D949] dark:text-[#1C1B1F] dark:hover:bg-[#E2C23B] text-xs font-bold transition-all duration-200 shadow-sm hover:-translate-y-0.5 group"
            >
              <span>Play Today's Practice</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Tip Card */}
        <div className="mt-4 p-3 rounded-2xl border border-primary/10 bg-primary/[0.03] dark:bg-white/[0.01]">
          <div className="flex items-start gap-2">
            <Sparkles className="size-3.5 text-[#D9692A] dark:text-[#F9D949] shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {weeklyRank !== null ? (
                <span>You are ranked <strong className="text-foreground">#{weeklyRank}</strong> this week. Keep practicing to protect your rank!</span>
              ) : (
                <span>Earn XP to rank higher on the weekly leaderboard and gain more visibility to clients.</span>
              )}
            </p>
          </div>
        </div>
      </FreelancerDashboardPanel>
    </section>
  );
};

export default FreelancerGrowthQuestWidget;
