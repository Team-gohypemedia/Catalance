import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, 
  Sparkles, 
  Users, 
  TrendingUp, 
  Handshake, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Lock 
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import testimonial1 from '@/assets/images/testimonials/Ajay-prajapati.jpg'
import testimonial2 from '@/assets/images/testimonials/mohd-kaif.jpg'
import testimonial3 from '@/assets/images/testimonials/nitin-nayak.jpg'
import testimonial4 from '@/assets/images/testimonials/aniket-thakur.jpg'

const testimonials = [
  {
    quote: "Since I started sharing my strengths, I've connected with amazing clients and grown my business more than ever.",
    name: "Sarah K.",
    role: "Freelance Marketing Consultant",
    image: testimonial1,
    initials: "SK"
  },
  {
    quote: "The matching algorithm is incredibly accurate. I got connected with my ideal clients in a matter of days.",
    name: "Ajay P.",
    role: "UI/UX Designer",
    image: testimonial2,
    initials: "AP"
  },
  {
    quote: "Creating a service catalog helped me showcase my work cleanly. My conversion rate has doubled since joining.",
    name: "Nitin N.",
    role: "Video Editor",
    image: testimonial3,
    initials: "NN"
  },
  {
    quote: "Catalance handles payment escrows and contracts flawlessly. I can focus 100% on doing great work.",
    name: "Aniket T.",
    role: "Software Engineer",
    image: testimonial4,
    initials: "AT"
  }
]

const FreelancerWelcomeSlide = ({ onContinue }) => {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-2 lg:py-3 flex flex-col items-center justify-center">
      {/* Centered Heading Section */}
      <div className="flex flex-col items-center text-center mb-5 lg:mb-6 max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-2">
          <Star className="h-3.5 w-3.5 fill-current text-primary" />
          <span className="text-primary font-bold">Your strengths make an impact</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] font-medium tracking-tight text-neutral-900 dark:text-white leading-tight mb-1.5">
          Time to <span className="font-serif italic font-light text-primary text-[1.05em] select-none">Show Off</span> a Little
        </h1>

        {/* Subheading */}
        <div className="text-neutral-900/60 dark:text-neutral-400 text-xs sm:text-sm lg:text-base max-w-2xl leading-relaxed font-medium">
          Share your strengths, we'll match you with clients who value them.
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center w-full mb-4">
        
        {/* Left Column: Strengths & Layout details (boxes) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Key Features Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            
            {/* Feature 1 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white/95 dark:border-neutral-800 dark:bg-neutral-900/40 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-snug">Get Matched</div>
                <div className="text-[11px] leading-tight text-neutral-900/60 dark:text-neutral-400 mt-0.5 font-medium">We connect you with clients who need you.</div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white/95 dark:border-neutral-800 dark:bg-neutral-900/40 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-snug">Show Your Value</div>
                <div className="text-[11px] leading-tight text-neutral-900/60 dark:text-neutral-400 mt-0.5 font-medium">Highlight your strengths and stand out.</div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white/95 dark:border-neutral-800 dark:bg-neutral-900/40 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-snug">Grow Your Business</div>
                <div className="text-[11px] leading-tight text-neutral-900/60 dark:text-neutral-400 mt-0.5 font-medium">Build relationships and achieve more.</div>
              </div>
            </div>

          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            
            {/* Stat 1 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-neutral-900/20 hover:border-primary/30 hover:bg-neutral-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/30 dark:border dark:border-purple-800/20 flex items-center justify-center shrink-0">
                <Users className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-base sm:text-xl font-extrabold text-neutral-900 dark:text-white leading-none">25K+</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-neutral-900/60 dark:text-neutral-400 uppercase tracking-tight mt-1 leading-none">Professionals</div>
                <div className="text-[9px] sm:text-[10px] text-neutral-900/45 dark:text-neutral-500 mt-1.5 leading-snug">Trusted by experts</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-neutral-900/20 hover:border-primary/30 hover:bg-neutral-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/30 dark:border dark:border-emerald-800/20 flex items-center justify-center shrink-0">
                <Handshake className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-base sm:text-xl font-extrabold text-neutral-900 dark:text-white leading-none">10K+</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-neutral-900/60 dark:text-neutral-400 uppercase tracking-tight mt-1 leading-none">Matches</div>
                <div className="text-[9px] sm:text-[10px] text-neutral-900/45 dark:text-neutral-500 mt-1.5 leading-snug">Meaningful links</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-neutral-900/20 hover:border-primary/30 hover:bg-neutral-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/30 dark:border dark:border-blue-800/20 flex items-center justify-center shrink-0">
                <Star className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 fill-current" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-base sm:text-xl font-extrabold text-neutral-900 dark:text-white leading-none">4.9/5</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-neutral-900/60 dark:text-neutral-400 uppercase tracking-tight mt-1 leading-none">Rating</div>
                <div className="text-[9px] sm:text-[10px] text-neutral-900/45 dark:text-neutral-500 mt-1.5 leading-snug">Highly approved</div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-neutral-900/20 hover:border-primary/30 hover:bg-neutral-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="text-base sm:text-xl font-extrabold text-neutral-900 dark:text-white leading-none">100%</div>
                <div className="text-[9px] sm:text-[10px] font-bold text-neutral-900/60 dark:text-neutral-400 uppercase tracking-tight mt-1 leading-none">Secure</div>
                <div className="text-[9px] sm:text-[10px] text-neutral-900/45 dark:text-neutral-500 mt-1.5 leading-snug">Private data</div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Moving Reviews Carousel */}
        <div className="lg:col-span-5 flex justify-center w-full relative">
          
          {/* Outer glow overlay */}
          <div className="absolute -inset-4 bg-radial from-purple-500/5 to-transparent blur-2xl pointer-events-none rounded-[3rem]" />
          
          {/* Testimonial card */}
          <div className="relative w-full max-w-md rounded-[2.25rem] border border-neutral-200/60 bg-white/95 dark:border-neutral-800 dark:bg-neutral-900/50 backdrop-blur-xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between min-h-[200px] sm:min-h-[230px]">
            
            {/* Purple quotes mark */}
            <div className="absolute top-2 left-4 text-[#6366F1] opacity-35 dark:opacity-45 text-6xl font-serif leading-none select-none">“</div>
            
            {/* Animated review quote */}
            <div className="flex-1 flex items-center pt-5 pb-5 min-h-[100px] relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeReviewIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm sm:text-base text-neutral-900/80 dark:text-neutral-100 italic font-medium leading-relaxed"
                >
                  {testimonials[activeReviewIdx].quote}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Author info & Dots navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeReviewIdx}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3"
                >
                  {/* Avatar image with fallback */}
                  <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {testimonials[activeReviewIdx].image ? (
                      <img 
                        src={testimonials[activeReviewIdx].image} 
                        alt={testimonials[activeReviewIdx].name}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : null}
                    <span className="text-xs font-bold text-muted-foreground uppercase">{testimonials[activeReviewIdx].initials}</span>
                  </div>
                  
                  {/* Author metadata */}
                  <div className="flex flex-col text-left">
                    <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                      {testimonials[activeReviewIdx].name}
                    </div>
                    <div className="text-[11px] font-semibold text-neutral-900/50 dark:text-neutral-400 mt-0.5">
                      {testimonials[activeReviewIdx].role}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slide dots indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveReviewIdx(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                      idx === activeReviewIdx 
                      ? "w-4 bg-primary" 
                      : "w-1.5 bg-neutral-900/20 dark:bg-neutral-700"
                    )}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Continue button block at bottom center */}
      <div className="flex flex-col items-center mt-4 sm:mt-5 w-full">
        <button
          type="button"
          onClick={onContinue}
          className="h-11 sm:h-12 px-10 sm:px-12 rounded-full bg-primary text-white keep-white font-semibold shadow-lg shadow-primary/10 hover:bg-primary/95 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
        >
          <span className="text-white keep-white">Continue</span>
          <ArrowRight className="h-4.5 w-4.5 text-white keep-white" />
        </button>
        
        {/* Helper lock text */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-900/55 dark:text-neutral-400 mt-1.5 font-semibold">
          <Lock className="h-3.5 w-3.5 text-neutral-900/55 dark:text-neutral-400" />
          <div>Takes less than 2 minutes</div>
        </div>
      </div>

    </section>
  )
}

export default FreelancerWelcomeSlide
