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
import ProjectCoverMedia from "@/components/features/freelancer/profile/ProjectCoverMedia";
import { getServiceLabel } from "@/components/features/freelancer/onboarding/utils";

const normalizeProjectLink = (link = "") => {
  const rawLink = String(link || "").trim();
  if (!rawLink) return "";

  if (/^https?:\/\//i.test(rawLink)) {
    return rawLink;
  }

  return `https://${rawLink}`;
};

const getProjectHost = (link = "") => {
  try {
    const normalizedLink = normalizeProjectLink(link);
    if (!normalizedLink) return "";
    const parsed = new URL(normalizedLink);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
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

const FeaturedProjectsSection = ({
  portfolioProjects,
  projectCoverUploadingIndex,
  handleProjectCoverInputChange,
  removeProject,
  onEditProject,
  onAddProject,
  hasPendingChanges,
  onViewAllProjects,
}) => {
  const projectCount = Array.isArray(portfolioProjects) ? portfolioProjects.length : 0;

  return (
    <section className="relative overflow-visible rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5 md:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary)), rgba(56,189,248,0.9), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="mb-4 flex flex-col gap-3 sm:mb-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 leading-tight">
              <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
                Featured Projects
              </h3>
              <span className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {projectCount} {projectCount === 1 ? "project" : "projects"}
              </span>
              {hasPendingChanges ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                  Unsaved changes
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Showcase your strongest work to increase client trust
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:w-auto sm:flex sm:flex-wrap sm:items-center">
          <Button
            variant="default"
            size="sm"
            className="w-full text-sm font-semibold sm:w-auto"
            onClick={onAddProject}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Add Project
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm font-medium text-primary hover:bg-primary/10 sm:w-auto"
            onClick={onViewAllProjects}
          >
            View All
          </Button>
        </div>
      </div>

      {projectCount > 0 ? (
        <div className="relative mt-5 px-0 sm:mt-6 sm:px-12 md:px-14 lg:px-16">
          <Carousel
            opts={{
              align: "start",
              loop: projectCount > 1,
            }}
            className="w-full"
          >
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

                  return (
                    <CarouselItem key={idx} className="basis-full pl-3 sm:pl-4 md:basis-1/2 xl:basis-1/3">
                      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:rounded-2xl">
                        <div className="relative h-44 overflow-hidden sm:h-52 md:h-56">
                          <ProjectCoverMedia
                            project={project}
                            containerClassName="h-full w-full"
                            imageClassName="transition-transform duration-700 group-hover:scale-105"
                            fallbackTitleClassName="text-4xl"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.72)_70%,rgba(7,7,10,0.97)_100%)]" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%)]" />

                          <div className="absolute right-3 top-3 z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-background text-foreground opacity-100 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-200 translate-y-0 pointer-events-auto hover:scale-105 hover:bg-background hover:text-primary sm:h-9 sm:w-9 sm:translate-y-1 sm:opacity-0 sm:pointer-events-none sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-focus-within:pointer-events-auto sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100 sm:focus-visible:pointer-events-auto sm:data-[state=open]:translate-y-0 sm:data-[state=open]:opacity-100 sm:data-[state=open]:pointer-events-auto"
                                  title="Project actions"
                                  aria-label="Project actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 border-white/10 bg-background text-foreground"
                              >
                                {projectHref ? (
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={projectHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="cursor-pointer"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                      Open project
                                    </a>
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onSelect={() => onEditProject?.(project, idx)}>
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
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove project
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

                        <div className="flex flex-1 flex-col space-y-2.5 px-3.5 pb-3 pt-3 sm:space-y-3 sm:px-4 sm:pb-4 sm:pt-3.5">
                          <div className="min-h-[4.25rem] min-w-0">
                            <h4
                              className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
                              title={project.title || project.link}
                            >
                              {project.title || "Project"}
                            </h4>
                            {project.link ? (
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                                {getProjectHost(project.link)}
                              </p>
                            ) : (
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                                Link not added
                              </p>
                            )}
                          </div>

                          <p
                            className="min-h-[4rem] max-h-[4rem] overflow-hidden text-xs leading-5 text-white/68 sm:min-h-[4.5rem] sm:max-h-[4.5rem] sm:text-[13px] sm:leading-6"
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                            }}
                            title={project.description || ""}
                          >
                            {project.description ||
                              "Add a concise project summary so clients can understand the scope, outcome, and value of this work."}
                          </p>

                          <div className="mt-auto flex flex-col items-start gap-2.5 border-t border-white/6 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="flex flex-wrap gap-2">
                              {visibleProjectServiceLabels.length ? (
                                visibleProjectServiceLabels.map((label) => (
                                  <span
                                    key={`${project.title || project.link || idx}-${label}`}
                                    className="inline-flex items-center rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-1 text-[10px] font-medium text-white/65 sm:text-[11px]"
                                  >
                                    {label}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-1 text-[10px] font-medium text-white/65 sm:text-[11px]">
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
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.045] px-2.5 py-1.5 text-xs text-white/40">
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
                <CarouselPrevious className="!-left-3 z-10 size-10 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30 disabled:[&_svg]:text-white/30 sm:!-left-12 sm:size-11 sm:[&_svg]:h-5 sm:[&_svg]:w-5 md:!-left-16 lg:!-left-18" />
                <CarouselNext className="!-right-3 z-10 size-10 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-primary hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30 disabled:[&_svg]:text-white/30 sm:!-right-12 sm:size-11 sm:[&_svg]:h-5 sm:[&_svg]:w-5 md:!-right-16 lg:!-right-18" />
              </>
            ) : null}
          </Carousel>
        </div>
      ) : (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/[0.08] p-6 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Rocket className="h-7 w-7 text-primary/80" aria-hidden="true" />
          </span>
          <h4 className="text-base font-semibold text-foreground">No featured projects yet</h4>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            No projects added yet. Click &quot;Add Project&quot; to get started.
          </p>
          <Button onClick={onAddProject} className="mt-4">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Project
          </Button>
        </div>
      )}
    </section>
  );
};

export default FeaturedProjectsSection;
