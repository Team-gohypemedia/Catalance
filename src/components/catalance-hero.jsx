import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowRight, Sparkles, Users, TrendingUp, CheckCircle2, Briefcase, Zap, ShieldCheck, Target } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

gsap.registerPlugin(SplitText, useGSAP);

const CatalanceHero = () => {
    const heroRef = useRef(null);
    const headlineRef = useRef(null);
    const headline2Ref = useRef(null);
    const subheadRef = useRef(null);
    const badgeRef = useRef(null);
    const ctaRef = useRef(null);
    const statsRef = useRef(null);
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState("dark");

    // Detect actual theme (resolve 'system' to actual theme)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const root = window.document.documentElement;

        const checkTheme = () => {
            setResolvedTheme(root.classList.contains("dark") ? "dark" : "light");
        };

        // Initial check
        checkTheme();

        // Observe changes to the class attribute on the html element
        const observer = new MutationObserver(checkTheme);
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    useGSAP(
        () => {
            if (!headlineRef.current || !headline2Ref.current) return;

            document.fonts.ready.then(() => {
                const headlineSplit = new SplitText(headlineRef.current, {
                    type: "words",
                    wordsClass: "hero-word",
                });

                // Don't use SplitText on gradient headline - it breaks the gradient
                // Animate the whole element instead

                // Set initial states
                gsap.set(badgeRef.current, { autoAlpha: 0, y: -20, scale: 0.9 });
                gsap.set(headlineSplit.words, {
                    yPercent: 100,
                    autoAlpha: 0,
                    rotateX: -45,
                    transformOrigin: "50% 100%",
                });
                gsap.set(headline2Ref.current, {
                    autoAlpha: 0,
                    y: 30,
                });
                gsap.set(subheadRef.current, { autoAlpha: 0, y: 20 });
                gsap.set(ctaRef.current?.children, { autoAlpha: 0, y: 20, scale: 0.95 });
                gsap.set(statsRef.current?.children, { autoAlpha: 0, y: 20 });

                // Create timeline
                const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

                tl.to(badgeRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6 }, 0.2)
                    .to(
                        headlineSplit.words,
                        {
                            yPercent: 0,
                            autoAlpha: 1,
                            rotateX: 0,
                            duration: 0.8,
                            stagger: 0.05,
                        },
                        0.4
                    )
                    .to(
                        headline2Ref.current,
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.8,
                        },
                        0.8
                    )
                    .to(subheadRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.3")
                    .to(
                        ctaRef.current?.children,
                        { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1 },
                        "-=0.2"
                    )
                    .to(
                        statsRef.current?.children,
                        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 },
                        "-=0.3"
                    );

                // Floating animation for orbs
                gsap.to(".floating-orb-1", {
                    y: -30,
                    x: 20,
                    duration: 4,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });

                gsap.to(".floating-orb-2", {
                    y: 25,
                    x: -15,
                    duration: 5,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });

                gsap.to(".floating-orb-3", {
                    y: -20,
                    x: -25,
                    duration: 6,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            });
        },
        { scope: heroRef }
    );

    // Counter animation effect
    useEffect(() => {
        const counters = document.querySelectorAll(".stat-number");
        counters.forEach((counter) => {
            const target = parseInt(counter.getAttribute("data-target"));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target + (counter.getAttribute("data-suffix") || "");
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + (counter.getAttribute("data-suffix") || "");
                }
            }, 16);
        });
    }, []);

    // Theme-aware styles
    const isDark = resolvedTheme === "dark";
    const bgColor = isDark ? "bg-black" : "bg-white";
    const textColor = isDark ? "text-white" : "text-gray-800";
    const subTextColor = isDark ? "text-neutral-300" : "text-gray-600";

    // Grid line color based on theme (with reduced opacity)
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

    return (
        <section
            ref={heroRef}
            className={`relative min-h-screen w-full ${bgColor} ${textColor} flex items-center justify-center overflow-hidden`}
        >
            {/* Grid Background - Adaptive to theme */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Spotlight Effect - Left */}
            <Spotlight
                className="-top-40 left-0 md:left-60 md:-top-20"
                fill={isDark ? "#fdc800" : "#f59e0b"}
            />
            {/* Spotlight Effect - Right */}
            <Spotlight
                className="-top-40 right-0 md:right-60 md:-top-20 scale-x-[-1]"
                fill={isDark ? "#fdc800" : "#f59e0b"}
            />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
                {/* Badge */}
                <div ref={badgeRef} className="flex justify-center mb-8 mt-16">
                    <Badge className="group bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 backdrop-blur-md px-6 py-2.5 text-sm font-medium transition-all duration-300 cursor-default">
                        <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                        Trusted by 10,000+ Freelancers & Clients
                    </Badge>
                </div>

                {/* Headline */}
                <div className="mb-6">
                    <h1
                        ref={headlineRef}
                        className={`text-6xl md:text-7xl lg:text-8xl font-semibold ${textColor} tracking-tight leading-tight`}
                    >
                        Find clever minds
                    </h1>
                    <h1
                        ref={headline2Ref}
                        className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-tight"
                        style={{
                            background: "linear-gradient(to right, #facc15, #fde047, #facc15)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        Upgrade your craft
                    </h1>
                </div>

                {/* Subheadline */}
                <p
                    ref={subheadRef}
                    className={`text-lg md:text-xl lg:text-2xl ${subTextColor} max-w-3xl mx-auto mb-12 font-light leading-relaxed`}
                >
                    Connect with world-class freelancers or discover your next big project.
                    Built for creators, dreamers, and doers.
                </p>

                {/* Cards */}
                <div ref={ctaRef} className="relative max-w-6xl mx-auto mb-16 px-4">
                    <div className="grid md:grid-cols-2 gap-6 relative">
                        {/* OR Circle - Centered between cards */}
                        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                            <div className={`relative w-20 h-20 rounded-full ${isDark ? 'bg-black border-primary/40' : 'bg-white border-primary/60'} border-2 flex items-center justify-center shadow-2xl shadow-primary/20 backdrop-blur-sm pointer-events-auto`}>
                                <span className="text-primary font-bold text-lg tracking-wider">OR</span>
                                {/* Animated glow */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-yellow-300/20 to-primary/20 blur-xl animate-pulse -z-10" />
                            </div>
                        </div>
                        {/* Business Card */}
                        <div className={`group relative p-8 rounded-3xl flex flex-col ${isDark ? 'bg-linear-to-br from-orange-500/10 via-white/5 to-white/5 border-white/10' : 'bg-white/50 border-gray-200'} backdrop-blur-xl border hover:border-orange-400/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1`}>
                            {/* Badge */}
                            <div className="mb-6">
                                <Badge className={`${isDark ? 'bg-orange-500/15 text-orange-300 border-orange-400/30' : 'bg-orange-50 text-orange-600 border-orange-300'} hover:bg-orange-500/20 border backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wide`}>
                                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                                    For Businesses
                                </Badge>
                            </div>

                            {/* Title */}
                            <h3 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4 leading-tight`}>
                                Hire Elite Talent
                            </h3>

                            {/* Description */}
                            <p className={`${subTextColor} mb-6 leading-relaxed min-h-[72px]`}>
                                Access our curated network of{" "}
                                <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'} font-semibold`}>world-class professionals</span>{" "}
                                ready to transform your vision into reality.
                            </p>

                            {/* Features */}
                            <div className="space-y-3 mb-8 grow">
                                <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>
                                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'} flex items-center justify-center shrink-0`}>
                                        <ShieldCheck className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                                    </div>
                                    <span className="font-medium">Verified expertise</span>
                                </div>
                                <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>
                                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'} flex items-center justify-center shrink-0`}>
                                        <Users className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                                    </div>
                                    <span className="font-medium">50K+ professionals</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link to="/service" className="w-full mt-auto">
                                <Button
                                    size="lg"
                                    className="w-full group/btn bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-6 text-base rounded-2xl shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.02]"
                                >
                                    Explore Talent
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                </Button>
                            </Link>

                            {/* Glow Effect */}
                            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-500 -z-10 blur-xl" />
                        </div>

                        {/* Professional Card */}
                        <div className={`group relative p-8 rounded-3xl flex flex-col ${isDark ? 'bg-linear-to-br from-primary/10 via-white/5 to-white/5 border-white/10' : 'bg-white/50 border-gray-200'} backdrop-blur-xl border hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1`}>
                            {/* Badge */}
                            <div className="mb-6">
                                <Badge className={`${isDark ? 'bg-primary/15 text-primary border-primary/30' : 'bg-primary/10 text-primary border-primary/30'} hover:bg-primary/20 border backdrop-blur-md px-4 py-1.5 text-xs font-semibold uppercase tracking-wide`}>
                                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                                    For Freelancers
                                </Badge>
                            </div>

                            {/* Title */}
                            <h3 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4 leading-tight`}>
                                Launch Your Career
                            </h3>

                            {/* Description */}
                            <p className={`${subTextColor} mb-6 leading-relaxed min-h-[72px]`}>
                                Join an exclusive community and connect with{" "}
                                <span className={`${isDark ? 'text-primary' : 'text-primary'} font-semibold`}>premium opportunities</span>{" "}
                                that match your ambitions.
                            </p>

                            {/* Features */}
                            <div className="space-y-3 mb-8 grow">
                                <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>
                                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-primary/15' : 'bg-primary/10'} flex items-center justify-center shrink-0`}>
                                        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-primary' : 'text-primary'}`} />
                                    </div>
                                    <span className="font-medium">Career acceleration</span>
                                </div>
                                <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-200' : 'text-gray-700'}`}>
                                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-primary/15' : 'bg-primary/10'} flex items-center justify-center shrink-0`}>
                                        <Target className={`w-5 h-5 ${isDark ? 'text-primary' : 'text-primary'}`} />
                                    </div>
                                    <span className="font-medium">Premium clients</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link to="/freelancer/onboarding" className="w-full mt-auto">
                                <Button
                                    size="lg"
                                    className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-6 text-base rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02]"
                                >
                                    Talk With Professionals
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                </Button>
                            </Link>

                            {/* Glow Effect */}
                            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/5 transition-all duration-500 -z-10 blur-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const StatCard = ({ icon, number, suffix = "", label }) => {
    return (
        <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/30 transition-all duration-300 hover:bg-white/10">
            <div className="text-primary/70 mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div
                className="stat-number text-3xl md:text-4xl font-bold text-white mb-1"
                data-target={number}
                data-suffix={suffix}
            >
                0{suffix}
            </div>
            <div className="text-sm text-neutral-400 font-medium">{label}</div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-emerald-500/0 group-hover:from-primary/5 group-hover:to-emerald-500/5 transition-all duration-500 -z-10" />
        </div>
    );
};

export default CatalanceHero;
