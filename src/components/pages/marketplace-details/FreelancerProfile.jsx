import { ExternalLink, Github, Linkedin, Briefcase, MapPin, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FreelancerProfile = ({ freelancer, portfolio = [] }) => {
    if (!freelancer) return null;

    const profile = freelancer.freelancerProfile || {};
    const bio = profile.bio || "This freelancer hasn't written a bio yet.";
    const title = profile.jobTitle || "Professional Freelancer";
    const experience = profile.experienceYears || 0;
    const location = profile.location || "Remote";

    return (
        <section className="space-y-8 pt-8 border-t border-border/30">
            <h2 className="text-2xl font-bold tracking-tight">About The Freelancer</h2>

            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-primary/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                    {/* Avatar */}
                    {freelancer.avatar ? (
                        <img
                            src={freelancer.avatar}
                            alt={freelancer.fullName}
                            className="w-24 h-24 rounded-full object-cover ring-4 ring-background shadow-md"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center ring-4 ring-background shadow-md shrink-0">
                            <User className="w-10 h-10 text-muted-foreground" />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-foreground">{freelancer.fullName}</h3>
                                {freelancer.isVerified && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                            </div>
                            <p className="text-primary font-medium mt-0.5">{title}</p>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" /> {location}
                            </div>
                            {experience > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4" /> {experience}+ Years Exp.
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                            {bio}
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-3 pt-2">
                            {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-full text-blue-600 border-blue-600/20 hover:bg-blue-600/10">
                                        <Linkedin className="w-4 h-4" />
                                    </Button>
                                </a>
                            )}
                            {profile.github && (
                                <a href={profile.github} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-full dark:text-white border-foreground/20 hover:bg-foreground/10">
                                        <Github className="w-4 h-4" />
                                    </Button>
                                </a>
                            )}
                            {profile.portfolio && (
                                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-primary/20 hover:bg-primary/10 text-primary">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Grid */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold tracking-tight">Portfolio & Previous Work</h3>
                {portfolio && portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {portfolio.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link || item.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block relative rounded-2xl overflow-hidden aspect-video bg-muted border border-border/50"
                            >
                                <img
                                    src={item.image || item.thumbnail || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop"}
                                    alt={item.title || "Portfolio Item"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                                    <p className="text-white font-medium text-sm truncate opacity-90 group-hover:opacity-100 transition-opacity">
                                        {item.title || "View Project"}
                                    </p>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 bg-muted/20 border border-border/50 border-dashed rounded-2xl text-center">
                        <p className="text-muted-foreground font-medium">No portfolio items added yet.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FreelancerProfile;
