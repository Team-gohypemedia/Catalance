import FilePlus2 from "lucide-react/dist/esm/icons/file-plus-2";
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import { Card } from "@/components/ui/card";

const normalizeEducationEntries = (profileDetails = {}) => {
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
      const graduationYear = String(
        entry.graduationYear ||
        entry.endYear ||
        entry.year ||
        entry.completedYear ||
        ""
      ).trim();

      const degreeLine = [degree, field].filter(Boolean).join(". ");
      const metaLine = [country, graduationYear ? `Graduated ${graduationYear}` : ""]
        .filter(Boolean)
        .join(", ");

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

const normalizeSkill = (entry, index) => {
  if (typeof entry === "string") {
    return { id: `skill-${index}-${entry}`, name: entry, level: "Intermediate" };
  }

  if (!entry || typeof entry !== "object") {
    return { id: `skill-${index}`, name: "Skill", level: "Intermediate" };
  }

  return {
    id: `skill-${index}-${entry.name || "item"}`,
    name: String(entry.name || "Skill").trim(),
    level: String(
      entry.level || entry.proficiency || entry.experienceLevel || "Intermediate"
    ).trim(),
  };
};

/* Subtle color palette for skill pills */
const SKILL_COLORS = [
  { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", hoverBg: "hover:bg-primary/20" },
  { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", hoverBg: "hover:bg-violet-500/20" },
  { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", hoverBg: "hover:bg-blue-500/20" },
  { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", hoverBg: "hover:bg-cyan-500/20" },
  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", hoverBg: "hover:bg-emerald-500/20" },
  { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", hoverBg: "hover:bg-amber-500/20" },
  { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", hoverBg: "hover:bg-rose-500/20" },
  { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", hoverBg: "hover:bg-indigo-500/20" },
];

const ProfileSidebarCards = ({
  openCreateExperienceModal,
  effectiveWorkExperience,
  workExperience,
  openEditExperienceModal,
  splitExperienceTitle,
  profileDetails,
  openFullProfileEditor,
}) => {
  const educationEntries = normalizeEducationEntries(profileDetails);
  const hasExperience = (Array.isArray(effectiveWorkExperience)
    ? effectiveWorkExperience
    : []
  ).length > 0;

  return (
    <div className="space-y-5">
      {/* ── Work Experience ── */}
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
            {/* Timeline line */}
            <div
              className="absolute bottom-4 left-[11px] top-4 w-px bg-border/60"
              aria-hidden="true"
            />

            {effectiveWorkExperience.map((exp, index) => {
              const [position, company] = splitExperienceTitle(exp.title);
              return (
                <button
                  key={`work-exp-${index}`}
                  type="button"
                  onClick={() => {
                    if (workExperience.length > 0) {
                      openEditExperienceModal(exp, index);
                    }
                  }}
                  className="group relative flex w-full gap-4 py-3 text-left transition-colors duration-200"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1.5 flex shrink-0">
                    <span
                      className="h-[9px] w-[9px] rounded-full border-2 border-primary/60 bg-card transition-colors duration-200 group-hover:border-primary group-hover:bg-primary/20"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-transparent p-3 transition-all duration-200 group-hover:border-border/60 group-hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">
                          {position || "Position"}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {company || "Company"}
                        </p>
                      </div>
                      <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors duration-200 group-hover:text-primary/60" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {exp.period || "Timeline not set"}
                    </p>
                    {exp.description ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-foreground/80 line-clamp-2">
                        {exp.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </Card>

      {/* ── Education ── */}
      <Card className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Education
          </h3>
          <button
            type="button"
            onClick={openFullProfileEditor}
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
