import { ExternalLink, Github, Linkedin, Briefcase, MapPin, User, CheckCircle2, Globe, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getFreelancerAvailabilityMeta } from "@/shared/lib/freelancer-availability";
import { cn } from "@/shared/lib/utils";

// Normalize portfolio from various shapes
const normalizePortfolioItems = (items = []) => {
    return items.filter(Boolean).map((item) => {
        if (typeof item === "string") return { title: "Project", image: null, link: item };
        return {
            title: item.title || item.name || "Project",
            image: item.image || item.thumbnail || item.coverImage || item.imageUrl || null,
            link: item.link || item.url || item.href || null,
        };
    });
};

const PORTFOLIO_FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
];

const FreelancerProfile = ({ freelancer, portfolio = [] }) => {
    if (!freelancer) return null;

    const profile = freelancer.freelancerProfile || {};
    const bio = profile.bio || profile.about || profile.summary || "";
    const title = profile.jobTitle || profile.title || profile.headline || "Professional Freelancer";
    const experience = profile.experienceYears || profile.yearsExperience || profile.years || 0;
    const location = profile.location || profile.city || profile.country || "Remote";
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const portfolioItems = normalizePortfolioItems(portfolio);
    const availability = getFreelancerAvailabilityMeta({
        ...freelancer,
        freelancerProfile: profile,
    });

    const socialLinks = [
        profile.linkedin && { href: profile.linkedin, icon: Linkedin, label: "LinkedIn", color: "text-blue-600 border-blue-500/20 hover:bg-blue-500/10" },
        profile.github && { href: profile.github, icon: Github, label: "GitHub", color: "text-foreground border-foreground/20 hover:bg-foreground/10" },
        profile.website && { href: profile.website, icon: Globe, label: "Website", color: "text-primary border-primary/20 hover:bg-primary/10" },
        profile.portfolio && { href: profile.portfolio, icon: ExternalLink, label: "Portfolio", color: "text-violet-500 border-violet-500/20 hover:bg-violet-500/10" },
    ].filter(Boolean);

    return (
        <section className="space-y-6 bg-card/50 border border-border/40 rounded-2xl p-6 md:p-8 shadow-sm backdrop-blur-sm">
            {/* Section Header */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-foreground">About The Freelancer</h2>
            </div>

            {/* Freelancer Card */}
            <div className="rounded-2xl overflow-hidden relative border border-border/30 bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative p-6 flex flex-col sm:flex-row gap-5 items-start">
                    {/* Avatar */}
                    {freelancer.avatar ? (
                        <img
                            src={freelancer.avatar}
                            alt={freelancer.fullName}
                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-background shadow-md shrink-0"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center ring-4 ring-background shadow-md shrink-0">
                            <User className="w-9 h-9 text-muted-foreground" />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 space-y-4 min-w-0">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-foreground">{freelancer.fullName}</h3>
                                {freelancer.isVerified && (
                                    <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full font-semibold">
                                        <CheckCircle2 className="w-3 h-3" /> Verified
                                    </span>
                                )}
                                <Badge variant="outline" className={availability.badgeClass}>
                                    <span
                                        className={`mr-1.5 h-2 w-2 rounded-full ${availability.dotClass}`}
                                        aria-hidden="true"
                                    />
                                    {availability.label}
                                </Badge>
                            </div>
                            <p className="text-primary font-medium text-sm mt-0.5">{title}</p>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> {location}
                            </div>
                            {Number(experience) > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5" /> {experience}+ yrs experience
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        {bio ? (
                            <p className="text-sm text-foreground/75 leading-relaxed max-w-2xl">{bio}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No bio provided yet.</p>
                        )}

                        {/* Skills */}
                        {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {skills.slice(0, 8).map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs rounded-full bg-secondary/50 font-medium">
                                        {skill}
                                    </Badge>
                                ))}
                                {skills.length > 8 && (
                                    <Badge variant="outline" className="text-xs rounded-full text-muted-foreground">
                                        +{skills.length - 8} more
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Social Links */}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {socialLinks.map(({ href, icon: Icon, label, color }) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn("h-8 px-3 rounded-full text-xs gap-1.5 border font-semibold", color)}
                                            aria-label={label}
                                        >
                                            <Icon className="w-3.5 h-3.5" /> {label}
                                        </Button>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-base font-bold tracking-tight">Portfolio & Previous Work</h3>
                </div>

                {portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                        {portfolioItems.map((item, idx) => {
                            const imgSrc = item.image || PORTFOLIO_FALLBACK_IMAGES[idx % PORTFOLIO_FALLBACK_IMAGES.length];
                            const content = (
                                <div className="group relative rounded-xl overflow-hidden aspect-video bg-muted border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                                    <img
                                        src={imgSrc}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.target.src = PORTFOLIO_FALLBACK_IMAGES[idx % PORTFOLIO_FALLBACK_IMAGES.length]; }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-8">
                                        <p className="text-white font-semibold text-xs truncate">{item.title}</p>
                                        {item.link && (
                                            <p className="text-white/50 text-[10px] flex items-center gap-0.5 mt-0.5">
                                                <ExternalLink className="w-2.5 h-2.5" /> View Project
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );

                            return item.link ? (
                                <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer">{content}</a>
                            ) : (
                                <div key={idx}>{content}</div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/40 bg-muted/10 text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/30">
                            <FolderOpen className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-muted-foreground">Portfolio coming soon</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">The freelancer has not added portfolio items yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FreelancerProfile;
