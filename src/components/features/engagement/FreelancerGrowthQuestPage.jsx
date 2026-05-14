import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Info from "lucide-react/dist/esm/icons/info";
import Clock from "lucide-react/dist/esm/icons/clock";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { useAuth } from "@/shared/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import StreakCalendar from "./StreakCalendar";

// Make sure formatReset and makeKey are available
const makeKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `gq-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatReset = (resetAt) => {
  if (!resetAt) return "UTC midnight";
  const d = new Date(resetAt);
  return Number.isNaN(d.getTime()) ? "UTC midnight" : d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
};

// ── Dashboard View (Cinematic UI) ─────────────────────────────
const DashboardView = ({ dashboard, onStartQuest, onAcceptContract, loading, error }) => {
  const profile = dashboard?.profile || {};
  const today = dashboard?.today || {};
  const streak = profile.currentStreak || 0;
  const xp = profile.totalXP || profile.lifetimeXp || profile.xp || 0;
  const used = today.attemptsUsed || 0;
  const max = today.maxAttempts || 2;
  const done = used >= max;

  // Level calculation
  const levelThresholds = [0, 200, 600, 1500, 3500];
  const levelNames = ["Starter", "Active Learner", "Skilled Contributor", "Pro Contributor", "Gold Contributor"];
  const currentLevelIdx = levelThresholds.reduce((acc, t, i) => (xp >= t ? i : acc), 0);
  const nextThreshold = levelThresholds[currentLevelIdx + 1] ?? null;
  const prevThreshold = levelThresholds[currentLevelIdx] ?? 0;
  const xpPct = nextThreshold ? Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100) : 100;
  const rankName = profile.engagementLevelLabel || levelNames[currentLevelIdx] || "Starter";

  // Real backend data
  const weeklyEfficiency = Array.isArray(profile.weeklyEfficiency) && profile.weeklyEfficiency.length === 7
    ? profile.weeklyEfficiency : [0, 0, 0, 0, 0, 0, 0];
  const activeBoosters = Array.isArray(profile.activeBoosters) ? profile.activeBoosters : [];
  const availableContracts = Array.isArray(dashboard?.availableContracts) ? dashboard.availableContracts : [];
  const activeOperations = Array.isArray(dashboard?.activeOperations) ? dashboard.activeOperations : [];
  const recentHistory = Array.isArray(dashboard?.recentHistory) ? dashboard.recentHistory : [];

  const maxEfficiency = Math.max(...weeklyEfficiency, 1);
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

  const CATEGORY_META = {
    SKILL_BUILDING: { label: "Skill Building", icon: "integration_instructions", color: "text-purple-400" },
    LIVE_CONTRACT:  { label: "Live Contract",  icon: "receipt_long",              color: "text-emerald-400" },
    SPEED_TRIAL:    { label: "Speed Trial",     icon: "timer",                     color: "text-primary" },
  };
  const DIFF_META = {
    BEGINNER:     { label: "Easy",   color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    INTERMEDIATE: { label: "Medium", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    ADVANCED:     { label: "Hard",   color: "text-error border-error/30 bg-error/10" },
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="glass-panel rounded-xl p-8 relative overflow-hidden transition-all duration-300 group circuit-bg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 left-0 w-full h-1 shimmer-premium"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-eyebrow text-eyebrow text-primary uppercase tracking-[0.2em]">Daily Protocol</h2>
              <div className="glass-pill px-3 py-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
                <span className="text-xs font-medium text-on-surface-variant">Resets {formatReset(today?.nextResetAt)}</span>
              </div>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface mb-3 tracking-tight group-hover:text-primary transition-colors duration-500">
              Freelancer Practice
            </h1>
            <p className="font-body text-body text-on-surface-variant max-w-xl leading-relaxed">
              Maintain your operational edge. Complete today's simulation to sustain your momentum bonus.
            </p>
          </div>
          
          <div className="glass-panel rounded-xl p-6 min-w-[320px] shadow-2xl glass-plus">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="font-eyebrow-sm text-eyebrow-sm text-on-surface-variant uppercase mb-1">Current Streak</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">local_fire_department</span>
                  <span className="font-display text-display text-primary">{streak} Days</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-eyebrow-sm text-eyebrow-sm text-on-surface-variant uppercase mb-1">Attempts</p>
                <p className="font-display-sm text-display-sm text-on-surface">{used}/{max}</p>
              </div>
            </div>

            <button 
              onClick={onStartQuest}
              disabled={done}
              className="w-full relative overflow-hidden rounded-lg font-bold text-sm tracking-wide h-12 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] shadow-[0_0_15px_rgba(255,204,0,0.2)] hover:shadow-[0_0_25px_rgba(255,204,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group bg-primary text-black"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                {done ? "Quest Completed" : "Start Today's Quest"} 
                {!done && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </span>
            </button>
            {error && <p className="mt-3 text-xs text-error text-center">{error}</p>}
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel glass-plus rounded-xl p-3 px-4">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search parameters..." 
            className="w-full bg-black/40 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm font-body text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          />
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] cursor-pointer hover:text-white transition-colors">tune</span>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
          <button className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-surface-container border border-white/10 text-xs font-bold text-on-surface hover:border-white/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">grid_view</span> All Categories
          </button>
          <button className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-xs font-bold text-primary hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">laptop_mac</span> Skill Building
          </button>
          <button className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-surface-container border border-white/10 text-xs font-bold text-on-surface hover:border-white/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span> Live Contracts
          </button>
          <button className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg bg-surface-container border border-white/10 text-xs font-bold text-on-surface hover:border-white/20 transition-all">
            <span className="material-symbols-outlined text-[16px]">timer</span> Speed Trials
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-section-gap items-start">
        
        {/* Left Column: Quick Stats & Navigation */}
        <aside className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-6 h-full glass-plus">
            <nav className="flex flex-col gap-2 pb-4 border-b border-white/10">
              <a className="text-primary font-bold bg-primary/10 border border-primary/20 active:scale-95 transition-transform flex items-center gap-3 p-2.5 rounded-lg cursor-pointer shadow-[0_0_15px_rgba(255,204,0,0.05)]">
                <span className="material-symbols-outlined text-[20px]">explore</span> Quests
              </a>
              <a className="text-on-surface-variant font-medium active:scale-95 transition-transform hover:text-primary hover:bg-white/5 p-2.5 rounded-lg flex items-center gap-3 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span> Inventory
              </a>
              <a className="text-on-surface-variant font-medium active:scale-95 transition-transform hover:text-primary hover:bg-white/5 p-2.5 rounded-lg flex items-center gap-3 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">leaderboard</span> Rankings
              </a>
            </nav>
            
            <div>
              <h4 className="font-eyebrow-sm text-eyebrow-sm text-primary uppercase mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">insights</span>
                Quick Stats
              </h4>
              
              <div className="flex flex-col gap-6">
                {/* Total XP & Coins */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total XP</p>
                    <div className="flex items-end gap-2 h-10">
                      <span className="text-2xl font-black text-on-surface">{xp}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Coins</p>
                    <div className="flex items-end gap-2 h-10">
                      <span className="text-2xl font-black text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">monetization_on</span>
                        {profile.loyaltyCoins || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-white/10"></div>

                {/* Weekly Efficiency */}
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Weekly Efficiency</p>
                  <div className="flex items-end gap-1 h-10 px-1">
                    {weeklyEfficiency.map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full relative flex-1 bg-white/5 rounded-sm overflow-hidden">
                          <div
                            className={cn("absolute bottom-0 w-full rounded-sm transition-all duration-500", val >= maxEfficiency * 0.9 ? "bg-gradient-to-t from-primary/80 to-primary shadow-[0_0_10px_rgba(255,204,0,0.5)]" : "bg-white/20 hover:bg-primary/50")}
                            style={{ height: `${Math.max(5, Math.round((val / maxEfficiency) * 100))}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-on-surface-variant">{DAYS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Boosters */}
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Active Boosters</p>
                  {activeBoosters.length === 0 ? (
                    <p className="text-[11px] text-on-surface-variant italic">No active boosters</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeBoosters.map((b, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <span className="material-symbols-outlined text-[14px]">bolt</span> {b.name}
                          </span>
                          {b.expiresIn && <span className="text-on-surface-variant font-medium">{b.expiresIn}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-white/10"></div>

                {/* Rank Progress */}
                <div className="glass-panel p-5 rounded-xl border-primary/40 bg-gradient-to-b from-primary/10 to-transparent text-center flex flex-col items-center gap-1 relative overflow-hidden shadow-[0_0_30px_rgba(255,204,0,0.1)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none"></div>
                  <p className="text-[9px] font-bold text-primary uppercase tracking-widest relative z-10">Rank Progress</p>
                  <h3 className="text-xl font-display text-white relative z-10 drop-shadow-md">{rankName}</h3>
                  <div className="w-full mt-3 relative z-10">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1.5">
                      <span className="text-primary">{xpPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full relative" style={{ width: `${xpPct}%` }}>
                         <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                      </div>
                    </div>
                    <p className="text-[9px] text-on-surface-variant mt-2 text-right">
                      {nextThreshold ? `${nextThreshold - xp} XP to next level` : "Max Level"}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Active Operations & Available Contracts */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Active Operations */}
          <section>
            <div className="flex justify-between items-end mb-4 px-1">
              <h3 className="font-display-sm text-display-sm text-on-surface flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Active Operations
              </h3>
              <a href="#" className="text-xs font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1 group">
                View Dashboard <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
            
            {activeOperations.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] mb-2 block">inbox</span>
                <p className="text-sm">No active operations. Accept a contract below to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOperations.map((op) => {
                  const diff = DIFF_META[op.difficulty] || DIFF_META.BEGINNER;
                  const cat = CATEGORY_META[op.category] || CATEGORY_META.SKILL_BUILDING;
                  return (
                    <div key={op.id} className="glass-panel rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-300 group cursor-pointer relative">
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {op.imageUrl ? (
                        <div className="w-full aspect-video overflow-hidden">
                          <img src={op.imageUrl} alt={op.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-full aspect-video relative flex items-center justify-center overflow-hidden bg-[#0a0a0c]">
                          {/* Vibrant Glowing Orbs */}
                          <div className={cn("absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[50px] opacity-40 transition-colors", cat.color.replace('text-', 'bg-'))}></div>
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary rounded-full blur-[60px] opacity-20"></div>
                          
                          {/* Modern Dot Pattern Overlay */}
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

                          {/* Center Glassmorphic Element */}
                          <div className="relative z-10 flex flex-col items-center gap-3 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.05)] overflow-hidden relative">
                              <div className={cn("absolute inset-0 opacity-20", cat.color.replace('text-', 'bg-'))}></div>
                              <span className={cn("material-symbols-outlined text-[40px] drop-shadow-lg", cat.color)}>{cat.icon}</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                              <span className={cn("text-[10px] font-bold tracking-widest uppercase", cat.color)}>{cat.label}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border flex items-center gap-1", diff.color)}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current" /> {diff.label}
                          </span>
                        </div>
                        <h4 className="font-bold text-on-surface mb-3">{op.title}</h4>
                        <div className="w-full flex justify-between text-[10px] font-bold text-on-surface-variant mb-1">
                          <span>Progress</span>
                          <span className="text-primary">{op.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${op.progress}%` }} />
                        </div>
                        <div className="flex gap-3 text-xs font-bold">
                          <span className="flex items-center gap-1 text-primary"><span className="material-symbols-outlined text-[14px]">star</span> {op.xpReward} XP</span>
                          <span className="flex items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined text-[14px]">toll</span> {op.coinReward} Coins</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Available Contracts */}
          <section>
            <div className="flex justify-between items-end mb-4 px-1">
              <h3 className="font-display-sm text-display-sm text-on-surface">Available Contracts</h3>
              <div className="flex gap-2">
                <button className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_left</span></button>
                <button className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span></button>
              </div>
            </div>

            {availableContracts.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] mb-2 block">task_alt</span>
                <p className="text-sm">No new contracts available right now. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableContracts.map((c) => {
                  const cat = CATEGORY_META[c.category] || CATEGORY_META.SKILL_BUILDING;
                  const diff = DIFF_META[c.difficulty] || DIFF_META.BEGINNER;
                  return (
                    <div key={c.id} className="glass-panel rounded-xl overflow-hidden hover:border-primary/30 transition-colors duration-300 group flex flex-col">
                      {c.imageUrl ? (
                        <div className="w-full aspect-video overflow-hidden border-b border-white/5">
                          <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-full aspect-video relative flex items-center justify-center overflow-hidden bg-[#0a0a0c] border-b border-white/5">
                          {/* Vibrant Glowing Orbs */}
                          <div className={cn("absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[50px] opacity-40 transition-colors", cat.color.replace('text-', 'bg-'))}></div>
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary rounded-full blur-[60px] opacity-20"></div>
                          
                          {/* Modern Dot Pattern Overlay */}
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

                          {/* Center Glassmorphic Element */}
                          <div className="relative z-10 flex flex-col items-center gap-3 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.05)] overflow-hidden relative">
                              <div className={cn("absolute inset-0 opacity-20", cat.color.replace('text-', 'bg-'))}></div>
                              <span className={cn("material-symbols-outlined text-[40px] drop-shadow-lg", cat.color)}>{cat.icon}</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                              <span className={cn("text-[10px] font-bold tracking-widest uppercase", cat.color)}>{cat.label}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className={cn("text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5", cat.color)}>
                            <span className="material-symbols-outlined text-[14px]">{cat.icon}</span> {cat.label}
                          </span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded border", diff.color)}>{diff.label}</span>
                        </div>
                        <h4 className="font-bold text-on-surface mb-2">{c.title}</h4>
                        {c.description && <p className="text-xs text-on-surface-variant mb-5 line-clamp-2 leading-relaxed">{c.description}</p>}
                        <div className="mt-auto">
                          <div className="flex gap-3 mb-4">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface"><span className="material-symbols-outlined text-[14px] text-primary">toll</span> +{c.coinReward}</span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface"><span className="material-symbols-outlined text-[14px] text-purple-400">star</span> +{c.xpReward} XP</span>
                          </div>
                          <button
                            onClick={() => onAcceptContract(c.id)}
                            className="w-full py-2.5 rounded-lg border border-primary/40 text-primary text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                          >
                            Accept Quest <span className="material-symbols-outlined text-[16px]">add_circle</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Premium Rewards & Calendar */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden border-primary/30 shadow-[0_0_30px_rgba(255,204,0,0.05)] h-full flex flex-col">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[50px] pointer-events-none"></div>
            
            <h3 className="font-eyebrow text-eyebrow text-on-surface-variant uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">workspace_premium</span>
              Premium Rewards
            </h3>

            <div className="bg-surface-container border border-primary/20 rounded-lg p-4 mb-5 relative group hover:border-primary/50 transition-colors cursor-pointer flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center border border-primary/30">
                    <span className="material-symbols-outlined text-primary">diamond</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Go Pro Access</h4>
                    <p className="text-[10px] text-primary">Unrestricted Quests</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary text-black rounded-sm">Featured</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                Join 50k+ elite freelancers. Unlock priority support, custom branding, and 2x XP multipliers.
              </p>
              <button className="w-full mt-4 py-2 rounded font-bold text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black transition-all">
                Upgrade Now
              </button>
            </div>
            
            <div className="mt-2">
              <StreakCalendar currentStreak={streak} completedToday={done} streakHistory={recentHistory.map(h => h.completedAt)} />
            </div>
          </div>
        </aside>
      </div>

      {/* Recent History */}
      <section className="mt-4">
        <h3 className="font-display-sm text-display-sm text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">history</span> Recent History
        </h3>
        
        <div className="glass-panel rounded-xl overflow-hidden glass-plus">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Quest Name</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Type</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Completion Date</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Rewards</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-on-surface-variant text-sm">
                      No completed quests yet. Start accepting contracts!
                    </td>
                  </tr>
                ) : recentHistory.map((h, idx) => {
                  const cat = CATEGORY_META[h.contest?.category] || { label: "Quest" };
                  const dateStr = h.completedAt ? new Date(h.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
                  return (
                    <tr key={h.id} className={cn("hover:bg-white/[0.02] transition-colors", idx < recentHistory.length - 1 && "border-b border-white/5")}>
                      <td className="py-4 px-6 font-medium text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">check_circle</span></div>
                          {h.title}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">{cat.label}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{dateStr}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3 text-xs font-bold">
                          <span className="flex items-center gap-1 text-on-surface"><span className="material-symbols-outlined text-[14px] text-primary">toll</span> +{h.coinReward}</span>
                          <span className="flex items-center gap-1 text-purple-400"><span className="material-symbols-outlined text-[14px]">star</span> +{h.xpReward} XP</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-white/10 p-4 text-center">
              <button className="text-xs font-bold text-on-surface-variant hover:text-white transition-colors">View Full History</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// ── Quiz View (Cinematic Restyle) ──────────────────────────────
const LABELS = ["A", "B", "C", "D", "E"];

const QuizView = ({ questions, activeIndex, setActiveIndex, selectedAnswers, handleSelectAnswer, onSubmit, submitting, canSubmit, error, onBack }) => {
  const q = questions[activeIndex];
  if (!q) return null;

  const chosenOptId = selectedAnswers[q.id];
  const hasAnswered = !!chosenOptId;
  const isLastQuestion = activeIndex === questions.length - 1;
  const numAnswered = Object.keys(selectedAnswers).length;

  const handleAnswer = (optId) => {
    if (hasAnswered) return;
    handleSelectAnswer(q.id, optId);
  };

  const advanceOrSubmit = () => {
    if (!isLastQuestion) {
      setActiveIndex((i) => Math.min(questions.length - 1, i + 1));
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pt-8">
      {/* Top Navigation */}
      <button onClick={onBack} className="text-on-surface-variant hover:text-primary flex items-center gap-2 text-sm font-bold transition-colors mb-6 group">
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Cancel Quest
      </button>

      <div className="glass-panel glass-plus rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden bg-[#14120f] border-white/5">
        
        {/* Top Progress Dashes */}
        <div className="flex justify-center gap-3 mb-10">
          {questions.map((qq, i) => {
            const ans = selectedAnswers[qq.id];
            let colorClass = "bg-white/10"; // Default (unanswered)
            if (i === activeIndex && !ans) colorClass = "bg-primary shadow-[0_0_10px_rgba(255,204,0,0.4)]"; // Active but unanswered
            else if (ans === qq.correctOptionId) colorClass = "bg-[#00e57b] shadow-[0_0_10px_rgba(0,229,123,0.4)]"; // Correct
            else if (ans && ans !== qq.correctOptionId) colorClass = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"; // Wrong
            else if (ans) colorClass = "bg-primary shadow-[0_0_10px_rgba(255,204,0,0.4)]"; // Answered (if no correctOptionId available)
            
            return (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn("h-1.5 w-10 rounded-full transition-all duration-300", colorClass)}
              />
            );
          })}
        </div>

        {/* Question Text */}
        <h3 className="text-xl md:text-2xl font-bold text-center leading-relaxed text-white mb-12 max-w-2xl mx-auto relative z-10">
          {q.questionText}
        </h3>

        {/* Options Grid */}
        <div className="grid gap-4 sm:grid-cols-2 relative z-10 mb-8">
          {(q.options || []).map((opt, idx) => {
            const isChosen = chosenOptId === opt.id;
            const isCorrect = hasAnswered && opt.id === q.correctOptionId;
            const isWrong = isChosen && opt.id !== q.correctOptionId;
            const label = LABELS[idx] || opt.id.toUpperCase();
            
            // Standard colors:
            let btnClass = "border-white/5 bg-[#1a1714] text-on-surface-variant";
            let labelClass = "bg-black/40 text-on-surface-variant";
            
            if (isChosen) {
              btnClass = "border-primary bg-primary/10 text-white shadow-[inset_0_0_15px_rgba(255,204,0,0.1)]";
              labelClass = "bg-primary text-black";
            }
            if (hasAnswered && isCorrect) {
              btnClass = "border-[#00e57b] bg-[#00e57b]/10 text-white";
              labelClass = "bg-[#00e57b] text-black";
            } else if (hasAnswered && isWrong) {
              btnClass = "border-red-500 bg-red-500/10 text-white";
              labelClass = "bg-red-500 text-white";
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                disabled={hasAnswered}
                className={cn(
                  "flex min-h-[80px] w-full items-center justify-between rounded-[20px] border p-5 text-left transition-all duration-300 ease-out group",
                  !hasAnswered && "hover:border-white/20 hover:bg-white/5",
                  btnClass,
                  hasAnswered && !isChosen && !isCorrect && "opacity-40"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-black transition-colors shadow-sm",
                    labelClass
                  )}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold leading-relaxed">
                    {opt.text}
                  </span>
                </div>
                {isChosen && (
                  <div className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    isCorrect ? "border-[#00e57b]" : isWrong ? "border-red-500" : "border-primary"
                  )}>
                    <div className={cn(
                      "size-2.5 rounded-full",
                      isCorrect ? "bg-[#00e57b]" : isWrong ? "bg-red-500" : "bg-primary"
                    )} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant feedback explanation */}
        {hasAnswered && q.explanation && (
          <div className="mb-8 rounded-xl bg-black/40 border border-white/5 p-5 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <span className={cn("font-bold mr-2", chosenOptId === q.correctOptionId ? "text-[#00e57b]" : "text-red-500")}>
                {chosenOptId === q.correctOptionId ? "+50 XP" : "0 XP"} • 
              </span>
              {q.explanation}
            </p>
          </div>
        )}

        {error && <p className="mb-8 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error text-center">{error}</p>}

        {/* Bottom Bar */}
        <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8 relative z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-on-surface-variant">
              {numAnswered}/{questions.length} Answered
            </span>
            <div className="hidden sm:block w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${(numAnswered / questions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 text-sm font-bold text-on-surface-variant transition-colors hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="size-4" /> Previous
            </button>

            {!isLastQuestion ? (
              <button
                onClick={advanceOrSubmit}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-bold transition-all",
                  hasAnswered
                    ? "bg-[#f5e3ba] text-black shadow-[0_0_20px_rgba(245,227,186,0.15)] hover:shadow-[0_0_30px_rgba(245,227,186,0.3)] hover:scale-[1.02] active:scale-95"
                    : "bg-white/5 text-on-surface-variant cursor-not-allowed border border-white/10"
                )}
                disabled={!hasAnswered}
              >
                Next <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={!canSubmit || submitting}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl px-8 text-sm font-bold transition-all",
                  canSubmit && !submitting
                    ? "bg-primary text-black shadow-[0_0_20px_rgba(255,204,0,0.2)] hover:shadow-[0_0_30px_rgba(255,204,0,0.4)] hover:scale-[1.02] active:scale-95"
                    : "cursor-not-allowed bg-white/5 border border-white/10 text-on-surface-variant"
                )}
              >
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting...</> : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Result View (Cinematic Restyle) ────────────────────────────
const ResultView = ({ result, nextResetAt, onBack }) => {
  const score = result?.scoreSummary || result?.score || {};
  const rewards = result?.rewardsAwarded || result?.rewards || {};
  const answers = Array.isArray(result?.questionResults) ? result.questionResults : Array.isArray(result?.answers) ? result.answers : [];
  const questionCount = score.questionCount || answers.length || 5;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-8">
      <div className="glass-panel glass-plus relative overflow-hidden rounded-2xl p-10 text-center shadow-2xl border-t-white/10 border-l-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative mb-6 flex size-24 mx-auto items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_30px_rgba(255,204,0,0.15)]">
          <CheckCircle2 className="size-12 text-primary" />
        </div>
        
        <p className="font-eyebrow text-eyebrow text-primary uppercase tracking-[0.25em]">Quest Completed</p>
        <h2 className="mt-4 text-7xl font-display text-on-surface mb-2">
          {score.correctCount ?? 0}<span className="text-3xl text-on-surface-variant">/{questionCount}</span>
        </h2>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 mb-8">
          <Sparkles className="size-3.5 text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {score.accuracy ?? 0}% accuracy
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/40 py-5">
            <p className="text-3xl font-display text-primary">+{rewards.xpAwarded ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">XP</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/40 py-5">
            <p className="text-3xl font-display text-on-surface">+{rewards.coinsAwarded ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Coins</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/40 py-5">
            <p className="text-3xl font-display text-on-surface">{result?.streak?.currentStreak ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1 flex items-center gap-1">
               Streak <span className="material-symbols-outlined text-[12px] text-primary">local_fire_department</span>
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8 border-white/10">
        <h3 className="text-2xl font-display-sm text-on-surface mb-6">Mission Debrief</h3>
        <div className="space-y-4">
          {answers.map((a, i) => (
            <div key={a.questionId} className={cn(
              "group relative overflow-hidden rounded-xl border p-5 transition-all",
              a.isCorrect 
                ? "border-emerald-500/20 bg-emerald-500/5" 
                : "border-error/20 bg-error/5"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-black",
                  a.isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-error/10 text-error"
                )}>
                  {a.isCorrect ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-relaxed text-on-surface mb-2">
                    <span className="text-on-surface-variant mr-2">{i + 1}.</span>{a.questionText}
                  </p>
                  {!a.isCorrect && (
                    <div className="inline-flex items-center gap-2 rounded border border-error/20 bg-error/10 px-3 py-1.5 text-xs font-bold text-error mb-3">
                      Correct Answer: {String(a.correctOptionId).toUpperCase()}
                    </div>
                  )}
                  {a.explanation && (
                    <div className="rounded-lg border border-white/5 bg-black/40 px-5 py-4 mt-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                        <Info className="size-3" /> Explanation
                      </p>
                      <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
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

      <div className="flex flex-col gap-6 items-center">
        <div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 py-3 px-6">
          <Clock className="size-4 text-on-surface-variant" />
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Next Protocol Unlocks: <span className="text-on-surface ml-1">{formatReset(nextResetAt)}</span>
          </p>
        </div>
        
        <button
          onClick={onBack}
          className="w-full max-w-md h-14 rounded-lg bg-primary text-black font-bold tracking-wide shadow-[0_0_15px_rgba(255,204,0,0.3)] hover:shadow-[0_0_25px_rgba(255,204,0,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Return to Hub <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
};


// ── Main Page Component ─────────────────────────────────────────
export default function FreelancerGrowthQuestPage() {
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
      toast.success("Quest Completed!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err?.message || "Submission failed."); toast.error(err?.message || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const acceptContract = async (contestId) => {
    if (!authFetch) return;
    try {
      const res = await authFetch(`/engagement/contracts/${contestId}/accept`, { method: "POST", suppressToast: true });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || "Failed to accept contract.");
      toast.success("Contract accepted! It's now in your Active Operations.");
      loadDashboard();
    } catch (err) {
      toast.error(err?.message || "Could not accept contract.");
    }
  };

  return (
    <div className="cinematic-bg text-on-surface font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary-container relative">
      <main className="max-w-[1440px] mx-auto pt-32 px-gutter pb-section-gap flex flex-col gap-section-gap">
        {view === "dashboard" && <DashboardView dashboard={dashboard} loading={loadingDashboard} error={error} onStartQuest={startQuest} onAcceptContract={acceptContract} />}

        {view === "quiz" && (
          loadingQuest ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
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
              onBack={() => setView("dashboard")}
            />
          )
        )}

        {view === "result" && <ResultView result={result} nextResetAt={quest?.nextResetAt} onBack={() => setView("dashboard")} />}
      </main>
    </div>
  );
}
