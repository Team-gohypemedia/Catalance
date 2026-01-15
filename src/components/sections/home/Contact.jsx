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
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import LifeBuoy from "lucide-react/dist/esm/icons/life-buoy";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Send from "lucide-react/dist/esm/icons/send";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import { useTheme } from "@/components/providers/theme-provider";

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
                            { icon: Briefcase, title: "Sales Inquiry", value: "gourav@gohypemedia.com", link: "mailto:gourav@gohypemedia.com" },
                            { icon: LifeBuoy, title: "General Support", value: "support@catalance.com", link: "mailto:support@catalance.com" },
                            { icon: MapPin, title: "Global HQ", value: "D-6/1, Pocket D, Okhla Phase II, Okhla Industrial Estate, New Delhi, Delhi 110020", link: null },
                            { icon: Phone, title: "Phone", value: "+91 8447788703", link: "tel:+918447788703" }
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
                                    {[
                                        { 
                                            icon: (props) => (
                                                <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                </svg>
                                            ), 
                                            color: "hover:text-[#1877F2] hover:border-[#1877F2]" 
                                        },
                                        { 
                                            icon: (props) => (
                                                <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                                                </svg>
                                            ), 
                                            color: "hover:text-[#0A66C2] hover:border-[#0A66C2]" 
                                        },
                                        { 
                                            icon: (props) => (
                                                <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                                </svg>
                                            ), 
                                            color: "hover:text-[#E4405F] hover:border-[#E4405F]" 
                                        },
                                        { 
                                           icon: (props) => (
                                                <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
                                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                </svg>
                                           ),
                                           color: "hover:text-[#FF0000] hover:border-[#FF0000]"
                                        }
                                    ].map((Social, i) => (
                                        <a key={i} href="#" className={`w-12 h-12 rounded-full ${inputBg} border ${borderColor} flex items-center justify-center ${isDark ? "text-white" : "text-black"} transition-all duration-300 hover:bg-neutral-800/80 hover:shadow-lg ${Social.color}`}>
                                            <Social.icon className="w-5 h-5 fill-current" />
                                        </a>
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
