import Cpu from "lucide-react/dist/esm/icons/cpu";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/shared/lib/utils";

const chunkServices = (entries = [], chunkSize = 2) => {
  const pages = [];
  for (let index = 0; index < entries.length; index += chunkSize) {
    pages.push(entries.slice(index, index + chunkSize));
  }
  return pages;
};

const ServicesFromOnboardingCard = ({
  onboardingServiceEntries,
  getServiceLabel,
  resolveAvatarUrl,
  collectServiceSpecializations,
  toUniqueLabels,
  normalizeValueLabel,
  openEditServiceProfileModal,
}) => {
  const serviceSlides = chunkServices(onboardingServiceEntries, 2);

  return (
    <Card className="p-6 md:p-7 space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
        <span className="text-primary">
          <Cpu className="w-5 h-5" />
        </span>
        Services From Onboarding
      </h3>

      {onboardingServiceEntries.length > 0 ? (
        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: serviceSlides.length > 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {serviceSlides.map((slide, slideIndex) => (
                <CarouselItem
                  key={`services-slide-${slideIndex}`}
                  className="pl-4 basis-full"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
                    {slide.map(({ serviceKey, detail }) => {
                      const serviceTitle = getServiceLabel(serviceKey);
                      const serviceDescription = String(
                        detail?.serviceDescription || detail?.description || ""
                      ).trim();
                      const serviceCoverImage = resolveAvatarUrl(detail?.coverImage);
                      const hasServiceProfileContent = Boolean(
                        serviceDescription || serviceCoverImage
                      );
                      const specializationTags =
                        collectServiceSpecializations(detail);
                      const nicheTags = toUniqueLabels([
                        ...(Array.isArray(detail?.niches) ? detail.niches : []),
                        detail?.otherNiche || "",
                      ]);
                      const projectList = Array.isArray(detail?.projects)
                        ? detail.projects
                        : [];
                      const displayedNicheTags = nicheTags.slice(0, 8);
                      const hiddenNicheCount = Math.max(
                        0,
                        nicheTags.length - displayedNicheTags.length
                      );
                      const displayedSpecializationTags =
                        specializationTags.slice(0, 14);
                      const hiddenSpecializationCount = Math.max(
                        0,
                        specializationTags.length -
                          displayedSpecializationTags.length
                      );
                      const displayedProjects = projectList.slice(0, 2);
                      const hiddenProjectCount = Math.max(
                        0,
                        projectList.length - displayedProjects.length
                      );

                      return (
                        <div
                          key={serviceKey}
                          className="rounded-xl border border-border/70 bg-secondary/20 p-4 h-full md:h-[820px] flex flex-col gap-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-foreground">
                              {serviceTitle}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {normalizeValueLabel(detail?.experienceYears) ||
                                "Experience not set"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                openEditServiceProfileModal(serviceKey)
                              }
                              className={cn(
                                "ml-auto inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                                hasServiceProfileContent
                                  ? "border-border/60 text-muted-foreground hover:text-foreground hover:bg-background/60"
                                  : "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                              )}
                            >
                              <Edit2 className="w-3 h-3" />
                              {hasServiceProfileContent
                                ? "Edit Description & Cover"
                                : "Add Description & Cover"}
                            </button>
                          </div>

                          <p
                            className={cn(
                              "rounded-md px-3 py-2 text-xs min-h-10 flex items-center border",
                              hasServiceProfileContent
                                ? "border-border/60 bg-background/40 text-muted-foreground"
                                : "border-dashed border-border/60 bg-background/40 text-muted-foreground"
                            )}
                          >
                            {hasServiceProfileContent
                              ? "Description and/or cover image added."
                              : "Add a service description and cover image to improve your profile visibility."}
                          </p>

                          <div className="rounded-lg overflow-hidden border border-border/60 bg-background/60 h-44 shrink-0">
                            {serviceCoverImage ? (
                              <img
                                src={serviceCoverImage}
                                alt={`${serviceTitle} cover`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                No cover image uploaded
                              </div>
                            )}
                          </div>

                          <p
                            className={cn(
                              "text-sm leading-relaxed min-h-[96px] line-clamp-4",
                              serviceDescription
                                ? "text-muted-foreground"
                                : "text-muted-foreground/80 italic"
                            )}
                          >
                            {serviceDescription ||
                              "No service description added yet."}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <p>
                              Level:{" "}
                              <span className="text-foreground">
                                {normalizeValueLabel(detail?.workingLevel) ||
                                  "Not set"}
                              </span>
                            </p>
                            <p>
                              Complexity:{" "}
                              <span className="text-foreground">
                                {normalizeValueLabel(detail?.projectComplexity) ||
                                  "Not set"}
                              </span>
                            </p>
                            <p>
                              Avg Project Price:{" "}
                              <span className="text-foreground">
                                {normalizeValueLabel(detail?.averageProjectPrice) ||
                                  "Not set"}
                              </span>
                            </p>
                            <p>
                              Industry Focus:{" "}
                              <span className="text-foreground">
                                {normalizeValueLabel(detail?.industryFocus) ||
                                  "Not set"}
                              </span>
                            </p>
                          </div>

                          <div className="space-y-2 min-h-[110px] max-h-[170px] overflow-y-auto pr-1">
                            {displayedNicheTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {displayedNicheTags.map((tag) => (
                                  <span
                                    key={`${serviceKey}-niche-${tag}`}
                                    className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-xs text-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {hiddenNicheCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-xs text-muted-foreground">
                                    +{hiddenNicheCount} more
                                  </span>
                                )}
                              </div>
                            )}

                            {displayedSpecializationTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {displayedSpecializationTags.map((tag) => (
                                  <span
                                    key={`${serviceKey}-spec-${tag}`}
                                    className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {hiddenSpecializationCount > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary">
                                    +{hiddenSpecializationCount} more
                                  </span>
                                )}
                              </div>
                            )}

                            {displayedNicheTags.length === 0 &&
                              displayedSpecializationTags.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  No specializations added.
                                </p>
                              )}
                          </div>

                          <div className="mt-auto rounded-lg border border-border/60 bg-background/70 p-3 space-y-2 min-h-[88px]">
                            <p className="text-xs font-medium text-foreground">
                              Projects Added In Onboarding
                            </p>
                            {displayedProjects.length > 0 ? (
                              <div className="space-y-1.5">
                                {displayedProjects.map((project, index) => (
                                  <div
                                    key={`${serviceKey}-project-${index}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    <span className="text-foreground font-medium">
                                      {project?.title || "Project"}
                                    </span>
                                    {project?.timeline
                                      ? ` | ${normalizeValueLabel(project.timeline)}`
                                      : ""}
                                    {project?.budget
                                      ? ` | ${normalizeValueLabel(project.budget)}`
                                      : ""}
                                  </div>
                                ))}
                                {hiddenProjectCount > 0 && (
                                  <p className="text-[11px] text-muted-foreground">
                                    +{hiddenProjectCount} more project
                                    {hiddenProjectCount > 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No projects added yet.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {serviceSlides.length > 1 ? (
              <>
                <CarouselPrevious className="-left-4" />
                <CarouselNext className="-right-4" />
              </>
            ) : null}
          </Carousel>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No service data from onboarding yet.
        </p>
      )}
    </Card>
  );
};

export default ServicesFromOnboardingCard;

