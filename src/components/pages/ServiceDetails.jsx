import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Home, User, CheckCircle2, Star, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MediaGallery from "./marketplace-details/MediaGallery";
import StickySidebar from "./marketplace-details/StickySidebar";
import ReviewsList from "./marketplace-details/ReviewsList";
import FreelancerProfile from "./marketplace-details/FreelancerProfile";

const formatCategory = (cat) => {
    if (!cat) return "";
    return cat.split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const ServiceDetails = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const { API_BASE_URL } = await import("@/shared/lib/api-client");
                const res = await fetch(`${API_BASE_URL}/marketplace/${id}`);
                if (!res.ok) throw new Error("Failed to fetch");
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

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // Optionally integrate a toast here: toast.success("Link copied to clipboard!")
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 pt-24 max-w-[1200px] min-h-screen">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <Skeleton className="h-96 w-full rounded-2xl mb-8" />
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                    </div>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="container mx-auto px-4 py-32 text-center min-h-screen">
                <h1 className="text-3xl font-bold">Service Not Found</h1>
                <Link to="/marketplace" className="text-primary mt-4 inline-block hover:underline">
                    Return to Marketplace
                </Link>
            </div>
        );
    }

    const { serviceDetails = {}, freelancer } = service;
    const authorName = freelancer?.fullName || "Anonymous";
    const categoryLabel = formatCategory(service.serviceKey);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 max-w-[1200px] min-h-screen">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2">
                <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" /> Home
                </Link>
                <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                <Link to="/marketplace" className="hover:text-primary transition-colors">
                    Marketplace
                </Link>
                {categoryLabel && (
                    <>
                        <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                        <span className="text-foreground font-medium">{categoryLabel}</span>
                    </>
                )}
            </nav>

            <div className="flex flex-col lg:flex-row gap-10 relative">

                {/* Main Content (70%) */}
                <div className="flex-1 min-w-0 flex flex-col gap-10">

                    {/* Header */}
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
                            {service.service || "Untitled Service"}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                {freelancer?.avatar ? (
                                    <img src={freelancer.avatar} alt={authorName} className="w-8 h-8 rounded-full object-cover shadow-sm bg-muted" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-sm">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                                <span className="text-foreground">{authorName}</span>
                                {freelancer?.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                            </div>

                            <div className="h-4 w-px bg-border/60"></div>

                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-foreground">{service.averageRating}</span>
                                <span className="text-muted-foreground">({service.reviewCount} Reviews)</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Sidebar Section injects here to match PRD (Below title, above description) */}
                    <div className="block lg:hidden w-full">
                        <StickySidebar service={service} onShare={handleShare} />
                    </div>

                    {/* Media Gallery */}
                    <MediaGallery images={serviceDetails.images || (serviceDetails.image ? [serviceDetails.image] : [])} serviceName={service.service} />

                    {/* About This Service */}
                    <section className="space-y-6 bg-card/50 border border-primary/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-sm">
                        <h2 className="text-2xl font-bold tracking-tight">About This Service</h2>
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {serviceDetails.description || serviceDetails.bio || "No detailed description provided."}
                        </div>

                        {serviceDetails.tools && serviceDetails.tools.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tech Stack & Tools</h3>
                                <div className="flex flex-wrap gap-2">
                                    {serviceDetails.tools.map((tool, i) => (
                                        <Badge key={i} variant="secondary" className="bg-secondary/50 font-medium">
                                            {tool}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {serviceDetails.deliverables && serviceDetails.deliverables.length > 0 && (
                            <div className="pt-4 border-t border-border/50">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">What's Included</h3>
                                <ul className="space-y-2">
                                    {serviceDetails.deliverables.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-foreground">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Freelancer Profile */}
                    <FreelancerProfile freelancer={freelancer} portfolio={serviceDetails.portfolio || []} />

                    {/* Reviews */}
                    <ReviewsList serviceId={service.id} initialStats={{ averageRating: service.averageRating, reviewCount: service.reviewCount }} />

                </div>

                {/* Sidebar (30%) - Desktop Only */}
                <div className="hidden lg:block w-[340px] shrink-0">
                    <StickySidebar service={service} onShare={handleShare} />
                </div>
            </div>
        </div>
    );
};

export default ServiceDetails;
