import React from "react";
import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import { useAuth } from "@/shared/context/AuthContext";
import { campusApi, campusBridgeHref } from "@/shared/lib/campus-api";
import { cn } from "@/shared/lib/utils";
import { FreelancerDashboardPanel, FreelancerDashboardSkeletonBlock } from "./shared.jsx";

const STATS = [
  { key: "verifiedSkills", label: "Verified skills", icon: BadgeCheck, tone: "bg-emerald-500/10 text-emerald-500" },
  { key: "activeCourses", label: "Active courses", icon: BookOpen, tone: "bg-sky-500/10 text-sky-500" },
  { key: "openOffers", label: "Project offers", icon: Briefcase, tone: "bg-amber-500/10 text-amber-500" },
];

/**
 * Catalance Campus snapshot on the freelancer dashboard: verified skills, active courses and
 * open project offers. One action: open Campus (session handed over via /campus?next=/app).
 */
const CampusSummaryCard = ({ className = "" }) => {
  const { authFetch } = useAuth();
  const [state, setState] = React.useState({ loading: true, summary: null });

  React.useEffect(() => {
    if (!authFetch) return undefined;
    let active = true;
    campusApi
      .getMySummary(authFetch)
      .then((summary) => {
        if (active) setState({ loading: false, summary });
      })
      .catch(() => {
        if (active) setState({ loading: false, summary: null });
      });
    return () => {
      active = false;
    };
  }, [authFetch]);

  const { loading, summary } = state;
  const linked = Boolean(summary?.linked);
  const ctaLabel = linked ? "Open Campus" : "Explore Campus";
  const hint = !linked
    ? "Learn a skill, pass the assessment and get verified."
    : summary.openOffers > 0
      ? "You have a project offer to review."
      : summary.verifiedSkills > 0
        ? "Verified skills show on your profile."
        : "Finish a course and get verified.";

  return (
    <section className={cn("w-full min-w-0", className)}>
      <div className="mb-6">
        <h2 className="text-[22px] sm:text-[1.75rem] font-semibold tracking-[-0.02em] dark:text-white text-[#1C1B1F]">
          Campus
        </h2>
      </div>

      <FreelancerDashboardPanel className="flex flex-col p-5">
        <div className="flex items-center gap-2 border-b border-border/55 pb-4 dark:border-white/[0.04]">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-foreground">Catalance Campus</h3>
            <p className="text-[10px] text-muted-foreground">Same account. No new sign-up.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading Campus summary">
            {STATS.map((stat) => (
              <FreelancerDashboardSkeletonBlock key={stat.key} className="h-[68px] rounded-2xl" />
            ))}
          </div>
        ) : linked ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {STATS.map(({ key, label, icon: Icon, tone }) => (
              <div
                key={key}
                className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border/40 bg-black/[0.02] p-3 dark:border-white/[0.04] dark:bg-white/[0.02]"
              >
                <span className={cn("flex size-7 items-center justify-center rounded-full", tone)}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-base font-bold leading-none text-foreground">{Number(summary[key] || 0)}</span>
                <span className="truncate text-[10px] leading-tight text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>

        <Link
          to={campusBridgeHref("/app")}
          className="group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#D9692A] px-4 py-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#C25820] dark:bg-[#F9D949] dark:text-[#1C1B1F] dark:hover:bg-[#E2C23B]"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </FreelancerDashboardPanel>
    </section>
  );
};

export default CampusSummaryCard;
