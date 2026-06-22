import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock 
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import testimonial1 from '@/assets/images/testimonials/Ajay-prajapati.jpg'
import testimonial2 from '@/assets/images/testimonials/mohd-kaif.jpg'
import testimonial3 from '@/assets/images/testimonials/nitin-nayak.jpg'
import testimonial4 from '@/assets/images/testimonials/aniket-thakur.jpg'
import welcomeIllustrationLight from '@/assets/images/welcome-illustration-light.png'
import welcomeIllustrationDark from '@/assets/images/welcome-illustration-dark.png'

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
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
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
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-1 lg:py-2 flex flex-col items-center justify-center mt-[20px] sm:mt-0">
      <div className="flex flex-col items-center text-center mb-1 lg:mb-2 max-w-4xl">

        {/* Heading */}
        <h1 className="text-[1.3rem] min-[400px]:text-2xl sm:text-3xl lg:text-[2.25rem] xl:text-[2.5rem] whitespace-nowrap font-medium tracking-tight text-neutral-900 dark:text-white leading-tight mb-3 sm:mb-4">
          Turn Your Skills into <span className="font-serif italic font-light text-primary text-[1.05em] select-none">Real Income</span>
        </h1>

        {/* Subheading */}
        <div className="text-neutral-900/60 dark:text-neutral-400 text-xs sm:text-sm lg:text-base max-w-none mb-6 sm:mb-8 leading-relaxed font-medium">
          Join thousands of freelancers who are earning on their terms and building the life they want.
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center w-full mb-2">
        
        {/* Left Column: Welcome Illustration */}
        <div className="lg:col-span-7 flex justify-center items-center">
          <div className="relative w-full max-w-lg lg:max-w-xl xl:max-w-2xl flex justify-center items-center">
            {/* Soft decorative background glow under the illustration */}
            <div className="absolute -inset-10 bg-radial from-primary/10 to-transparent blur-3xl pointer-events-none rounded-full opacity-60 dark:opacity-30" />
            
            {/* Light Theme Illustration */}
            <img 
              src={welcomeIllustrationLight} 
              alt="Welcome Illustration (Light Theme)" 
              className="relative w-full h-auto object-contain max-h-[250px] lg:max-h-[280px] xl:max-h-[310px] select-none hover:scale-[1.02] transition-transform duration-500 ease-out block dark:hidden"
            />

            {/* Dark Theme Illustration */}
            <img 
              src={welcomeIllustrationDark} 
              alt="Welcome Illustration (Dark Theme)" 
              className="relative w-full h-auto object-contain max-h-[250px] lg:max-h-[280px] xl:max-h-[310px] select-none hover:scale-[1.02] transition-transform duration-500 ease-out hidden dark:block"
            />
          </div>
        </div>

        {/* Right Column: Moving Reviews Carousel */}
        <div className="lg:col-span-5 flex justify-center w-full relative">
          
          {/* Outer glow overlay */}
          <div className="absolute -inset-4 bg-radial from-purple-500/5 to-transparent blur-2xl pointer-events-none rounded-[3rem]" />
          
          {/* Testimonial card */}
          <div className="relative w-full max-w-md rounded-[2.25rem] border border-neutral-200/60 bg-white/95 dark:border-neutral-800 dark:bg-neutral-900/50 backdrop-blur-xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
            
            {/* Purple quotes mark */}
            <div className="absolute top-2 left-4 text-[#6366F1] opacity-35 dark:opacity-45 text-6xl font-serif leading-none select-none">“</div>
            
            {/* Animated review quote */}
            <div className="flex-1 flex items-center pt-3 pb-3 min-h-[80px] relative z-10">
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
                    <span className="text-xs font-bold text-muted-foreground uppercase">{testimonials[activeReviewIdx].initials}</span>
                    {testimonials[activeReviewIdx].image ? (
                      <img 
                        src={testimonials[activeReviewIdx].image} 
                        alt={testimonials[activeReviewIdx].name}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : null}
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
      <div className="flex flex-col items-center mt-1 sm:mt-1.5 w-full">
        <button
          type="button"
          onClick={onContinue}
          className="h-11 sm:h-12 px-10 sm:px-12 rounded-full bg-primary text-white keep-white dark:text-black font-semibold shadow-lg shadow-primary/10 hover:bg-primary/95 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center text-sm sm:text-base cursor-pointer"
        >
          <span className="text-white keep-white dark:text-black">Continue</span>
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
