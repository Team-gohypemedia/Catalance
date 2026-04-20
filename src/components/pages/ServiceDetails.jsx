import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ImageIcon,
  Layers,
  MapPin,
  Quote,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/shared/context/AuthContext";
import { API_BASE_URL } from "@/shared/lib/api-client";
import MediaGallery from "./marketplace-details/MediaGallery";
import StickySidebar from "./marketplace-details/StickySidebar";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const toTitleCase = (value = "") =>
  normalizeText(value)
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const uniqueText = (values = []) => {
  const seen = new Set();
  const result = [];

  values.forEach((entry) => {
    const label = normalizeText(entry);
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(label);
  });

  return result;
};

const flattenTextValues = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenTextValues(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => flattenTextValues(entry));
  }

  if (typeof value === "string" || typeof value === "number") {
    const normalized = normalizeText(String(value));
    return normalized ? [normalized] : [];
  }

  return [];
};

const firstTextValue = (...values) => {
  for (const value of values) {
    const first = flattenTextValues(value)[0];
    if (first) return first;
  }
  return "";
};

const getCategoryGradient = (category) => {
  const gradients = [
    "from-emerald-500/30 to-teal-900/60",
    "from-blue-500/30 to-indigo-900/60",
    "from-purple-500/30 to-violet-900/60",
    "from-rose-500/30 to-red-900/60",
    "from-primary/30 to-zinc-900/60",
    "from-cyan-500/30 to-blue-900/60",
  ];

  const seed = normalizeText(category);
  if (!seed) return gradients[0];

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
};

const formatMemberSince = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

const formatReviewDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const formatDeliveryLabel = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "Not specified";
  return normalized.replace(/_/g, " ");
};

const formatMoney = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `Rs. ${numeric.toLocaleString("en-IN")}`;
  }
  return normalizeText(value) || "Not specified";
};

const normalizePortfolioItems = (serviceDetails = {}) => {
  const rawItems = [...asArray(serviceDetails.portfolio), ...asArray(serviceDetails.projects)];

  return rawItems
    .map((entry, index) => {
      if (typeof entry === "string") {
        const text = normalizeText(entry);
        if (!text) return null;
        const isUrl = /^https?:\/\//i.test(text);

        return {
          id: `portfolio-${index}`,
          title: `Project ${index + 1}`,
          description: "",
          imageUrl: isUrl ? text : null,
          link: isUrl ? text : null,
          role: "",
          timeline: "",
          budget: "",
        };
      }

      const item = asObject(entry);
      return {
        id: item.id || `portfolio-${index}`,
        title: firstTextValue(item.title, item.name, `Project ${index + 1}`),
        description: firstTextValue(item.description, item.summary, item.readme),
        imageUrl: firstTextValue(
          item.imageUrl,
          item.image,
          item.coverImage,
          item.thumbnail,
          item.fileUrl
        ),
        link: firstTextValue(item.link, item.url, item.href),
        role: firstTextValue(item.role),
        timeline: firstTextValue(item.timeline, item.duration),
        budget: firstTextValue(item.budget, item.budgetRange),
      };
    })
    .filter(Boolean);
};

const normalizeImages = (serviceDetails = {}, portfolioItems = []) => {
  const imageCandidates = [
    serviceDetails.coverImage,
    serviceDetails.image,
    serviceDetails.thumbnail,
    ...asArray(serviceDetails.images),
    ...asArray(serviceDetails.gallery),
    ...asArray(serviceDetails.media),
    ...asArray(serviceDetails.serviceMedia),
    ...portfolioItems.map((item) => item.imageUrl),
  ];

  return uniqueText(imageCandidates.filter((entry) => /^https?:\/\//i.test(String(entry || ""))));
};

const normalizeDeliverables = (serviceDetails = {}) =>
  uniqueText([
    ...flattenTextValues(serviceDetails.deliverables),
    ...flattenTextValues(serviceDetails.whatsIncluded),
    ...flattenTextValues(serviceDetails.includes),
    ...flattenTextValues(serviceDetails.features),
  ]);

const normalizeSkillCategories = (service = {}, serviceDetails = {}) => {
  const groups = asObject(serviceDetails.groups);

  return uniqueText([
    firstTextValue(serviceDetails.categoryLabel, serviceDetails.category),
    toTitleCase(service.serviceKey || ""),
    ...Object.keys(groups).map((key) => toTitleCase(key)),
    ...flattenTextValues(serviceDetails.niches),
  ]).slice(0, 12);
};

const normalizeSkills = (serviceDetails = {}, freelancerProfile = {}) =>
  uniqueText([
    ...flattenTextValues(serviceDetails.tools),
    ...flattenTextValues(serviceDetails.techStack),
    ...flattenTextValues(serviceDetails.technologies),
    ...flattenTextValues(serviceDetails.stack),
    ...flattenTextValues(serviceDetails.skillsAndTechnologies),
    ...flattenTextValues(serviceDetails.serviceSpecializations),
    ...flattenTextValues(asObject(serviceDetails.caseStudy).techStack),
    ...flattenTextValues(freelancerProfile.skills),
  ]).slice(0, 24);

const buildWhyChooseItems = (serviceDetails = {}, freelancerProfile = {}, deliverables = []) => {
  const caseStudy = asObject(serviceDetails.caseStudy);
  const experienceYears = Number(freelancerProfile.experienceYears || 0);
  const caseStudyGoal = firstTextValue(caseStudy.goal);
  const caseStudyResults = firstTextValue(caseStudy.results);
  const hasSampleWork = normalizeText(serviceDetails.hasSampleWork || "").toLowerCase() === "yes";

  return uniqueText([
    ...deliverables,
    caseStudyGoal ? `Case-study goal: ${caseStudyGoal}` : "",
    caseStudyResults ? `Case-study result: ${caseStudyResults}` : "",
    experienceYears > 0 ? `${experienceYears}+ years of service experience` : "",
    hasSampleWork ? "Sample work available for this service" : "",
  ]).slice(0, 6);
};

const buildReviewStats = (reviews = [], fallbackAverage = 0, fallbackCount = 0) => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach((review) => {
    const rating = Math.min(5, Math.max(1, Number(review.rating || 0)));
    if (counts[rating] !== undefined) counts[rating] += 1;
  });

  const total = reviews.length || Number(fallbackCount || 0);
  const average =
    reviews.length > 0
      ? Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1))
      : Number(fallbackAverage || 0);

  return {
    total,
    average,
    counts,
  };
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto min-h-screen max-w-[1200px] px-4 py-8 pt-24 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-4 w-48 rounded-full" />
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-48 rounded-full" />
          </div>
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <div className="hidden w-[330px] shrink-0 space-y-4 lg:block">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const ServiceDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchService = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/marketplace/${id}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Service not found");

        const payload = await response.json();
        setService(payload.data || null);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setService(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchService();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/marketplace/${id}/reviews?limit=25`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const payload = await response.json();
        setReviews(asArray(payload.data));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setReviews([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setReviewsLoading(false);
        }
      }
    };

    fetchReviews();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let updated = false;

    if (isAuthenticated && params.get("openMessage") === "1" && service) {
      setChatModalOpen(true);
      params.delete("openMessage");
      updated = true;
    }

    if (updated) {
      const nextUrl = [location.pathname, params.toString() ? `?${params}` : ""].join("");
      window.history.replaceState({}, "", nextUrl);
    }
  }, [isAuthenticated, location.pathname, location.search, service]);

  useEffect(() => {
    if (!service) return undefined;

    const title = firstTextValue(service.service, "Service");
    document.title = `${title} | Catalance Marketplace`;

    const serviceDetails = asObject(service.serviceDetails);
    const description = firstTextValue(
      serviceDetails.description,
      serviceDetails.serviceDescription,
      serviceDetails.bio
    );
    const metaText =
      normalizeText(description).slice(0, 155) ||
      `Hire a verified freelancer for ${title} on Catalance Marketplace.`;

    let metaTag = document.querySelector('meta[name="description"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "description";
      document.head.appendChild(metaTag);
    }
    metaTag.content = metaText;

    return () => {
      document.title = "Catalance";
    };
  }, [service]);

  const handleLoginRequired = () => {
    const returnPath = location.pathname;
    navigate(`/login?redirect=${encodeURIComponent(returnPath)}&openMessage=1`);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const normalized = useMemo(() => {
    if (!service) return null;

    const serviceDetails = asObject(service.serviceDetails);
    const freelancer = asObject(service.freelancer);
    const freelancerProfile = asObject(freelancer.freelancerProfile);
    const caseStudy = asObject(serviceDetails.caseStudy);

    const portfolioItems = normalizePortfolioItems(serviceDetails);
    const images = normalizeImages(serviceDetails, portfolioItems);
    const deliverables = normalizeDeliverables(serviceDetails);
    const skillCategories = normalizeSkillCategories(service, serviceDetails);
    const skills = normalizeSkills(serviceDetails, freelancerProfile);
    const whyChooseItems = buildWhyChooseItems(serviceDetails, freelancerProfile, deliverables);

    const categoryLabel = firstTextValue(
      serviceDetails.categoryLabel,
      serviceDetails.category,
      toTitleCase(service.serviceKey || "")
    );
    const serviceName = firstTextValue(service.service, "Untitled Service");
    const description = firstTextValue(
      serviceDetails.description,
      serviceDetails.serviceDescription,
      serviceDetails.bio,
      service.bio
    );

    const deliveryLabel = formatDeliveryLabel(serviceDetails.deliveryTime);
    const categoryGradient = getCategoryGradient(service.serviceKey || categoryLabel);
    const rating = Number(service.averageRating || 0);
    const reviewCount = Number(service.reviewCount || 0);

    const caseStudySummary = {
      projectTitle: firstTextValue(caseStudy.projectTitle, caseStudy.title, portfolioItems[0]?.title),
      goal: firstTextValue(caseStudy.goal, portfolioItems[0]?.description),
      results: firstTextValue(caseStudy.results),
      timeline: firstTextValue(caseStudy.timeline, portfolioItems[0]?.timeline),
      budgetRange: firstTextValue(caseStudy.budgetRange, portfolioItems[0]?.budget),
      techStack: uniqueText(flattenTextValues(caseStudy.techStack)).slice(0, 5),
    };

    return {
      serviceName,
      categoryLabel,
      categoryGradient,
      description,
      shortDescription: description.slice(0, 140) || "Professional freelance service with structured delivery.",
      images,
      skillCategories,
      skills,
      whyChooseItems,
      deliveryLabel,
      rating,
      reviewCount,
      caseStudy: caseStudySummary,
      featuredProject: portfolioItems[0] || null,
      recentProjects: portfolioItems.slice(1, 8),
      portfolioItems,
      freelancer: {
        id: firstTextValue(freelancer.id),
        name: firstTextValue(freelancer.fullName, "Anonymous Freelancer"),
        avatar: firstTextValue(freelancer.avatar),
        isVerified: Boolean(freelancer.isVerified),
        bio: firstTextValue(freelancerProfile.bio, freelancerProfile.professionalBio),
        title: firstTextValue(freelancerProfile.jobTitle, freelancerProfile.professionalTitle),
        location: firstTextValue(
          freelancerProfile.location,
          freelancerProfile.city,
          freelancerProfile.country
        ),
        experienceYears: Number(freelancerProfile.experienceYears || 0),
        memberSince: formatMemberSince(freelancerProfile.createdAt),
      },
    };
  }, [service]);

  const reviewStats = useMemo(
    () => buildReviewStats(reviews, normalized?.rating || 0, normalized?.reviewCount || 0),
    [reviews, normalized?.rating, normalized?.reviewCount]
  );

  const featuredReview = reviews[0] || null;
  const freelancerInitial = normalized?.freelancer?.name?.charAt(0).toUpperCase() || "F";

  if (loading) return <LoadingSkeleton />;

  if (!service || !normalized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-32 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/40">
            <Layers className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Service Not Found</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            This service may have been removed or no longer exists.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative mx-auto min-h-screen max-w-[1200px] px-4 py-8 pt-24 sm:px-6 lg:px-8">
        {shareToast ? (
          <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg">
            Link copied to clipboard
          </div>
        ) : null}

        <div className="flex flex-col gap-8 overflow-visible lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            <header className="space-y-3">
              {normalized.categoryLabel ? (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8f8f95]">
                  {normalized.categoryLabel}
                </p>
              ) : null}

              <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
                {normalized.serviceName}
              </h1>

              <p className="max-w-3xl text-sm leading-7 text-[#a1a1aa]">{normalized.shortDescription}</p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2.5">
                  {normalized.freelancer.avatar ? (
                    <img
                      src={normalized.freelancer.avatar}
                      alt={normalized.freelancer.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#27272a]">
                      <span className="text-xs font-bold text-[#a1a1aa]">{freelancerInitial}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white">{normalized.freelancer.name}</p>
                    {normalized.freelancer.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-[#d4d4d8]">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-semibold">{reviewStats.average > 0 ? reviewStats.average : "New"}</span>
                  <span className="text-[#8f8f95]">({reviewStats.total} reviews)</span>
                </div>
              </div>
            </header>

            <div className="block lg:hidden" role="complementary" aria-label="Service pricing and contact">
              <StickySidebar
                service={service}
                isAuthenticated={isAuthenticated}
                onLoginRequired={handleLoginRequired}
                modalOpen={chatModalOpen}
                onModalOpenChange={setChatModalOpen}
              />
            </div>

            <MediaGallery
              images={normalized.images}
              serviceName={normalized.serviceName}
              categoryGradient={normalized.categoryGradient}
              categoryLabel={normalized.categoryLabel}
            />

            <section className="space-y-4 rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <h2 className="text-xl font-bold text-white">Skills Category</h2>
              {normalized.skillCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {normalized.skillCategories.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-[#8f8f95]">No skill categories available.</p>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <h2 className="text-xl font-bold text-white">Skills</h2>
              {normalized.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {normalized.skills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#d4d4d8]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-[#8f8f95]">No skills provided yet.</p>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <h2 className="text-3xl font-bold text-white">About This Service</h2>

              <p className="whitespace-pre-wrap text-sm leading-7 text-[#d4d4d8]">
                {normalized.description || "Service description is not available yet."}
              </p>

              <div className="space-y-2 pt-1">
                <h3 className="text-2xl font-bold text-white">Why Choose Me</h3>
                {normalized.whyChooseItems.length > 0 ? (
                  <ul className="space-y-2.5">
                    {normalized.whyChooseItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-[#e4e4e7]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-[#8f8f95]">Highlights are not available yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <h2 className="text-3xl font-bold text-white">Get to know the seller</h2>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#151519] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {normalized.freelancer.avatar ? (
                      <img
                        src={normalized.freelancer.avatar}
                        alt={normalized.freelancer.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#27272a] text-lg font-bold text-[#a1a1aa]">
                        {freelancerInitial}
                      </div>
                    )}

                    <div>
                      <p className="text-base font-bold text-white">{normalized.freelancer.name}</p>
                      {normalized.freelancer.title ? (
                        <p className="text-xs text-[#a1a1aa]">{normalized.freelancer.title}</p>
                      ) : null}
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="font-semibold">{reviewStats.average > 0 ? reviewStats.average : "New"}</span>
                        <span className="text-[#8f8f95]">({reviewStats.total} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-black hover:bg-primary/90"
                    onClick={() => setChatModalOpen(true)}
                  >
                    Contact Me
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8f95]">From</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {normalized.freelancer.location || "Remote"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8f95]">Member Since</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {normalized.freelancer.memberSince}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8f95]">Experience</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
                      {normalized.freelancer.experienceYears > 0
                        ? `${normalized.freelancer.experienceYears}+ years`
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8f95]">Delivery Timeline</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                      <Clock3 className="h-3.5 w-3.5 text-primary" />
                      {normalized.deliveryLabel}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/30 p-3.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8f95]">About me</p>
                  <p className="mt-2 text-sm leading-7 text-[#d4d4d8]">
                    {normalized.freelancer.bio || "Freelancer bio is not available yet."}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">What people loved about this freelancer</h2>
                <div className="flex items-center gap-2 text-xs text-[#8f8f95]">
                  <span>{reviewStats.total} reviews</span>
                  <button type="button" className="rounded-full border border-white/10 p-1.5 text-[#a1a1aa]">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded-full border border-white/10 p-1.5 text-[#a1a1aa]">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {featuredReview ? (
                <article className="rounded-xl border border-white/10 bg-[#17171c] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/90 text-xs font-semibold text-white">
                        {(featuredReview.clientName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{featuredReview.clientName || "Client"}</p>
                        <p className="text-[11px] text-[#8f8f95]">{formatReviewDate(featuredReview.createdAt)}</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="text-sm font-semibold text-white">{Number(featuredReview.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#d4d4d8]">
                    {featuredReview.comment || "No review comment available."}
                  </p>
                </article>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#17171c] p-6 text-center text-sm text-[#8f8f95]">
                  {reviewsLoading ? "Loading reviews..." : "No reviews yet for this service."}
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <h2 className="text-3xl font-bold text-white">My Portfolio</h2>

              {normalized.featuredProject || normalized.caseStudy.projectTitle ? (
                <article className="rounded-2xl border border-white/10 bg-[#17171c] p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111113]">
                      {normalized.featuredProject?.imageUrl ? (
                        <img
                          src={normalized.featuredProject.imageUrl}
                          alt={normalized.featuredProject.title}
                          className="h-full min-h-[220px] w-full object-cover"
                        />
                      ) : (
                        <div className="flex min-h-[220px] w-full items-center justify-center text-[#6b6b72]">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8f8f95]">
                        From {normalized.freelancer.memberSince}
                      </p>
                      <h3 className="text-2xl font-bold leading-tight text-white">
                        {normalized.caseStudy.projectTitle || normalized.featuredProject?.title || "Case Study"}
                      </h3>
                      <p className="line-clamp-4 text-sm leading-7 text-[#c4c4cc]">
                        {normalized.caseStudy.goal ||
                          normalized.featuredProject?.description ||
                          "Project details are available on request."}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {normalized.caseStudy.timeline ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#d4d4d8]">
                            {normalized.caseStudy.timeline}
                          </span>
                        ) : null}
                        {normalized.caseStudy.budgetRange ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#d4d4d8]">
                            {formatMoney(normalized.caseStudy.budgetRange)}
                          </span>
                        ) : null}
                        {normalized.caseStudy.techStack.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#d4d4d8]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      {normalized.featuredProject?.link ? (
                        <a
                          href={normalized.featuredProject.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-black hover:bg-primary/90"
                        >
                          View Case Study
                        </a>
                      ) : (
                        <Button
                          type="button"
                          className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-black hover:bg-primary/90"
                          onClick={handleShare}
                        >
                          Share Service
                        </Button>
                      )}
                    </div>
                  </div>

                  {normalized.recentProjects.length > 0 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8f8f95]">Recent Projects</p>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {normalized.recentProjects.slice(0, 6).map((item) => (
                          <article
                            key={item.id}
                            className="group overflow-hidden rounded-lg border border-white/10 bg-[#111113]"
                          >
                            <div className="aspect-square">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#6b6b72]">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-[#17171c] p-6 text-center text-sm text-[#8f8f95]">
                  No portfolio projects added yet.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/8 bg-[#111113] p-4 md:p-5">
              <h2 className="text-3xl font-bold text-white">Reviews</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className="rounded-xl border border-white/10 bg-[#17171c] p-4">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.counts[rating] || 0;
                    const percentage = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
                    return (
                      <div key={rating} className="mb-2 flex items-center gap-2 text-xs">
                        <span className="w-10 text-[#a1a1aa]">{rating} Star</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[#a1a1aa]">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-[#17171c] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#d4d4d8]">Rating Breakdown</span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {reviewStats.average > 0 ? reviewStats.average.toFixed(1) : "0.0"}
                    </span>
                  </div>
                  {[
                    { label: "Seller communication", value: reviewStats.average || 0 },
                    { label: "Quality of delivery", value: reviewStats.average || 0 },
                    { label: "Value of delivery", value: reviewStats.average || 0 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-[#a1a1aa]">{item.label}</span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {item.value > 0 ? Number(item.value).toFixed(1) : "0.0"}
                      </span>
                    </div>
                  ))}
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-[#8f8f95]">
                    {reviewStats.total > 0
                      ? `${reviewStats.total} verified review${reviewStats.total > 1 ? "s" : ""}`
                      : "No reviews yet. Be the first to rate this service."}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside
            className="hidden w-[330px] shrink-0 self-start lg:sticky lg:top-24 lg:block"
            role="complementary"
            aria-label="Service pricing and contact"
          >
            <div className="lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <StickySidebar
                service={service}
                isAuthenticated={isAuthenticated}
                onLoginRequired={handleLoginRequired}
                modalOpen={chatModalOpen}
                onModalOpenChange={setChatModalOpen}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
