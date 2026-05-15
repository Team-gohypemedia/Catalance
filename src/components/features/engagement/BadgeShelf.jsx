import React from "react";
import Award from "lucide-react/dist/esm/icons/award";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Flame from "lucide-react/dist/esm/icons/flame";
import Gem from "lucide-react/dist/esm/icons/gem";
import Lock from "lucide-react/dist/esm/icons/lock";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import Zap from "lucide-react/dist/esm/icons/zap";
import { cn } from "@/shared/lib/utils";

const ICONS = {
  award: Award,
  calendar: Calendar,
  flame: Flame,
  gem: Gem,
  lock: Lock,
  trophy: Trophy,
  zap: Zap,
};

const fallbackBadges = [
  {
    key: "streak_3",
    title: "3-Day Spark",
    description: "Maintained a 3-day consecutive work streak. The engine is warm.",
    milestoneDays: 3,
    icon: "flame",
  },
  {
    key: "streak_7",
    title: "7-Day Client Ready",
    description: "Delivered flawless work for a full week. Trust established.",
    milestoneDays: 7,
    icon: "award",
  },
  {
    key: "streak_15",
    title: "15-Day Consistent",
    description: "Maintaining output for 15 consecutive days.",
    milestoneDays: 15,
    icon: "calendar",
  },
  {
    key: "streak_30",
    title: "30-Day Pro",
    description: "Achieve elite status with a flawless 30-day run.",
    milestoneDays: 30,
    icon: "trophy",
  },
  {
    key: "streak_60",
    title: "60-Day Gold",
    description: "The ultimate test of endurance and quality.",
    milestoneDays: 60,
    icon: "gem",
  },
];

const BadgeIcon = ({ icon, earned }) => {
  const Icon = ICONS[String(icon || "").toLowerCase()] || Trophy;
  return (
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full border",
          earned
            ? "border-[#55472b] bg-[#18130b] text-[#d7c08e] shadow-[0_0_18px_rgba(196,167,104,0.1)]"
            : "border-[#3d3220] bg-[#1b160d] text-[#8d836f]",
        )}
      >
      <Icon className="size-5" />
    </div>
  );
};

const BadgeCard = ({ badge, currentStreak }) => {
  const earned = Boolean(badge?.earned);
  const targetDays = Number(badge?.milestoneDays || 0);
  const pct =
    earned || !targetDays
      ? 100
      : Math.min(100, Math.round((currentStreak / targetDays) * 100));

  return (
    <article className="rounded-[16px] border border-[#342a17] bg-[#17120c] p-5">
      <div className="flex items-start justify-between gap-4">
        <BadgeIcon icon={badge?.icon} earned={earned} />
        <span
          className={cn(
            "rounded-md px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em]",
            earned
              ? "bg-[#314426] text-[#91e38f]"
              : "bg-[#2a241b] text-[#a79b84]",
          )}
        >
          {earned ? "Unlocked" : "Locked"}
        </span>
      </div>

      <h4 className="mt-5 text-2xl font-bold tracking-tight text-[#f0e6cf]">{badge?.title}</h4>
      <p className="mt-2 min-h-[58px] text-sm leading-6 text-[#9f9278]">
        {badge?.description || "Badge reward"}
      </p>

      {targetDays ? (
        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-[#2d2417]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                earned
                  ? "bg-[linear-gradient(90deg,#d4bc86,#e6d4aa)]"
                  : "bg-[linear-gradient(90deg,#8c7750,#b39a6a)]",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8d836f]">
            <span>{Math.min(currentStreak, targetDays)} days</span>
            <span>{targetDays} days</span>
          </div>
        </div>
      ) : null}
    </article>
  );
};

const BadgeShelf = ({ badges = [], currentStreak = 0 }) => {
  const badgeList = Array.isArray(badges) && badges.length ? badges : fallbackBadges;
  const unlockedCount = badgeList.filter((badge) => badge?.earned).length;

  return (
    <section className="rounded-[18px] border border-[#332917] bg-[linear-gradient(180deg,rgba(16,13,8,0.98),rgba(11,9,6,0.98))] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-[#4e4127] bg-[#18130b]">
            <Trophy className="size-5 text-[#d3be92]" />
          </div>
          <div>
            <h3 className="text-[1.65rem] font-bold tracking-tight text-[#f3ead5]">Achievement Badges</h3>
            <p className="mt-1 text-sm text-[#a99c84]">Unlock streak and contest rewards here.</p>
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#8f846b]">
          {unlockedCount}/{badgeList.length} Unlocked
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {badgeList.map((badge) => (
          <BadgeCard key={badge.key} badge={badge} currentStreak={currentStreak} />
        ))}
      </div>

      <div className="mt-8 rounded-[14px] border border-[#342a17] bg-[#16120b] px-4 py-4">
        <p className="text-sm font-semibold text-[#f0e6cf]">Active Inventory</p>
        <p className="mt-1 text-sm text-[#9f9278]">
          Contest badges and unlocked streak badges stay visible in your account profile.
        </p>
      </div>
    </section>
  );
};

export default BadgeShelf;
