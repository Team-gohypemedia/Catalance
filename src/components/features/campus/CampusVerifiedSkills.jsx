import { memo } from "react";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/shared/context/AuthContext";
import {
  campusLevelLabel,
  campusSkillVerifyUrl,
  useCampusVerifiedSkills,
} from "@/shared/lib/campus-api";
import { cn } from "@/shared/lib/utils";

const formatAwardedDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const VARIANT_STYLES = {
  // Freelancer's own profile page (matches the profile cards around it)
  profile: {
    card: "rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6",
    title: "text-xl font-bold tracking-tight text-foreground",
    icon: "h-5 w-5 text-primary",
  },
  // Client / PM facing profile dialog (matches its TagListCard sections)
  compact: {
    card: "border-border/60 bg-muted/15 p-3.5 shadow-none sm:p-4",
    title: "text-sm sm:text-base font-semibold text-foreground",
    icon: "h-4 w-4 text-primary",
  },
};

/**
 * "Campus-verified skills": skill + level badges earned on Catalance Campus, each linking to its
 * public verification page. Renders nothing while loading, on error, or when there are none.
 */
const CampusVerifiedSkills = ({ userId, variant = "profile", className = "" }) => {
  const { authFetch } = useAuth();
  const skills = useCampusVerifiedSkills(authFetch, userId);
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.profile;

  if (!skills.length) return null;

  return (
    <Card className={cn(styles.card, className)}>
      <h3 className={cn("mb-3 flex items-center gap-2", styles.title)}>
        <BadgeCheck className={styles.icon} />
        Campus-verified skills
      </h3>
      <ul className="flex flex-wrap gap-2">
        {skills.map((verification) => {
          const href = campusSkillVerifyUrl(verification);
          const awarded = formatAwardedDate(verification.awardedAt);
          const label = `${verification.skill?.name || "Skill"} · ${campusLevelLabel(verification.level)}`;

          return (
            <li key={verification.verifyCode || label}>
              <a
                href={href || undefined}
                target="_blank"
                rel="noopener noreferrer"
                title={awarded ? `Verified ${awarded}. View verification.` : "View verification."}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
                {href ? <ExternalLink className="h-3 w-3 shrink-0 opacity-70" /> : null}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Assessed on Catalance Campus. Tap a badge to verify it.
      </p>
    </Card>
  );
};

export default memo(CampusVerifiedSkills);
