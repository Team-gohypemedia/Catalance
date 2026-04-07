"use client";

import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React from "react";
import {
  Autoplay,
  EffectCoverflow,
  Navigation,
  Pagination,
} from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css";
import "swiper/css/effect-cards";

import { cn } from "@/shared/lib/utils";

const DEFAULT_IMAGES = [
  {
    src: "/images/x.com/11.jpeg",
    alt: "Illustrations by my fav AarzooAly",
  },
  {
    src: "/images/x.com/13.jpeg",
    alt: "Illustrations by my fav AarzooAly",
  },
  {
    src: "/images/x.com/32.jpeg",
    alt: "Illustrations by my fav AarzooAly",
  },
  {
    src: "/images/x.com/20.jpeg",
    alt: "Illustrations by my fav AarzooAly",
  },
  {
    src: "/images/x.com/21.jpeg",
    alt: "Illustrations by my fav AarzooAly",
  },
  {
    src: "/images/x.com/19.jpeg",
    alt: "Illustrations by my fav AarzooAly",
  },
];

const DEFAULT_BREAKPOINTS = {
  0: {
    slidesPerView: 1.08,
    spaceBetween: 16,
  },
  640: {
    slidesPerView: 1.35,
    spaceBetween: 18,
  },
  768: {
    slidesPerView: 1.75,
    spaceBetween: 22,
  },
  1024: {
    slidesPerView: 2.2,
    spaceBetween: 28,
  },
  1280: {
    slidesPerView: 2.55,
    spaceBetween: 32,
  },
};

const Skiper47 = ({
  items = DEFAULT_IMAGES,
  renderSlide,
  wrapperClassName,
  className,
  slideClassName,
  showPagination = true,
  showNavigation = false,
  loop = true,
  autoplay = false,
  spaceBetween = 40,
  slidesPerView = 2.43,
  breakpoints = DEFAULT_BREAKPOINTS,
  centeredSlides = true,
}) => {

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-[#f5f4f3]",
        wrapperClassName,
      )}>
      <Carousel_001
        items={items}
        renderSlide={renderSlide}
        className={className}
        slideClassName={slideClassName}
        showPagination={showPagination}
        showNavigation={showNavigation}
        loop={loop}
        autoplay={autoplay}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        breakpoints={breakpoints}
        centeredSlides={centeredSlides}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-5 bg-[inherit] sm:w-6 lg:w-8"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-5 bg-[inherit] sm:w-6 lg:w-8"
      />
    </div>
  );
};

export { Skiper47 };

const Carousel_001 = ({
  items = DEFAULT_IMAGES,
  renderSlide,
  className,
  slideClassName,
  showPagination = false,
  showNavigation = false,
  loop = true,
  autoplay = false,
  spaceBetween = 40,
  slidesPerView = 2.43,
  breakpoints = DEFAULT_BREAKPOINTS,
  centeredSlides = true,
}) => {
  const resolvedAutoplay =
    typeof autoplay === "object"
      ? autoplay
      : autoplay
        ? {
            delay: 1500,
            disableOnInteraction: false,
          }
        : false;

  const css = `
  .Carousal_001 {
    padding-inline: 6px !important;
    padding-bottom: 26px !important;
    overflow: hidden !important;
  }

  .Carousal_001 .swiper-pagination-bullet {
    width: 9px;
    height: 9px;
    background: var(--color-accent);
    opacity: 1;
    transition: transform 0.2s ease, background-color 0.2s ease;
  }

  .Carousal_001 .swiper-pagination-bullet-active {
    background: var(--color-primary);
    transform: scale(1.15);
  }
  `;

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.5,
      }}
      className={cn("relative w-full max-w-[1120px] overflow-hidden", className)}>
      <style>{css}</style>
      <Swiper
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        autoplay={resolvedAutoplay}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={centeredSlides}
        loop={loop}
        breakpoints={breakpoints}
        coverflowEffect={{
          rotate: 0,
          slideShadows: false,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
        }}
        pagination={
          showPagination
            ? {
                clickable: true,
              }
            : false
        }
        navigation={
          showNavigation
            ? {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              }
            : false
        }
        className="Carousal_001"
        modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}>
        {items.map((item, index) => (
          <SwiperSlide
            key={item.id ?? item.src ?? index}
            className={cn(
              renderSlide
                ? "!flex !h-auto items-stretch"
                : "!h-[320px] overflow-hidden rounded-[2rem]",
              slideClassName,
            )}>
            {renderSlide ? (
              renderSlide(item, index)
            ) : (
              <img
                className="h-full w-full object-cover"
                src={item.src}
                alt={item.alt}
              />
            )}
          </SwiperSlide>
        ))}
        {showNavigation && (
          <div>
            <div className="swiper-button-next after:hidden">
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </div>
            <div className="swiper-button-prev after:hidden">
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </Swiper>
    </motion.div>
  );
};

export { Carousel_001 };

/**
 * Skiper 47 Carousel_001 — React + Swiper
 * Built with Swiper.js - Read docs to learn more https://swiperjs.com/
 * Illustrations by AarzooAly - https://x.com/AarzooAly
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.in
 * Twitter: https://x.com/Gur__vi
 */
