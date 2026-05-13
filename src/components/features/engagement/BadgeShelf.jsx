import React from "react";
import { cn } from "@/shared/lib/utils";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Lock from "lucide-react/dist/esm/icons/lock";

const BADGE_DEFS = [
  { key: "streak_3", label: "3-Day Spark", emoji: "✨", days: 3, desc: "Complete 3 days in a row" },
  { key: "streak_7", label: "7-Day Client Ready", emoji: "🔥", days: 7, desc: "Complete 7 days in a row" },
  { key: "streak_15", label: "15-Day Consistent", emoji: "⚡", days: 15, desc: "Complete 15 days in a row" },
  { key: "streak_30", label: "30-Day Pro", emoji: "🏆", days: 30, desc: "Complete 30 days in a row" },
  { key: "streak_60", label: "60-Day Gold", emoji: "💎", days: 60, desc: "Complete 60 days in a row" },
];

const BadgeCard = ({ badge, earned, currentStreak }) => {
  const pct = earned ? 100 : Math.min(100, Math.round((currentStreak / badge.days) * 100));
  return (
    <div className={cn(
      "group relative flex flex-col items-center gap-2 rounded-[12px] border p-4 text-center transition-all duration-300",
      earned
        ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent hover:shadow-[0_0_20px_rgba(255,193,7,0.15)] hover:-translate-y-1"
        : "border-white/[0.04] bg-white/[0.01] opacity-70 hover:opacity-100 hover:bg-white/[0.03] backdrop-blur-sm"
    )}>
      <div className={cn(
        "relative flex size-14 items-center justify-center rounded-[10px] text-2xl transition-transform duration-300 group-hover:scale-110",
        earned ? "bg-gradient-to-br from-primary/20 to-primary/5 shadow-[inset_0_0_12px_rgba(255,193,7,0.2)] drop-shadow-[0_0_10px_rgba(255,193,7,0.4)]" : "bg-black/40 shadow-inner"
      )}>
        {earned ? (
          <span>{badge.emoji}</span>
        ) : (
          <span className="text-muted-foreground opacity-40">{badge.emoji}</span>
        )}
        {!earned && (
          <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-white/[0.1] bg-black/60 backdrop-blur-md shadow-sm">
            <Lock className="size-2.5 text-white/50" />
          </div>
        )}
      </div>
      <div>
        <p className={cn("text-xs font-semibold", earned ? "text-foreground" : "text-muted-foreground")}>
          {badge.label}
        </p>
        {!earned && (
          <p className="mt-0.5 text-[0.7rem] leading-5 text-muted-foreground">{badge.desc}</p>
        )}
      </div>
      {!earned && currentStreak > 0 && (
        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-primary transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[0.6rem] text-muted-foreground">{currentStreak}/{badge.days} days</p>
        </div>
      )}
      {earned && (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold text-primary shadow-sm">
          <Trophy className="size-2.5" /> Earned
        </span>
      )}
    </div>
  );
};

const BadgeShelf = ({ badges = [], currentStreak = 0 }) => {
  const earnedKeys = new Set(badges.map((b) => (typeof b === "string" ? b : b?.key)));
  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-black/40 p-6 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">Milestones</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">Badge Collection</h3>
        </div>
        <div className="flex size-11 items-center justify-center rounded-[10px] bg-primary/10 transition-transform duration-300 hover:scale-110 hover:bg-primary/20">
          <Trophy className="size-5 text-primary" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {BADGE_DEFS.map((def) => (
          <BadgeCard
            key={def.key}
            badge={def}
            earned={earnedKeys.has(def.key)}
            currentStreak={currentStreak}
          />
        ))}
      </div>
    </div>
  );
};

export default BadgeShelf;
