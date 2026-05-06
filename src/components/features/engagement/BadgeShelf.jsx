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
      "group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200",
      earned
        ? "border-primary/30 bg-primary/8 hover:-translate-y-0.5"
        : "border-border bg-background opacity-60 hover:opacity-80"
    )}>
      <div className={cn(
        "relative flex size-14 items-center justify-center rounded-2xl text-2xl",
        earned ? "bg-primary/15" : "bg-muted"
      )}>
        {earned ? (
          <span>{badge.emoji}</span>
        ) : (
          <span className="text-muted-foreground opacity-40">{badge.emoji}</span>
        )}
        {!earned && (
          <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-muted border border-border">
            <Lock className="size-2.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div>
        <p className={cn("text-xs font-black", earned ? "text-foreground" : "text-muted-foreground")}>
          {badge.label}
        </p>
        {!earned && (
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{badge.desc}</p>
        )}
      </div>
      {!earned && currentStreak > 0 && (
        <div className="w-full">
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/50 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[0.6rem] text-muted-foreground">{currentStreak}/{badge.days} days</p>
        </div>
      )}
      {earned && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[0.65rem] font-black text-primary">
          <Trophy className="size-2.5" /> Earned
        </span>
      )}
    </div>
  );
};

const BadgeShelf = ({ badges = [], currentStreak = 0 }) => {
  const earnedKeys = new Set(badges.map((b) => (typeof b === "string" ? b : b?.key)));
  return (
    <div className="rounded-[28px] border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-muted-foreground">Milestones</p>
          <h3 className="mt-0.5 text-xl font-black text-foreground">Badge Collection</h3>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
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
