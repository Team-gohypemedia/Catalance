import { useRef, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spotlight } from "@/components/ui/spotlight";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  Target, 
  ShieldCheck, 
  Zap, 
  Rocket,
  Globe,
  Heart,
  Briefcase
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

gsap.registerPlugin(SplitText, useGSAP);

const StatCard = ({ icon, number, suffix = "", label, isDark }) => {
    return (
        <div className={`group relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${
            isDark 
                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30" 
                : "bg-white/60 border-black/5 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        }`}>
            <div className={`mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300 ${
                isDark ? "text-primary/70" : "text-primary"
            }`}>
                {icon}
            </div>
            <div
                className={`stat-number text-3xl md:text-4xl font-bold mb-1 text-center ${
                    isDark ? "text-white" : "text-gray-900"
                }`}
                data-target={number}
                data-suffix={suffix}
            >
                0{suffix}
            </div>
            <div className={`text-sm font-medium text-center ${
                isDark ? "text-neutral-400" : "text-gray-600"
            }`}>{label}</div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-emerald-500/0 group-hover:from-primary/5 group-hover:to-emerald-500/5 transition-all duration-500 -z-10" />
        </div>
    );
};

const ValueCard = ({ icon: Icon, title, description, isDark }) => (
    <Card className={`border-none shadow-none bg-transparent overflow-hidden group relative`}>
        <CardContent className="p-0">
             <div className={`p-8 rounded-3xl h-full border transition-all duration-300 ${
                isDark 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/20" 
                    : "bg-white/50 border-black/5 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
             } backdrop-blur-md`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${
                    isDark ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black" : "bg-primary/10 text-primary-700 group-hover:bg-primary group-hover:text-white"
                }`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {title}
                </h3>
                <p className={`leading-relaxed ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
                    {description}
                </p>
            </div>
        </CardContent>
    </Card>
);

const About = () => {
    const containerRef = useRef(null);
    const heroTextRef = useRef(null);
    const heroGradientRef = useRef(null);
    const heroDescRef = useRef(null);
    const statsRef = useRef(null);
    const timelineRef = useRef(null);
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState("dark");

    // Detect actual theme
    useEffect(() => {
        if (typeof window === "undefined") return;
        const root = window.document.documentElement;
        const checkTheme = () => setResolvedTheme(root.classList.contains("dark") ? "dark" : "light");
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const isDark = resolvedTheme === "dark";
    const bgColor = isDark ? "bg-black" : "bg-white";
    const textColor = isDark ? "text-white" : "text-gray-900";
    const mutedTextColor = isDark ? "text-neutral-400" : "text-gray-600";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

    useGSAP(() => {
        if (!heroTextRef.current) return;

        // Initial setup for all animated elements
        const childSplit = new SplitText(heroTextRef.current, { type: "words,chars" });
        
        // 1. Text plain
        gsap.set(childSplit.chars, { autoAlpha: 0, y: 50, rotateX: -90 });
        // 2. Text gradient
        gsap.set(heroGradientRef.current, { autoAlpha: 0, y: 30, scale: 0.95 });
        // 3. Description
        gsap.set(heroDescRef.current, { autoAlpha: 0, y: 20 });
        // 4. Stats
        gsap.set(statsRef.current?.children || [], { autoAlpha: 0, y: 30 });

        // Create timeline
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        
        // Build sequence using .to()
        tl.to(childSplit.chars, {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.02,
            duration: 1
        })
        .to(heroGradientRef.current, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.8
        }, "-=0.6")
        .to(heroDescRef.current, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8
        }, "-=0.4")
        .to(statsRef.current?.children || [], {
            autoAlpha: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8
        }, "-=0.4");
        
    }, { scope: containerRef });

    // Stats Counter Animation (GSAP for smoothness)
    useEffect(() => {
        const counters = document.querySelectorAll(".stat-number");
        const ctx = gsap.context(() => {
            counters.forEach((counter) => {
                const target = parseInt(counter.getAttribute("data-target"));
                const suffix = counter.getAttribute("data-suffix") || "";
                
                // Animate from 0 to target
                const obj = { value: 0 };
                
                // Use ScrollTrigger logic if possible, otherwise just on mount/view
                // Since there's a parent animation that fades them in, we can start counting effectively immediately 
                // or wait for the fade in. Given the parent GSAP timeline, the elements fade in. 
                // Let's just run it immediately as they appear.
                
                gsap.to(obj, {
                    value: target,
                    duration: 2.5,
                    ease: "power2.out",
                    onUpdate: () => {
                        counter.textContent = Math.floor(obj.value) + suffix;
                    }
                });
            });
        });
        return () => ctx.revert();
    }, []);

    const stats = [
        { icon: <Users className="w-6 h-6" />, number: 50, suffix: "k+", label: "Active Freelancers" },
        { icon: <Briefcase className="w-6 h-6" />, number: 120, suffix: "+", label: "Countries Served" },
        { icon: <Target className="w-6 h-6" />, number: 98, suffix: "%", label: "Project Success" },
        { icon: <Star className="w-6 h-6" />, number: 15, suffix: "M+", label: "Paid to Talent" },
    ];

    // Helper to allow generic icons in array
    function Star(props) { return <Sparkles {...props} /> }

    return (
        <main ref={containerRef} className={`relative min-h-screen w-full ${bgColor} ${textColor} overflow-hidden font-sans selection:bg-primary/30`}>
            {/* Background Grid */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                }}
            />

            {/* Spotlights */}
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 opacity-50" fill={isDark ? "#fdc800" : "#f59e0b"} />
            <Spotlight className="top-40 right-0 md:right-40 opacity-30" fill={isDark ? "#3b82f6" : "#60a5fa"} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
                {/* Hero Section */}
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5 hover:bg-primary/20 transition-colors">
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Our Story
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                        <span ref={heroTextRef} className="inline-block">Revolutionizing how the world </span> <span ref={heroGradientRef} className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${isDark ? "from-primary via-yellow-200 to-primary" : "from-primary via-orange-400 to-primary"}`}>works together.</span>
                    </h1>
                    <p ref={heroDescRef} className={`text-lg md:text-xl ${mutedTextColor} max-w-2xl mx-auto leading-relaxed`}>
                        We built Catalance to bridge the gap between extraordinary talent and visionary enterprises. No friction, just results.
                    </p>
                </div>

                {/* Stats Grid */}
                <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32">
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} {...stat} isDark={isDark} />
                    ))}
                </div>

                {/* Mission Section */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="relative">
                         <div className={`absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary to-purple-600 opacity-20 blur-2xl ${isDark ? "opacity-20" : "opacity-10"}`} />
                         <div className={`relative p-8 md:p-12 rounded-3xl border overflow-hidden ${
                             isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-2xl shadow-primary/5"
                         }`}>
                             <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
                             <p className={`${mutedTextColor} text-lg mb-6 leading-relaxed`}>
                                 To empower trusted relationships between businesses and independent professionals. We believe the future of work is flexible, meritocratic, and borderless.
                             </p>
                             <ul className="space-y-4">
                                 {[
                                     "Transparent pricing models",
                                     "AI-powered talent matching",
                                     "Guaranteed payment protection"
                                 ].map((item, i) => (
                                     <li key={i} className="flex items-center gap-3">
                                         <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                             <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                                         </div>
                                         <span className={isDark ? "text-neutral-200" : "text-gray-700"}>{item}</span>
                                     </li>
                                 ))}
                             </ul>
                         </div>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold mb-4">Built for the bold.</h2>
                            <p className={`${mutedTextColor} text-lg leading-relaxed`}>
                                Whether you're a startup scaling up or a professional breaking free from the 9-to-5, Catalance provides the infrastructure for your success.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className={`bg-transparent border ${isDark ? "border-white/10" : "border-black/10"}`}>
                                <CardContent className="p-6">
                                    <Rocket className="w-8 h-8 text-blue-500 mb-4" />
                                    <h4 className="font-bold text-lg mb-2">Moving Fast</h4>
                                    <p className={`text-sm ${mutedTextColor}`}>Connect and start working within 24 hours.</p>
                                </CardContent>
                            </Card>
                            <Card className={`bg-transparent border ${isDark ? "border-white/10" : "border-black/10"}`}>
                                <CardContent className="p-6">
                                    <Globe className="w-8 h-8 text-emerald-500 mb-4" />
                                    <h4 className="font-bold text-lg mb-2">Global Reach</h4>
                                    <p className={`text-sm ${mutedTextColor}`}>Talent from over 120 countries at your fingertips.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Catalance?</h2>
                        <p className={`${mutedTextColor} max-w-2xl mx-auto`}>Our core values drive every decision we make.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <ValueCard 
                            icon={Heart}
                            title="People First"
                            description="We prioritize the human connection in every transaction. Technology serves people, not the other way around."
                            isDark={isDark}
                        />
                        <ValueCard 
                            icon={Zap}
                            title="Unmatched Speed"
                            description="Time is your most valuable asset. Our platform is optimized to get you from idea to execution instantly."
                            isDark={isDark}
                        />
                        <ValueCard 
                            icon={ShieldCheck}
                            title="Total Trust"
                            description="With enterprise-grade security and escrow protection, you can focus on the work, not the risk."
                            isDark={isDark}
                        />
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative rounded-[2.5rem] overflow-hidden">
                    <div className="absolute inset-0 bg-primary/10" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? "from-black/80 via-black/50 to-transparent" : "from-white/80 via-white/50 to-transparent"} z-10`} />
                    <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070" 
                        alt="Team collaboration" 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
                    />
                    
                    <div className="relative z-20 p-12 md:p-24 text-center max-w-3xl mx-auto">
                        <h2 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>
                            Ready to start your journey?
                        </h2>
                        <p className={`text-xl mb-10 ${isDark ? "text-neutral-300" : "text-gray-700"}`}>
                            Join thousands of forward-thinking companies and independent professionals.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(253,200,0,0.3)] hover:shadow-[0_0_30px_rgba(253,200,0,0.5)] transition-all transform hover:-translate-y-1">
                                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link to="/contact">
                                <Button size="lg" variant="outline" className={`h-14 px-8 text-lg rounded-full border-2 ${isDark ? "bg-black/50 border-white/20 text-white hover:bg-white/10" : "bg-white/50 border-black/10 text-black hover:bg-white"} backdrop-blur-md transition-all`}>
                                    Contact Sales
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default About;
