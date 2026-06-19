import React from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  Headphones, 
  Heart, 
  Lock, 
  Check 
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import catalanceLogo from "@/assets/logos/logo.svg";
import testimonial1 from "@/assets/images/testimonials/Ajay-prajapati.jpg";
import testimonial2 from "@/assets/images/testimonials/mohd-kaif.jpg";
import testimonial3 from "@/assets/images/testimonials/nitin-nayak.jpg";
import testimonial4 from "@/assets/images/testimonials/aniket-thakur.jpg";

const testimonials = [
  {
    quote: "Since I started sharing my strengths, I've connected with amazing clients and grown my business.",
    name: "Sarah K.",
    role: "Marketing Consultant",
    image: testimonial1,
  },
  {
    quote: "The matching algorithm is incredibly accurate. I got connected with my ideal clients in days.",
    name: "Ajay P.",
    role: "UI/UX Designer",
    image: testimonial2,
  },
  {
    quote: "Creating a service catalog helped me showcase my work. My conversion rate has doubled.",
    name: "Nitin N.",
    role: "Video Editor",
    image: testimonial3,
  },
  {
    quote: "Catalance handles payment escrows flawlessly. I can focus 100% on doing great work.",
    name: "Aniket T.",
    role: "Software Engineer",
    image: testimonial4,
  }
];

const FloatingAvatar = ({ testimonial, delay = 0, x = "0%", y = "0%", scale = 1, isDark, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [typedText, setTypedText] = React.useState('');
  const [hasBeenHovered, setHasBeenHovered] = React.useState(false);
  const typewriterTimeoutRef = React.useRef(null);
  const currentTextRef = React.useRef('');
  const audioPlayerRef = React.useRef(null);

  const yVal = typeof y === "string" ? parseFloat(y) : y;
  const popDown = yVal < 50;

  const xVal = typeof x === "string" ? parseFloat(x) : x;
  const isLeftSide = xVal < 50;
  const transformOrigin = isLeftSide
    ? (popDown ? "top left" : "bottom left")
    : (popDown ? "top right" : "bottom right");

  const stopAudio = React.useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause(); 
      audioPlayerRef.current.currentTime = 0; 
      audioPlayerRef.current.src = ''; 
      audioPlayerRef.current.load(); 
      audioPlayerRef.current = null; 
    }
  }, []); 

  const startTypewriter = React.useCallback((text) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setTypedText('');
    currentTextRef.current = text;
    
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setTypedText(text.slice(0, i));
        i++;
        typewriterTimeoutRef.current = setTimeout(type, 35);
      }
    };
    type();
  }, []);

  const stopTypewriter = React.useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setTypedText('');
    currentTextRef.current = '';
  }, []); 

  const handleMouseEnter = React.useCallback(() => {
    setIsOpen(true);
    stopAudio(); 
  
    if (testimonial.audio) {
      const newAudio = new Audio(`/audio/${testimonial.audio}`);
      audioPlayerRef.current = newAudio; 
      newAudio.play().catch(e => {
        console.warn("Audio playback prevented or failed:", e);
      });
    }
    
    setHasBeenHovered(true);
    startTypewriter(testimonial.quote);
  }, [testimonial, stopAudio, startTypewriter]); 

  const handleMouseLeave = React.useCallback(() => {
    setIsOpen(false);
    stopAudio(); 
    stopTypewriter();
  }, [stopAudio, stopTypewriter]);

  React.useEffect(() => {
    return () => {
      stopAudio(); 
      stopTypewriter(); 
    };
  }, [stopAudio, stopTypewriter]);

  return (
    <motion.div
      className={cn("absolute z-20 hover:z-50", isOpen ? "z-50" : "", className)}
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 0.9, 
        scale: scale,
        y: [0, -8, 0] 
      }}
      transition={{ 
        y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { duration: 1 },
        scale: { duration: 0.5 }
      }}
    >
      <div 
        className="group relative cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cn(
          "absolute -inset-1 rounded-full opacity-0 blur-md transition duration-500 group-hover:opacity-100", 
          isOpen ? "opacity-100" : "", 
          isDark ? "bg-[#F9D949]" : "bg-[#D9692A]"
        )} />
        <motion.img
          src={testimonial.image}
          alt={testimonial.name}
          className="relative size-8 rounded-full border-2 object-cover transition-all duration-300 sm:size-12"
          animate={{ 
            borderColor: isOpen 
              ? 'var(--primary)' 
              : (isDark ? '#262626' : '#E5E7EB'),
            scale: isOpen ? 1.08 : 1
          }}
          transition={{ duration: 0.3 }}
        />
        {/* Pop-up Review with Typewriter Effect */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: popDown ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: popDown ? -10 : 10 }}
              style={{ transformOrigin }}
              transition={{ duration: 0.4 }}
              className={cn(
                "absolute w-48 sm:w-56 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-[11px] px-3.5 py-3 rounded-2xl shadow-2xl border border-neutral-200/60 dark:border-neutral-800 z-50 text-left",
                isLeftSide ? "left-0" : "right-0",
                popDown ? "top-full mt-3" : "bottom-full mb-3"
              )}
            >
              <div className="flex items-center gap-0.5 mb-1 sm:mb-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{ fill: isDark ? "#F9D949" : "#D9692A", color: isDark ? "#F9D949" : "#D9692A" }}>
                    <path d="M10 1.5l2.49 5.04 5.56.81-4.02 3.92.95 5.54L10 13.98 5.02 16.81l.95-5.54-4.02-3.92 5.56-.81L10 1.5z" />
                  </svg>
                ))}
              </div>
              <div className="min-h-[4rem] whitespace-pre-wrap font-medium leading-relaxed opacity-90 dark:opacity-95 text-[10px] sm:text-xs">
                "{typedText}"
                <span className="animate-pulse text-primary font-bold">|</span>
              </div>
              <p className="mt-1 text-right font-bold text-neutral-900 dark:text-white text-[9px] sm:text-[10px] uppercase tracking-wider">
                - {testimonial.name}
              </p>
              <p className="text-right text-neutral-900/50 dark:text-neutral-400 text-[8px] sm:text-[9px] font-semibold mt-0.5">
                {testimonial.role}
              </p>
              {/* Connector dots */}
              {popDown ? (
                /* Upward pointing bubble connector dots */
                <div className={cn(
                  "absolute -top-4 flex flex-col items-center pointer-events-none",
                  isLeftSide ? "left-4 sm:left-6" : "right-4 sm:right-6"
                )}>
                  <div className="w-1 h-1 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850"></div>
                  <div className="w-1.5 h-1.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                  <div className="w-2.5 h-2.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                </div>
              ) : (
                /* Downward pointing bubble connector dots */
                <div className={cn(
                  "absolute -bottom-4 flex flex-col items-center pointer-events-none",
                  isLeftSide ? "left-4 sm:left-6" : "right-4 sm:right-6"
                )}>
                  <div className="w-2.5 h-2.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850"></div>
                  <div className="w-1.5 h-1.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                  <div className="w-1 h-1 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const FreelancerIndividualProofSlide = ({ onContinue }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onContinue()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onContinue])

  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 pt-2 pb-2 text-center sm:px-6 sm:pt-3 md:px-8 md:pt-4">
      {/* Background Peach Glows - for light theme visual alignment */}
      <div className="absolute top-0 left-0 w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] bg-primary/[0.04] dark:bg-primary/[0.01] rounded-full blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] bg-primary/[0.04] dark:bg-primary/[0.01] rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Semicircle Dotted Arc Wrapper */}
      <div className="relative w-full max-w-[340px] sm:max-w-[480px] md:max-w-[820px] mx-auto pt-8 sm:pt-10 md:pt-12 pb-2 z-20">
        {/* Dotted Arch Line - placed fully inside container to prevent top cropping */}
        <div className="absolute top-2 sm:top-3 md:top-4 left-0 w-full h-[100px] sm:h-[130px] md:h-[160px] border-t-2 border-dashed border-neutral-200 dark:border-neutral-850 rounded-t-full pointer-events-none z-0" />
        
        {/* Center Badge on top of the semicircle arc */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 sm:top-3 md:top-4 z-10">
          <div className="relative -translate-y-1/2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#D9692A] dark:bg-[#F9D949] border border-[#D9692A] dark:border-[#F9D949] flex items-center justify-center shadow-sm">
              <img src={catalanceLogo} alt="Catalance Logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain invert dark:invert-0" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#10B981] border border-white dark:border-neutral-900 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 text-white keep-white stroke-[3px]" />
            </div>
          </div>
        </div>

        {/* 4 Floating Avatars along the arch - y is adjusted relative to container inside parameters */}
        <FloatingAvatar testimonial={testimonials[1]} delay={0} x="4%" y="48%" scale={0.95} isDark={isDark} className="block" />
        <FloatingAvatar testimonial={testimonials[0]} delay={0.8} x="18%" y="25%" scale={1.05} isDark={isDark} className="block" />
        <FloatingAvatar testimonial={testimonials[2]} delay={1.6} x="76%" y="25%" scale={1.05} isDark={isDark} className="block" />
        <FloatingAvatar testimonial={testimonials[3]} delay={2.4} x="90%" y="48%" scale={0.95} isDark={isDark} className="block" />

        {/* Centered Heading Section */}
        <div className="relative z-10 max-w-[200px] sm:max-w-[340px] md:max-w-[600px] lg:max-w-none mx-auto mt-1.5 md:mt-2">
          <h1 className="leading-tight flex flex-col items-center select-none">
            <span className="text-primary font-black text-3xl sm:text-5xl md:text-[2.75rem] tracking-tight">10,000+</span>
            <span className="font-bold text-lg sm:text-2xl md:text-[1.85rem] mt-0.5 text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-none">freelancers are already</span>
            <span className="font-bold text-lg sm:text-2xl md:text-[1.85rem] mt-0.5 text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-none">earning on Catalance</span>
          </h1>
        </div>
      </div>

      <div className={cn(
        "w-full max-w-4xl rounded-[1.5rem] border p-3 sm:p-3.5 mt-3 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center z-10",
        isDark 
          ? "border-white/5 bg-[#171717]/40 backdrop-blur-xl" 
          : "border-neutral-200/60 bg-white shadow-[0_8px_30px_rgba(217,105,42,0.02)]"
      )}>
        {/* Card 1 */}
        <div className="flex flex-col items-center">
          <Wallet className="h-6 w-6 text-primary mb-3 shrink-0" />
          <h3 className={cn("text-xs sm:text-sm font-bold leading-normal text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap")}>
            Real Opportunities
          </h3>
          <p className={cn("text-[10.5px] sm:text-xs mt-1 max-w-[180px] mx-auto leading-relaxed text-[#475569] dark:text-[#94A3B8]")}>
            Access high-quality projects from trusted clients.
          </p>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col items-center border-l border-neutral-200/60 dark:border-neutral-800">
          <ShieldCheck className="h-6 w-6 text-primary mb-3 shrink-0" />
          <h3 className={cn("text-xs sm:text-sm font-bold leading-normal text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap")}>
            Secure & Reliable
          </h3>
          <p className={cn("text-[10.5px] sm:text-xs mt-1 max-w-[180px] mx-auto leading-relaxed text-[#475569] dark:text-[#94A3B8]")}>
            Your payments and data are always protected.
          </p>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col items-center border-t md:border-t-0 md:border-l border-neutral-200/60 dark:border-neutral-800 pt-3 md:pt-0">
          <TrendingUp className="h-6 w-6 text-primary mb-3 shrink-0" />
          <h3 className={cn("text-xs sm:text-sm font-bold leading-normal text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap")}>
            Grow Your Career
          </h3>
          <p className={cn("text-[10.5px] sm:text-xs mt-1 max-w-[180px] mx-auto leading-relaxed text-[#475569] dark:text-[#94A3B8]")}>
            Build your profile, gain reviews and scale your income.
          </p>
        </div>

        {/* Card 4 */}
        <div className="flex flex-col items-center border-t border-l md:border-t-0 border-neutral-200/60 dark:border-neutral-800 pt-3 md:pt-0">
          <Headphones className="h-6 w-6 text-primary mb-3 shrink-0" />
          <h3 className={cn("text-xs sm:text-sm font-bold leading-normal text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap")}>
            We're Here for You
          </h3>
          <p className={cn("text-[10.5px] sm:text-xs mt-1 max-w-[180px] mx-auto leading-relaxed text-[#475569] dark:text-[#94A3B8]")}>
            Get 24/7 support whenever you need assistance.
          </p>
        </div>
      </div>

      {/* Heart Divider with Horizontal Dotted Line */}
      <div className="relative w-full hidden md:flex items-center justify-center my-2 z-10">
        <div className="absolute left-0 right-0 border-t border-dashed border-neutral-200 dark:border-neutral-800 w-1/3 mx-auto" />
        <div className="relative w-7 h-7 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-850 flex items-center justify-center shadow-sm z-10">
          <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
        </div>
      </div>

      {/* Continue Action Block */}
      <div className="flex flex-col items-center mt-6 w-full z-10">
        <button
          type="button"
          onClick={onContinue}
          className="h-10 px-8 rounded-full bg-primary text-white keep-white dark:text-black font-semibold shadow-lg shadow-primary/10 hover:bg-primary/95 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
        >
          <span className="text-white keep-white dark:text-black">Continue</span>
          
        </button>
        
        {/* Helper lock text */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#475569] dark:text-[#94A3B8] mt-2 font-semibold">
          <Lock className="h-3 w-3 text-[#475569] dark:text-[#94A3B8]" />
          <div>Takes less than 2 minutes</div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerIndividualProofSlide;
