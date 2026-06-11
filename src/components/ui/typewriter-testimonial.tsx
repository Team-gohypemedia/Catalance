'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "@/components/providers/theme-provider";

export type Testimonial = {
  image: string;
  audio?: string;
  text: string;
  name: string;
  jobtitle: string;
};

export type ComponentProps = {
  testimonials: Testimonial[];
};

export const Component: React.FC<ComponentProps> = ({ testimonials }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { theme } = useTheme();
  
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null); 
  const [hasBeenHovered, setHasBeenHovered] = useState<boolean[]>(new Array(testimonials.length).fill(false));
  const [typedText, setTypedText] = useState('');
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef('');

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause(); 
      audioPlayerRef.current.currentTime = 0; 
      audioPlayerRef.current.src = ''; 
      audioPlayerRef.current.load(); 
      audioPlayerRef.current = null; 
    }
  }, []); 

  const startTypewriter = useCallback((text: string) => {
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

  const stopTypewriter = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setTypedText('');
    currentTextRef.current = '';
  }, []); 

  const handleMouseEnter = useCallback((index: number) => {
    stopAudio(); 
    setHoveredIndex(index);
  
    if (testimonials[index].audio) {
      const newAudio = new Audio(`/audio/${testimonials[index].audio}`);
      audioPlayerRef.current = newAudio; 
      newAudio.play().catch(e => {
        console.warn("Audio playback prevented or failed:", e);
      });
    }
    
    setHasBeenHovered(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
    startTypewriter(testimonials[index].text);
  }, [testimonials, stopAudio, startTypewriter]); 

  const handleMouseLeave = useCallback(() => {
    stopAudio(); 
    setHoveredIndex(null);
    stopTypewriter();
  }, [stopAudio, stopTypewriter]);

  useEffect(() => {
    return () => {
      stopAudio(); 
      stopTypewriter(); 
    };
  }, [stopAudio, stopTypewriter]); 

  return (
    <div className="flex justify-center items-center gap-4 flex-wrap">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          className="relative flex flex-col items-center"
          onMouseEnter={() => handleMouseEnter(index)} 
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img
            src={testimonial.image}
            alt={`Testimonial ${testimonial.name}`}
            className="w-16 h-16 rounded-full border-4 hover:animate-pulse border-gray-300 cursor-pointer object-cover shadow-md"
            animate={{ 
              borderColor: (hoveredIndex === index || hasBeenHovered[index]) 
                ? 'var(--primary)' 
                : (isDark ? '#262626' : '#E5E7EB')
            }}
            transition={{ duration: 0.3 }}
          />
          <AnimatePresence>
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-20 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs px-4 py-3 rounded-2xl shadow-2xl max-w-xs w-56 border border-neutral-200/60 dark:border-neutral-800 z-50 text-left"
              >
                <div className="h-20 overflow-hidden whitespace-pre-wrap font-medium leading-relaxed opacity-90 dark:opacity-95">
                  {typedText}
                  <span className="animate-pulse text-primary font-bold">|</span>
                </div>
                <p className="mt-1 text-right font-bold text-neutral-900 dark:text-white">{testimonial.name}</p>
                <p className="text-right text-neutral-900/50 dark:text-neutral-400 text-[10px] font-semibold">{testimonial.jobtitle}</p>
                <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-4 flex flex-col items-center pointer-events-none">
                  <div className="w-2.5 h-2.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850"></div>
                  <div className="w-1.5 h-1.5 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                  <div className="w-1 h-1 bg-white dark:bg-neutral-900 rounded-full shadow-md border border-neutral-200/60 dark:border-neutral-850 mt-0.5"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default Component;
