import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import Facebook from "lucide-react/dist/esm/icons/facebook";
import Twitter from "lucide-react/dist/esm/icons/twitter";
import Linkedin from "lucide-react/dist/esm/icons/linkedin";
import Check from "lucide-react/dist/esm/icons/check";
import { toast } from "sonner";
import { submitContactInquiry } from "@/shared/lib/api-client";

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
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const brandTextClass = isDark ? 'text-[#f2cc0d]' : 'text-[#D9692A]';
  const brandBgClass = isDark ? 'bg-[#f2cc0d]' : 'bg-[#D9692A]';
  const brandTextOnBgClass = isDark ? 'text-black' : 'text-white';
  
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
    if (!agreed) {
      toast.error("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactInquiry({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: "Contact Inquiry",
        message: `${formData.message.trim()}\n\nPhone: ${formData.phone}`,
      });

      toast.success("Message sent successfully.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
      setAgreed(false);
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
      className={`relative min-h-screen w-full pt-32 pb-16 px-4 md:px-10 lg:px-20 xl:px-40 ${bgColor} ${textColor} font-sans overflow-x-hidden transition-colors duration-300 selection:bg-[#f2cc0d]/30`}
    >
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 ${isDark ? "bg-[#f2cc0d]/5" : "bg-[#D9692A]/5"}`}
        ></div>
        <div
          className={`absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 ${isDark ? "bg-[#f2cc0d]/5" : "bg-[#D9692A]/5"}`}
        ></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto flex flex-col gap-6 md:gap-10">
        
        {/* 1. Hero Section */}
        <div className={`hero-content relative w-full p-8 md:p-12 lg:p-16 rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md flex flex-col md:flex-row gap-10 justify-between items-center`}>
          {/* Decorative Quote Icon */}
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`absolute -top-4 left-4 md:-top-8 md:left-8 w-20 h-20 md:w-28 md:h-28 opacity-80 ${isDark ? 'text-[#f2cc0d]' : 'text-[#D9692A]'}`}>
            <path d="M20 80 L 20 60 C 20 45 35 45 35 30 L 35 10" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.25" />
            <path d="M45 80 L 45 60 C 45 45 60 45 60 30 L 60 10" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.5" />
            <path d="M70 80 L 70 60 C 70 45 85 45 85 30 L 85 10" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.85" />
          </svg>
          <div className="md:w-1/2 flex flex-col items-start gap-4 relative z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
              We Would Love to Hear <br />
              <span className={`inline-block px-4 py-1 mt-2 rounded-xl italic font-semibold ${brandBgClass} ${brandTextOnBgClass}`}>
                from You
              </span>
            </h1>
          </div>
          <div className="md:w-1/2 flex flex-col items-start md:items-end gap-6 text-left md:text-right">
            <p className={`text-sm md:text-base max-w-md leading-relaxed ${mutedText}`}>
              Thank you for your interest in Catalance. We value your thoughts, questions, and feedback. Please don't hesitate to reach out to us. Our dedicated team is here to assist you.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin].map((Icon, idx) => (
                <a key={idx} href="#" className={`w-10 h-10 rounded-full flex items-center justify-center ${brandBgClass} ${brandTextOnBgClass} hover:-translate-y-1 transition-transform shadow-md`}>
                   <Icon className="w-5 h-5 fill-current" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Contact Grid (4 horizontal cards) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Address", value: "New Delhi, India", link: null },
            { title: "You Can Email Here", value: "support@catalance.com", link: "mailto:support@catalance.com" },
            { title: "Call us on", value: "+91 8882855425", link: "tel:+918882855425" },
            { title: "Working Hours", value: "10:00 am - 6:00 pm", link: null },
          ].map((item, idx) => (
            <div key={idx} className={`contact-card flex items-center justify-between p-5 rounded-xl border ${borderColor} ${cardBg} backdrop-blur-md group hover:-translate-y-1 transition-transform cursor-pointer`}>
               <div className="flex flex-col gap-1 overflow-hidden pr-2">
                 <span className={`text-[11px] md:text-xs uppercase tracking-wider font-semibold ${mutedText}`}>{item.title}</span>
                 {item.link ? (
                   <a href={item.link} className={`text-sm md:text-base font-bold truncate transition-colors ${brandTextClass} hover:opacity-80`}>{item.value}</a>
                 ) : (
                   <span className={`text-sm md:text-base font-bold truncate`}>{item.value}</span>
                 )}
               </div>
               <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-neutral-900 text-white dark:bg-white dark:text-black transition-transform group-hover:scale-110`}>
                 <ArrowUpRight className="w-4 h-4" />
               </div>
            </div>
          ))}
        </div>

        {/* (Map Section Moved Below Form) */}

        {/* 3. Main Form & Image Section */}
        <div className={`hero-content w-full rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md overflow-hidden flex flex-col lg:flex-row p-4 md:p-8 gap-8 lg:gap-12`}>
          {/* Left Image Side */}
          <div className="lg:w-2/5 relative rounded-2xl overflow-hidden min-h-[300px] lg:min-h-full bg-neutral-100 dark:bg-neutral-800">
             <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')"}}></div>
             <div className={`absolute inset-0 ${brandBgClass} mix-blend-multiply opacity-50`}></div>
             
             {/* Floating Card */}
             <div className={`absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 p-4 md:p-5 rounded-xl border ${borderColor} ${isDark ? 'bg-black/80' : 'bg-white/90'} backdrop-blur-lg flex justify-between items-center group cursor-pointer shadow-lg`}>
                <div className="flex flex-col gap-1">
                   <span className={`text-[10px] md:text-xs uppercase tracking-wider font-semibold ${mutedText}`}>Partnerships and Collaborations</span>
                   <a href="mailto:partners@catalance.com" className={`text-sm md:text-base font-bold transition-colors ${brandTextClass} hover:opacity-80`}>partners@catalance.com</a>
                </div>
                <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center bg-neutral-900 text-white dark:bg-white dark:text-black transition-transform group-hover:scale-110`}>
                   <ArrowUpRight className="w-4 h-4" />
                </div>
             </div>
          </div>
          
          {/* Right Form Side */}
          <div className="lg:w-3/5 p-2 md:p-4">
             <form ref={formRef} className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <label className="flex flex-col gap-2">
                     <span className={`text-sm font-semibold ml-1 ${textColor}`}>First Name</span>
                     <input name="firstName" className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 focus:outline-none focus:ring-1 focus:ring-[${isDark ? '#f2cc0d' : '#D9692A'}] focus:border-[${isDark ? '#f2cc0d' : '#D9692A'}] transition-all`} placeholder="Enter First Name" value={formData.firstName} onChange={handleInputChange} required />
                   </label>
                   <label className="flex flex-col gap-2">
                     <span className={`text-sm font-semibold ml-1 ${textColor}`}>Last Name</span>
                     <input name="lastName" className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 focus:outline-none focus:ring-1 focus:ring-[${isDark ? '#f2cc0d' : '#D9692A'}] focus:border-[${isDark ? '#f2cc0d' : '#D9692A'}] transition-all`} placeholder="Enter Last Name" value={formData.lastName} onChange={handleInputChange} required />
                   </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <label className="flex flex-col gap-2">
                     <span className={`text-sm font-semibold ml-1 ${textColor}`}>Email</span>
                     <input name="email" type="email" className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 focus:outline-none focus:ring-1 focus:ring-[${isDark ? '#f2cc0d' : '#D9692A'}] focus:border-[${isDark ? '#f2cc0d' : '#D9692A'}] transition-all`} placeholder="Enter your Email" value={formData.email} onChange={handleInputChange} required />
                   </label>
                   <label className="flex flex-col gap-2">
                     <span className={`text-sm font-semibold ml-1 ${textColor}`}>Phone</span>
                     <input name="phone" type="tel" className={`w-full ${inputBg} border ${borderColor} rounded-xl px-4 h-14 focus:outline-none focus:ring-1 focus:ring-[${isDark ? '#f2cc0d' : '#D9692A'}] focus:border-[${isDark ? '#f2cc0d' : '#D9692A'}] transition-all`} placeholder="Enter Phone Number" value={formData.phone} onChange={handleInputChange} />
                   </label>
                </div>
                <label className="flex flex-col gap-2">
                     <span className={`text-sm font-semibold ml-1 ${textColor}`}>Message</span>
                     <textarea name="message" className={`w-full ${inputBg} border ${borderColor} rounded-xl p-4 min-h-[140px] resize-y focus:outline-none focus:ring-1 focus:ring-[${isDark ? '#f2cc0d' : '#D9692A'}] focus:border-[${isDark ? '#f2cc0d' : '#D9692A'}] transition-all`} placeholder="Enter your Message" value={formData.message} onChange={handleInputChange} required></textarea>
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border ${borderColor} ${inputBg} flex items-center justify-center transition-colors relative ${agreed ? `border-[${isDark ? '#f2cc0d' : '#D9692A'}] ${brandBgClass}` : `group-hover:border-[${isDark ? '#f2cc0d' : '#D9692A'}]`}`}>
                         <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required className="w-full h-full opacity-0 cursor-pointer absolute z-10" />
                         {agreed && <Check className={`w-3.5 h-3.5 ${brandTextOnBgClass}`} />}
                      </div>
                      <span className={`text-sm ${mutedText} group-hover:text-current transition-colors`}>I agree with Terms of Use and Privacy Policy</span>
                   </label>
                   <button type="submit" disabled={isSubmitting} className={`px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all shadow-md bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 w-full sm:w-auto whitespace-nowrap shrink-0`}>
                      {isSubmitting ? "Sending..." : "Send your Message"}
                   </button>
                </div>
             </form>
          </div>
        </div>

        {/* 3.5 Global Map Section */}
        <div className={`hero-content w-full rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md overflow-hidden relative min-h-[350px] md:min-h-[450px] flex flex-col p-8 md:p-12 mb-2 md:mb-4`}>
            {/* Header Text */}
            <div className="relative z-10 max-w-md mb-8">
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight ${textColor}`}>
                    We're here to help<br />
                    <span className={`font-normal ${mutedText}`}>you with any questions</span>
                </h2>
            </div>

            {/* Map & Beacons Container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
                <div className="relative w-[140%] sm:w-full max-w-[850px] aspect-square mx-auto transform translate-y-12">
                    {/* Dotted Map Image */}
                    <img 
                        src="/india-map.png" 
                        alt="India Map" 
                        className={`absolute inset-0 w-full h-full object-contain transition-all duration-300 ${isDark ? 'brightness-0 invert opacity-15' : 'brightness-0 opacity-15'}`}
                        style={{
                            maskImage: 'radial-gradient(circle, black 1.5px, transparent 1.5px)',
                            maskSize: '8px 8px',
                            WebkitMaskImage: 'radial-gradient(circle, black 1.5px, transparent 1.5px)',
                            WebkitMaskSize: '8px 8px'
                        }}
                    />

                    {/* Pulsing Beacons */}
                    {[
                        { top: '28%', left: '40%', isHQ: true, label: "HQ (New Delhi)" },
                        { top: '58%', left: '26%' }, // Mumbai
                        { top: '75%', left: '38%' }, // Bangalore
                        { top: '60%', left: '42%' }, // Hyderabad
                        { top: '48%', left: '68%' }  // Kolkata
                    ].map((pos, i) => (
                        <div key={i} className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 ${pos.isHQ ? 'z-20' : 'z-10'}`} style={{ top: pos.top, left: pos.left }}>
                            {pos.isHQ && (
                                <span className={`absolute -top-8 whitespace-nowrap text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full bg-white dark:bg-black border ${borderColor} shadow-lg ${brandTextClass} animate-bounce`}>
                                    {pos.label}
                                </span>
                            )}
                            <div className={`absolute rounded-full ${brandBgClass} ${pos.isHQ ? 'w-8 h-8 md:w-12 md:h-12 opacity-80' : 'w-4 h-4 md:w-6 md:h-6 opacity-60'} animate-ping`}></div>
                            <div className={`relative rounded-full ${brandBgClass} ${pos.isHQ ? 'w-3 h-3 md:w-4 md:h-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'w-1.5 h-1.5 md:w-2 md:h-2'}`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 4. Two Info Cards */}
        <div className="hero-content w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
           {[
             { title: "Freelancer Opportunities", desc: "Interested in becoming a top-tier freelancer and making a hands-on difference? Please visit our Freelancer page for more information and to apply.", btn: "Visit Page" },
             { title: "Enterprise Solutions", desc: "To empower your business with elite talent or learn more about our enterprise options, visit our Enterprise page.", btn: "Enterprise Page" }
           ].map((info, idx) => (
              <div key={idx} className={`p-8 md:p-10 rounded-2xl border ${borderColor} ${cardBg} backdrop-blur-md flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform`}>
                 <h3 className="text-lg md:text-xl font-bold">{info.title}</h3>
                 <p className={`text-xs md:text-sm leading-relaxed ${mutedText} mb-2`}>{info.desc}</p>
                 <button className={`mt-auto px-6 py-3 rounded-full flex items-center gap-2 bg-neutral-900 text-white dark:bg-white dark:text-black text-sm font-semibold hover:shadow-lg transition-all`}>
                    {info.btn} <ArrowUpRight className="w-4 h-4"/>
                 </button>
              </div>
           ))}
        </div>

        {/* 5. Bottom Banner */}
        <div className={`hero-content w-full p-8 md:p-16 rounded-2xl ${brandBgClass} flex flex-col items-center text-center gap-6 relative overflow-hidden`}>
            {/* Background Pattern SVG */}
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
            
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold max-w-3xl leading-tight ${brandTextOnBgClass} relative z-10`}>
               Join Catalance and Help Level Up Your Business Operations
            </h2>
            <p className={`max-w-3xl text-sm md:text-base ${isDark ? 'text-black/80' : 'text-white/90'} relative z-10`}>
               Our platform will help provide essential talent for your business needs, such as web development, design, marketing, and strategic growth.
            </p>
            
            <div className={`mt-4 p-2 pl-4 md:pl-6 rounded-full flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'bg-black/10' : 'bg-white/20'} backdrop-blur-md max-w-2xl w-full relative z-10`}>
               <span className={`text-sm font-medium text-center sm:text-left ${brandTextOnBgClass}`}>
                 Click here to get started and level up your business operations.
               </span>
               <button className={`px-6 py-3 w-full sm:w-auto rounded-full flex shrink-0 justify-center items-center gap-2 ${brandBgClass} border ${isDark ? 'border-black/20 text-black' : 'border-white/20 text-white'} font-bold shadow-lg hover:-translate-y-1 transition-all`}>
                  Get Started <ArrowUpRight className="w-4 h-4"/>
               </button>
            </div>
        </div>

      </div>
    </main>
  );
};

export default Contact;
