import { useMemo, useState } from "react";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import Clock from "lucide-react/dist/esm/icons/clock";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { Link } from "react-router-dom";
import Loader from "@/components/common/Loader";
import FreelancerProfileDialog from "@/components/features/client/dashboard/FreelancerProfileDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/shared/context/AuthContext";
import {
  CAMPUS_LEVEL_OPTIONS,
  campusApi,
  campusBridgeHref,
  campusLevelLabel,
  campusSkillVerifyUrl,
} from "@/shared/lib/campus-api";
import { PmShell } from "@/modules/project-manager/components/PmShell";
import { useAsyncResource } from "@/modules/project-manager/hooks/use-async-resource";

const CAMPUS_PM_TOOLS_PATH = "/admin/talent";

const SELECT_CLASSNAME =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground";

const initialsOf = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CT";

const formatAvailability = (availability = {}) => {
  const parts = [];
  const hours = Number(availability.hoursPerWeek || 0);
  if (hours > 0) parts.push(`${hours} hrs/week`);
  const days = Array.isArray(availability.days) ? availability.days.filter(Boolean) : [];
  if (days.length) parts.push(days.join(", "));
  return parts.join(" · ");
};

const TalentCard = ({ person, onViewProfile }) => {
  const availabilityLabel = formatAvailability(person.availability);
  const taskTypes = Array.isArray(person.availability?.preferredTaskTypes)
    ? person.availability.preferredTaskTypes.filter(Boolean).slice(0, 4)
    : [];

  return (
    <Card className="border-border/70">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-xl border border-border">
            <AvatarImage src={person.avatar || undefined} alt="" />
            <AvatarFallback className="rounded-xl text-sm font-semibold">
              {initialsOf(person.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {person.fullName || "Campus member"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{availabilityLabel || "Open to projects"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {person.verifications.map((verification) => {
            const href = campusSkillVerifyUrl(verification);
            return (
              <a
                key={verification.verifyCode || `${verification.skill?.slug}-${verification.level}`}
                href={href || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {verification.skill?.name || "Skill"} · {campusLevelLabel(verification.level)}
                </span>
              </a>
            );
          })}
        </div>

        {taskTypes.length ? (
          <div className="flex flex-wrap gap-1.5">
            {taskTypes.map((task) => (
              <Badge key={task} variant="outline" className="text-[11px] font-normal">
                {task}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => onViewProfile(person)}>
            View profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const StateMessage = ({ title, body, action }) => (
  <Card className="border-dashed border-border/70">
    <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
      <GraduationCap className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body ? <p className="max-w-md text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </CardContent>
  </Card>
);

/**
 * Project manager view of Catalance Campus talent: people with active Campus skill
 * verifications who said they are open to projects (spec §5.3 step 14). Read-only here;
 * offers are made in Campus PM tools.
 */
const CampusTalentPage = () => {
  const { authFetch } = useAuth();
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewingFreelancer, setViewingFreelancer] = useState(null);

  const resource = useAsyncResource(
    () => campusApi.getTalent(authFetch, { skill, level }),
    [authFetch, skill, level]
  );

  const talent = useMemo(
    () => (Array.isArray(resource.data?.talent) ? resource.data.talent : []),
    [resource.data]
  );
  // The API always returns every verified skill (not just filtered ones), and the previous
  // response stays in place while a new filter loads, so the dropdown never empties.
  const skillOptions = useMemo(
    () => (Array.isArray(resource.data?.skills) ? resource.data.skills : []),
    [resource.data]
  );

  const hasFilters = Boolean(skill || level);
  const isForbidden = resource.error?.status === 403;

  const openProfile = (person) => {
    setViewingFreelancer({
      id: person.userId,
      freelancerId: person.userId,
      name: person.fullName,
      fullName: person.fullName,
      avatar: person.avatar,
    });
    setProfileOpen(true);
  };

  const campusToolsLink = (
    <Button asChild className="h-10 rounded-lg">
      <Link to={campusBridgeHref(CAMPUS_PM_TOOLS_PATH)}>
        <ExternalLink className="mr-2 h-4 w-4" />
        Open Campus PM tools
      </Link>
    </Button>
  );

  let body;
  if (resource.loading && !resource.data) {
    body = (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader size="sm" />
        Loading Campus talent...
      </div>
    );
  } else if (isForbidden) {
    body = (
      <StateMessage
        title="No access"
        body="Only project managers and admins can view Campus talent."
      />
    );
  } else if (resource.error) {
    body = (
      <StateMessage
        title="Could not load Campus talent"
        body="Please try again."
        action={
          <Button type="button" variant="outline" onClick={() => resource.refresh().catch(() => null)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        }
      />
    );
  } else if (resource.data && !resource.data.available) {
    body = (
      <StateMessage
        title="Campus is not connected"
        body="Campus data is not available in this environment yet."
      />
    );
  } else if (!talent.length) {
    body = (
      <StateMessage
        title={hasFilters ? "No match" : "No verified talent yet"}
        body={
          hasFilters
            ? "No one open to projects has this skill and level. Try another filter."
            : "People appear here once they are verified on Campus and open to projects."
        }
        action={
          hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSkill("");
                setLevel("");
              }}
            >
              Clear filters
            </Button>
          ) : null
        }
      />
    );
  } else {
    body = (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {talent.map((person) => (
          <TalentCard key={person.userId} person={person} onViewProfile={openProfile} />
        ))}
      </div>
    );
  }

  return (
    <PmShell
      title="Campus Talent"
      subtitle="Verified on Catalance Campus and open to projects. Verification does not guarantee work."
      actions={campusToolsLink}
    >
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skill</span>
            <select
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
              className={SELECT_CLASSNAME}
            >
              <option value="">All skills</option>
              {skillOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Level</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className={SELECT_CLASSNAME}
            >
              <option value="">All levels</option>
              {CAMPUS_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground sm:pb-3">
            {resource.loading ? "Updating..." : `${talent.length} ${talent.length === 1 ? "person" : "people"}`}
          </p>
        </CardContent>
      </Card>

      {body}

      <FreelancerProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        viewingFreelancer={viewingFreelancer}
      />
    </PmShell>
  );
};

export default CampusTalentPage;
