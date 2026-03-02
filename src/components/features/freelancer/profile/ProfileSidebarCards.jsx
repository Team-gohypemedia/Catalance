import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import FilePlus2 from "lucide-react/dist/esm/icons/file-plus-2";
import Globe from "lucide-react/dist/esm/icons/globe";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const normalizeEducationEntries = (profileDetails = {}) => {
  const extractYearToken = (value = "") => {
    const matches = String(value || "").match(/\b(19|20)\d{2}\b/g);
    if (!matches || matches.length === 0) return "";
    return String(matches[matches.length - 1] || "").trim();
  };

  const candidates = [
    profileDetails?.education,
    profileDetails?.educationHistory,
    profileDetails?.identity?.education,
    profileDetails?.identity?.educationHistory,
  ].filter(Array.isArray);

  const rows = candidates.flatMap((items) =>
    items.map((entry, index) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        return {
          id: `edu-string-${index}-${entry}`,
          school: entry,
          degreeLine: "",
          metaLine: "",
        };
      }

      if (typeof entry !== "object") return null;

      const school = String(
        entry.school ||
          entry.institution ||
          entry.university ||
          entry.college ||
          entry.name ||
          entry.title ||
          ""
      ).trim();
      const degree = String(
        entry.degree || entry.qualification || entry.program || entry.level || ""
      ).trim();
      const field = String(
        entry.field ||
          entry.specialization ||
          entry.stream ||
          entry.focus ||
          entry.subject ||
          ""
      ).trim();
      const country = String(
        entry.country || entry.location || entry.region || ""
      ).trim();
      const startYear = String(
        entry.startYear || extractYearToken(entry.startDate || entry.from || "")
      ).trim();
      const graduationYear = String(
        entry.graduationYear ||
          entry.endYear ||
          entry.year ||
          entry.completedYear ||
          extractYearToken(entry.endDate || entry.to || "") ||
          ""
      ).trim();

      const degreeLine = [degree, field].filter(Boolean).join(". ");
      const timelineLine =
        startYear && graduationYear
          ? `${startYear} - ${graduationYear}`
          : graduationYear
            ? `Graduated ${graduationYear}`
            : "";
      const metaLine = [country, timelineLine].filter(Boolean).join(", ");

      if (!school && !degreeLine && !metaLine) return null;

      return {
        id: `edu-${index}-${school}-${graduationYear}`,
        school: school || "Education",
        degreeLine,
        metaLine,
      };
    })
  );

  const deduped = new Map();
  rows.filter(Boolean).forEach((row) => {
    const key = `${row.school}|${row.degreeLine}|${row.metaLine}`.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, row);
    }
  });

  return Array.from(deduped.values());
};

const normalizeProfileLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return "";
  return `https://${raw}`;
};

const ProfileSidebarCards = ({
  openCreateExperienceModal,
  effectiveWorkExperience,
  workExperience,
  openEditExperienceModal,
  removeExperience,
  splitExperienceTitle,
  profileDetails,
  openFullProfileEditor,
}) => {
  const educationEntries = normalizeEducationEntries(profileDetails);
  const experienceEntries = Array.isArray(effectiveWorkExperience)
    ? effectiveWorkExperience
    : [];
  const hasExperience = experienceEntries.length > 0;

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Work Experience
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Add your job history and achievements to give clients insight into
              your expertise.
            </p>
            <button
              type="button"
              onClick={openCreateExperienceModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:bg-muted hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add work experience
            </button>
          </div>

          {!hasExperience ? (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted/40">
              <FilePlus2 className="h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        {hasExperience ? (
          <div className="relative mt-5 space-y-0">
            <div
              className="absolute bottom-4 left-[11px] top-4 w-px bg-border/60"
              aria-hidden="true"
            />

            {experienceEntries.map((exp, index) => {
              const [position, company] = splitExperienceTitle(exp.title);
              const companyWebsite = normalizeProfileLink(
                exp.companyWebsite || exp.website
              );
              const experienceLinkedin = normalizeProfileLink(
                exp.linkedinUrl || exp.linkedin
              );

              return (
                <div
                  key={`work-exp-${index}`}
                  className="group relative flex w-full gap-4 py-3 text-left"
                >
                  <div className="relative z-10 mt-1.5 flex shrink-0">
                    <span
                      className="h-[9px] w-[9px] rounded-full border-2 border-primary/60 bg-card transition-colors duration-200 group-hover:border-primary group-hover:bg-primary/20"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-transparent p-3 transition-all duration-200 group-hover:border-border/60 group-hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (workExperience.length > 0) {
                            openEditExperienceModal(exp, index);
                          }
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <h4 className="text-sm font-semibold text-foreground">
                          {position || "Position"}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {company || "Company"}
                        </p>
                      </button>

                      <div className="inline-flex items-center gap-1">
                        <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors duration-200 group-hover:text-primary/60" aria-hidden="true" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="Experience actions"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onSelect={() => openEditExperienceModal(exp, index)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => removeExperience(index)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {exp.period || "Timeline not set"}
                    </p>

                    {exp.location || exp.employmentType ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {exp.location ? (
                          <span className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
                            {exp.location}
                          </span>
                        ) : null}
                        {exp.employmentType ? (
                          <span className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
                            {exp.employmentType}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {companyWebsite || experienceLinkedin ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {companyWebsite ? (
                          <a
                            href={companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <Globe className="h-3 w-3" aria-hidden="true" />
                            Website
                          </a>
                        ) : null}
                        {experienceLinkedin ? (
                          <a
                            href={experienceLinkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            <Linkedin className="h-3 w-3" aria-hidden="true" />
                            LinkedIn
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    {exp.description ? (
                      <p className="mt-2 text-xs leading-relaxed text-foreground/80 line-clamp-3">
                        {exp.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>

      <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Education
          </h3>
          <button
            type="button"
            onClick={() => openFullProfileEditor("education")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-primary/30 hover:bg-muted hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Edit Details
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {educationEntries.length > 0 ? (
            educationEntries.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-xl border border-border/50 bg-muted/20 p-3.5 transition-all duration-200 hover:border-border/70 hover:bg-muted/30"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground">
                      {entry.school}
                    </h4>
                    {entry.degreeLine ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entry.degreeLine}
                      </p>
                    ) : null}
                    {entry.metaLine ? (
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {entry.metaLine}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">
                Add education details to strengthen your profile credibility.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfileSidebarCards;
