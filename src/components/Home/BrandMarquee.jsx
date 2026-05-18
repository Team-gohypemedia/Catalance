"use client";

import React from "react";
import { Marquee } from "@/components/ui/marquee";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/shared/lib/utils";

// Import new marquee logos
import logo1 from "@/assets/marquee logo/1.webp";
import logo2 from "@/assets/marquee logo/2.webp";
import logo3 from "@/assets/marquee logo/3.webp";
import logo4 from "@/assets/marquee logo/4.webp";
import logo5 from "@/assets/marquee logo/5.webp";
import logo6 from "@/assets/marquee logo/6.webp";
import logo7 from "@/assets/marquee logo/7.webp";
import logo8 from "@/assets/marquee logo/8.webp";
import logo9 from "@/assets/marquee logo/9.webp";
import logo10 from "@/assets/marquee logo/10.webp";
import logo11 from "@/assets/marquee logo/11.webp";
import logo12 from "@/assets/marquee logo/12.webp";

const brands = [
  { name: "Brand 1", logo: logo1 },
  { name: "Brand 2", logo: logo2 },
  { name: "Brand 3", logo: logo3, isWhite: true }, // Ghanshyam Das Kotawala
  { name: "Brand 4", logo: logo4, isWhite: true }, // KAZO
  { name: "Brand 5", logo: logo5, isWhite: true }, // Lazada
  { name: "Brand 6", logo: logo6 },
  { name: "Brand 7", logo: logo7, isWhite: true }, // IT
  { name: "Brand 8", logo: logo8 },
  { name: "Brand 9", logo: logo9 },
  { name: "Brand 10", logo: logo10, isWhite: true },
  { name: "Brand 11", logo: logo11, isWhite: true },
  { name: "Brand 12", logo: logo12, isWhite: true },
];

const BrandCard = ({ brand, isDark }) => {
  return (
    <div className="flex items-center justify-center px-12 py-6">
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-300",
          "opacity-100 hover:scale-110",
          !isDark && brand.isWhite && "brightness-0"
        )}
      >
        <img 
          src={brand.logo} 
          alt={brand.name} 
          className="h-16 w-auto object-contain sm:h-20 md:h-24 lg:h-32"
        />
      </div>
    </div>
  );
};

const BrandMarquee = ({ isIntegrated = false }) => {
  const { theme } = useTheme();
  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className={cn(
      "relative w-full overflow-hidden mx-auto",
      isIntegrated ? "py-4 sm:py-6" : "py-8 sm:py-12"
    )}>
      {/* Diagonal Grid Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.25] dark:opacity-[0.1]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px),
            repeating-linear-gradient(-45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px)
          `,
          backgroundSize: "40px 40px",
          color: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)"
        }}
      />

      <div className="relative z-10 mb-8 text-center">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.4em] text-foreground/70 dark:text-white/60">
          Trusted by Industry Leaders
        </span>
      </div>

      <div className="relative z-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-32 bg-linear-to-r from-background to-transparent sm:w-64" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-32 bg-linear-to-l from-background to-transparent sm:w-64" />
        
        <Marquee pauseOnHover className="[--duration:40s]">
          {brands.map((brand, idx) => (
            <BrandCard key={`${brand.name}-${idx}`} brand={brand} isDark={isDarkMode} />
          ))}
        </Marquee>
      </div>
    </div>
  );
};

export default BrandMarquee;
