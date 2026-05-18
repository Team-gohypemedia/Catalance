"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const AnimatedHeroText = ({ 
  staticText, 
  titles = ["amazing", "new", "wonderful", "beautiful", "smart"],
  className = "" 
}) => {
  const [titleNumber, setTitleNumber] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <span className={className}>
      <span className="block sm:inline">{staticText}</span>
      <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 sm:inline-flex sm:w-auto sm:ml-3">
        &nbsp;
        <AnimatePresence mode="wait">
          {titles.map((title, index) => (
            titleNumber === index && (
              <motion.span
                key={index}
                className="absolute font-semibold text-[var(--primary)] whitespace-nowrap sm:relative sm:inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                {title}
              </motion.span>
            )
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
};
