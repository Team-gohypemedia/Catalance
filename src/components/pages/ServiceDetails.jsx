import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { ChevronRight, Home, User, CheckCircle2, Star, Wrench, PackageCheck, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import MediaGallery from "./marketplace-details/MediaGallery";
import StickySidebar from "./marketplace-details/StickySidebar";
import ReviewsList from "./marketplace-details/ReviewsList";
import FreelancerProfile from "./marketplace-details/FreelancerProfile";

// ─── Data Normalization Utilities ───────────────────────────────────────────
const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const getCategoryGradient = (category) => {
    const gradients = [
        "from-emerald-500/30 to-teal-900/60",
        "from-blue-500/30 to-indigo-900/60",
        "from-purple-500/30 to-violet-900/60",
        "from-rose-500/30 to-red-900/60",
        "from-amber-500/30 to-orange-900/60",
        "from-cyan-500/30 to-blue-900/60",
    ];
    if (!category) return gradients[0];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
};

/** Normalize images from any serviceDetails key combo */
const normalizeImages = (sd = {}) => {
    const candidates = [
        sd.images,
        sd.gallery,
        sd.media,
        sd.image ? [sd.image] : null,
        sd.thumbnail ? [sd.thumbnail] : null,
        sd.coverImage ? [sd.coverImage] : null,
    ];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) {
            return c.filter(Boolean);
        }
        if (typeof c === "string" && c) return [c];
    }
    return [];
};

/** Normalize description */
const normalizeDescription = (sd = {}) =>
    sd.description || sd.about || sd.bio || sd.summary || "";

/** Normalize tools / tech stack */
const normalizeTools = (sd = {}) => {
    const candidates = [sd.tools, sd.techStack, sd.technologies, sd.stack];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c.filter(Boolean);
    }
    return [];
};

/** Normalize deliverables */
const normalizeDeliverables = (sd = {}) => {
    const candidates = [sd.deliverables, sd.whatsIncluded, sd.includes, sd.features];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c.filter(Boolean);
    }
    return [];
};

/** Normalize portfolio */
const normalizePortfolio = (sd = {}, freelancer = {}) => {
    const candidates = [sd.portfolio, sd.projects, freelancer?.freelancerProfile?.portfolioProjects];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c.filter(Boolean);
    }
    return [];
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-[1200px] min-h-screen">
        <Skeleton className="h-4 w-48 mb-6 rounded-full" />
        <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4 rounded-xl" />
                    <Skeleton className="h-5 w-48 rounded-full" />
                </div>
                <Skeleton className="w-full aspect-video rounded-3xl" />
                <div className="space-y-3 p-6 border border-border/40 rounded-2xl">
                    <Skeleton className="h-6 w-40 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4 w-4/5 rounded" />
                </div>
                <div className="space-y-3 p-6 border border-border/40 rounded-2xl">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                </div>
            </div>
            <div className="hidden lg:block w-[340px] shrink-0 space-y-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const ServiceDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shareToast, setShareToast] = useState(false);
    // Controlled modal state — lifted here so ServiceDetails can auto-open it
    const [chatModalOpen, setChatModalOpen] = useState(false);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const { API_BASE_URL } = await import("@/shared/lib/api-client");
                const res = await fetch(`${API_BASE_URL}/marketplace/${id}`);
                if (!res.ok) throw new Error("Not found");
                const json = await res.json();
                setService(json.data);
            } catch (err) {
                console.error(err);
                setService(null);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id]);

    // ── Auto-open modal after post-login return (openMessage=1) ──
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (isAuthenticated && params.get("openMessage") === "1" && service) {
            setChatModalOpen(true);
            // Clean the query param from URL without re-render/navigation
            params.delete("openMessage");
            const newUrl = [location.pathname, params.toString() ? `?${params}` : ""].join("");
            window.history.replaceState({}, "", newUrl);
        }
    }, [isAuthenticated, location.search, service]);

    // ── SEO: Update document title + meta description when service loads ──
    useEffect(() => {
        if (!service) return;
        const svcTitle = service.service || "Service";
        document.title = `${svcTitle} | Catalance Marketplace`;

        const sd = service.serviceDetails || {};
        const desc = sd.description || sd.about || sd.bio || sd.summary || "";
        const metaDesc = desc.slice(0, 155).replace(/\s+/g, " ").trim() ||
            `Hire a top freelancer for ${svcTitle} on Catalance Marketplace.`;

        let metaTag = document.querySelector('meta[name="description"]');
        if (!metaTag) {
            metaTag = document.createElement("meta");
            metaTag.name = "description";
            document.head.appendChild(metaTag);
        }
        metaTag.content = metaDesc;

        return () => {
            document.title = "Catalance";
        };
    }, [service]);

    // ── Handler: unauthenticated user clicks CTA ──
    const handleLoginRequired = () => {
        const returnPath = location.pathname;
        const loginUrl = `/login?redirect=${encodeURIComponent(returnPath)}&openMessage=1`;
        navigate(loginUrl);
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2000);
        } catch {
            alert("Link copied!");
        }
    };

    if (loading) return <LoadingSkeleton />;

    if (!service) {
        return (
            <div className="container mx-auto px-4 py-32 text-center min-h-screen flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-muted/40 flex items-center justify-center mb-6 border border-dashed border-border/50">
                    <Layers className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Service Not Found</h1>
                <p className="text-muted-foreground mb-6 text-sm">This service may have been removed or doesn't exist.</p>
                <Link to="/marketplace" className="text-primary hover:underline font-semibold text-sm">
                    ← Back to Marketplace
                </Link>
            </div>
        );
    }

    // ── Normalized Data ────────────────────────────────────────────────────
    const { serviceDetails = {}, freelancer } = service;
    const categoryLabel = formatCategory(service.serviceKey);
    const categoryGradient = getCategoryGradient(service.serviceKey);
    const authorName = freelancer?.fullName || "Anonymous";

    const images = normalizeImages(serviceDetails);
    const description = normalizeDescription(serviceDetails);
    const tools = normalizeTools(serviceDetails);
    const deliverables = normalizeDeliverables(serviceDetails);
    const portfolio = normalizePortfolio(serviceDetails, freelancer);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-[1200px] min-h-screen relative">

            {/* Share Toast */}
            {shareToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    Link copied to clipboard ✓
                </div>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center text-xs text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-1 gap-1">
                <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Home className="w-3 h-3" /> Home
                </Link>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                <Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link>
                {categoryLabel && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-foreground font-medium">{categoryLabel}</span>
                    </>
                )}
            </nav>

            {/* items-start prevents sidebar stretching full height; overflow-x is unset to allow sticky */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-10">

                {/* ── Main Content (70%) ─────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col gap-8">

                    {/* Service Header */}
                    <div className="space-y-5 pb-6 border-b border-border/40">
                        {categoryLabel && (
                            <Badge variant="secondary" className="rounded-full text-xs font-semibold px-3 py-1">
                                {categoryLabel}
                            </Badge>
                        )}
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                            {service.service || "Untitled Service"}
                        </h1>

                        {/* Freelancer + Rating Row */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2.5">
                                {freelancer?.avatar ? (
                                    <img src={freelancer.avatar} alt={authorName} className="w-9 h-9 rounded-full object-cover ring-2 ring-background shadow" />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center ring-2 ring-background shadow">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-1 font-semibold text-foreground leading-none">
                                        {authorName}
                                        {freelancer?.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                                    </div>
                                    {freelancer?.freelancerProfile?.jobTitle && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{freelancer.freelancerProfile.jobTitle}</p>
                                    )}
                                </div>
                            </div>

                            <div className="h-4 w-px bg-border/60 hidden sm:block" />

                            <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>{service.averageRating > 0 ? service.averageRating : "New"}</span>
                                <span className="text-muted-foreground font-normal">({service.reviewCount} reviews)</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sidebar — PRD: between title/header and gallery/description */}
                    <div className="block lg:hidden w-full" role="complementary" aria-label="Service pricing and contact">
                        <StickySidebar
                            service={service}
                            onShare={handleShare}
                            isAuthenticated={isAuthenticated}
                            onLoginRequired={handleLoginRequired}
                            modalOpen={chatModalOpen}
                            onModalOpenChange={setChatModalOpen}
                        />
                    </div>

                    {/* Media Gallery */}
                    <MediaGallery
                        images={images}
                        serviceName={service.service}
                        categoryGradient={categoryGradient}
                        categoryLabel={categoryLabel}
                    />

                    {/* About This Service */}
                    <SectionCard title="About This Service" icon={<Layers className="w-5 h-5 text-primary" />}>
                        {description ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {description}
                            </div>
                        ) : (
                            <EmptyState message="No description provided yet." subtle />
                        )}
                    </SectionCard>

                    {/* Tools & Tech Stack */}
                    <SectionCard title="Tech Stack & Tools" icon={<Wrench className="w-5 h-5 text-primary" />}>
                        {tools.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tools.map((tool, i) => (
                                    <Badge key={i} variant="secondary" className="rounded-full font-medium bg-secondary/60 border border-border/40 px-3 py-1">
                                        {tool}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="Tools not specified yet." subtle />
                        )}
                    </SectionCard>

                    {/* What's Included */}
                    <SectionCard title="What's Included" icon={<PackageCheck className="w-5 h-5 text-primary" />}>
                        {deliverables.length > 0 ? (
                            <ul className="space-y-2.5">
                                {deliverables.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                message="Deliverables not listed yet."
                                subtitle="Contact the freelancer for a detailed scope of work."
                                subtle
                            />
                        )}
                    </SectionCard>

                    {/* Freelancer Profile */}
                    <FreelancerProfile freelancer={freelancer} portfolio={portfolio} />

                    {/* Reviews */}
                    <ReviewsList
                        serviceId={service.id}
                        initialStats={{ averageRating: service.averageRating, reviewCount: service.reviewCount }}
                    />
                </div>

                {/* ── Sticky Sidebar (30%) — self-start prevents stretching, sticky top-24 stops at natural end ──*/}
                <div
                    className="hidden lg:block w-[340px] shrink-0 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4"
                    role="complementary"
                    aria-label="Service pricing and contact"
                >
                    <StickySidebar
                        service={service}
                        onShare={handleShare}
                        isAuthenticated={isAuthenticated}
                        onLoginRequired={handleLoginRequired}
                        modalOpen={chatModalOpen}
                        onModalOpenChange={setChatModalOpen}
                    />
                </div>
            </div>
        </div>
    );
};

// ─── Reusable Section Card ─────────────────────────────────────────────────
export const SectionCard = ({ title, icon, children, className }) => (
    <section className={cn(
        "flex flex-col gap-5 bg-card/50 border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm backdrop-blur-sm",
        className
    )}>
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        </div>
        <div>{children}</div>
    </section>
);

// ─── Reusable Empty State ──────────────────────────────────────────────────
export const EmptyState = ({ message, subtitle, icon: Icon, subtle = false }) => (
    <div className={cn(
        "flex flex-col items-center justify-center py-8 text-center rounded-xl",
        subtle ? "" : "bg-muted/20 border border-dashed border-border/40"
    )}>
        {!subtle && (Icon ? <Icon className="w-8 h-8 text-muted-foreground/30 mb-3" /> : null)}
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
        {subtitle && <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{subtitle}</p>}
    </div>
);

export default ServiceDetails;
