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
    <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary)), #8b5cf6, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-foreground">Services From Onboarding</h3>
          <p className="text-xs text-muted-foreground">
            Compact summary of each service from your onboarding answers.
          </p>
        </div>
      </div>

      {onboardingServiceEntries.length > 0 ? (
        <div className="relative mt-4 px-10">
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
                  className="basis-full pl-4"
                >
                  <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2">
                    {slide.map(({ serviceKey, detail }) => {
                      const serviceTitle = getServiceLabel(serviceKey);
                      const serviceDescription = String(
                        detail?.serviceDescription || detail?.description || ""
                      ).trim();
                      const serviceCoverImage = resolveAvatarUrl(detail?.coverImage);
                      const hasServiceProfileContent = Boolean(
                        serviceDescription || serviceCoverImage
                      );

                      const specializationTags = collectServiceSpecializations(detail);
                      const nicheTags = toUniqueLabels([
                        ...(Array.isArray(detail?.niches) ? detail.niches : []),
                        detail?.otherNiche || "",
                      ]);
                      const mergedUniqueTags = Array.from(
                        new Set([
                          ...specializationTags.map((tag) => String(tag || "").trim()),
                          ...nicheTags.map((tag) => String(tag || "").trim()),
                        ].filter(Boolean))
                      );
                      const visibleTags = mergedUniqueTags.slice(0, 8);
                      const hiddenTagCount = Math.max(
                        0,
                        mergedUniqueTags.length - visibleTags.length
                      );

                      const projectList = Array.isArray(detail?.projects)
                        ? detail.projects
                        : [];
                      const displayedProjects = projectList.slice(0, 2);
                      const hiddenProjectCount = Math.max(
                        0,
                        projectList.length - displayedProjects.length
                      );

                      const metadataItems = [
                        {
                          label: "Level",
                          value: normalizeValueLabel(detail?.workingLevel) || "Not set",
                        },
                        {
                          label: "Complexity",
                          value:
                            normalizeValueLabel(detail?.projectComplexity) || "Not set",
                        },
                        {
                          label: "Avg Price",
                          value:
                            normalizeValueLabel(detail?.averageProjectPrice) ||
                            "Not set",
                        },
                        {
                          label: "Industry",
                          value: normalizeValueLabel(detail?.industryFocus) || "Not set",
                        },
                      ];

                      return (
                        <div
                          key={serviceKey}
                          className="group flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border/50 bg-muted/15 p-3.5 transition-colors duration-200 hover:border-border/70"
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="truncate text-sm font-bold text-foreground">
                                  {serviceTitle}
                                </h4>
                                <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {normalizeValueLabel(detail?.experienceYears) ||
                                    "Experience not set"}
                                </span>
                              </div>

                              <p
                                className={cn(
                                  "mt-1 text-xs leading-relaxed",
                                  hasServiceProfileContent
                                    ? "text-muted-foreground"
                                    : "text-amber-500/90"
                                )}
                              >
                                {hasServiceProfileContent
                                  ? "Description and/or cover added"
                                  : "Missing description or cover"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => openEditServiceProfileModal(serviceKey)}
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
                                hasServiceProfileContent
                                  ? "border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                              )}
                            >
                              <Edit2 className="h-3 w-3" aria-hidden="true" />
                              {hasServiceProfileContent ? "Edit Details" : "Add Details"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                            <div className="h-24 overflow-hidden rounded-lg border border-border/40 bg-background/40">
                              {serviceCoverImage ? (
                                <img
                                  src={serviceCoverImage}
                                  alt={`${serviceTitle} cover`}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground/70">
                                  No cover yet
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              {metadataItems.map((item) => (
                                <div
                                  key={`${serviceKey}-${item.label}`}
                                  className="rounded-md border border-border/40 bg-background/30 px-2 py-1.5"
                                >
                                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {item.label}
                                  </p>
                                  <p className="truncate text-[11px] font-medium text-foreground/90">
                                    {item.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <p
                            className={cn(
                              "text-xs leading-relaxed",
                              serviceDescription
                                ? "line-clamp-2 text-foreground/80"
                                : "italic text-muted-foreground/60"
                            )}
                          >
                            {serviceDescription || "No service description added yet."}
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {visibleTags.length > 0 ? (
                              visibleTags.map((tag) => (
                                <span
                                  key={`${serviceKey}-tag-${tag}`}
                                  className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground/60">
                                No specializations added
                              </span>
                            )}
                            {hiddenTagCount > 0 ? (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                +{hiddenTagCount} more
                              </span>
                            ) : null}
                          </div>

                          <div className="rounded-lg border border-border/40 bg-background/25 px-2.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Onboarding Projects
                            </p>
                            {displayedProjects.length > 0 ? (
                              <div className="mt-1 space-y-1">
                                {displayedProjects.map((project, index) => (
                                  <p
                                    key={`${serviceKey}-project-${index}`}
                                    className="truncate text-xs text-muted-foreground"
                                  >
                                    <span className="font-medium text-foreground/90">
                                      {project?.title || "Project"}
                                    </span>
                                    {project?.timeline
                                      ? ` | ${normalizeValueLabel(project.timeline)}`
                                      : ""}
                                    {project?.budget
                                      ? ` | ${normalizeValueLabel(project.budget)}`
                                      : ""}
                                  </p>
                                ))}
                                {hiddenProjectCount > 0 ? (
                                  <p className="text-[10px] text-muted-foreground">
                                    +{hiddenProjectCount} more project
                                    {hiddenProjectCount > 1 ? "s" : ""}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-muted-foreground/60">
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
        <p className="mt-3 text-sm text-muted-foreground">
          No service data from onboarding yet.
        </p>
      )}
    </Card>
  );
};

export default ServicesFromOnboardingCard;
