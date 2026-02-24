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
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <span className="text-primary">
            <Rocket className="w-5 h-5" />
          </span>
          Featured Projects
        </h3>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary flex items-center gap-1"
            onClick={onAddProject}
          >
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
          <button
            className="text-primary text-sm font-medium hover:underline"
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
                  <div className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all h-full">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <ProjectCoverMedia
                        project={project}
                        containerClassName="h-full w-full"
                        imageClassName="transition-transform duration-500 group-hover:scale-105"
                        fallbackTitleClassName="text-4xl"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {project.link ? (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="p-2 bg-white/70 rounded-full text-black/60 cursor-not-allowed">
                            <ExternalLink className="w-4 h-4" />
                          </span>
                        )}
                        <label
                          htmlFor={`project-cover-main-${idx}`}
                          className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform cursor-pointer"
                          title="Upload cover image"
                        >
                          {projectCoverUploadingIndex === idx ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
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
                          className="p-2 bg-destructive text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4
                          className="font-semibold truncate text-sm"
                          title={project.title || project.link}
                        >
                          {project.title || "Project"}
                        </h4>
                        {project.description ? (
                          <p
                            className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed"
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
                          className="flex items-center justify-center p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                          title="Visit Project"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="flex items-center justify-center p-2 rounded-lg bg-secondary/40 text-muted-foreground/60 cursor-not-allowed">
                          <ExternalLink className="w-4 h-4" />
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
        <div className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center hover:bg-secondary/10 transition-colors">
          <p className="text-muted-foreground text-sm">
            No projects added yet. Click "Add Project" to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeaturedProjectsSection;

