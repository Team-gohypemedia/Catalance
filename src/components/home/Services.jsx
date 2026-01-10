import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ArrowRight,
    Globe,
    Smartphone,
    PenTool,
    TrendingUp,
    ClipboardList,
    Brain,
    Handshake,
    DollarSign,
    Monitor,
    Layout,
    Palette,
    Megaphone,
    PhoneCall,
    Briefcase
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const Services = () => {
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState("dark");
    const containerRef = useRef(null);

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
    const bgColor = isDark ? "bg-[#181710]" : "bg-[#f8f8f5]";
    const textColor = isDark ? "text-white" : "text-[#181710]";
    const cardBg = isDark ? "bg-[#28251b]" : "bg-white";
    const mutedText = isDark ? "text-gray-400" : "text-gray-600";
    const borderColor = isDark ? "border-white/5" : "border-gray-200";

    useGSAP(() => {
        // Simple fade-in for hero elements
        gsap.from(".hero-animate", {
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });
    }, { scope: containerRef });

    return (
        <main ref={containerRef} className={`relative min-h-screen w-full ${bgColor} ${textColor} font-sans selection:bg-[#ffc800]/30 transition-colors duration-300`}>

            {/* Hero Section */}
            <section className="relative w-full py-20 lg:py-32 px-4 flex justify-center">
                <div className="max-w-7xl w-full">
                    <div className="relative flex min-h-[480px] flex-col gap-6 overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat items-center justify-center p-8 text-center"
                        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAjxMysTiJBOFF-OfHfchNpaxZj70r5d-imh1-Lj_kCS3Xx-hSPqK9AlTGvfjqynGdfk2k3XxhM5eTzpEkjwHpTfAQgSvMg4O6VY1b8ugH9pnpS8XzCltnWdGABHohJzajRyvA_iMscFqMpWE18lQ_9RmpZyjY7VKwUCk10MZj2KrdvmJfzEpZcXiC-smjQI7bPgkZ4gF3v1I3zPesMNYRmq_riTjVM_9_OlkDyYE9I4CTNZoAi61KZRTekVu_6PkcmF4oTM3dfQaU")` }}>

                        <div className="flex flex-col gap-4 max-w-3xl z-10 hero-animate">
                            <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight">
                                Expertise that <span className="text-[#ffc800]">scales</span> with you.
                            </h1>
                            <h2 className="text-gray-200 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
                                From MVP to Enterprise, access the top 1% of global talent tailored to your specific needs.
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 z-10 mt-4 hero-animate">
                            <Button size="lg" className="h-12 px-8 text-base font-bold bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] hover:scale-105 transition-all">
                                Find Talent
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-bold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white transition-colors">
                                View Portfolio
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Categories - Card Grid with 3D Icons */}
            <section className={`w-full px-4 py-12 md:py-16 flex justify-center ${bgColor}`}>
                <div className="max-w-7xl w-full flex flex-col gap-10">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Expertise</h2>
                        <p className={`${mutedText} max-w-2xl text-lg`}>
                            Specialized teams ready to deploy for your most critical projects.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Card 1: Web Development */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="h-56 w-full bg-linear-to-br from-[#ffa726] via-[#ff9800] to-[#ff7043] flex items-center justify-center p-6">
                                <img
                                    src="/src/assets/icons/web_dev_icon.png"
                                    alt="Web Development"
                                    className="w-32 h-32 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div className={`p-5 ${isDark ? "bg-[#1a1915]" : "bg-white"} border-t-4 border-[#ff5722]`}>
                                <h3 className="text-lg font-bold mb-3 text-center">Website Development</h3>
                                <Button className="w-full bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] font-bold rounded-lg">
                                    Chat Now
                                </Button>
                            </div>
                        </div>

                        {/* Card 2: App Development */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="h-56 w-full bg-linear-to-br from-[#ffa726] via-[#ff9800] to-[#ff7043] flex items-center justify-center p-6">
                                <img
                                    src="/src/assets/icons/app_dev_icon.png"
                                    alt="App Development"
                                    className="w-32 h-32 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div className={`p-5 ${isDark ? "bg-[#1a1915]" : "bg-white"} border-t-4 border-[#ff5722]`}>
                                <h3 className="text-lg font-bold mb-3 text-center">App Development</h3>
                                <Button className="w-full bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] font-bold rounded-lg">
                                    Chat Now
                                </Button>
                            </div>
                        </div>

                        {/* Card 3: Creative & Design */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="h-56 w-full bg-linear-to-br from-[#ffa726] via-[#ff9800] to-[#ff7043] flex items-center justify-center p-6">
                                <img
                                    src="/src/assets/icons/creative_design_icon.png"
                                    alt="Creative Design"
                                    className="w-32 h-32 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div className={`p-5 ${isDark ? "bg-[#1a1915]" : "bg-white"} border-t-4 border-[#ff5722]`}>
                                <h3 className="text-lg font-bold mb-3 text-center">Creative & Design</h3>
                                <Button className="w-full bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] font-bold rounded-lg">
                                    Chat Now
                                </Button>
                            </div>
                        </div>

                        {/* Card 4: Performance Marketing */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="h-56 w-full bg-linear-to-br from-[#ffa726] via-[#ff9800] to-[#ff7043] flex items-center justify-center p-6">
                                <img
                                    src="/src/assets/icons/marketing_icon.png"
                                    alt="Marketing"
                                    className="w-32 h-32 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                            <div className={`p-5 ${isDark ? "bg-[#1a1915]" : "bg-white"} border-t-4 border-[#ff5722]`}>
                                <h3 className="text-lg font-bold mb-3 text-center">Marketing</h3>
                                <Button className="w-full bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] font-bold rounded-lg">
                                    Chat Now
                                </Button>
                            </div>
                        </div>

                        {/* Card 5: Voice Agent */}
                        <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                            <div className="h-56 w-full bg-linear-to-br from-[#ffa726] via-[#ff9800] to-[#ff7043] flex items-center justify-center p-6">
                                <PhoneCall className="w-20 h-20 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className={`p-5 ${isDark ? "bg-[#1a1915]" : "bg-white"} border-t-4 border-[#ff5722]`}>
                                <h3 className="text-lg font-bold mb-3 text-center">Voice Agent (AI Voice Bot / Call Automation)</h3>
                                <Button className="w-full bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] font-bold rounded-lg">
                                    Chat Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="w-full px-4 py-16 md:py-24 bg-[#12110c] text-white">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-gray-400">Simple, transparent, and efficient.</p>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-linear-to-r from-gray-800 via-[#ffc800]/50 to-gray-800 z-0"></div>

                        {[
                            { step: "1. Post a Brief", text: "Describe your project, budget, and timeline.", icon: ClipboardList },
                            { step: "2. AI Matching", text: "Our algorithm finds the top 1% talent.", icon: Brain },
                            { step: "3. Collaborate", text: "Work directly with experts via workspace.", icon: Handshake },
                            { step: "4. Secure Pay", text: "Release payment only when milestones are met.", icon: DollarSign }
                        ].map((item, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-[#1e1c15] border-2 border-[#3a3627] group-hover:border-[#ffc800] transition-colors flex items-center justify-center mb-6 shadow-lg shadow-black/50">
                                    <item.icon className="w-10 h-10 text-gray-300 group-hover:text-[#ffc800] transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.step}</h3>
                                <p className="text-sm text-gray-400 px-4">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className={`w-full px-4 py-16 md:py-24 ${bgColor}`}>
                <div className="max-w-3xl mx-auto w-full">
                    <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="space-y-4">
                        {[
                            { q: "How do you vet talent?", a: "We use a rigorous 5-step vetting process including portfolio reviews, technical coding challenges, English proficiency tests, and live video interviews. Only the top 1% of applicants join Catalance." },
                            { q: "What are the fees?", a: "Clients pay the project price or hourly rate set by the talent plus a small platform service fee (typically 5%). There are no hidden subscription costs for clients." },
                            { q: "Is there a trial period?", a: "Yes. For hourly contracts, you have a risk-free trial period of up to 20 hours. If you're not satisfied, you don't pay. We ensure the perfect match before commitment." },
                            { q: "Can I hire a full team?", a: "Absolutely. Catalance specializes in assembling cross-functional teams (PMs, Developers, Designers) for complex enterprise projects." }
                        ].map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className={`border ${borderColor} rounded-lg ${cardBg} overflow-hidden px-2`}>
                                <AccordionTrigger className={`px-4 text-lg font-bold hover:no-underline ${isDark ? "hover:text-[#ffc800]" : "hover:text-black"}`}>
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className={`px-4 pb-6 text-base ${mutedText}`}>
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="w-full py-20 px-4 relative overflow-hidden flex items-center justify-center min-h-[400px]">
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Futuristic dark cyber technology background"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzCs8GFeT9MRHYD-XO1pVjFbW5Wb5n3V-6gHt68r2qkfStt92aZE20P4bLU4GbIOBRssvnRafbtcv2_Ct4zlF0fL4__ATiOI9PaqsP2yIT7uHxwjBpFMnK2Wf52cM-xIUy25P5GktntQ9SO6Eqhr3OnYJUmgyuK1lZEUaUJCpW76yQd56NnCKPFyLbZjAloUaRqXDCqdjBWH4r5n5dJIyZiSQya_euH4bKJiIELVkzHpfh6NGMpF5vCvaszA79Z0Va51X_3lkorjo"
                    />
                    <div className="absolute inset-0 bg-black/70 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-linear-to-t from-[#181710] to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-4xl w-full text-center flex flex-col items-center gap-6">
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                        Ready to build the <span className="text-[#ffc800]">future</span>?
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl">
                        Join hundreds of fast-growing companies scaling with Catalance.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
                        <Button size="lg" className="h-14 px-8 text-lg font-bold bg-[#ffc800] text-[#181710] hover:bg-[#e5b400] w-full sm:w-auto">
                            Start Hiring Now
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-2 border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white w-full sm:w-auto">
                            Talk to Sales
                        </Button>
                    </div>
                </div>
            </section>

        </main>
    );
};

export default Services;

