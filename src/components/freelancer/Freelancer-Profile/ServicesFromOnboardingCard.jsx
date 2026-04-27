import Cpu from "lucide-react/dist/esm/icons/cpu";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import Plus from "lucide-react/dist/esm/icons/plus";
import { Card } from "@/components/ui/card";
import {
  PROJECT_TIMELINE_OPTIONS,
} from "@/components/features/freelancer/onboarding/constants";
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


const PROJECT_TIMELINE_LABELS = PROJECT_TIMELINE_OPTIONS.reduce(
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

const normalizeServiceIdentity = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const resolveProjectServiceKeys = (project = {}) => {
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
    acc.push(rawValue);
    return acc;
  }, []);
};

const projectMatchesService = (project = {}, serviceKey = "") => {
  const normalizedTarget = normalizeServiceIdentity(serviceKey);
  if (!normalizedTarget) return false;

  return resolveProjectServiceKeys(project).some(
    (value) => normalizeServiceIdentity(value) === normalizedTarget
  );
};

const resolveServiceCardCoverImage = (
  detail = {},
  projectList = [],
  resolveAvatarUrl
) => {
  const directCoverImage = resolveAvatarUrl(detail?.coverImage, { allowBlob: true });
  if (directCoverImage) {
    return directCoverImage;
  }

  for (const project of Array.isArray(projectList) ? projectList : []) {
    const projectCoverImage = resolveAvatarUrl(
      project?.image ||
        project?.imageUrl ||
        project?.thumbnail ||
        project?.coverImage ||
        project?.fileUrl,
      { allowBlob: true }
    );

    if (projectCoverImage) {
      return projectCoverImage;
    }
  }

  return "";
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
  openAddServiceModal,
}) => {
  const serviceSlides = chunkServices(onboardingServiceEntries, 1);

  return (
    <Card className="relative overflow-visible rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4 pb-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5 md:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary)), rgba(56,189,248,0.9), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
              Services From Onboarding
            </h3>
            <p className="text-sm text-muted-foreground">
              Service cards styled as polished profile showcases.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAddServiceModal}
          className="inline-flex h-10 w-full items-center justify-center gap-2 self-start rounded-md border border-primary/35 bg-primary/10 px-4 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/20 sm:w-auto sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add Service
        </button>
      </div>

      {onboardingServiceEntries.length > 0 ? (
        <div className="relative mt-5 sm:mt-6 sm:px-12 md:px-14 lg:px-16">
          <Carousel
            opts={{
              align: "start",
              loop: serviceSlides.length > 1,
            }}
            className="w-full"
          >
            <div className="overflow-hidden rounded-2xl">
              <CarouselContent className="ml-0 sm:-ml-4">
                {serviceSlides.map((slide, slideIndex) => (
                  <CarouselItem
                    key={`services-slide-${slideIndex}`}
                    className="basis-full pl-0 sm:pl-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
                      {slide.map(({ serviceKey, detail }) => {
                    const serviceTitle = getServiceLabel(serviceKey);
                    const serviceDescription = String(
                      detail?.serviceDescription || detail?.description || ""
                    ).trim();

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
                    const visibleTags = mergedUniqueTags.slice(0, 4);
                    const hiddenTagCount = Math.max(
                      0,
                      mergedUniqueTags.length - visibleTags.length
                    );

                    const linkedFeaturedProjects = (
                      Array.isArray(portfolioProjects) ? portfolioProjects : []
                    ).filter((project) => projectMatchesService(project, serviceKey));
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
                    const displayedProjects = projectList.slice(0, 4);
                    const serviceProfileCoverImage = resolveAvatarUrl(detail?.coverImage, {
                      allowBlob: true,
                    });
                    const serviceCoverImage = resolveServiceCardCoverImage(
                      detail,
                      projectList,
                      resolveAvatarUrl
                    );
                    const hasServiceProfileContent = Boolean(
                      serviceDescription || serviceProfileCoverImage
                    );

                    const metadataItems = [
                      {
                        label: "Delivery",
                        value:
                          PROJECT_TIMELINE_LABELS[
                            String(
                              detail?.deliveryTime ||
                                detail?.deliveryDays ||
                                detail?.caseStudy?.timeline ||
                                ""
                            )
                              .trim()
                              .toLowerCase()
                          ] ||
                          normalizeValueLabel(
                            detail?.deliveryTime ||
                              detail?.deliveryDays ||
                              detail?.caseStudy?.timeline
                          ) ||
                          "Not set",
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
                          className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] sm:rounded-2xl"
                        >
                        <div className="relative h-44 overflow-hidden sm:h-52 md:h-56">
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

                          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-3 p-3 sm:p-3.5 md:p-4">
                            <button
                              type="button"
                              onClick={() => openEditServiceProfileModal(serviceKey)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur-sm transition-colors duration-200 sm:px-3 sm:text-[11px]",
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

                        <div className="flex flex-1 flex-col space-y-2.5 px-3.5 pb-3 pt-3 sm:space-y-3 sm:px-4 sm:pb-4 sm:pt-3.5">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base md:text-lg">
                                {serviceTitle}
                              </h4>
                              <div className="mt-1 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:tracking-[0.16em]">
                                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.65)]" />
                                {normalizeValueLabel(detail?.experienceYears) ||
                                  "Experience not set"}
                              </div>
                            </div>
                          </div>

                          <p
                            className={cn(
                              "min-h-[4rem] max-h-[4rem] max-w-6xl overflow-hidden text-xs leading-5 sm:min-h-[4.5rem] sm:max-h-[4.5rem] sm:text-[13px] sm:leading-6",
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

                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2">
                            {metadataItems.map((item) => (
                              <div
                                key={`${serviceKey}-${item.label}`}
                                className="rounded-xl border border-white/6 bg-white/[0.035] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                              >
                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                                  {item.label}
                                </p>
                                <p className="mt-0.5 truncate text-[13px] font-semibold text-white sm:text-sm">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="min-h-[5rem] border-t border-white/6 pt-3 sm:min-h-[5.5rem]">
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
                                <span className="text-xs text-white/45 sm:text-sm">
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

                          <div className="mt-auto min-h-[7rem] border-t border-white/6 pt-3 sm:min-h-[7.75rem]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[13px] font-semibold text-white/78 sm:text-sm">
                                Featured Projects ({projectList.length})
                              </span>
                            </div>

                            {displayedProjects.length > 0 ? (
                              <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-2.5 min-[420px]:grid-cols-2 sm:grid-cols-[repeat(4,max-content)] sm:gap-x-6 sm:gap-y-3">
                                {displayedProjects.map((project, index) => {
                                  const projectHref = normalizeProjectHref(project);

                                  return (
                                    <div
                                      key={`${serviceKey}-project-${index}`}
                                      className="flex items-center gap-0"
                                    >
                                      <span className="truncate text-xs font-medium text-primary sm:text-sm">
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
                                  <p className="text-[11px] font-medium text-primary/80 sm:text-xs">
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
                <CarouselPrevious className="!left-2 !top-1/2 z-10 size-10 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30 sm:hidden" />
                <CarouselNext className="!right-2 !top-1/2 z-10 size-10 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30 sm:hidden" />
                <CarouselPrevious className="hidden sm:flex sm:!-left-12 sm:size-11 md:!-left-16 lg:!-left-18 z-10 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30" />
                <CarouselNext className="hidden sm:flex sm:!-right-12 sm:size-11 md:!-right-16 lg:!-right-18 z-10 border-primary/40 bg-background text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_12px_28px_rgba(0,0,0,0.18)] hover:scale-105 hover:bg-background hover:text-primary disabled:border-white/8 disabled:bg-white/5 disabled:text-white/30" />
              </>
            ) : null}
          </Carousel>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm text-muted-foreground">
            No service data from onboarding yet.
          </p>
          <button
            type="button"
            onClick={openAddServiceModal}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-4 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add your first service
          </button>
        </div>
      )}
    </Card>
  );
};

export default ServicesFromOnboardingCard;
