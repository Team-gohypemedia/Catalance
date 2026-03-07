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
    <section className="relative overflow-visible rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary)), rgba(56,189,248,0.9), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 leading-tight">
              <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="text-sm font-semibold"
            onClick={onAddProject}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Add Project
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-primary hover:bg-primary/10"
            onClick={onViewAllProjects}
          >
            View All
          </Button>
        </div>
      </div>

      {projectCount > 0 ? (
        <div className="relative mt-6 px-12 md:px-14 lg:px-16">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <div className="overflow-hidden rounded-[28px]">
              <CarouselContent className="-ml-4">
                {portfolioProjects.map((project, idx) => {
                  const projectHref = normalizeProjectLink(project?.link || "");

                  return (
                    <CarouselItem key={idx} className="pl-4 md:basis-1/2 xl:basis-1/3">
                      <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
                        <div className="relative h-52 overflow-hidden md:h-56">
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
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-background text-foreground opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-200 translate-y-1 pointer-events-none group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:pointer-events-auto data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=open]:pointer-events-auto hover:scale-105 hover:bg-background hover:text-primary"
                                  title="Project actions"
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

                        <div className="flex flex-1 flex-col space-y-3 px-4 pb-3.5 pt-3 md:px-4.5 md:pb-4 md:pt-3.5">
                          <div className="min-h-[4.25rem] min-w-0">
                            <h4
                              className="truncate text-base font-semibold tracking-tight text-foreground"
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
                            className="min-h-[4.5rem] max-h-[4.5rem] overflow-hidden text-[13px] leading-6 text-white/68"
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

                          <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/6 pt-3">
                            <span className="inline-flex items-center rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-1 text-[11px] font-medium text-white/65">
                              Featured Work
                            </span>
                            {projectHref ? (
                              <a
                                href={projectHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
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
            <CarouselPrevious className="!-left-16 md:!-left-16 lg:!-left-18 z-10 size-11 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-primary hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30 disabled:[&_svg]:text-white/30" />
            <CarouselNext className="!-right-16 md:!-right-16 lg:!-right-18 z-10 size-11 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-primary hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30 disabled:[&_svg]:text-white/30" />
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
