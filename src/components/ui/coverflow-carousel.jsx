import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CoverflowCarousel = ({ items, onCardClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-10 flex flex-col items-center justify-center perspective-[1000px]">
      <div className="relative h-[400px] w-full flex items-center justify-center preserve-3d">
        {items.map((item, index) => {
          // Calculate circular distance
          let offset = (index - activeIndex + items.length) % items.length;
          // Adjust for negative wrapping to keep items centered
          if (offset > items.length / 2) offset -= items.length;

          // Only render visible items to improve performance and look
          if (Math.abs(offset) > 2) return null;

          const isActive = offset === 0;
          const direction = offset > 0 ? 1 : -1;

          return (
            <motion.div
              key={item.id}
              className="absolute w-[280px] sm:w-[350px] h-[400px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer border border-white/10 bg-gray-900"
              initial={false}
              animate={{
                rotateY: isActive ? 0 : offset * -25, // Rotate towards center
                scale: isActive ? 1 : 1 - Math.abs(offset) * 0.15, // Scale down further items
                zIndex: 100 - Math.abs(offset),
                x: isActive ? 0 : offset * 220, // Spacing
                z: isActive ? 0 : -100 * Math.abs(offset), // Push back
                opacity: isActive ? 1 : 0.6,
                filter: isActive ? "blur(0px)" : "blur(2px)",
              }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }} // Smooth spring-like easing
              onClick={() => {
                if (isActive && onCardClick) {
                  onCardClick(item);
                } else {
                  setActiveIndex(index);
                }
              }}
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform, opacity, filter",
                boxShadow: isActive
                  ? "0 20px 50px -12px rgba(0, 0, 0, 0.5)"
                  : "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Content Container */}
              <div className="relative w-full h-full">
                {item.content}

                {/* Overlay for depth */}
                {!isActive && (
                  <div className="absolute inset-0 bg-black/40 pointer-events-none transition-colors duration-500" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex gap-3 mt-8">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? "bg-[#ffc800] w-8"
                : "bg-gray-600 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
