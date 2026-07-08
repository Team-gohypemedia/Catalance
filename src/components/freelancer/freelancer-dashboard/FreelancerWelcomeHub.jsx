import React from "react";
import { useNavigate } from "react-router-dom";
import User from "lucide-react/dist/esm/icons/user";
import Zap from "lucide-react/dist/esm/icons/zap";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Circle from "lucide-react/dist/esm/icons/circle";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/lib/utils";

const FreelancerWelcomeHub = ({
  profileCompletionPercent = 0,
  isDailyQuestCompleted = false,
  payoutMethodConnected = false,
  openToWork = false,
  onOpenProfile,
}) => {
  const navigate = useNavigate();

  // Determine item completion status
  const steps = [
    {
      id: "profile",
      title: "Complete your Profile details",
      description: "Make your profile stand out to clients with your skills and bio. Verified profiles get 5x more invitations.",
      icon: User,
      isCompleted: profileCompletionPercent >= 90,
      badgeText: "Required",
      actionLabel: "Update Profile",
      onClick: onOpenProfile || (() => navigate("/freelancer/profile")),
    },
    {
      id: "quest",
      title: "Play Today's Growth Quest Practice Quiz",
      description: "Answer today's practice challenge to test your skills and earn extra XP and Coins to boost your ranking.",
      icon: Zap,
      isCompleted: isDailyQuestCompleted,
      badgeText: "+50 XP",
      actionLabel: "Start Quiz",
      onClick: () => navigate("/freelancer/growth-quest"),
    },
    {
      id: "services",
      title: "Set up your Service Offerings",
      description: "Choose the services, tools, and pricing you offer so clients and project managers can find and invite you to matching projects.",
      icon: CreditCard,
      isCompleted: profileCompletionPercent >= 50,
      badgeText: "Highly Recommended",
      actionLabel: "Configure Services",
      onClick: onOpenProfile || (() => navigate("/freelancer/profile")),
    },
    {
      id: "availability",
      title: "Set Availability Status to 'Open to Work'",
      description: "Let clients and project managers know you're actively looking for projects. Toggle this in the top right user menu.",
      icon: Briefcase,
      isCompleted: openToWork,
      badgeText: "Instant Visibility",
      actionLabel: "View Settings",
      onClick: onOpenProfile || (() => navigate("/freelancer/profile")),
    },
  ];

  const completedSteps = steps.filter((step) => step.isCompleted).length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="w-full rounded-[28px] border border-border/55 dark:border-white/[0.06] bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Background ambient glow matching Catalance aesthetics */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D9692A]/5 dark:bg-[#F9D949]/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/55 dark:border-white/[0.06]">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[#1C1B1F] dark:text-white">
            Welcome to Catalance! 🚀
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ready to start earning? Complete these quick setup milestones to level up your freelancer score, stand out to matching clients, and unlock project invitations.
          </p>
        </div>

        {/* Progress Tracker Ring/Bar */}
        <div className="flex flex-col items-start md:items-end shrink-0 min-w-[200px]">
          <div className="flex justify-between items-baseline w-full gap-x-4 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setup Status</span>
            <span className="text-lg font-bold text-[#D9692A] dark:text-[#F9D949] shrink-0">{overallProgress}% Complete</span>
          </div>
          <Progress value={overallProgress} className="h-2.5 w-full bg-black/10 dark:bg-white/10" />
          <p className="text-[11px] text-muted-foreground/80 mt-1.5 self-end">
            {completedSteps} of {steps.length} tasks completed
          </p>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.id}
              onClick={step.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  step.onClick();
                }
              }}
              className={cn(
                "group flex items-start gap-4 rounded-[22px] border p-5 transition-all duration-200 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                step.isCompleted
                  ? "border-[#A3E2C9]/40 bg-[#E8F8F2]/10 dark:border-[#20684C]/30 dark:bg-[#102A20]/10 hover:border-[#A3E2C9]/60"
                  : "border-border/55 dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] hover:border-[#D9692A]/30 dark:hover:border-[#F9D949]/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              )}
            >
              {/* Checkbox status indicator */}
              <div className="mt-0.5 shrink-0 flex items-center justify-center">
                {step.isCompleted ? (
                  <CheckCircle2 className="size-6 text-emerald-500 dark:text-[#52D49C]" />
                ) : (
                  <Circle className="size-6 text-muted-foreground/40 group-hover:text-muted-foreground/75 transition-colors" />
                )}
              </div>

              {/* Text content details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn(
                    "text-[15px] font-bold tracking-tight",
                    step.isCompleted ? "text-foreground/80 line-through decoration-[#0F8A5F]/40" : "text-foreground"
                  )}>
                    {step.title}
                  </h3>
                  {step.badgeText && !step.isCompleted && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF1EB] text-[#D9692A] dark:bg-[#F9D949]/10 dark:text-[#F9D949]">
                      {step.badgeText}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Inline CTA / Link */}
                {!step.isCompleted && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#D9692A] dark:text-[#F9D949] group-hover:translate-x-1 transition-transform duration-200">
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                )}
              </div>

              {/* Right side icon decoration */}
              <div className="shrink-0 flex items-center justify-center size-10 rounded-full bg-white/[0.06] dark:bg-white/[0.02] border border-border/55 dark:border-white/[0.06] text-muted-foreground group-hover:scale-105 transition-transform duration-200">
                <StepIcon className="size-4.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FreelancerWelcomeHub;
