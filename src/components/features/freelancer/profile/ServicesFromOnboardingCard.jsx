import Cpu from "lucide-react/dist/esm/icons/cpu";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import { Card } from "@/components/ui/card";
import { PROJECT_COMPLEXITY_OPTIONS } from "@/components/features/freelancer/onboarding/constants";
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

const PROJECT_COMPLEXITY_LABELS = PROJECT_COMPLEXITY_OPTIONS.reduce(
  (acc, option) => ({
    ...acc,
    [option.value]: option.label,
  }),
  {}
);

const normalizeProjectHref = (project) => {
  const rawValue = String(
    project?.link || project?.url || project?.projectUrl || project?.website || ""
  ).trim();

  if (!rawValue) {
    return "";
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  return `https://${rawValue}`;
};

const getProjectDedupKey = (project, fallbackKey = "") => {
  const normalizedHref = normalizeProjectHref(project).toLowerCase();
  if (normalizedHref) {
    return `link:${normalizedHref}`;
  }

  const normalizedTitle = String(project?.title || "")
    .trim()
    .toLowerCase();
  if (normalizedTitle) {
    return `title:${normalizedTitle}`;
  }

  return fallbackKey;
};

const ServicesFromOnboardingCard = ({
  onboardingServiceEntries,
  portfolioProjects,
  getServiceLabel,
  resolveAvatarUrl,
  collectServiceSpecializations,
  toUniqueLabels,
  normalizeValueLabel,
  openEditServiceProfileModal,
}) => {
  const serviceSlides = chunkServices(onboardingServiceEntries, 2);

  return (
    <Card className="relative overflow-visible rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary)), rgba(56,189,248,0.9), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            Services From Onboarding
          </h3>
          <p className="text-sm text-muted-foreground">
            Service cards styled as polished profile showcases.
          </p>
        </div>
      </div>

      {onboardingServiceEntries.length > 0 ? (
        <div className="relative mt-6 px-12 md:px-14 lg:px-16">
          <Carousel
            opts={{
              align: "start",
              loop: serviceSlides.length > 1,
            }}
            className="w-full"
          >
            <div className="overflow-hidden rounded-[28px]">
              <CarouselContent className="-ml-4">
                {serviceSlides.map((slide, slideIndex) => (
                  <CarouselItem
                    key={`services-slide-${slideIndex}`}
                    className="basis-full pl-4"
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
                    const visibleTags = mergedUniqueTags.slice(0, 6);
                    const hiddenTagCount = Math.max(
                      0,
                      mergedUniqueTags.length - visibleTags.length
                    );

                    const linkedFeaturedProjects = (
                      Array.isArray(portfolioProjects) ? portfolioProjects : []
                    ).filter(
                      (project) =>
                        String(project?.serviceKey || "").trim() === serviceKey
                    );
                    const onboardingProjects = Array.isArray(detail?.projects)
                      ? detail.projects
                      : [];
                    const projectList = Array.from(
                      new Map(
                        [...linkedFeaturedProjects, ...onboardingProjects].map(
                          (project, index) => [
                            getProjectDedupKey(
                              project,
                              `${serviceKey}-${index}`
                            ),
                            project,
                          ]
                        )
                      ).values()
                    );
                    const displayedProjects = projectList.slice(0, 6);

                    const metadataItems = [
                      {
                        label: "Complexity",
                        value:
                          PROJECT_COMPLEXITY_LABELS[
                            String(detail?.projectComplexity || "").trim().toLowerCase()
                          ] || "Not set",
                      },
                      {
                        label: "Avg Price",
                        value:
                          normalizeValueLabel(detail?.averageProjectPrice) || "Not set",
                      },
                    ];

                    return (
                        <article
                          key={serviceKey}
                          className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]"
                        >
                        <div className="relative h-52 overflow-hidden md:h-56">
                          {serviceCoverImage ? (
                            <img
                              src={serviceCoverImage}
                              alt={`${serviceTitle} cover`}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{
                                background:
                                  "radial-gradient(circle at 18% 18%, rgba(34,211,238,0.22), transparent 18%), radial-gradient(circle at 86% 80%, rgba(14,165,233,0.24), transparent 16%), linear-gradient(180deg, rgba(2,6,23,0.96), rgba(3,7,18,0.98))",
                              }}
                            />
                          )}

                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.72)_70%,rgba(7,7,10,0.97)_100%)]" />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%)]" />

                          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-3 p-3.5 md:p-4">
                            <button
                              type="button"
                              onClick={() => openEditServiceProfileModal(serviceKey)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm transition-colors duration-200",
                                hasServiceProfileContent
                                  ? "border-white/10 bg-black/25 text-white/80 hover:bg-black/40 hover:text-white"
                                  : "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
                              )}
                            >
                              <Edit2 className="h-3 w-3" aria-hidden="true" />
                              {hasServiceProfileContent ? "Edit Details" : "Add Details"}
                            </button>
                          </div>

                        </div>

                        <div className="flex flex-1 flex-col space-y-3 px-4 pb-3.5 pt-3 md:px-4.5 md:pb-4 md:pt-3.5">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                                {serviceTitle}
                              </h4>
                              <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
                                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.65)]" />
                                {normalizeValueLabel(detail?.experienceYears) ||
                                  "Experience not set"}
                              </div>
                            </div>
                          </div>

                          <p
                            className={cn(
                              "min-h-[4.5rem] max-h-[4.5rem] max-w-6xl overflow-hidden text-[13px] leading-6",
                              serviceDescription
                                ? "text-white/68"
                                : "italic text-white/45"
                            )}
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                            }}
                          >
                            {serviceDescription ||
                              "Add a stronger service description so clients understand your positioning, delivery approach, and outcomes at a glance."}
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            {metadataItems.map((item) => (
                              <div
                                key={`${serviceKey}-${item.label}`}
                                className="rounded-[15px] border border-white/6 bg-white/[0.035] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                              >
                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                                  {item.label}
                                </p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-white">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="min-h-[5.5rem] border-t border-white/6 pt-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                              Skills &amp; Technologies
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {visibleTags.length > 0 ? (
                                visibleTags.map((tag) => (
                                  <span
                                    key={`${serviceKey}-tag-${tag}`}
                                    className="rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-0.5 text-[10px] font-semibold text-white/72"
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-white/45">
                                  No skills added yet.
                                </span>
                              )}
                              {hiddenTagCount > 0 ? (
                                <span className="rounded-full border border-white/6 bg-white/[0.045] px-2.5 py-0.5 text-[10px] font-semibold text-white/72">
                                  +{hiddenTagCount}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-auto min-h-[7.75rem] border-t border-white/6 pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-white/78">
                                Featured Projects ({projectList.length})
                              </span>
                            </div>

                            {displayedProjects.length > 0 ? (
                              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-[repeat(4,max-content)]">
                                {displayedProjects.map((project, index) => {
                                  const projectHref = normalizeProjectHref(project);

                                  return (
                                    <div
                                      key={`${serviceKey}-project-${index}`}
                                      className="flex items-center gap-0"
                                    >
                                      <span className="truncate text-sm font-medium text-primary">
                                        {project?.title || "Project"}
                                      </span>
                                      {projectHref ? (
                                        <a
                                          href={projectHref}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex h-5 w-5 flex-none items-center justify-center text-primary transition-opacity duration-200 hover:opacity-80"
                                          aria-label={`Visit ${project?.title || "project"} website`}
                                        >
                                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                        </a>
                                      ) : null}
                                    </div>
                                  );
                                })}
                                {projectList.length > displayedProjects.length ? (
                                  <p className="text-xs font-medium text-primary/80">
                                    +{projectList.length - displayedProjects.length} more
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-white/45">
                                No projects added yet.
                              </p>
                            )}
                          </div>
                        </div>
                        </article>
                      );
                    })}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </div>

            {serviceSlides.length > 1 ? (
              <>
                <CarouselPrevious className="!-left-16 md:!-left-16 lg:!-left-18 z-10 size-11 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30" />
                <CarouselNext className="!-right-16 md:!-right-16 lg:!-right-18 z-10 size-11 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30" />
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
