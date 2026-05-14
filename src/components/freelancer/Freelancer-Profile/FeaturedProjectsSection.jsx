import Camera from "lucide-react/dist/esm/icons/camera";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import ProjectCoverMedia from "@/components/freelancer/Freelancer-Profile/ProjectCoverMedia";
import { getServiceLabel } from "@/components/features/freelancer/onboarding/utils";
import {
  formatCaseStudyTimelineLabel,
  formatSkillLabel,
} from "@/components/freelancer/Freelancer-Profile/freelancerProfileUtils";

const normalizeProjectLink = (link = "") => {
  const rawLink = String(link || "").trim();
  if (!rawLink) return "";

  if (/^https?:\/\//i.test(rawLink)) {
    return rawLink;
  }

  return `https://${rawLink}`;
};

const normalizeServiceIdentity = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const resolveProjectServiceLabels = (project = {}) => {
  const seen = new Set();

  return [
    ...(Array.isArray(project?.serviceKeys) ? project.serviceKeys : []),
    project?.serviceKey,
  ].reduce((acc, value) => {
    const rawValue = String(value || "").trim();
    const normalizedValue = normalizeServiceIdentity(rawValue);

    if (!normalizedValue || seen.has(normalizedValue)) {
      return acc;
    }

    seen.add(normalizedValue);
    acc.push(getServiceLabel(rawValue));
    return acc;
  }, []);
};

const formatCaseStudyBudget = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  if (/^(₹|\$|€|£)/.test(rawValue)) return rawValue;
  if (/^\d/.test(rawValue)) return `₹ ${rawValue}`;
  return rawValue;
};

const formatCaseStudyDetailValue = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  return formatSkillLabel(rawValue);
};

const FeaturedProjectsSection = ({
  portfolioProjects,
  projectCoverUploadingIndex,
  handleProjectCoverInputChange,
  removeProject,
  onEditProject,
  onAddProject,
  hasPendingChanges,
}) => {
  const projectCount = Array.isArray(portfolioProjects) ? portfolioProjects.length : 0;

  return (
    <Carousel
      opts={{
        align: "start",
        loop: projectCount > 1,
      }}
      className="w-full"
    >
      <section className="relative overflow-visible rounded-3xl border border-white/10 bg-[#121212] px-6 py-6 shadow-none sm:px-7 sm:py-7 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
              <FlaskConical className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 leading-tight">
                <h3 className="text-xl font-bold leading-tight tracking-normal text-white">
                  Case Studies
                </h3>
                {hasPendingChanges ? (
                  <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                    Unsaved changes
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-white/55">
                Highlight your best work and build client confidence
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-full rounded-lg border border-primary bg-transparent px-4 text-sm font-medium text-primary hover:bg-primary/10 sm:w-auto"
              onClick={onAddProject}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Add Case Study
            </Button>

            {projectCount > 1 ? (
              <div className="flex shrink-0 items-center gap-2">
                <CarouselPrevious className="relative inset-auto size-8 translate-x-0 translate-y-0 border-primary/40 bg-card text-primary hover:scale-105 hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
                <CarouselNext className="relative inset-auto size-8 translate-x-0 translate-y-0 border-primary/40 bg-card text-primary hover:scale-105 hover:bg-card hover:text-primary disabled:border-border disabled:bg-card disabled:text-muted-foreground" />
              </div>
            ) : null}
          </div>
        </div>

        {projectCount > 0 ? (
          <div className="relative">
            <div className="overflow-hidden">
              <CarouselContent className="ml-0">
                {portfolioProjects.map((project, idx) => {
                  const projectHref = normalizeProjectLink(project?.link || "");
                  const projectServiceLabels = resolveProjectServiceLabels(project);
                  const visibleProjectServiceLabels = projectServiceLabels.slice(0, 2);
                  const hiddenProjectServiceLabelCount = Math.max(
                    0,
                    projectServiceLabels.length - visibleProjectServiceLabels.length
                  );
                  const projectDetails = [
                    project?.niche
                      ? { label: "Niche", value: formatCaseStudyDetailValue(project.niche) }
                      : null,
                    project?.role
                      ? { label: "Role", value: formatCaseStudyDetailValue(project.role) }
                      : null,
                    project?.timeline
                      ? {
                          label: "Timeline",
                          value: formatCaseStudyTimelineLabel(project.timeline),
                        }
                      : null,
                    project?.budget
                      ? {
                          label: "Budget",
                          value: formatCaseStudyBudget(project.budget),
                        }
                      : null,
                  ].filter(Boolean);

                  return (
                    <CarouselItem key={idx} className="basis-full pl-0 sm:basis-[402px] sm:pr-6">
                      <article className="group flex h-full min-h-[480px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#1a1a1a] shadow-[0_20px_40px_rgba(0,0,0,0.22)]">
                        <div className="relative h-[200px] overflow-hidden rounded-t-[24px]">
                            <ProjectCoverMedia
                              project={project}
                              containerClassName="h-full w-full"
                              imageClassName="transition-transform duration-700 group-hover:scale-105"
                              fallbackTitleClassName="text-4xl"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.72)_70%,rgba(7,7,10,0.97)_100%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%)]" />

                            <div className="absolute right-3 top-3 z-10">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-card text-foreground opacity-100 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-200 translate-y-0 pointer-events-auto hover:scale-105 hover:bg-card hover:text-primary sm:h-9 sm:w-9 sm:translate-y-1 sm:opacity-0 sm:pointer-events-none sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:pointer-events-auto sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100 sm:focus-visible:pointer-events-auto sm:data-[state=open]:translate-y-0 sm:data-[state=open]:opacity-100 sm:data-[state=open]:pointer-events-auto"
                                    title="Case study actions"
                                    aria-label="Case study actions"
                                  >
                                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  sideOffset={10}
                                  className="w-60 min-w-60 rounded-xl border border-border/60 !bg-card p-1.5 text-foreground !shadow-none"
                                >
                                  {projectHref ? (
                                    <DropdownMenuItem asChild className="whitespace-nowrap rounded-lg px-3 py-2">
                                      <a
                                        href={projectHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="cursor-pointer"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                        Open case study
                                      </a>
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem
                                    onSelect={() => onEditProject?.(project, idx)}
                                    className="whitespace-nowrap rounded-lg px-3 py-2"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                                    Edit details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={(event) => {
                                      event.preventDefault();
                                      document
                                        .getElementById(`project-cover-main-${idx}`)
                                        ?.click();
                                    }}
                                    className="whitespace-nowrap rounded-lg px-3 py-2"
                                  >
                                    {projectCoverUploadingIndex === idx ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : (
                                      <Camera className="h-3.5 w-3.5 text-primary" />
                                    )}
                                    Upload cover
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => removeProject(idx)}
                                    className="whitespace-nowrap rounded-lg px-3 py-2"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove case study
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <input
                              id={`project-cover-main-${idx}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => handleProjectCoverInputChange(idx, event)}
                            />
                        </div>

                        <div className="flex flex-1 flex-col space-y-3 px-6 pb-6 pt-5">
                          <div className="min-h-[1.75rem] min-w-0">
                            <h4
                              className="truncate text-xl font-bold leading-7 tracking-normal text-white"
                              title={project.title || project.link}
                            >
                              {project.title || "Case Study"}
                            </h4>
                          </div>

                          <p
                            className="min-h-6 line-clamp-2 overflow-hidden text-sm leading-6 text-white/60"
                            title={project.description || ""}
                          >
                            {project.description ||
                              "Add a concise case study summary so clients can understand the scope, outcome, and value of this work."}
                          </p>

                          {projectDetails.length ? (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              {projectDetails.map((detail) => (
                                <div
                                  key={`${project.title || project.link || idx}-${detail.label}`}
                                  className="min-h-[68px] rounded-[12px] border border-white/10 bg-white/[0.04] px-3.5 py-3"
                                >
                                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
                                    {detail.label}
                                  </div>
                                  <div className="mt-2 line-clamp-1 text-base font-semibold text-white">
                                    {detail.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-auto flex flex-col items-start gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                              {visibleProjectServiceLabels.length ? (
                                visibleProjectServiceLabels.map((label) => (
                                  <span
                                    key={`${project.title || project.link || idx}-${label}`}
                                    className="inline-flex min-h-9 items-center rounded-lg border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-medium leading-5 text-white/70"
                                  >
                                    {label}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex min-h-9 items-center rounded-lg border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-medium leading-5 text-white/70">
                                  Featured Work
                                </span>
                              )}
                              {hiddenProjectServiceLabelCount > 0 ? (
                                <span className="inline-flex min-h-9 items-center rounded-lg border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium leading-5 text-primary">
                                  +{hiddenProjectServiceLabelCount} more
                                </span>
                              ) : null}
                            </div>
                            {projectHref ? (
                              <a
                                href={projectHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium leading-5 text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                              >
                                Open
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/[0.045] px-4 py-2 text-sm leading-5 text-white/45">
                                Link missing
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.025] p-6 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
              <FlaskConical className="h-7 w-7 text-primary/80" aria-hidden="true" />
            </span>
            <h4 className="text-base font-semibold text-foreground">No featured case studies yet</h4>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              No case studies added yet. Click &quot;Add Case Study&quot; to get started.
            </p>
            <Button variant="outline" onClick={onAddProject} className="mt-4 border border-primary bg-transparent text-primary hover:bg-primary/10">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Case Study
            </Button>
          </div>
        )}
      </section>
    </Carousel>
  );
};

export default FeaturedProjectsSection;
