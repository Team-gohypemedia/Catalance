import Camera from "lucide-react/dist/esm/icons/camera";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Rocket from "lucide-react/dist/esm/icons/rocket";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import ProjectCoverMedia from "@/components/features/freelancer/profile/ProjectCoverMedia";

const getProjectHost = (link = "") => {
  try {
    const parsed = new URL(String(link || "").trim());
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
  onAddProject,
  hasPendingChanges,
  onViewAllProjects,
}) => {
  const projectCount = Array.isArray(portfolioProjects) ? portfolioProjects.length : 0;
  const projectsWithLiveLinks = (Array.isArray(portfolioProjects) ? portfolioProjects : [])
    .filter((project) => Boolean(String(project?.link || "").trim())).length;
  const projectsWithCoverImages = (Array.isArray(portfolioProjects) ? portfolioProjects : [])
    .filter((project) => Boolean(String(project?.image || "").trim())).length;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <Rocket className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Featured Projects
            </h3>
            <p className="text-xs text-muted-foreground">
              Showcase your strongest work to increase client trust
            </p>
          </div>
          <span className="ml-1 inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {projectCount} {projectCount === 1 ? "project" : "projects"}
          </span>
          {hasPendingChanges ? (
            <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
              Unsaved changes
            </span>
          ) : null}
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

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
          {projectsWithLiveLinks} with live links
        </span>
        <span className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
          {projectsWithCoverImages} with cover images
        </span>
      </div>

      {projectCount > 0 ? (
        <div className="relative px-2 sm:px-10">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {portfolioProjects.map((project, idx) => (
                <CarouselItem key={idx} className="pl-3 md:basis-1/2 xl:basis-1/3">
                  <article className="group relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <ProjectCoverMedia
                        project={project}
                        containerClassName="h-full w-full"
                        imageClassName="transition-transform duration-500 group-hover:scale-110"
                        fallbackTitleClassName="text-4xl"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-90" />

                      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-2 py-1 backdrop-blur-md">
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95"
                            title="Open project"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                        <label
                          htmlFor={`project-cover-main-${idx}`}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95"
                          title="Upload cover image"
                        >
                          {projectCoverUploadingIndex === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Camera className="h-3.5 w-3.5" />
                          )}
                        </label>
                        <button
                          onClick={() => removeProject(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/90 text-white shadow-sm transition-transform duration-200 hover:scale-110 active:scale-95"
                          title="Remove project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <input
                        id={`project-cover-main-${idx}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleProjectCoverInputChange(idx, event)}
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold tracking-tight text-foreground" title={project.title || project.link}>
                          {project.title || "Project"}
                        </h4>
                        {project.link ? (
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-primary/80">
                            {getProjectHost(project.link)}
                          </p>
                        ) : null}
                        {project.description ? (
                          <p
                            className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground"
                            title={project.description}
                          >
                            {project.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground">
                          Featured Work
                        </span>
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                          >
                            Open
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground/60">
                            Link missing
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-1 sm:-left-2 border-border/60 bg-background/80 backdrop-blur" />
            <CarouselNext className="-right-1 sm:-right-2 border-border/60 bg-background/80 backdrop-blur" />
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
