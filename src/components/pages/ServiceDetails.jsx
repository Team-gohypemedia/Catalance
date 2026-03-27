import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { CheckCircle2, Star, Clock, FileIcon, Search, ChevronDown, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import MediaGallery from "./marketplace-details/MediaGallery";
import StickySidebar from "./marketplace-details/StickySidebar";
import ReviewsList from "./marketplace-details/ReviewsList";

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
        sd.coverImage,
        sd.images,
        sd.gallery,
        sd.media,
        sd.image,
        sd.thumbnail,
    ];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c.filter(Boolean);
        if (typeof c === "string" && c) return [c];
    }
    return [];
};

/** Normalize description */
const normalizeDescription = (sd = {}) =>
    sd.description || sd.bio || "";

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
const normalizePortfolio = (sd = {}) => {
    const candidates = [sd.portfolio, sd.projects];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c.filter(Boolean);
    }
    return [];
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────
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
                    <div className="space-y-3 rounded-2xl border border-border/40 p-6">
                        <Skeleton className="h-6 w-40 rounded-lg" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <Skeleton className="h-4 w-4/5 rounded" />
                    </div>
                    <div className="space-y-3 rounded-2xl border border-border/40 p-6">
                        <Skeleton className="h-6 w-48 rounded-lg" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-20 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <Skeleton className="h-8 w-16 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="hidden w-[340px] shrink-0 space-y-4 lg:block">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
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

    // ── Auto-open modal or scroll after post-login return ──
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        let updated = false;

        if (isAuthenticated && params.get("openMessage") === "1" && service) {
            setChatModalOpen(true);
            params.delete("openMessage");
            updated = true;
        }

        if (isAuthenticated && params.get("openReview") === "1" && service) {
            setTimeout(() => {
                const el = document.getElementById("reviews-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 500);
            params.delete("openReview");
            updated = true;
        }

        if (updated) {
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
            <div className="min-h-screen bg-background">
                <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-32 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/40">
                        <Layers className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold">Service Not Found</h1>
                    <p className="mb-6 text-sm text-muted-foreground">This service may have been removed or doesn't exist.</p>
                    <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
                        ← Back to Marketplace
                    </Link>
                </div>
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
    const portfolio = normalizePortfolio(serviceDetails);

    return (
        <div className="min-h-screen bg-background">
        <div className="container relative mx-auto min-h-screen max-w-[1200px] px-4 py-8 pt-24 sm:px-6 lg:px-8">

            {/* Share Toast */}
            {shareToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    Link copied to clipboard ✓
                </div>
            )}

            {/* Removed internal Breadcrumb for clean layout */}

            {/* items-start prevents sidebar stretching full height; overflow-x is unset to allow sticky */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-10">

                {/* ── Main Content (70%) ─────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col gap-8">

                    {/* Service Header - Redesigned to match image */}
                    <div className="space-y-4 pb-0 border-0">
                        {categoryLabel && (
                            <div className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] mb-2">
                                <span>{categoryLabel}</span>
                            </div>
                        )}

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
                            {service.service || "Untitled Service"}
                        </h1>

                        {/* Freelancer + Rating Row */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <div className="flex items-center gap-2.5">
                                {freelancer?.avatar ? (
                                    <img src={freelancer.avatar} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center">
                                        <span className="font-bold text-[#a1a1aa]">{authorName.charAt(0)}</span>
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                                        {authorName}
                                        {freelancer?.isVerified && <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">PRO VERIFIED</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                <span className="text-amber-500 font-bold">{Number(service?.averageRating || 0) > 0 ? Number(service.averageRating).toFixed(1) : "New"}</span>
                                <span className="text-[#a1a1aa]">({service.reviewCount || 0} reviews)</span>
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

                    {/* Tabs Navigation */}
                    <div className="flex gap-6 border-b border-white/10 overflow-x-auto mt-2">
                        {["About this service", "Scope of Work", "Reviews", "FAQ"].map((tab, i) => (
                            <button
                                key={tab}
                                className={cn(
                                    "pb-3 text-sm font-bold whitespace-nowrap transition-colors",
                                    i === 0
                                        ? "text-amber-500 border-b-2 border-amber-500"
                                        : "text-[#a1a1aa] hover:text-white"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Description - Redesigned */}
                    <div className="text-[#d4d4d8] leading-relaxed space-y-4 text-[15px] pt-4">
                        {description ? (
                            <div className="whitespace-pre-wrap">{description}</div>
                        ) : (
                            <p className="italic text-[#a1a1aa]">Not provided yet</p>
                        )}
                    </div>

                    {/* What's Included Grid */}
                    <div className="pt-6">
                        <h2 className="text-xl font-bold text-white mb-4">What's Included</h2>
                        {deliverables && deliverables.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {deliverables.map((item, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-[#171717] gap-2.5 text-center">
                                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                        <span className="text-sm font-bold text-[#e4e4e7]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl border border-dashed border-white/5 bg-white/[0.02] text-center">
                                <p className="text-sm text-[#a1a1aa] font-medium">No deliverables listed yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Technical Stack Pills */}
                    <div className="pt-6">
                        <h2 className="text-xl font-bold text-white mb-4">Technical Stack</h2>
                        {tools && tools.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tools.map((tech, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-[#171717]">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        <span className="text-xs font-bold text-white">{tech}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl border border-dashed border-white/5 bg-white/[0.02] text-center">
                                <p className="text-xs text-[#a1a1aa] font-medium uppercase tracking-wider">Tools not specified yet</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-8">
                        <ReviewsList
                            serviceId={service.id}
                            initialStats={{ averageRating: service.averageRating, reviewCount: service.reviewCount }}
                        />
                    </div>



                    {/* Portfolio */}
                    <div className="pt-8 pb-12">
                        <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
                        {portfolio && portfolio.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {portfolio.slice(0, 6).map((item, i) => {
                                    const imgUrl = typeof item === "string" ? item : (item.imageUrl || item.image);
                                    const titleStr = typeof item === "string" ? `Portfolio item ${i + 1}` : (item.title || item.name || `Portfolio item ${i + 1}`);
                                    return (
                                        <div key={i} className="group cursor-pointer">
                                            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-[#171717] border border-white/5 flex items-center justify-center">
                                                {imgUrl ? (
                                                    <img
                                                        src={imgUrl}
                                                        alt={titleStr}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-[#27272a] flex flex-col items-center justify-center text-[#a1a1aa] gap-2">
                                                        <ImageIcon className="w-6 h-6 opacity-40" />
                                                        <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-amber-500 transition-colors line-clamp-1">{titleStr}</h3>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="p-12 rounded-2xl border border-dashed border-white/5 bg-white/[0.02] text-center">
                                <p className="text-sm text-[#a1a1aa] font-medium">No portfolio added yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="hidden lg:block w-[340px] shrink-0 self-start sticky top-24 pb-4"
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
        </div>
    );
};

export default ServiceDetails;
