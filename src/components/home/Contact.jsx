import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  MapPin, 
  Phone, 
  Mail, 
  LifeBuoy, 
  Briefcase, 
  Send, 
  Linkedin, 
  Twitter, 
  Instagram,
  ChevronDown
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const Contact = () => {
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState("dark");
    const containerRef = useRef(null);
    const formRef = useRef(null);

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
    const bgColor = isDark 
        ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a180e] via-black to-black" 
        : "bg-[#f8f8f5]";
    const textColor = isDark ? "text-white" : "text-[#1a180e]";
    const cardBg = isDark ? "bg-white/5" : "bg-white/60";
    const borderColor = isDark ? "border-white/10" : "border-black/5";
    const inputBg = isDark ? "bg-white/5" : "bg-white";
    const mutedText = isDark ? "text-gray-400" : "text-gray-600";
    const primaryText = "text-[#f2cc0d]";

    useGSAP(() => {
        // Hero Fade In
        gsap.set(".hero-content", { y: 30, opacity: 0 });
        gsap.to(".hero-content", {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });

        // Cards Stagger
        gsap.set(".contact-card", { y: 40, opacity: 0 });
        gsap.to(".contact-card", {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.4
        });
    }, { scope: containerRef });

    return (
        <main ref={containerRef} className={`relative min-h-screen w-full ${bgColor} ${textColor} font-sans selection:bg-[#f2cc0d]/30 overflow-x-hidden transition-colors duration-300`}>
            
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 ${isDark ? "bg-[#f2cc0d]/5" : "bg-[#f2cc0d]/20"}`}></div>
                <div className={`absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 ${isDark ? "bg-[#f2cc0d]/5" : "bg-[#f2cc0d]/20"}`}></div>
            </div>

            <div className="relative z-10 flex min-h-screen flex-col">
                {/* Hero Section */}
                <div className="w-full px-4 md:px-10 lg:px-40 pt-28 pb-10 md:pt-32 flex flex-col items-center">
                    <div className={`w-full max-w-[1200px] relative rounded-3xl overflow-hidden min-h-[480px] flex flex-col items-center justify-center text-center p-8 border ${borderColor}`}>
                        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(26, 24, 14, 0.7), rgba(26, 24, 14, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBj_wsjaznNLc-pWIItacXdt5nPujuVWndii9xH5clS6QL9L_DBOofFYQiTbTAasZzfen1BIOgzwytosZiZZrGJEwFjq9ux5pf1tniSQl8ZhyjuRac5e3GOoY03afdQiCWmnA9Q362enQN7z5blHVk6NBDVf2p41GN2PfxhCN8Im0-GiGsgYFAmD72WCfm528nmMsY7-LAgLWnDv48rAL3LZ3Wd-HPxnR_GD433z74IQWx9ZiZGqHc91dPICuUoPeixM2YCl_RMsko6')` }}></div>
                        
                        <div className="relative z-10 flex flex-col gap-6 max-w-3xl mx-auto hero-content">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mx-auto backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-[#f2cc0d] animate-pulse"></span>
                                <span className="text-xs font-medium tracking-wide text-[#f2cc0d] uppercase">24/7 Support Available</span>
                            </div>
                            <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-[-0.03em] drop-shadow-lg">
                                Let&apos;s build something <span className="bg-linear-to-br from-white via-[#f2cc0d] to-[#f2cc0d] bg-clip-text text-transparent">extraordinary.</span>
                            </h1>
                            <p className="text-gray-300 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
                                Have a question or enterprise inquiry? Our team is ready to help you deploy the future.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Grid */}
                <div className="w-full px-4 md:px-10 lg:px-40 py-8">
                    <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Briefcase, title: "Sales Inquiry", value: "sales@catalance.com", link: "mailto:sales@catalance.com" },
                            { icon: LifeBuoy, title: "General Support", value: "support@catalance.com", link: "mailto:support@catalance.com" },
                            { icon: MapPin, title: "Global HQ", value: "100 Innovation Blvd, San Francisco, CA 94105", link: null },
                            { icon: Phone, title: "Phone", value: "+1 (555) 000-0000", link: "tel:+15550000000" }
                        ].map((item, idx) => (
                            <div key={idx} className={`contact-card ${cardBg} backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4 group cursor-pointer border ${borderColor} hover:border-[#f2cc0d] hover:shadow-[0_0_25px_rgba(242,204,13,0.15)] transition-all duration-300 hover:-translate-y-1`}>
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#f2cc0d]/20 to-transparent flex items-center justify-center border border-[#f2cc0d]/20 group-hover:border-[#f2cc0d] transition-colors">
                                    <item.icon className="text-[#f2cc0d] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={`${mutedText} text-sm font-medium uppercase tracking-wider mb-1`}>{item.title}</h3>
                                    {item.link ? (
                                        <a href={item.link} className={`text-lg font-bold leading-tight hover:text-[#f2cc0d] transition-colors block ${isDark ? "text-white" : "text-black"}`}>
                                            {item.value}
                                        </a>
                                    ) : (
                                        <p className={`text-base font-bold leading-snug ${isDark ? "text-white" : "text-black"}`}>
                                            {item.value}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form & Connect Section */}
                <div className="w-full px-4 md:px-10 lg:px-40 py-16 flex justify-center">
                    <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                        {/* Contact Form */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Send us a message</h2>
                                <p className={mutedText}>Fill out the form below and our team will get back to you within 24 hours.</p>
                            </div>
                            <form ref={formRef} className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <label className="flex flex-col gap-2">
                                        <span className={`text-sm font-semibold ml-1 ${mutedText}`}>Name</span>
                                        <input className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 ${isDark ? "text-white placeholder-gray-500" : "text-black placeholder-gray-400"} focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] focus:border-[#f2cc0d] transition-all`} placeholder="John Doe" type="text" />
                                    </label>
                                    <label className="flex flex-col gap-2">
                                        <span className={`text-sm font-semibold ml-1 ${mutedText}`}>Work Email</span>
                                        <input className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 ${isDark ? "text-white placeholder-gray-500" : "text-black placeholder-gray-400"} focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] focus:border-[#f2cc0d] transition-all`} placeholder="john@company.com" type="email" />
                                    </label>
                                </div>
                                <label className="flex flex-col gap-2">
                                    <span className={`text-sm font-semibold ml-1 ${mutedText}`}>Subject</span>
                                    <div className="relative">
                                        <select className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 ${isDark ? "text-white" : "text-black"} appearance-none focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] focus:border-[#f2cc0d] transition-all cursor-pointer`}>
                                            <option className={isDark ? "bg-[#221f10]" : "bg-white"}>General Inquiry</option>
                                            <option className={isDark ? "bg-[#221f10]" : "bg-white"}>Enterprise Sales</option>
                                            <option className={isDark ? "bg-[#221f10]" : "bg-white"}>Technical Support</option>
                                            <option className={isDark ? "bg-[#221f10]" : "bg-white"}>Partnerships</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                                    </div>
                                </label>
                                <label className="flex flex-col gap-2">
                                    <span className={`text-sm font-semibold ml-1 ${mutedText}`}>Message</span>
                                    <textarea className={`w-full ${inputBg} border ${borderColor} rounded-xl p-4 min-h-[160px] ${isDark ? "text-white placeholder-gray-500" : "text-black placeholder-gray-400"} resize-y focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] focus:border-[#f2cc0d] transition-all`} placeholder="How can we help you?"></textarea>
                                </label>
                                <button className="mt-2 w-fit flex items-center justify-center rounded-full h-12 px-8 bg-[#f2cc0d] text-[#232010] text-base font-bold shadow-[0_4px_20px_rgba(242,204,13,0.3)] hover:shadow-[0_6px_25px_rgba(242,204,13,0.5)] hover:-translate-y-0.5 transition-all" type="button">
                                    Send Message <Send className="w-4 h-4 ml-2" />
                                </button>
                            </form>
                        </div>

                        {/* Connect & FAQ */}
                        <div className="lg:col-span-5 flex flex-col gap-10">
                            <div className={`${cardBg} backdrop-blur-md rounded-3xl p-8 border ${borderColor}`}>
                                <h3 className="text-xl font-bold mb-6">Connect with us</h3>
                                <div className="flex gap-4">
                                    {[Linkedin, Twitter, Instagram].map((Icon, i) => (
                                        <Link key={i} to="#" className={`w-12 h-12 rounded-full ${inputBg} border ${borderColor} flex items-center justify-center ${isDark ? "text-white" : "text-black"} hover:bg-[#f2cc0d] hover:text-black hover:border-[#f2cc0d] transition-all duration-300`}>
                                            <Icon className="w-5 h-5 fill-current" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-lg font-bold">Common Questions</h3>
                                <Accordion type="single" collapsible className="space-y-3">
                                    {[
                                        { q: "What is your response time?", a: "For enterprise inquiries, we typically respond within 4 hours. General support requests are answered within 24 hours." },
                                        { q: "Do you offer custom demos?", a: "Yes! Contact our sales team using the form to schedule a personalized walkthrough of the Catalance platform." },
                                        { q: "Where are your data centers?", a: "We have primary data hubs in New York, London, and Singapore to ensure low-latency global coverage." }
                                    ].map((faq, i) => (
                                        <AccordionItem key={i} value={`item-${i}`} className={`${inputBg} border ${borderColor} rounded-xl overflow-hidden px-1`}>
                                            <AccordionTrigger className={`px-4 py-4 text-base font-medium hover:text-[#f2cc0d] hover:no-underline ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-4 text-sm text-gray-400">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
};

export default Contact;
