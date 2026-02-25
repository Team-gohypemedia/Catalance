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

const FeaturedProjectsSection = ({
  portfolioProjects,
  projectCoverUploadingIndex,
  handleProjectCoverInputChange,
  removeProject,
  onAddProject,
  onViewAllProjects,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Rocket className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          Featured Projects
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-semibold text-primary transition-all duration-200 hover:scale-[1.02] hover:bg-primary/10"
            onClick={onAddProject}
          >
            <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Add Project
          </Button>
          <button
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/5 hover:underline"
            onClick={onViewAllProjects}
          >
            View All
          </button>
        </div>
      </div>

      {portfolioProjects.length > 0 ? (
        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {portfolioProjects.map((project, idx) => (
                <CarouselItem key={idx} className="pl-4 md:basis-1/2">
                  <div className="group relative h-full overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-border/70 hover:shadow-lg">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <ProjectCoverMedia
                        project={project}
                        containerClassName="h-full w-full"
                        imageClassName="transition-transform duration-500 group-hover:scale-105"
                        fallbackTitleClassName="text-4xl"
                      />
                      {/* Glassmorphism overlay on hover */}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-md transition-transform duration-200 hover:scale-110 active:scale-95"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-black/40 cursor-not-allowed">
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        )}
                        <label
                          htmlFor={`project-cover-main-${idx}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-black shadow-md transition-transform duration-200 hover:scale-110 active:scale-95"
                          title="Upload cover image"
                        >
                          {projectCoverUploadingIndex === idx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </label>
                        <input
                          id={`project-cover-main-${idx}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handleProjectCoverInputChange(idx, event)}
                        />
                        <button
                          onClick={() => removeProject(idx)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/90 text-white shadow-md transition-transform duration-200 hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom gradient accent */}
                    <div
                      className="h-px w-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)",
                      }}
                      aria-hidden="true"
                    />

                    <div className="flex items-start justify-between gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-sm font-semibold truncate"
                          title={project.title || project.link}
                          style={{ textWrap: "balance" }}
                        >
                          {project.title || "Project"}
                        </h4>
                        {project.description ? (
                          <p
                            className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                            title={project.description}
                          >
                            {project.description}
                          </p>
                        ) : null}
                      </div>
                      {project.link ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                          title="Visit Project"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground/40 cursor-not-allowed">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </Carousel>
        </div>
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-muted/5 p-4 text-center transition-colors duration-200 hover:border-primary/20 hover:bg-muted/10">
          <Rocket className="mb-2 h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No projects added yet. Click "Add Project" to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeaturedProjectsSection;
