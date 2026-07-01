import Camera from "lucide-react/dist/esm/icons/camera";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Plus from "lucide-react/dist/esm/icons/plus";
import Rocket from "lucide-react/dist/esm/icons/rocket";
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
        watchDrag: (emblaApi, event) =>
          event.pointerType !== "mouse" && event.type !== "mousedown",
      }}
      className="w-full"
    >
      <section className="relative overflow-visible rounded-2xl border border-border/60 bg-card p-4 shadow-none sm:p-5 md:p-6">
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(var(--primary)), rgba(56,189,248,0.9), transparent)",
          }}
          aria-hidden="true"
        />

        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Rocket className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 leading-tight">
                <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
                  Case Studies
                </h3>
                {hasPendingChanges ? (
                  <span className="inline-flex items-center rounded-full border border-primary/20/40 bg-primary/10/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    Unsaved changes
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Highlight your best work and build client confidence
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-3 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:scale-[1.02]"
              onClick={onAddProject}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Case Study
            </button>
          </div>
        </div>

        {projectCount > 0 ? (
          <div className="relative mt-5">
            <div className="overflow-hidden rounded-2xl">
              <CarouselContent className="-ml-3 sm:-ml-4">
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
                    <CarouselItem key={idx} className="select-none basis-full pl-3 sm:pl-4 md:basis-1/2 xl:basis-1/3">
                      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card sm:rounded-2xl">
                        <div className="px-3 pt-3">
                          <div className="relative h-44 overflow-hidden rounded-xl sm:h-52 md:h-56">
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
                        </div>

                        <div className="flex flex-1 flex-col space-y-1.5 px-3.5 pb-3 pt-3 sm:space-y-2 sm:px-4 sm:pb-4 sm:pt-3.5">
                          <div className="min-h-[1.75rem] min-w-0">
                            <h4
                              className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
                              title={project.title || project.link}
                            >
                              {project.title || "Case Study"}
                            </h4>
                          </div>

                          <p
                            className="min-h-[2.5rem] line-clamp-2 overflow-hidden text-xs leading-5 text-muted-foreground sm:min-h-[2.75rem] sm:text-[13px] sm:leading-6"
                            title={project.description || ""}  
                          >
                            {project.description ||
                              "Add a concise case study summary so clients can understand the scope, outcome, and value of this work."}
                          </p>

                          {projectDetails.length ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {projectDetails.map((detail) => (
                                <div
                                  key={`${project.title || project.link || idx}-${detail.label}`}
                                  className="rounded-xl border border-border bg-muted/50 px-3 py-2"
                                >
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                    {detail.label}
                                  </div>
                                  <div className="mt-1 line-clamp-1 text-xs font-medium text-foreground sm:text-[13px]">
                                    {detail.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-auto flex flex-col items-start gap-2.5 border-t border-border pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="flex flex-wrap gap-2">
                              {visibleProjectServiceLabels.length ? (
                                visibleProjectServiceLabels.map((label) => (
                                  <span
                                    key={`${project.title || project.link || idx}-${label}`}
                                    className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]"
                                  >
                                    {label}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                                  Featured Work
                                </span>
                              )}
                              {hiddenProjectServiceLabelCount > 0 ? (
                                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary sm:text-[11px]">
                                  +{hiddenProjectServiceLabelCount} more
                                </span>
                              ) : null}
                            </div>
                            {projectHref ? (
                              <a
                                href={projectHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                              >
                                Open
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
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

            {projectCount > 1 ? (
              <>
                <CarouselPrevious className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-10 size-9 border-primary/40 bg-card text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-30" />
                <CarouselNext className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-10 size-9 border-primary/40 bg-card text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-30" />
              </>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card p-6 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Rocket className="h-7 w-7 text-primary/80" aria-hidden="true" />
            </span>
            <h4 className="text-base font-semibold text-foreground">No featured case studies yet</h4>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Showcase your best work by adding a case study using the button above.
            </p>
          </div>
        )}
      </section>
    </Carousel>
  );
};

export default FeaturedProjectsSection;
