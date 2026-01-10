import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, TrendingUp, ShieldCheck, Target, Zap, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import MatrixRain from "@/components/ui/matrix-code";
import SparklesIcon from "@/components/ui/sparkles-icon";
import { Spotlight } from "@/components/spotlight-new";
import DecorativeIcons from "@/components/ui/decorative-icons";

const CatalanceHero = () => {

    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";

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
            <section className={`relative isolate min-h-screen w-full overflow-hidden bg-white dark:bg-black text-foreground flex flex-col items-center transition-colors duration-500`}>
                {/* ================== BACKGROUND ================== */}
                <div
                    aria-hidden
                    className="absolute inset-0 -z-30 transition-opacity duration-500"
                    style={{
                        backgroundColor: isDark ? "#000000" : "#FFFFFF",
                    }} />

                {/* Matrix Rain Background */}
                <MatrixRain
                    color="#FACC15"
                    className="absolute inset-0 z-[-26]"
                    fadeOpacity={0.1}
                    style={{
                        opacity: isDark ? 0.25 : 0.1
                    }}
                />

                {/* Spotlight Effect */}
                <Spotlight
                    gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(48, 96%, 53%, .25) 0, hsla(48, 96%, 53%, .1) 50%, hsla(48, 96%, 53%, 0) 80%)"
                    gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(48, 96%, 53%, .18) 0, hsla(48, 96%, 53%, .06) 80%, transparent 100%)"
                    gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(48, 96%, 53%, .14) 0, hsla(48, 96%, 53%, .04) 80%, transparent 100%)"
                    duration={8}
                    xOffset={80}
                />

                {/* Decorative Icons */}
                <DecorativeIcons isDark={isDark} />

                {/* Grid Background */}
                <div
                    aria-hidden
                    className={`absolute inset-0 z-[-28] ${isDark ? 'opacity-30' : 'opacity-100'}`}
                    style={{
                        backgroundImage: isDark
                            ? `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`
                            : `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                               linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                        backgroundSize: "100px 100px",
                    }}
                />

                {/* Bottom Fade */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-80 -z-10"
                    style={{
                        background: isDark
                            ? "linear-gradient(to top, #000000 0%, transparent 100%)"
                            : "linear-gradient(to top, #FFFFFF 0%, transparent 100%)",
                    }}
                />

                {/* ================== CONTENT ================== */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 text-center">

                    {/* Badge */}
                    <div className={`flex justify-center mb-4 mt-16 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
                        <Badge className={`group [&>svg]:size-6 [&>svg]:pointer-events-auto ${isDark ? 'bg-transparent hover:bg-white/5 text-white border-white/20' : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200 shadow-sm'} border backdrop-blur-md px-6 py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer`}>
                            <SparklesIcon size={24} className="text-primary" />
                            Trusted by <span className="text-primary font-semibold">10,000+</span> Freelancers & Clients
                        </Badge>
                    </div>

                    {/* Headlines */}
                    <div className={` ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
                        <h1
                            className={`font-medium tracking-tight leading-tight whitespace-nowrap mb-4 ${textColor}`}
                            style={{ fontSize: 'clamp(1.5rem, 4vw, 4rem)' }}
                        >
                            Connecting <span className="text-primary">Ideas</span> with The Right <span className="text-primary">Experts</span>.
                        </h1>
                    </div>

                    {/* Subhead */}
                    <p
                        className={`text-lg md:text-xl lg:text-2xl ${subTextColor} mx-auto mb-6 font-light leading-relaxed whitespace-nowrap ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '200ms' }}
                    >
                        A platform that helps projects move from brief to delivery with clarity and control.
                    </p>

                    {/* Cards Container */}
                    <div
                        className={`relative max-w-3xl mx-auto mb-16 px-4 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
                        style={{ animationDelay: '300ms' }}
                    >
                        <div className="grid md:grid-cols-2 gap-15 relative">
                            {/* OR Circle */}
                            <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                <div className={`relative w-22 h-22 rounded-full ${isDark ? 'bg-black border-primary/50' : 'bg-white border-primary/50'} border-2 flex items-center justify-center shadow-[0_0_20px_var(--color-primary)] backdrop-blur-sm pointer-events-auto`}>
                                    <span className="text-foreground font-medium text-2xl tracking-wider">OR</span>
                                    <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-linear-to-r from-primary/20 via-primary/40 to-primary/20' : 'bg-linear-to-r from-primary/10 via-primary/20 to-primary/10'} blur-xl animate-pulse -z-10`} />
                                </div>
                            </div>

                            {/* Business Card */}
                            <div className="group relative p-6 rounded-3xl flex flex-col bg-background bg-linear-to-bl from-primary/40 via-background to-background text-card-foreground shadow-card backdrop-blur-xl text-left min-h-[450px]">
                                <div className="mb-6 flex flex-col items-start">
                                    <div className="px-0 py-2">
                                        <Briefcase className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium uppercase tracking-wide text-primary">
                                        For Businesses
                                    </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-2 leading-tight">
                                    Hire Elite Talent
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed min-h-[40px]">
                                    Access our curated network of{" "}
                                    <span className="text-primary dark:text-primary font-semibold">world-class professionals</span>{" "}
                                    ready to transform your vision into reality.
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-8">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Verified expertise</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">50K+ professionals</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Secure payments</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Dedicated support</span>
                                    </div>
                                </div>
                                <Link to="/service" className="w-full mt-auto">
                                    <Button
                                        size="lg"
                                        className="w-full group/btn bfont-semibold px-6 py-6 text-base shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.02]"
                                    >
                                        Explore Talent
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </Link>
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-orange-500/0 to-amber-500/0 -z-10 blur-xl" />
                            </div>

                            {/* Freelancer Card */}
                            <div className="group relative p-6 rounded-3xl flex flex-col bg-background bg-linear-to-bl from-primary/40 via-background to-background text-card-foreground shadow-card backdrop-blur-xl text-left min-h-[450px]">
                                <div className="mb-6 flex flex-col items-start">
                                    <div className="px-0 py-2">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium uppercase tracking-wide text-primary">
                                        For Freelancers
                                    </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-medium text-foreground mb-2 leading-tight whitespace-nowrap">
                                    Launch Careers
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed min-h-[72px]">
                                    Join an exclusive community and connect with{" "}
                                    <span className="text-primary-strong dark:text-primary font-semibold">premium opportunities</span>{" "}
                                    that match your ambitions.
                                </p>

                                {/* Features */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-8">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Zero commission</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Global network</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Secure payments</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 text-primary-strong">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/90">Fast hiring</span>
                                    </div>
                                </div>
                                <Link to="/freelancer/onboarding" className="w-full mt-auto">
                                    <Button
                                        size="lg"
                                        className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-6 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02]"
                                    >
                                        Start Your Career
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                </Link>
                                <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/0 to-primary/0 -z-10 blur-xl" />
                            </div>
                        </div>
                    </div>

                </div>


            </section>
        </>
    );
};

export default CatalanceHero;
