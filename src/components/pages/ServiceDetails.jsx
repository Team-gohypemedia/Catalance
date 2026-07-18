import { useEffect, useMemo, useState, memo } from "react";
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
  Star,
  Check,
  X,
  Users,
  ExternalLink,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useAuth } from "@/shared/context/AuthContext";
import { API_BASE_URL } from "@/shared/lib/api-client";
import MediaGallery from "./marketplace-details/MediaGallery";
import StickySidebar from "./marketplace-details/StickySidebarLive";
import { readMarketplaceChatRequests } from "@/shared/lib/marketplace-chat-requests";
import cataLogo from "@/assets/logos/logo.svg";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const parseBooleanFlag = (value) => {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;
  if (typeof value === "number") return value === 1;

  const normalized = normalizeText(String(value)).toLowerCase();
  if (!normalized) return false;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return false;
};

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

const formatDisplayLabel = (value) => {
  if (!value) return "";
  let str = String(value).replace(/_plus_/gi, "+ ");
  str = str.replace(/[_-]/g, " ");
  return str.split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatMoney = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `Rs. ${numeric.toLocaleString("en-IN")}`;
  }
  return normalizeText(value) || "Not specified";
};

const normalizePortfolioItems = (serviceDetails = {}, serviceKey = "") => {
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
          niche: "",
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
        niche: firstTextValue(item.niche, item.category, item.serviceKey),
      };
    })
    .filter(Boolean)
    .filter((project) => {
      if (!serviceKey || !project.niche) return true;
      const sk = serviceKey.toLowerCase();
      const n = project.niche.toLowerCase();
      if (sk === n || n.includes(sk) || sk.includes(n)) return true;
      if (sk.includes("web") && n.includes("web")) return true;
      if (sk.includes("app") && n.includes("app")) return true;
      
      const skWords = sk.split(/[\s_-]+/).filter(w => w.length > 2);
      const nWords = n.split(/[\s_-]+/).filter(w => w.length > 2);
      return skWords.some(w => nWords.includes(w)) || nWords.some(w => skWords.includes(w));
    })
    .filter((project, index, self) => 
      index === self.findIndex((p) => 
        (p.id !== undefined && p.id === project.id && !p.id.startsWith('portfolio-')) || 
        (p.title === project.title && p.imageUrl === project.imageUrl)
      )
    );
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

const normalizeDeliverables = (serviceDetails = {}) => {
  const groups = asObject(serviceDetails.groups);
  const groupOther = asObject(serviceDetails.groupOther);

  return uniqueText([
    ...flattenTextValues(serviceDetails.deliverables),
    ...flattenTextValues(serviceDetails.whatsIncluded),
    ...flattenTextValues(serviceDetails.includes),
    ...flattenTextValues(serviceDetails.features),
    ...flattenTextValues(serviceDetails.scopeOfWork),
    ...flattenTextValues(serviceDetails.scope),
    ...flattenTextValues(serviceDetails.serviceSpecializations),
    ...flattenTextValues(serviceDetails.niches),
    ...Object.entries(groups).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey) ? [] : flattenTextValues(values)
    ),
    ...Object.entries(groupOther).flatMap(([groupKey, values]) =>
      /tech|tool|stack|platform/i.test(groupKey) ? [] : flattenTextValues(values)
    ),
  ]);
};

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
    ...flattenTextValues(serviceDetails.serviceTools),
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

const CaseStudyModal = memo(({ caseStudy, isOpen, onClose }) => {
  if (!caseStudy) return null;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border dark:bg-[#111113] dark:border-white/10 sm:rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>{caseStudy.title}</DialogTitle>
          <DialogDescription>{caseStudy.description || "Case study details"}</DialogDescription>
        </DialogHeader>
        
        {caseStudy.imageUrl && (
          <div className="relative w-full h-48 sm:h-64 shrink-0 bg-muted/20">
            <img 
              src={caseStudy.imageUrl} 
              alt={caseStudy.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
          </div>
        )}
        
        <div className="px-6 pb-6 pt-4 space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-white mb-2">
              {caseStudy.title || "Untitled Project"}
            </h2>
            <p className="text-base leading-relaxed text-foreground/80 dark:text-[#c4c4cc]">
              {caseStudy.description || "No detailed description provided for this case study."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-[#17171c]/50">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Niche</div>
              <div className="mt-1 font-medium text-sm text-foreground dark:text-[#d4d4d8]">
                {caseStudy.niche ? formatDisplayLabel(caseStudy.niche) : "Not specified"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-[#17171c]/50">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Role</div>
              <div className="mt-1 font-medium text-sm text-foreground dark:text-[#d4d4d8]">
                {caseStudy.role ? formatDisplayLabel(caseStudy.role) : "Not specified"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-[#17171c]/50">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Timeline</div>
              <div className="mt-1 font-medium text-sm text-foreground dark:text-[#d4d4d8]">
                {caseStudy.timeline ? formatDisplayLabel(caseStudy.timeline) : "Not specified"}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-[#17171c]/50">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Budget</div>
              <div className="mt-1 font-medium text-sm text-foreground dark:text-[#d4d4d8]">
                {caseStudy.budget ? formatMoney(caseStudy.budget) : "Not specified"}
              </div>
            </div>
          </div>
          
          {caseStudy.link && (
            <div className="pt-4 border-t border-border dark:border-white/10 flex justify-end">
              <a 
                href={caseStudy.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
              >
                Visit Project
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
CaseStudyModal.displayName = "CaseStudyModal";

const ServiceDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const marketplaceReturnTo = useMemo(() => {
    const routeState =
      location.state && typeof location.state === "object" ? location.state : {};
    const candidate = String(routeState.marketplaceReturnTo || "").trim();
    if (candidate.startsWith("/marketplace")) {
      return candidate;
    }
    return "/marketplace";
  }, [location.state]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchService = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/marketplace/${encodeURIComponent(id)}`, {
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
        const response = await fetch(`${API_BASE_URL}/marketplace/${encodeURIComponent(id)}/reviews?limit=25`, {
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
    navigate(`/signin/phone?redirect=${encodeURIComponent(returnPath)}&openMessage=1`);
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

    const portfolioItems = normalizePortfolioItems(serviceDetails, service.serviceKey || "");
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
      niche: firstTextValue(caseStudy.niche, caseStudy.category, portfolioItems[0]?.niche),
      role: firstTextValue(caseStudy.role, portfolioItems[0]?.role),
    };

    const freelancerProfileDetails = asObject(freelancerProfile.profileDetails);
    const freelancerIdentity = asObject(freelancerProfileDetails.identity);

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
        isVerified: parseBooleanFlag(freelancer.isVerified),
        bio: firstTextValue(freelancerProfile.bio, freelancerProfile.professionalBio),
        title: firstTextValue(
          freelancerProfile.jobTitle,
          freelancerIdentity.professionalTitle,
          freelancerProfile.professionalTitle
        ),
        location: firstTextValue(
          freelancerProfile.location,
          freelancerIdentity.city,
          freelancerIdentity.country,
          freelancerProfile.city,
          freelancerProfile.country
        ),
        experienceYears: Number(freelancerProfile.experienceYears || serviceDetails.experienceYears || 0),
        experienceLevel: firstTextValue(
          serviceDetails.experienceLevel, 
          serviceDetails.workingLevel, 
          freelancerProfile.experienceLevel,
          freelancerProfile.workingLevel,
          freelancer.experienceLevel
        ),
        memberSince: formatMemberSince(freelancerProfile.createdAt),
      },
    };
  }, [service]);

  const reviewStats = useMemo(
    () => buildReviewStats(reviews, normalized?.rating || 0, normalized?.reviewCount || 0),
    [reviews, normalized?.rating, normalized?.reviewCount]
  );

  const hasExistingRequest = useMemo(() => {
    if (!user?.id || !normalized?.freelancer?.id || !service?.id) return false;
    const requests = readMarketplaceChatRequests();
    return requests.some(
      (req) =>
        String(req.clientId) === String(user.id) &&
        String(req.freelancerId) === String(normalized.freelancer.id) &&
        String(req.serviceId) === String(service.id)
    );
  }, [user?.id, normalized?.freelancer?.id, service?.id]);

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
            <Link to={marketplaceReturnTo}>Back to Marketplace</Link>
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
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {normalized.categoryLabel}
                </p>
              ) : null}

              <h1 className="text-4xl font-extrabold tracking-tight text-foreground dark:text-white lg:text-5xl">
                {normalized.serviceName}
              </h1>

              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {isDescriptionExpanded 
                  ? normalized.description 
                  : (normalized.description?.length > 140 
                      ? normalized.description.slice(0, 140).trim() + "..." 
                      : normalized.description)}
                {normalized.description?.length > 140 && (
                  <button 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="ml-2 font-semibold text-primary hover:underline"
                  >
                    {isDescriptionExpanded ? "Show Less" : "Read More"}
                  </button>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2.5">
                  {normalized.freelancer.avatar ? (
                    <img
                      src={normalized.freelancer.avatar}
                      alt={normalized.freelancer.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs font-bold text-muted-foreground">{freelancerInitial}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground dark:text-white">{normalized.freelancer.name}</p>
                    {normalized.freelancer.isVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                        <BadgeCheck className="h-3 w-3 keep-white verified-badge-custom-stroke" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:text-[#d4d4d8]">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-semibold">{reviewStats.average > 0 ? reviewStats.average : "New"}</span>
                  <span className="text-muted-foreground">({reviewStats.total} reviews)</span>
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

            <section className="space-y-4 rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Skills Category</h2>
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

            <section className="space-y-4 rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Skills</h2>
              {normalized.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {normalized.skills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:text-[#d4d4d8]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground dark:text-[#8f8f95]">No skills provided yet.</p>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
              <h2 className="text-3xl font-bold text-foreground dark:text-white">About This Service</h2>

              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80 dark:text-[#d4d4d8]">
                {normalized.description || "Service description is not available yet."}
              </p>

              <div className="space-y-2 pt-1">
                <h3 className="text-2xl font-bold text-foreground dark:text-white">Why Choose Me</h3>
                {normalized.whyChooseItems.length > 0 ? (
                  <ul className="space-y-2.5">
                    {normalized.whyChooseItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90 dark:text-[#e4e4e7]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-muted-foreground dark:text-[#8f8f95]">Highlights are not available yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
              <h2 className="text-3xl font-bold text-foreground dark:text-white">Get to know the seller</h2>

              <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-[#151519]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {normalized.freelancer.avatar ? (
                      <img
                        src={normalized.freelancer.avatar}
                        alt={normalized.freelancer.name}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground dark:bg-[#27272a] dark:text-[#a1a1aa]">
                        {freelancerInitial}
                      </div>
                    )}

                    <div>
                      <p className="text-base font-bold text-foreground dark:text-white">{normalized.freelancer.name}</p>
                      {normalized.freelancer.title ? (
                        <p className="text-xs text-muted-foreground dark:text-[#a1a1aa]">{normalized.freelancer.title}</p>
                      ) : null}
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="font-semibold">{reviewStats.average > 0 ? reviewStats.average : "New"}</span>
                        <span className="text-muted-foreground dark:text-[#8f8f95]">({reviewStats.total} reviews)</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-3 dark:border-white/10 dark:bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-[#8f8f95]">From</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground dark:text-white">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {normalized.freelancer.location || "Remote"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3 dark:border-white/10 dark:bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-[#8f8f95]">Member Since</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground dark:text-white">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      {normalized.freelancer.memberSince}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3 dark:border-white/10 dark:bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-[#8f8f95]">Experience</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground dark:text-white">
                      <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
                      {(() => {
                        const level = normalized.freelancer.experienceLevel?.toLowerCase();
                        const labels = {
                          entry: "Entry Level (0-1 years)",
                          intermediate: "Intermediate (1-3 years)",
                          experienced: "Experienced (3-5 years)",
                          expert: "Expert (5-10 years)",
                          veteran: "Veteran (10+ years)",
                        };
                        if (level && labels[level]) return labels[level];
                        if (normalized.freelancer.experienceLevel) return normalized.freelancer.experienceLevel;
                        if (normalized.freelancer.experienceYears > 0) return `${normalized.freelancer.experienceYears}+ years`;
                        return "Not specified";
                      })()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3 dark:border-white/10 dark:bg-black/30">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-[#8f8f95]">Delivery Timeline</p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground dark:text-white">
                      <Clock3 className="h-3.5 w-3.5 text-primary" />
                      {normalized.deliveryLabel}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-3.5 dark:border-white/10 dark:bg-black/30">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground dark:text-[#8f8f95]">About me</p>
                  <p className="mt-2 text-sm leading-7 text-foreground/80 dark:text-[#d4d4d8]">
                    {normalized.freelancer.bio || "Freelancer bio is not available yet."}
                  </p>
                </div>
              </div>
            </section>

            {(reviewStats.total > 0 || reviewsLoading) && (
              <section className="space-y-4 rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">What people loved about this freelancer</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-[#8f8f95]">
                    <span>{reviewStats.total} reviews</span>
                    <button type="button" className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-muted dark:border-white/10 dark:text-[#a1a1aa]">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="rounded-full border border-border p-1.5 text-muted-foreground hover:bg-muted dark:border-white/10 dark:text-[#a1a1aa]">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {featuredReview ? (
                  <article className="rounded-xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-[#17171c]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/90 text-xs font-semibold text-white">
                          {(featuredReview.clientName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground dark:text-white">{featuredReview.clientName || "Client"}</p>
                          <p className="text-[11px] text-muted-foreground dark:text-[#8f8f95]">{formatReviewDate(featuredReview.createdAt)}</p>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-semibold text-foreground dark:text-white">{Number(featuredReview.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-foreground/80 dark:text-[#d4d4d8]">
                      {featuredReview.comment || "No review comment available."}
                    </p>
                  </article>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-[#17171c] dark:text-[#8f8f95]">
                    {reviewsLoading ? "Loading reviews..." : "No reviews yet for this service."}
                  </div>
                )}
              </section>
            )}

            <section className="space-y-4 rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
              <h2 className="text-3xl font-bold text-foreground dark:text-white">My Portfolio</h2>

              {normalized.portfolioItems?.length > 0 || normalized.caseStudy?.projectTitle ? (
                <div className="relative w-full px-2 sm:px-10">
                  <Carousel className="w-full" opts={{ loop: true }}>
                    <CarouselContent>
                      {(normalized.portfolioItems?.length > 0
                        ? normalized.portfolioItems
                        : [
                            {
                              id: "case-study-legacy",
                              title: normalized.caseStudy.projectTitle,
                              description: normalized.caseStudy.goal,
                              timeline: normalized.caseStudy.timeline,
                              budget: normalized.caseStudy.budgetRange,
                              imageUrl: null,
                              link: null,
                            },
                          ]
                      ).map((project, idx) => (
                        <CarouselItem key={project.id || idx}>
                          <article
                            className="h-full rounded-2xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-[#17171c]"
                          >
                            <div className="grid h-full gap-4 lg:grid-cols-[1.1fr_1fr]">
                              <div className="overflow-hidden rounded-xl border border-border bg-background dark:border-white/10 dark:bg-[#111113]">
                                {project.imageUrl ? (
                                  <img
                                    src={project.imageUrl}
                                    alt={project.title}
                                    className="h-full min-h-[220px] w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex min-h-[220px] h-full w-full items-center justify-center bg-muted/20 text-6xl font-bold uppercase text-muted-foreground/30 dark:bg-white/5 dark:text-white/10">
                                    {project.title ? project.title.charAt(0) : <ImageIcon className="h-8 w-8" />}
                                  </div>
                                )}
                              </div>

                              <div className="flex h-full flex-col space-y-3">

                                <h3 className="line-clamp-2 text-2xl font-bold leading-tight text-foreground dark:text-white" title={project.title}>
                                  {project.title || `Case Study ${idx + 1}`}
                               </h3>
                                <p className="line-clamp-2 text-sm leading-7 text-foreground/80 dark:text-[#c4c4cc]">
                                  {project.description || "Project details are available on request."}
                                </p>

                                {(() => {
                                  const isLegacy = project.title === normalized.caseStudy?.projectTitle || idx === 0;
                                  
                                  const rawNiche = project.niche || (isLegacy ? normalized.caseStudy?.niche : "");
                                  const displayNiche = rawNiche ? formatDisplayLabel(rawNiche) : "Not specified";
                                  
                                  const rawRole = project.role || (isLegacy ? normalized.caseStudy?.role : "");
                                  const displayRole = rawRole ? formatDisplayLabel(rawRole) : "Not specified";
                                  
                                  const rawTimeline = project.timeline || (isLegacy ? normalized.caseStudy?.timeline : "");
                                  const displayTimeline = rawTimeline ? formatDisplayLabel(rawTimeline) : "Not specified";
                                  
                                  const rawBudget = project.budget || (isLegacy ? normalized.caseStudy?.budgetRange : "");
                                  const displayBudget = rawBudget ? formatMoney(rawBudget) : "Not specified";
                                  
                                  const fullProjectData = {
                                    ...project,
                                    niche: rawNiche,
                                    role: rawRole,
                                    timeline: rawTimeline,
                                    budget: rawBudget,
                                  };

                                  return (
                                    <>
                                      <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-border bg-background/50 p-3 dark:border-white/10 dark:bg-[#17171c]/50">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Niche</div>
                                          <div className="mt-1 truncate text-xs font-medium text-foreground dark:text-[#d4d4d8]">{displayNiche}</div>
                                        </div>
                                        <div className="rounded-xl border border-border bg-background/50 p-3 dark:border-white/10 dark:bg-[#17171c]/50">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Role</div>
                                          <div className="mt-1 truncate text-xs font-medium text-foreground dark:text-[#d4d4d8]">{displayRole}</div>
                                        </div>
                                        <div className="rounded-xl border border-border bg-background/50 p-3 dark:border-white/10 dark:bg-[#17171c]/50">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Timeline</div>
                                          <div className="mt-1 truncate text-xs font-medium text-foreground dark:text-[#d4d4d8]">{displayTimeline}</div>
                                        </div>
                                        <div className="rounded-xl border border-border bg-background/50 p-3 dark:border-white/10 dark:bg-[#17171c]/50">
                                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-[#8f8f95]">Budget</div>
                                          <div className="mt-1 truncate text-xs font-medium text-foreground dark:text-[#d4d4d8]">{displayBudget}</div>
                                        </div>
                                      </div>

                                      {isLegacy && normalized.caseStudy?.techStack?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                          {normalized.caseStudy.techStack.map((item) => (
                                            <span
                                              key={item}
                                              className="rounded-full border border-border bg-background px-2.5 py-1 text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:text-[#d4d4d8]"
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      <div className="mt-auto flex justify-end pt-4">
                                        <Button
                                          onClick={() => setSelectedCaseStudy(fullProjectData)}
                                          className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                                        >
                                          View Case Study
                                        </Button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </article>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {normalized.portfolioItems?.length > 1 && (
                      <>
                        <CarouselPrevious className="absolute -left-2 sm:-left-12 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute -right-2 sm:-right-12 top-1/2 -translate-y-1/2" />
                      </>
                    )}
                  </Carousel>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-[#17171c] dark:text-[#8f8f95]">
                  No portfolio projects added yet.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-white p-4 md:p-5 dark:border-white/8 dark:bg-[#111113]">
              <h2 className="text-3xl font-bold text-foreground dark:text-white">Reviews</h2>

              <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <div className="rounded-xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-[#17171c]">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.counts[rating] || 0;
                    const percentage = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
                    return (
                      <div key={rating} className="mb-2 flex items-center gap-2 text-xs">
                        <span className="w-10 text-muted-foreground dark:text-[#a1a1aa]">{rating} Star</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-muted-foreground dark:text-[#a1a1aa]">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-[#17171c]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80 dark:text-[#d4d4d8]">Rating Breakdown</span>
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
                      <span className="text-muted-foreground dark:text-[#a1a1aa]">{item.label}</span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {item.value > 0 ? Number(item.value).toFixed(1) : "0.0"}
                      </span>
                    </div>
                  ))}
                  <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground dark:border-white/10 dark:bg-black/30 dark:text-[#8f8f95]">
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

        {/* ===== Why Businesses Choose Catalance ===== */}
        <section id="why-choose-catalance" className="relative py-2 mt-20 sm:mt-28 max-w-3xl mx-auto w-full">
          {/* Warm cream background card with adjusted height */}
          <div className="relative rounded-3xl overflow-hidden border border-orange-100/60 dark:border-white/10 bg-[#FDF7F0] dark:bg-[#18130d] px-4 py-5 sm:px-6 sm:py-5">

            {/* Header */}
            <div className="text-center mb-4 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.1] text-[#1a1209] dark:text-white">
                Why Businesses Choose <span className="text-primary">Catalance</span>
              </h2>
              <p className="text-[#6b5c45] dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Everything you need for successful project delivery — without the marketplace headaches.
              </p>

              {/* Trust avatars */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                <div className="flex -space-x-1.5">
                  {["t1", "t2", "t3", "t4"].map((seed) => (
                    <div key={seed} className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-[#FDF7F0] dark:ring-[#18130d] bg-orange-100">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-[#6b5c45] dark:text-slate-400">
                  Trusted by <span className="font-bold text-primary">300+ Businesses</span>
                </span>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="max-w-2xl mx-auto">
              {/* Column Headers */}
              <div className="grid grid-cols-2 rounded-2xl overflow-hidden mb-0 shadow-sm">
                {/* Catalance header */}
                <div className="bg-primary flex items-center justify-center gap-1.5 py-2 px-4">
                  <img
                    src={cataLogo}
                    alt="Catalance logo"
                    className="h-4 w-4 object-contain invert dark:invert-0"
                  />
                  <span className="!text-white dark:!text-black font-bold text-xs sm:text-sm">Catalance</span>
                </div>
                {/* VS badge & Other Platforms header */}
                <div className="bg-[#e8e5e0] dark:bg-[#2a2520] flex items-center justify-center gap-1.5 py-2 px-4 relative">
                  <div className="absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-[#f5f1ec] dark:bg-[#1a1512] border border-[#ddd9d3] dark:border-white/10 flex items-center justify-center z-10">
                    <span className="text-[7px] font-extrabold text-[#888] uppercase">vs</span>
                  </div>
                  <Users className="w-3.5 h-3.5 text-[#888] dark:text-slate-400" />
                  <span className="text-[#555] dark:text-slate-300 font-semibold text-xs sm:text-sm">Other Platforms</span>
                </div>
              </div>

              {/* Comparison Rows */}
              <div className="divide-y divide-[#e8e0d5] dark:divide-white/10 bg-white/70 dark:bg-white/[0.03] rounded-b-2xl border border-t-0 border-[#e8e0d5] dark:border-white/10">
                {[
                  {
                    catalance: { title: "Project Manager Included", desc: "You get a dedicated project manager to lead and coordinate your project." },
                    other: { title: "No Project Manager", desc: "You're on your own with no dedicated project manager." },
                  },
                  {
                    catalance: { title: "Verified Freelancers", desc: "Rigorous verification for skill and experience." },
                    other: { title: "Open Marketplace", desc: "Anyone can join with no verification." },
                  },
                  {
                    catalance: { title: "100% Refund Policy*", desc: "Full refund if you're not satisfied with the work." },
                    other: { title: "Limited Protection", desc: "Limited refund and dispute protection." },
                  },
                  {
                    catalance: { title: "Freelancer Replacement Available*", desc: "We'll replace your freelancer at no extra cost." },
                    other: { title: "Find a New Freelancer Yourself", desc: "You have to restart the whole process again." },
                  },
                  {
                    catalance: { title: "Dedicated Support", desc: "Real people, ready to help you succeed." },
                    other: { title: "Self-Service Support", desc: "Mostly help articles and automated replies." },
                  },
                  {
                    catalance: { title: "Fast Talent Matching", desc: "We match you with the right talent, faster." },
                    other: { title: "Endless Profile Searching", desc: "You search, filter and hope for the best." },
                  },
                  {
                    catalance: { title: "Transparent Pricing", desc: "Clear pricing, no hidden charges." },
                    other: { title: "Unexpected Platform Fees", desc: "Service fees and add-ons you didn't expect." },
                  },
                  {
                    catalance: { title: "Focused on Project Success", desc: "Your success is our top priority." },
                    other: { title: "Focused on Transactions", desc: "Their focus is on fees and transactions." },
                  },
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-2">
                    {/* Catalance column */}
                    <div className="flex items-start gap-2 py-1.5 px-3 sm:px-4 border-r border-[#e8e0d5] dark:border-white/10">
                      <div className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1a1209] dark:text-white leading-snug">{row.catalance.title}</p>
                        <p className="text-[10px] text-[#7a6a55] dark:text-zinc-200 mt-0.5 leading-relaxed">{row.catalance.desc}</p>
                      </div>
                    </div>
                    {/* Other platforms column */}
                    <div className="flex items-start gap-2 py-1.5 px-3 sm:px-4">
                      <div className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-red-100/80 dark:bg-red-900/20 flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-red-500" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1a1209] dark:text-white leading-snug">{row.other.title}</p>
                        <p className="text-[10px] text-[#7a6a55] dark:text-zinc-200 mt-0.5 leading-relaxed">{row.other.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footnote */}
              <div className="text-right mt-2">
                <span className="text-[9px] text-primary italic font-medium">*Terms & Conditions Apply.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <CaseStudyModal 
        caseStudy={selectedCaseStudy} 
        isOpen={!!selectedCaseStudy} 
        onClose={() => setSelectedCaseStudy(null)} 
      />
    </div>
  );
};

export default ServiceDetails;

