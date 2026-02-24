import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import Globe from "lucide-react/dist/esm/icons/globe";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import User from "lucide-react/dist/esm/icons/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ProfileSidebarCards = ({
  profileCompletionPercent,
  completedCompletionSections,
  profileCompletionCriteriaLength,
  profileCompletionMessage,
  incompleteCompletionLabels,
  openEditPersonalModal,
  onboardingIdentity,
  personal,
  onboardingLanguages,
  skills,
  deleteSkill,
  openSkillModal,
  onboardingGlobalIndustry,
  resolvedPortfolioLink,
  resolvedLinkedinLink,
  openPortfolioModal,
  openCreateExperienceModal,
  effectiveWorkExperience,
  workExperience,
  openEditExperienceModal,
  splitExperienceTitle,
}) => {
  return (
    <div className="xl:col-span-4 space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="text-primary">
              <User className="w-5 h-5" />
            </span>
            Profile Completion
          </h3>
          <span className="text-sm font-semibold text-primary">
            {profileCompletionPercent}%
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${profileCompletionPercent}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {completedCompletionSections}/{profileCompletionCriteriaLength} sections fully completed
        </p>
        <p className="text-sm text-foreground">{profileCompletionMessage}</p>

        {incompleteCompletionLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {incompleteCompletionLabels.map((label) => (
              <span
                key={`profile-completion-gap-${label}`}
                className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs border border-border/50"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="text-primary">
              <MapPin className="w-5 h-5" />
            </span>
            Identity Details
          </h3>
          <Button variant="ghost" size="icon" onClick={openEditPersonalModal}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Username: <span className="text-foreground">{onboardingIdentity?.username || "Not set"}</span>
          </p>
          <p className="text-muted-foreground">
            Professional Title:{" "}
            <span className="text-foreground">
              {onboardingIdentity?.professionalTitle || personal.headline || "Not set"}
            </span>
          </p>
          <p className="text-muted-foreground">
            Country: <span className="text-foreground">{onboardingIdentity?.country || "Not set"}</span>
          </p>
          <p className="text-muted-foreground">
            State/City: <span className="text-foreground">{onboardingIdentity?.city || "Not set"}</span>
          </p>
        </div>

        {onboardingLanguages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {onboardingLanguages.map((language) => (
              <span
                key={`language-${language}`}
                className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50"
              >
                {language}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="text-primary">
              <Cpu className="w-5 h-5" />
            </span>
            Skills And Tech Stack
          </h3>
          <Button variant="ghost" size="icon" onClick={openSkillModal}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? (
            skills.map((s, i) => (
              <div key={i} className="group relative">
                <span className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50 cursor-default block">
                  {s.name}
                </span>
                <Trash2
                  className="w-3 h-3 absolute -top-1 -right-1 text-destructive opacity-0 group-hover:opacity-100 cursor-pointer bg-card rounded-full"
                  onClick={() => deleteSkill(i)}
                />
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No skills added.</p>
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="text-primary">
              <Globe className="w-5 h-5" />
            </span>
            Industry And Presence
          </h3>
          <Button variant="ghost" size="icon" onClick={openPortfolioModal}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        {onboardingGlobalIndustry.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {onboardingGlobalIndustry.map((industry) => (
              <span
                key={`industry-${industry}`}
                className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-xs text-foreground"
              >
                {industry}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Portfolio:{" "}
            {resolvedPortfolioLink ? (
              <a
                href={resolvedPortfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground break-all underline-offset-2 hover:underline"
              >
                {resolvedPortfolioLink}
              </a>
            ) : (
              <span className="text-foreground break-all">Not set</span>
            )}
          </p>
          <p className="text-muted-foreground">
            LinkedIn:{" "}
            {resolvedLinkedinLink ? (
              <a
                href={resolvedLinkedinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground break-all underline-offset-2 hover:underline"
              >
                {resolvedLinkedinLink}
              </a>
            ) : (
              <span className="text-foreground break-all">Not set</span>
            )}
          </p>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="text-primary">
              <Briefcase className="w-5 h-5" />
            </span>
            Work Experience
          </h3>
          <Button variant="ghost" size="icon" onClick={openCreateExperienceModal}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative border-l border-border ml-3.5 space-y-8 py-2">
          {effectiveWorkExperience.length > 0 ? (
            effectiveWorkExperience.map((exp, i) => {
              const [position, company] = splitExperienceTitle(exp.title);
              return (
                <div
                  key={i}
                  className={`relative pl-8 group ${
                    workExperience.length > 0 ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() => {
                    if (workExperience.length > 0) {
                      openEditExperienceModal(exp, i);
                    }
                  }}
                >
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5 block">
                    {exp.period || "Date N/A"}
                  </span>
                  <h4 className="font-bold text-foreground leading-tight">
                    {position || "Position"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {company || "Company"}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {exp.description}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="pl-6 text-sm text-muted-foreground">No experience added.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfileSidebarCards;

