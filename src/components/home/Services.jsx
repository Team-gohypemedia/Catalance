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

            {/* Service Categories (Bento Grid) */}
            <section className={`w-full px-4 py-12 md:py-16 flex justify-center ${bgColor}`}>
                <div className="max-w-7xl w-full flex flex-col gap-10">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Expertise</h2>
                        <p className={`${mutedText} max-w-2xl text-lg`}>
                            Specialized teams ready to deploy for your most critical projects.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
                        {/* Card 1: Web Dev (Large) */}
                        <div className={`group relative md:col-span-2 overflow-hidden rounded-xl ${cardBg} shadow-sm border ${borderColor} hover:border-[#ffc800]/50 transition-colors duration-300`}>
                            <div className="absolute inset-0 bg-linear-to-br from-transparent to-[#ffc800]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between z-10">
                                    <div className="bg-[#ffc800]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-[#ffc800]">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">Website Development</h3>
                                        <p className={`${mutedText} mb-6`}>
                                            Scalable architectures using React, Next.js, and modern headless CMS solutions. We build for speed, SEO, and conversion.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {["React", "Next.js", "Shopify"].map((tag) => (
                                                <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium border ${isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <Link to="#" className="inline-flex items-center text-[#ffc800] font-bold hover:underline gap-1">
                                        Explore Web <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                                <div className="w-full md:w-1/2 min-h-[240px] bg-cover bg-center" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBCdxzpqzMp0gUEsDGMB0w0pBDH45rbr6C2372ZiyBdUvPLI7tbKWXCcZS3XLsmZrbBruxoiVLhCGhXKjAKAgS9n5mou7_-Awi7XMQ4EYFSfgu5uPGk_3dE-KavXieZIB-i2GvWVdGvx_at1CBXlKe26iOa1AdTXGiU4uXu9D19k8HuPOqndBK8Nu1yjFflxUkObWpOXz2p3F5YO5NuXddU57b9Oz1oUy920rgcBm7Fj_VL3gGzhvxe_3SSpn92We7E88MXKN8183M")` }}></div>
                            </div>
                        </div>

                        {/* Card 2: App Dev */}
                        <div className={`group relative overflow-hidden rounded-xl ${cardBg} shadow-sm border ${borderColor} hover:border-[#ffc800]/50 transition-colors duration-300 flex flex-col`}>
                            <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDisM3EqSDld6G-53iKW3wYDKOCherok6mEBX1P6cRaXEe6ndVS559L9tcCrA3CJdEH8qsnTQ_Ym8xnXyU_neVUidwazutcBVlLwFmWQxHdnlRa8QfUpQSwRa4nbBQcQks1EIIYN9HUvdW3kHhgf2Pg9NQy5rUiXI190c-60OANGHU26H1BlBNcGgTSbcTAFXromrH_dfRzK0Ofn-zfk0IP45fOfp8WJPR0eaGmSIDVO46B3YJduCpatO3d72588NbHM7w1BcK9bgs")` }}></div>
                            <div className="p-6 flex flex-col flex-grow justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xl font-bold">App Development</h3>
                                        <Smartphone className="text-[#ffc800]" />
                                    </div>
                                    <p className={`text-sm ${mutedText} mb-4`}>
                                         Native iOS, Android, and Flutter applications built for performance and scale.
                                     </p>
                                </div>
                                <Link to="#" className={`inline-flex items-center text-sm font-bold hover:text-[#ffc800] transition-colors gap-1 ${isDark ? "text-white" : "text-black"}`}>
                                     View Details <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Creative */}
                        <div className={`group relative overflow-hidden rounded-xl ${cardBg} shadow-sm border ${borderColor} hover:border-[#ffc800]/50 transition-colors duration-300 flex flex-col`}>
                            <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBF7JnsXkunhU7TsuAtZhfPewW_yJg_6Ix5hlwtrz4g3boexwQ7TvuSqUiJ-tWKgKn_UKOhq_4tEbuWorGN_50eXpETlr-mWx8-4agvRRohgHEroCAFVvJ_6xnp7ybwpn-5VY7QWG3IQ5RL0_HCISsNlVRS-9zaMzCZi4hRMOdrVYUAIqwRC7ZsxtxajQZFuSJODQh700J82Ctc3pXtnes5ik6t6MmYMqYWnCGIrC_jdWHOMsy4W5PV2W8LIn9b3OUxUcL6sCPpVNI")` }}></div>
                            <div className="p-6 flex flex-col flex-grow justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xl font-bold">Creative & Design</h3>
                                        <PenTool className="text-[#ffc800]" />
                                    </div>
                                    <p className={`text-sm ${mutedText} mb-4`}>
                                        World-class UI/UX, branding, and motion design that elevates your brand identity.
                                    </p>
                                </div>
                                <Link to="#" className={`inline-flex items-center text-sm font-bold hover:text-[#ffc800] transition-colors gap-1 ${isDark ? "text-white" : "text-black"}`}>
                                    View Details <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Card 4: Marketing */}
                        <div className={`group relative lg:col-span-2 overflow-hidden rounded-xl ${cardBg} shadow-sm border ${borderColor} hover:border-[#ffc800]/50 transition-colors duration-300`}>
                            <div className="flex flex-col-reverse md:flex-row h-full">
                                <div className="w-full md:w-2/3 p-8 flex flex-col justify-center z-10 order-2 md:order-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <TrendingUp className="text-[#ffc800] w-8 h-8" />
                                        <h3 className="text-2xl font-bold">Performance Marketing</h3>
                                    </div>
                                    <p className={`${mutedText} mb-6 max-w-lg`}>
                                       Data-driven strategies for SEO, PPC, and Content Marketing. We focus on ROI and sustainable growth for your business.
                                   </p>
                                    <div className="flex gap-4">
                                        {["SEO Optimization", "Paid Media"].map((btn) => (
                                            <button key={btn} className={`px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#ffc800] hover:text-[#181710] transition-colors ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                                                {btn}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full md:w-1/3 min-h-[200px] bg-cover bg-center order-1 md:order-2" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB510wjtXjjnV44ToSXfnOSvARQ2jSg7NSDO7k8c65VFp7dp2xIU-SBps7B9m4_uveBxgP62MkDO4CmJBmqRQ7kAN5HorPgbuW20rcAxjF8lO0A5a_PzHq6bSVtZoUJIw3RQOjvbOABrXS4x-MSUy9w-BndluDXnhlUKu3Nznc-90viFqjnSAeVmXtxSUpv_Sz80EB38dpBVgV0Tdgt2WTgWMR1qxSknWji8V9xGCclAcm7rkf3imQ5_53YvSuOYm7kqZVadO_MGbg")` }}></div>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181710] to-transparent"></div>
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
