import React, { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  subDays,
  parseISO
} from "date-fns";
import Flame from "lucide-react/dist/esm/icons/flame";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const SUBTLE_CARD_CLASS = "rounded-[6px] border border-white/[0.08] bg-background/60";

const StreakCalendar = ({
  streakHistory = [],
  currentStreak = 0,
  completedToday = false,
  compact = false,
}) => {
  const today = useMemo(() => new Date(), []);

  // If no history is provided, mock it backwards from today
  const activeDates = useMemo(() => {
    if (Array.isArray(streakHistory) && streakHistory.length > 0) {
      return streakHistory.map(d => (typeof d === "string" ? parseISO(d) : new Date(d)));
    }
    
    // Derive from currentStreak if history missing
    const derived = [];
    let count = currentStreak;
    if (count > 0) {
       let d = completedToday ? today : subDays(today, 1);
       while (count > 0) {
          derived.push(d);
          d = subDays(d, 1);
          count--;
       }
    }
    return derived;
  }, [streakHistory, currentStreak, completedToday, today]);

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const isDayCompleted = (date) => {
    return activeDates.some(d => isSameDay(d, date));
  };

  const handleDayClick = (date) => {
    const isFuture = date > today;
    const completed = isDayCompleted(date);
    
    if (isFuture) {
      toast.info(`Upcoming: ${format(date, "MMM do")}`);
      return;
    }

    if (completed) {
      toast.success(`You completed your quest on ${format(date, "MMM do")}! 🔥`);
    } else {
      toast("Missed day", { description: `No activity on ${format(date, "MMM do")}.` });
    }
  };

  return (
    <div className={cn(SUBTLE_CARD_CLASS, compact ? "p-3.5" : "p-4")}>
      <div className={cn("flex items-center justify-between gap-3", compact ? "mb-3 flex-wrap" : "mb-4")}>
        <div>
          <h3 className={cn("font-semibold text-foreground", compact ? "text-[13px]" : "text-sm")}>Activity Calendar</h3>
          <p className="text-xs text-muted-foreground">{format(today, "MMMM yyyy")}</p>
        </div>
        <div className={cn("flex items-center gap-2 rounded-full bg-primary/10 text-xs font-semibold text-primary", compact ? "px-2.5 py-1" : "px-3 py-1")}>
          <Flame className="size-3.5" />
          {currentStreak} Day Streak
        </div>
      </div>

      <div className={cn("grid grid-cols-7 text-center", compact ? "mb-1 gap-0.5" : "mb-1 gap-1")}>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <div key={i} className="text-[10px] font-bold text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className={cn("grid grid-cols-7", compact ? "gap-1" : "gap-1.5 sm:gap-2")}>
        {calendarDays.map((day, idx) => {
          const completed = isDayCompleted(day);
          const isCurrentMonth = isSameMonth(day, today);
          const isToday = isSameDay(day, today);
          const isFuture = day > today;
          
          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex w-full items-center justify-center rounded-[10px] font-bold transition-all duration-300",
                compact ? "h-9 text-[10px] sm:h-10 sm:text-[11px]" : "h-10 text-[11px] sm:h-12 sm:text-xs",
                !isCurrentMonth && "opacity-30",
                completed && "bg-gradient-to-br from-primary/30 to-amber-600/10 text-primary border border-primary/40 hover:bg-primary/30 shadow-[0_0_10px_rgba(255,193,7,0.2)] hover:shadow-[0_0_15px_rgba(255,193,7,0.4)] hover:-translate-y-0.5",
                !completed && !isFuture && "bg-white/[0.02] text-muted-foreground border border-white/[0.05] hover:bg-white/[0.06]",
                !completed && isFuture && "bg-transparent text-muted-foreground/30",
                isToday && !completed && "border border-white/20",
                isToday && "ring-1 ring-white/20 ring-offset-1 ring-offset-background"
              )}
            >
             {completed ? (
               <Flame className={cn("drop-shadow-[0_0_6px_rgba(255,193,7,0.8)] text-primary", compact ? "size-3.5" : "size-4")} />
             ) : (
                format(day, "d")
             )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StreakCalendar;
