import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Users, TrendingUp, ShieldCheck, Target, Zap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const CatalanceHero = () => {
    // Symmetric pillar heights (percent). Tall at edges, low at center.
    const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92];

    const [isMounted, setIsMounted] = useState(false);

    // Always Dark Mode for Hero
    const isDark = true;

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);
    const textColor = isDark ? "text-white" : "text-gray-900";
    const subTextColor = isDark ? "text-neutral-300" : "text-gray-600";
    const bgColor = isDark ? "bg-black" : "bg-white";

    return (
        <>
            <style>
                {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes subtlePulse {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.03);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}
            </style>
            <section className="relative isolate min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col items-center transition-colors duration-500 dark">
                {/* ================== BACKGROUND ================== */}
                <div
                    aria-hidden
                    className="absolute inset-0 -z-30 transition-opacity duration-500"
                    style={{
                        backgroundImage: [
                            "radial-gradient(80% 55% at 50% 52%, rgba(255, 204, 0, 0.65) 0%, rgba(255, 100, 0, 0.60) 25%, rgba(140, 40, 0, 0.55) 45%, rgba(60, 20, 0, 0.70) 65%, rgba(10, 4, 0, 0.98) 85%, rgba(0,0,0,1) 100%)", /* Gold core -> Orange -> Deep Warm Dark */
                            "radial-gradient(85% 60% at 14% 0%, rgba(255, 160, 0, 0.80) 0%, rgba(255, 80, 0, 0.70) 30%, rgba(40, 10, 0, 0.0) 64%)", /* Intense hot top-left */
                            "radial-gradient(70% 50% at 86% 22%, rgba(255, 215, 0, 0.60) 0%, rgba(40, 20, 0, 0.0) 55%)", /* Gold right accent with warm fade */
                            "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 40%)",
                        ].join(","),
                        backgroundColor: "#000",
                    }} />

                <div
                    aria-hidden
                    className={`absolute inset-0 -z-20 ${isDark ? 'bg-[radial-gradient(140%_120%_at_50%_0%,transparent_60%,rgba(0,0,0,0.85))]' : 'bg-transparent'}`} />

                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 -z-10 mix-blend-screen ${isDark ? 'opacity-30' : 'opacity-100'}`}
                    style={{
                        backgroundImage: [
                            `repeating-linear-gradient(90deg, ${isDark ? 'rgba(255, 220, 100, 0.12)' : 'rgba(0,0,0,0.06)'} 0 1px, transparent 1px 96px)`, /* Warm gold grid */
                            `repeating-linear-gradient(90deg, ${isDark ? 'rgba(255, 220, 100, 0.08)' : 'rgba(0,0,0,0.03)'} 0 1px, transparent 1px 24px)`,
                            `repeating-radial-gradient(80% 55% at 50% 52%, ${isDark ? 'rgba(255, 220, 100, 0.10)' : 'rgba(0,0,0,0.04)'} 0 1px, transparent 1px 120px)`
                        ].join(","),
                        backgroundBlendMode: "screen",
                    }} />

                {/* ================== CONTENT ================== */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 text-center">

                    {/* Badge */}
                    <div className={`flex justify-center mb-8 mt-16 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <Badge className={`group ${isDark ? 'bg-white/10 hover:bg-white/15 text-white border-white/20' : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200 shadow-sm'} border backdrop-blur-md px-6 py-2.5 text-sm font-medium transition-all duration-300 cursor-default`}>
                            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                            Trusted by 10,000+ Freelancers & Clients
                        </Badge>
                    </div>

                    {/* Headlines */}
                    <div className={`mb-6 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-foreground tracking-tight leading-tight">
                            Find clever minds
                        </h1>
                        <h1
                            className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-tight text-primary-strong"
                            style={isDark ? {
                                background: "linear-gradient(to right, #facc15, #ea580c, #facc15)", /* Yellow -> Orange -> Yellow for fire effect */
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            } : {}}
                        >
                            Upgrade your craft
                        </h1>
                    </div>

                    {/* Subhead */}
                    <p
                        className={`text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-light leading-relaxed ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '200ms' }}
                    >
                        Connect with world-class freelancers or discover your next big project.
                        Built for creators, dreamers, and doers.
                    </p>

                    {/* Cards Container */}
                    <div
                        className={`relative max-w-6xl mx-auto mb-16 px-4 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '300ms' }}
                    >
                        <div className="grid md:grid-cols-2 gap-6 relative">
                            {/* OR Circle */}
                            <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                <div className={`relative w-20 h-20 rounded-full ${isDark ? 'bg-black border-white/20' : 'bg-white border-gray-200'} border-2 flex items-center justify-center shadow-2xl backdrop-blur-sm pointer-events-auto`}>
                                    <span className="text-foreground font-bold text-lg tracking-wider">OR</span>
                                    <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-gradient-to-r from-white/10 via-white/20 to-white/10' : 'bg-gradient-to-r from-black/5 via-black/10 to-black/5'} blur-xl animate-pulse -z-10`} />
                                </div>
                            </div>

                            {/* Business Card */}
                            <div className="group relative p-8 rounded-3xl flex flex-col bg-card text-card-foreground border border-border/50 shadow-card backdrop-blur-xl transition-all duration-500 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 text-left">
                                <div className="mb-6">
                                    <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-400/30 hover:bg-orange-500/20 border backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
                                        <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                                        For Businesses
                                    </Badge>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                                    Hire Elite Talent
                                </h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed min-h-[72px]">
                                    Access our curated network of{" "}
                                    <span className="text-orange-600 dark:text-orange-400 font-semibold">world-class professionals</span>{" "}
                                    ready to transform your vision into reality.
                                </p>
                                <div className="space-y-3 mb-8 grow">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <span className="font-medium">Verified expertise</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                                            <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <span className="font-medium">50K+ professionals</span>
                                    </div>
                                </div>
                                <Link to="/service" className="w-full mt-auto">
                                    <Button
                                        size="lg"
                                        className="w-full group/btn bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-6 text-base rounded-2xl shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.02]"
                                    >
                                        Explore Talent
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </Link>
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-500 -z-10 blur-xl" />
                            </div>

                            {/* Freelancer Card */}
                            <div className="group relative p-8 rounded-3xl flex flex-col bg-card text-card-foreground border border-border/50 shadow-card backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 text-left">
                                <div className="mb-6">
                                    <Badge className="bg-primary/15 text-primary-strong dark:text-primary border-primary/30 hover:bg-primary/20 border backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
                                        <Zap className="w-3.5 h-3.5 mr-1.5" />
                                        For Freelancers
                                    </Badge>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                                    Launch Your Career
                                </h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed min-h-[72px]">
                                    Join an exclusive community and connect with{" "}
                                    <span className="text-primary-strong dark:text-primary font-semibold">premium opportunities</span>{" "}
                                    that match your ambitions.
                                </p>
                                <div className="space-y-3 mb-8 grow">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                            <TrendingUp className="w-5 h-5 text-primary-strong dark:text-primary" />
                                        </div>
                                        <span className="font-medium">Career acceleration</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                            <Target className="w-5 h-5 text-primary-strong dark:text-primary" />
                                        </div>
                                        <span className="font-medium">Premium clients</span>
                                    </div>
                                </div>
                                <Link to="/freelancer/onboarding" className="w-full mt-auto">
                                    <Button
                                        size="lg"
                                        className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-6 text-base rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02]"
                                    >
                                        Talk With Professionals
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </Link>
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/5 transition-all duration-500 -z-10 blur-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================== FOREGROUND EFFECTS ================== */}
                <div
                    className="pointer-events-none absolute bottom-[128px] left-1/2 z-0 h-36 w-28 -translate-x-1/2 rounded-md bg-gradient-to-b from-white/75 via-rose-100/60 to-transparent"
                    style={{ animation: 'subtlePulse 6s ease-in-out infinite' }} />

                {/* Pillars */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[100vh]">
                    <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black via-black/90' : 'from-[var(--background)] via-[var(--background)]/80'} to-transparent`} />
                    <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px px-[2px]">
                        {pillars.map((h, i) => (
                            <div
                                key={i}
                                className={`flex-1 ${isDark ? 'bg-black' : 'bg-orange-200/40'} transition-height duration-1000 ease-in-out`}
                                style={{
                                    height: isMounted ? `${h}%` : '0%',
                                    transitionDelay: `${Math.abs(i - Math.floor(pillars.length / 2)) * 60}ms`
                                }} />
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default CatalanceHero;
