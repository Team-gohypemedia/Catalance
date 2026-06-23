import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import { toast } from "sonner";
import { submitContactInquiry } from "@/shared/lib/api-client";
import { indiaPaths } from "./india_svg_paths";

const cities = [
  // Tier 1 Cities
  { name: "Delhi (NCR)", top: "30.2%", left: "30.4%", type: "T1", isHQ: true },
  { name: "Mumbai", top: "63.0%", left: "16.6%", type: "T1" },
  { name: "Bangalore", top: "84.0%", left: "31.7%", type: "T1" },
  { name: "Hyderabad", top: "68.8%", left: "34.5%", type: "T1" },
  { name: "Kolkata", top: "51.0%", left: "66.2%", type: "T1" },
  { name: "Chennai", top: "83.6%", left: "40.2%", type: "T1" },
  { name: "Pune", top: "64.9%", left: "19.7%", type: "T1" },
  { name: "Ahmedabad", top: "49.5%", left: "15.6%", type: "T1" },

  // Tier 2 Cities
  { name: "Jaipur", top: "36.1%", left: "25.9%", type: "T2" },
  { name: "Lucknow", top: "36.3%", left: "42.4%", type: "T2" },
  { name: "Patna", top: "40.6%", left: "55.8%", type: "T2" },
  { name: "Indore", top: "50.5%", left: "26.1%", type: "T2" },
  { name: "Surat", top: "55.8%", left: "16.4%", type: "T2" },
  { name: "Nagpur", top: "55.9%", left: "36.5%", type: "T2" },
  { name: "Kochi", top: "94.5%", left: "27.4%", type: "T2" },
  { name: "Coimbatore", top: "90.7%", left: "29.6%", type: "T2" },
  { name: "Bhubaneswar", top: "58.8%", left: "58.0%", type: "T2" },
  { name: "Chandigarh", top: "22.9%", left: "29.1%", type: "T2" },
  { name: "Guwahati", top: "38.7%", left: "77.0%", type: "T2" },
  { name: "Srinagar", top: "11.4%", left: "22.7%", type: "T2" },
  { name: "Dehradun", top: "24.4%", left: "33.1%", type: "T2" },
  { name: "Raipur", top: "55.5%", left: "44.6%", type: "T2" },
  { name: "Ranchi", top: "48.3%", left: "56.4%", type: "T2" },
  { name: "Jodhpur", top: "38.4%", left: "17.0%", type: "T2" },
  { name: "Visakhapatnam", top: "67.8%", left: "49.7%", type: "T2" },
  { name: "Madurai", top: "94.5%", left: "33.4%", type: "T2" },
];

const Contact = () => {
  const [resolvedTheme, setResolvedTheme] = useState("dark");
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [hoveredCity, setHoveredCity] = useState(null);

  // Detect actual theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    const checkTheme = () =>
      setResolvedTheme(root.classList.contains("dark") ? "dark" : "light");
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isDark = resolvedTheme === "dark";
  const bgColor = "bg-background";
  const textColor = isDark ? "text-white" : "text-[#1a180e]";
  const cardBg = isDark ? "bg-white/5" : "bg-white/60";
  const borderColor = isDark ? "border-white/10" : "border-black/5";
  const inputBg = isDark ? "bg-white/5" : "bg-white";
  const mutedText = isDark ? "text-gray-400" : "text-gray-600";
  
  // Theme-aware brand colors
  const brandTextClass = isDark ? 'text-primary' : 'text-[#D9692A]';
  const brandBgClass = isDark ? 'bg-primary' : 'bg-[#D9692A]';
  const brandTextOnBgClass = isDark ? 'text-primary-foreground' : 'text-white';
  
  useGSAP(
    () => {
      // Elements Fade In
      gsap.set(".hero-content", { y: 30, opacity: 0 });
      gsap.to(".hero-content", {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.set(".contact-card", { y: 20, opacity: 0 });
      gsap.to(".contact-card", {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.3,
      });
    },
    { scope: containerRef },
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await submitContactInquiry({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: "Contact Inquiry",
        message: formData.message.trim(),
      });

      toast.success("Message sent successfully.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      const message =
        error?.message ||
        "We could not send your message right now. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      ref={containerRef}
      className={`relative min-h-screen w-full pt-32 pb-16 px-4 md:px-10 lg:px-20 xl:px-40 ${bgColor} ${textColor} font-sans overflow-x-hidden transition-colors duration-300 ${isDark ? 'selection:bg-primary/30' : 'selection:bg-[#D9692A]/30'}`}
    >
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 ${isDark ? 'bg-primary/10' : 'bg-[#D9692A]/5'}`}
        ></div>
        <div
          className={`absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 ${isDark ? 'bg-primary/10' : 'bg-[#D9692A]/5'}`}
        ></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto flex flex-col gap-6 md:gap-10">
        
        {/* 1. Hero Section — target design */}
        <div className={`hero-content relative w-full rounded-2xl border ${borderColor} overflow-hidden`}
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#FAF7F4' }}
        >
          <div className="flex flex-col sm:flex-row items-stretch">

            {/* ── LEFT PANEL ── */}
            <div className="relative flex flex-row items-center sm:w-1/2 overflow-hidden py-8 px-6 sm:py-10 sm:px-10 gap-4 sm:gap-6">

              {/* Salmon decorative quote strokes — adjusted size and position */}
              <svg
                viewBox="0 0 90 110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="absolute top-4 left-4 w-10 h-12 sm:w-12 sm:h-14 pointer-events-none select-none"
                style={{ opacity: isDark ? 0.18 : 1 }}
              >
                {/* Left stroke */}
                <path
                  d="M14 100 L14 62 C14 38 32 38 32 18"
                  stroke={isDark ? '#F9D949' : '#e8b49a'}
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Right stroke */}
                <path
                  d="M52 100 L52 62 C52 38 70 38 70 18"
                  stroke={isDark ? '#F9D949' : '#e8b49a'}
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              </svg>

              {/* Phone image — slightly larger to balance the container, adjusted left margin */}
              <div className="relative z-10 shrink-0 -mb-8 -ml-1 sm:-mb-10 sm:-ml-2">
                <img
                  src="/retro-phone.png"
                  alt="Retro cordless telephone"
                  className="h-48 sm:h-60 w-auto object-contain"
                  draggable={false}
                />
              </div>

              {/* Heading + fromYou pill — beside the phone, aligned nicely */}
              <div className="relative z-10 flex flex-col items-start justify-center gap-2.5 min-w-0 flex-1 pl-1">
                <h1
                  className="font-extrabold leading-tight tracking-tight"
                  style={{
                    fontSize: 'clamp(1.15rem, 2.2vw, 1.85rem)',
                    color: isDark ? '#ffffff' : '#1a1209',
                  }}
                >
                  We Would Love to Hear
                </h1>
                <span
                  className={`italic font-bold rounded-xl px-5 py-2 text-base sm:text-lg ${brandBgClass} ${brandTextOnBgClass}`}
                  style={{ letterSpacing: '-0.01em' }}
                >
                  fromYou
                </span>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="relative flex flex-col justify-center px-8 py-10 sm:px-12 sm:py-12 sm:w-1/2">
              <p className={`text-sm md:text-base leading-relaxed max-w-sm ${mutedText}`}>
                Thank you for your interest in Catalance. We value your thoughts, questions, and feedback. Please don't hesitate to reach out to us. Our dedicated team is here to assist you.
              </p>
              
              {/* Social icons — beneath text on mobile, bottom-right on sm */}
              <div className="mt-8 sm:mt-0 sm:absolute sm:bottom-6 sm:right-12 flex gap-3 justify-end">
                {[
                  {
                    href: "https://www.facebook.com/profile.php?id=61586800500990",
                    label: "Facebook",
                    icon: (props) => (
                      <svg viewBox="0 0 24 24" {...props}>
                        <path d="M9.101 23.69h4.837v-10.74h3.244l.477-4.185H13.938v-2.67c0-1.127.265-1.9 1.83-1.9h2.24V.5C17.624.444 16.03 0 14.28 0 10.623 0 8.007 2.23 8.007 6.31v3.454H4.898v4.185H8.01V23.69H9.1z" fill="currentColor"/>
                      </svg>
                    ),
                  },
                  {
                    href: "https://www.linkedin.com/company/catalance/?viewAsMember=true",
                    label: "LinkedIn",
                    icon: (props) => (
                      <svg viewBox="0 0 24 24" {...props}>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor"/>
                      </svg>
                    ),
                  },
                  {
                    href: "https://www.instagram.com/catalance_official/",
                    label: "Instagram",
                    icon: (props) => (
                      <svg viewBox="0 0 24 24" {...props}>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.33.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.33 0 8.74 0 12s.014 3.67.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.257 0 3.666-.014 4.947-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.257-.014-3.67-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.666.014 15.257 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" fill="currentColor"/>
                      </svg>
                    ),
                  },
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-11 h-11 rounded-full flex items-center justify-center ${brandBgClass} ${brandTextOnBgClass} hover:-translate-y-1 transition-transform shadow-md`}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 2. Contact Grid (4 horizontal cards) */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { title: "Address", value: "New Delhi, India", link: null },
            { title: "You Can Email Here", value: "support@catalance.in", link: "mailto:support@catalance.in" },
            { title: "Call us on", value: "+91 8882855425", link: "tel:+918882855425" },
            { title: "Working Hours", value: "10:00 am - 6:00 pm", link: null },
          ].map((item, idx) => {
            const CardElement = item.link ? "a" : "div";
            const extraProps = item.link ? { href: item.link } : {};

            return (
              <CardElement
                key={idx}
                {...extraProps}
                className={`contact-card flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-5 gap-2 sm:gap-0 rounded-xl border ${borderColor} ${cardBg} backdrop-blur-md group hover:-translate-y-1 transition-transform cursor-pointer relative overflow-hidden`}
              >
                <div className="flex flex-col gap-1 overflow-hidden pr-8 sm:pr-2 text-left">
                  <span className={`text-[9px] sm:text-[11px] md:text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{item.title}</span>
                  <span className={`text-[11px] sm:text-sm md:text-base font-bold truncate transition-colors ${item.link ? `${textColor} group-hover:opacity-70` : ""}`}>
                    {item.value}
                  </span>
                </div>
                <div className={`absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center bg-neutral-900 text-white dark:bg-white dark:text-black transition-transform group-hover:scale-110`}>
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-black" />
                </div>
              </CardElement>
            );
          })}
        </div>

        {/* (Map Section Moved Below Form) */}

        {/* 3. Main Form Section */}
        <div className={`hero-content w-full rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md overflow-hidden p-6 md:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center`}>
          {/* Left Text Side */}
          <div className="lg:col-span-5 flex flex-col justify-center">
             <div className="max-w-sm">
                <div className="relative inline-block mb-3 mt-4 md:mt-6">
                   <h2 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight">
                     <span className="relative inline-block">
                       {/* Sparkle SVG centered directly above the "G" */}
                       <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -top-5 left-1/2 -translate-x-1/2 ${brandTextClass}`}>
                         <path d="M20 18V4M10 22L4 10M30 22L36 10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                       </svg>
                       G
                     </span>et In <span className={brandTextClass}>Touch</span>
                   </h2>
                </div>
                <p className={`text-sm leading-relaxed ${mutedText}`}>
                  We'd love to hear from you. Whether you have a question, need.
                </p>
             </div>
          </div>
          
          {/* Right Form Side */}
          <div className="lg:col-span-7">
             <form ref={formRef} className="flex flex-col gap-4 sm:gap-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                   <label className="flex flex-col gap-1.5">
                     <span className={`text-[13px] font-semibold ${textColor}`}>First Name</span>
                      <input name="firstName" className={`w-full ${inputBg} border ${borderColor} rounded-lg px-2.5 sm:px-4 h-10 sm:h-11 focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-primary focus:border-primary' : 'focus:ring-[#D9692A] focus:border-[#D9692A]'} transition-all text-xs sm:text-sm`} placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required />
                   </label>
                   <label className="flex flex-col gap-1.5">
                     <span className={`text-[13px] font-semibold ${textColor}`}>Last Name</span>
                      <input name="lastName" className={`w-full ${inputBg} border ${borderColor} rounded-lg px-2.5 sm:px-4 h-10 sm:h-11 focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-primary focus:border-primary' : 'focus:ring-[#D9692A] focus:border-[#D9692A]'} transition-all text-xs sm:text-sm`} placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required />
                   </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <label className="flex flex-col gap-1.5">
                     <span className={`text-[13px] font-semibold ${textColor}`}>Email</span>
                      <input name="email" type="email" className={`w-full ${inputBg} border ${borderColor} rounded-lg px-2.5 sm:px-4 h-10 sm:h-11 focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-primary focus:border-primary' : 'focus:ring-[#D9692A] focus:border-[#D9692A]'} transition-all text-xs sm:text-sm`} placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                   </label>
                   <label className="flex flex-col gap-1.5">
                     <span className={`text-[13px] font-semibold ${textColor}`}>Phone</span>
                      <input name="phone" type="tel" className={`w-full ${inputBg} border ${borderColor} rounded-lg px-2.5 sm:px-4 h-10 sm:h-11 focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-primary focus:border-primary' : 'focus:ring-[#D9692A] focus:border-[#D9692A]'} transition-all text-xs sm:text-sm`} placeholder="Phone" value={formData.phone} onChange={handleInputChange} />
                   </label>
                </div>
                <label className="flex flex-col gap-1.5">
                     <span className={`text-[13px] font-semibold ${textColor}`}>Message</span>
                     <textarea name="message" className={`w-full ${inputBg} border ${borderColor} rounded-lg p-4 min-h-[120px] resize-y focus:outline-none focus:ring-1 ${isDark ? 'focus:ring-primary focus:border-primary' : 'focus:ring-[#D9692A] focus:border-[#D9692A]'} transition-all text-sm`} placeholder="Enter your Message" value={formData.message} onChange={handleInputChange} required></textarea>
                </label>
                <div className="flex justify-end mt-2">
                   <button type="submit" disabled={isSubmitting} className={`px-6 py-2.5 md:px-8 rounded-full text-sm font-bold transition-all shadow-md ${brandBgClass} ${brandTextOnBgClass} hover:opacity-90 w-full sm:w-auto whitespace-nowrap shrink-0`}>
                      {isSubmitting ? "Sending..." : "Send your Message"}
                   </button>
                </div>
             </form>
          </div>
        </div>

        {/* 3.5 Global Map Section */}
        <div className={`hero-content w-full rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md overflow-hidden p-6 md:p-10 mb-2 md:mb-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center`}>
            {/* Left Side: Content and Filtering */}
            <div className="lg:col-span-5 flex flex-col justify-center h-full gap-6 relative z-10">
                <div>
                    <span className={`text-xs md:text-sm font-semibold uppercase tracking-widest ${brandTextClass} mb-2 block`}>National Footprint</span>
                    <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight ${textColor}`}>
                        We're here to help<br />
                        <span className={`font-normal ${mutedText}`}>you with any questions</span>
                    </h2>
                </div>
                
                <p className={`text-sm md:text-base leading-relaxed ${mutedText}`}>
                    Catalance spans a distributed network across all major Tier 1 hubs and fast-growing Tier 2 cities in India. Our support is available round-the-clock, bringing localized project coordination and elite talent to your operations.
                </p>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${borderColor} ${cardBg}`}>
                        <div className={`text-xl md:text-2xl font-extrabold ${textColor}`}>100%</div>
                        <div className={`text-xs ${mutedText} mt-1`}>National Coverage</div>
                    </div>
                    <div className={`p-4 rounded-xl border ${borderColor} ${cardBg}`}>
                        <div className={`text-xl md:text-2xl font-extrabold ${textColor}`}>24/7</div>
                        <div className={`text-xs ${mutedText} mt-1`}>Client Support</div>
                    </div>
                </div>

                {/* Location Filters */}
                <div className="flex flex-col gap-2 pt-2">
                    <span className={`text-xs uppercase font-bold tracking-wider ${mutedText}`}>Filter Hubs:</span>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            type="button"
                            onClick={() => setSelectedFilter("all")} 
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border ${selectedFilter === "all" ? `${brandBgClass} ${brandTextOnBgClass} border-transparent` : `${borderColor} ${cardBg} hover:bg-neutral-800/10 dark:hover:bg-white/10`}`}
                        >
                            All Hubs ({cities.length})
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedFilter("T1")} 
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border ${selectedFilter === "T1" ? `${brandBgClass} ${brandTextOnBgClass} border-transparent` : `${borderColor} ${cardBg} hover:bg-neutral-800/10 dark:hover:bg-white/10`}`}
                        >
                            Tier 1 ({cities.filter(c => c.type === "T1").length})
                        </button>
                        <button 
                            type="button"
                            onClick={() => setSelectedFilter("T2")} 
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border ${selectedFilter === "T2" ? `${brandBgClass} ${brandTextOnBgClass} border-transparent` : `${borderColor} ${cardBg} hover:bg-neutral-800/10 dark:hover:bg-white/10`}`}
                        >
                            Tier 2 ({cities.filter(c => c.type === "T2").length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: High-Accuracy SVG Map of India */}
            <div className="lg:col-span-7 w-full flex items-center justify-center relative min-h-[380px] sm:min-h-[480px]">
                <div className="relative w-full max-w-[480px] mx-auto select-none aspect-[612/696]">
                    {/* SVG Map Path outlines */}
                    <svg
                        viewBox="0 0 612 696"
                        className="w-full h-auto block select-none"
                    >
                        <g>
                            {indiaPaths.map((path) => (
                                <path
                                    key={path.id}
                                    d={path.d}
                                    name={path.name}
                                    className={`transition-all duration-300 ${
                                        isDark
                                            ? "fill-zinc-800/30 stroke-zinc-700/60 hover:fill-zinc-700/50 hover:stroke-primary/50"
                                            : "fill-[#FAF6F0]/90 stroke-neutral-300 hover:fill-white hover:stroke-[#D9692A]/50"
                                    }`}
                                />
                            ))}
                        </g>
                    </svg>

                    {/* Pulsing Beacons */}
                    {cities
                        .filter(city => selectedFilter === "all" || city.type === selectedFilter)
                        .map((city, i) => {
                            const isHovered = hoveredCity === city.name;
                            const isT1 = city.type === "T1";
                            return (
                                <div 
                                    key={i} 
                                    className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${city.isHQ ? 'z-30' : isHovered ? 'z-20' : 'z-10'}`} 
                                    style={{ top: city.top, left: city.left }}
                                    onMouseEnter={() => setHoveredCity(city.name)}
                                    onMouseLeave={() => setHoveredCity(null)}
                                >
                                    {/* Tooltip */}
                                    {(city.isHQ || isHovered) && (
                                        <span className={`absolute -top-9 whitespace-nowrap text-[9px] md:text-xs font-bold px-2 py-0.5 md:py-1 rounded-md border transition-all duration-200 ${
                                            city.isHQ 
                                            ? `${brandBgClass} ${brandTextOnBgClass} border-transparent animate-bounce` 
                                            : `bg-neutral-900/90 dark:bg-black/90 text-white dark:text-white border-neutral-800 dark:border-neutral-800`
                                        }`}>
                                            {city.isHQ ? `HQ (${city.name})` : `${city.name} (${city.type})`}
                                        </span>
                                    )}

                                    <div className={`relative rounded-full transition-all duration-300 animate-pulse ${
                                        city.isHQ 
                                        ? `${brandBgClass} w-2 h-2 md:w-2.5 md:h-2.5` 
                                        : isT1
                                          ? `${brandBgClass} w-1.5 h-1.5 md:w-2 md:h-2`
                                          : `${brandBgClass} opacity-80 w-1 h-1`
                                    }`}></div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>

        {/* 4. Two Info Cards */}
        <div className="hero-content w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
           {[
             { title: "Freelancer Opportunities", desc: "Interested in becoming a top-tier freelancer and making a hands-on difference? Please visit our Freelancer page for more information and to apply." },
             { title: "Enterprise Solutions", desc: "To empower your business with elite talent or learn more about our enterprise options, visit our Enterprise page." }
           ].map((info, idx) => (
              <div key={idx} className={`p-8 md:p-10 rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform`}>
                 <h3 className="text-lg md:text-xl font-bold">{info.title}</h3>
                 <p className={`text-xs md:text-sm leading-relaxed ${mutedText} mb-2`}>{info.desc}</p>
              </div>
           ))}
        </div>

        {/* 5. Bottom Banner */}
        <div className={`hero-content w-full p-8 md:p-16 rounded-2xl border ${borderColor} ${isDark ? 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-black' : 'bg-gradient-to-br from-white via-stone-50 to-orange-50/10'} flex flex-col items-center text-center gap-6 relative overflow-hidden shadow-xl`}>
            {/* Soft Glowing Ambient Lights */}
            <div className={`absolute top-[-50%] left-[-20%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-35 ${isDark ? 'bg-primary/20' : 'bg-[#D9692A]/15'}`}></div>
            <div className={`absolute bottom-[-50%] right-[-20%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-35 ${isDark ? 'bg-primary/10' : 'bg-[#D9692A]/10'}`}></div>
            
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-extrabold max-w-3xl leading-tight relative z-10 ${textColor}`}>
               Join Catalance and Help Level Up Your <br />
               <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-primary to-yellow-300' : 'from-[#D9692A] to-[#f19e6d]'}`}>
                 Business Operations
               </span>
            </h2>
            <p className={`max-w-2xl text-sm md:text-base leading-relaxed ${mutedText} relative z-10`}>
               Our platform will help provide essential talent for your business needs, such as web development, design, marketing, and strategic growth.
            </p>
            
         </div>

      </div>
    </main>
  );
};

export default Contact;
