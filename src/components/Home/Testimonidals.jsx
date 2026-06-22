import React from 'react'
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/shared/lib/utils";
import AutoScroll from 'embla-carousel-auto-scroll'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import testimonial1 from '@/assets/images/testimonials/Ajay-prajapati.jpg'
import testimonial2 from '@/assets/images/testimonials/mohd-kaif.jpg'
import testimonial3 from '@/assets/images/testimonials/nitin-nayak.jpg'
import testimonial4 from '@/assets/images/testimonials/aniket-thakur.jpg'

import { motion, AnimatePresence } from 'framer-motion'

const testimonials = [
  {
    quote: 'Since using the platform, our brand visibility and engagement have grown consistently across platforms.',
    name: 'Ajay Prajapati',
    role: 'UX Designer',
    image: testimonial1,
  },
  {
    quote: 'Our brand visibility and audience interaction improved significantly thanks to Catalance.',
    name: 'Mohd Kaif',
    role: 'Software Engineer',
    image: testimonial2,
  },
  {
    quote: 'Our digital presence improved significantly, leading to a strong rise in engagement and audience interaction.',
    name: 'Nitin Nayak',
    role: 'Video Editor',
    image: testimonial3,
  },
  {
    quote: 'We saw a complete shift in our online presence, with doubled engagement and deeper audience connection.',
    name: 'Aniket Thakur',
    role: 'Software Engineer',
    image: testimonial4,
  },
  {
    quote: 'The collaborative nature of the platform made our project execution seamless and efficient.',
    name: 'Sarah Chen',
    role: 'Product Manager',
    image: testimonial1,
  },
  {
    quote: 'Found world-class talent within days. The quality of work exceeded all our expectations.',
    name: 'James Wilson',
    role: 'Startup Founder',
    image: testimonial2,
  }
]

function StarRating() {
  const { theme } = useTheme();
  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const starColor = isDarkMode ? "#F9D949" : "#D9692A";

  return (
    <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5"
          aria-hidden="true"
          style={{ fill: starColor, color: starColor }}
        >
          <path d="M10 1.5l2.49 5.04 5.56.81-4.02 3.92.95 5.54L10 13.98 5.02 16.81l.95-5.54-4.02-3.92 5.56-.81L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial }) {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <article className={cn(
      "group flex h-full w-full select-none flex-col justify-between rounded-[2rem] border p-7 text-left transition-all duration-500",
      isDark 
        ? "border-white/5 bg-white/5 backdrop-blur-xl hover:bg-white/[0.08]" 
        : "border-black/[0.08] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
    )}>
      <div>
        <StarRating />
        <p className={cn(
          "mt-5 text-base leading-relaxed sm:text-lg",
          isDark ? "text-white/90" : "text-neutral-800"
        )}>
          "{testimonial.quote}"
        </p>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <div className="relative">
          <div className={cn(
            "absolute -inset-1 rounded-full opacity-20 blur-sm transition duration-500 group-hover:opacity-100",
            isDark ? "bg-[#F9D949]" : "bg-[#D9692A]"
          )} />
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="relative h-12 w-12 rounded-full border-2 border-white object-cover shadow-sm transition duration-500 group-hover:scale-110 sm:h-14 sm:w-14"
            loading="lazy"
          />
        </div>
        <div>
          <p className={cn("text-base font-bold", isDark ? "text-white" : "text-neutral-900")}>
            {testimonial.name}
          </p>
          <p className={cn("text-sm font-medium", isDark ? "text-white/50" : "text-neutral-500")}>
            {testimonial.role}
          </p>
        </div>
      </div>
    </article>
  )
}

const WavyBackground = ({ isDark }) => {
  const waveColor = isDark ? "#F9D949" : "#D9692A";
  
  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-20 dark:opacity-30">
      <svg className="h-full w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        {[...Array(6)].map((_, i) => (
          <motion.path
            key={i}
            d={`M0 ${150 + i * 20} C 360 ${100 + i * 15}, 720 ${200 + i * 25}, 1080 ${150 + i * 20} S 1440 ${100 + i * 15}, 1440 ${150 + i * 20}`}
            stroke={waveColor}
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.5
            }}
            transition={{ 
              duration: 10 + i * 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        ))}
      </svg>
    </div>
  )
}

const FloatingAvatar = ({ testimonial, delay = 0, x = "0%", y = "0%", scale = 1, isDark }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [typedText, setTypedText] = React.useState('');
  const [hasBeenHovered, setHasBeenHovered] = React.useState(false);
  const typewriterTimeoutRef = React.useRef(null);
  const currentTextRef = React.useRef('');
  const audioPlayerRef = React.useRef(null);

  const yVal = typeof y === "string" ? parseFloat(y) : y;
  const popDown = yVal < 50;

  const xVal = typeof x === "string" ? parseFloat(x) : x;
  let align = "center";
  if (!isNaN(xVal)) {
    if (xVal < 30) align = "left";
    else if (xVal > 70) align = "right";
  }

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
      className={cn("absolute z-10 hover:z-50", isOpen ? "z-50" : "")}
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 0.9, 
        scale: scale,
        y: [0, -20, 0] 
      }}
      transition={{ 
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
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
          className="relative size-10 rounded-full border-4 object-cover transition-all duration-300 sm:size-16"
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
              transition={{ duration: 0.4 }}
              className={cn(
                "absolute w-52 sm:w-60 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs px-4 py-3.5 rounded-2xl shadow-2xl border border-neutral-200/60 dark:border-neutral-800 z-50 text-left",
                popDown ? "top-full mt-4" : "bottom-full mb-4",
                align === "left" && "left-[-10px] translate-x-0",
                align === "right" && "right-[-10px] translate-x-0",
                align === "center" && "left-1/2 -translate-x-1/2"
              )}
            >
              <div className="flex items-center gap-0.5 mb-1.5 sm:mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{ fill: isDark ? "#F9D949" : "#D9692A", color: isDark ? "#F9D949" : "#D9692A" }}>
                    <path d="M10 1.5l2.49 5.04 5.56.81-4.02 3.92.95 5.54L10 13.98 5.02 16.81l.95-5.54-4.02-3.92 5.56-.81L10 1.5z" />
                  </svg>
                ))}
              </div>
              <div className="h-20 overflow-hidden whitespace-pre-wrap font-medium leading-relaxed opacity-90 dark:opacity-95 text-[11px] sm:text-xs">
                "{typedText}"
                <span className="animate-pulse text-primary font-bold">|</span>
              </div>
              <p className="mt-2 text-right font-bold text-neutral-900 dark:text-white text-[10px] sm:text-xs uppercase tracking-wider">
                - {testimonial.name}
              </p>
              <p className="text-right text-neutral-900/50 dark:text-neutral-400 text-[9px] sm:text-[10px] font-semibold mt-0.5">
                {testimonial.role}
              </p>
              {/* Connector dots */}
              {popDown ? (
                /* Upward pointing bubble connector dots */
                <div className={cn(
                  "absolute -top-4 flex flex-col items-center pointer-events-none",
                  align === "left" && "left-[30px] sm:left-[42px] -translate-x-1/2",
                  align === "right" && "right-[30px] sm:right-[42px] translate-x-1/2",
                  align === "center" && "left-1/2 -translate-x-1/2"
                )}>
                  <div className="w-1 h-1 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850"></div>
                  <div className="w-1.5 h-1.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                  <div className="w-2.5 h-2.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                </div>
              ) : (
                /* Downward pointing bubble connector dots */
                <div className={cn(
                  "absolute -bottom-4 flex flex-col items-center pointer-events-none",
                  align === "left" && "left-[30px] sm:left-[42px] -translate-x-1/2",
                  align === "right" && "right-[30px] sm:right-[42px] translate-x-1/2",
                  align === "center" && "left-1/2 -translate-x-1/2"
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
}

const Testimonidals = () => {
  const [api, setApi] = React.useState(null)
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const autoScrollPlugins = React.useMemo(() => [
    AutoScroll({
      speed: 1,
      stopOnInteraction: false,
      startDelay: 0,
    })
  ], [])

  return (
    <section className="relative overflow-hidden bg-background py-10 sm:py-32">
      {/* Header Section (Title & Badge) */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-10 mb-8 sm:mb-12">
          <div className={`inline-flex rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all mb-8 ${
            isDark 
              ? "border-white/10 bg-white/5 text-white/60 backdrop-blur-md" 
              : "border-black/5 bg-black/5 text-black/50"
          }`}>
            Expert Community
          </div>

          <header className="mt-4 max-w-4xl mx-auto">
            <h2 className={`text-6xl font-black tracking-tight text-balance sm:text-8xl ${
              isDark ? "text-white" : "text-neutral-900"
            }`}>
              <span className="block">Don&apos;t Just Take Our</span>
              <span className="block text-primary italic font-medium">Word For It</span>
            </h2>
            <p className={`mx-auto mt-8 max-w-2xl text-xl font-medium leading-relaxed ${
              isDark ? "text-white/50" : "text-neutral-500"
            }`}>
              Join thousands of experts who have already transformed their digital presence.
            </p>
          </header>
      </div>

      {/* Contained Area for Organic Waves and Larger Avatars - Height Reduced */}
      <div className="relative mx-auto max-w-screen-2xl h-[250px] sm:h-[350px] w-full">
        {/* Natural Organic Waves - Spaced more vertically to avoid stretching */}
        <div className="absolute inset-0 z-0 overflow-hidden opacity-30 dark:opacity-40">
          <svg className="h-full w-full" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice">
            {[...Array(10)].map((_, i) => (
              <motion.path
                key={i}
                d={`M-100 ${20 + i * 35} Q 360 ${-30 + i * 30}, 720 ${20 + i * 35} T 1540 ${20 + i * 35}`}
                stroke={isDark ? "#F9D949" : "#D9692A"}
                strokeWidth={1 + i * 0.1}
                fill="none"
              />
            ))}
          </svg>
        </div>
        
        <FloatingAvatar testimonial={testimonials[0]} x="8%" y="10%" delay={0} scale={0.8} isDark={isDark} />
        <FloatingAvatar testimonial={testimonials[1]} x="14%" y="45%" delay={1} scale={1} isDark={isDark} />
        <FloatingAvatar testimonial={testimonials[2]} x="80%" y="15%" delay={0.5} scale={0.9} isDark={isDark} />
        <FloatingAvatar testimonial={testimonials[3]} x="84%" y="45%" delay={1.5} scale={0.75} isDark={isDark} />
        <FloatingAvatar testimonial={testimonials[4]} x="20%" y="65%" delay={2} scale={1.1} isDark={isDark} />
        <FloatingAvatar testimonial={testimonials[5]} x="76%" y="70%" delay={0.8} scale={1} isDark={isDark} />
        <FloatingAvatar testimonial={testimonials[3]} x="50%" y="35%" delay={1.2} scale={1.1} isDark={isDark} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="relative mt-4">
          {/* Gradient Masks for smooth carousel fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-32 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-32 bg-linear-to-l from-background to-transparent" />

          <Carousel
            setApi={setApi}
            plugins={autoScrollPlugins}
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-6 items-stretch">
              {[...testimonials, ...testimonials].map((testimonial, idx) => (
                <CarouselItem
                  key={`${testimonial.name}-${idx}`}
                  className="basis-full pl-6 sm:basis-[28rem] lg:basis-[32rem]"
                >
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="mt-16 flex items-center justify-center gap-4 text-center sm:mt-20">
          <div className="flex -space-x-3">
             {[testimonial1, testimonial2, testimonial3, testimonial4].map((img, i) => (
               <img key={i} src={img} className="size-10 rounded-full border-2 border-background object-cover" />
             ))}
          </div>
          <div className="flex flex-col items-start">
             <StarRating />
             <p className={cn("text-sm font-bold mt-1", isDark ? "text-white" : "text-neutral-900")}>
               4.9/5 <span className={cn("font-medium", isDark ? "text-white/50" : "text-neutral-500")}>from 2,000+ experts</span>
             </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonidals
