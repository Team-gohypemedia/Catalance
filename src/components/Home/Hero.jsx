import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/providers/theme-provider";
import NumberTicker from "@/components/ui/number-ticker";
import Star from "lucide-react/dist/esm/icons/star";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeroBg1 from "@/assets/images/hero-bg1.png";
import HeroBg2 from "@/assets/images/hero-bg2.png";

import ShinyText from "@/components/common/ShinyText";
import BrandMarquee from "./BrandMarquee";
import { AnimatedHeroText } from "@/components/ui/animated-hero";

const BlackholeParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let maxRadius = 0;
    let animationFrame = 0;
    const particleCount = 80;

    const createParticle = () => {
      const radius = Math.random() * maxRadius;
      return {
        angle: Math.random() * Math.PI * 2,
        radius,
        driftX: (Math.random() - 0.5) * 0.12,
        driftY: (Math.random() - 0.5) * 0.12,
        pull: 0.22 + Math.random() * 0.34,
        size: 0.35 + Math.random() * 0.8,
        alpha: 0.72 + Math.random() * 0.28,
      };
    };

    let particles = [];
    let particleColorRGB = "255, 255, 255";

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const fg = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
      particleColorRGB = fg.includes("1C1B1F") || fg.includes("0, 0, 0") || fg.includes("#1C1B1F") ? "0, 0, 0" : "255, 255, 255";

      width = bounds.width;
      height = bounds.height;
      centerX = width / 2;
      centerY = height / 2;
      maxRadius = Math.max(width, height) * 0.62;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      particles = Array.from({ length: particleCount }, createParticle);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.radius -= particle.pull;

        if (particle.radius <= 6) {
          Object.assign(particle, createParticle(), {
            radius: maxRadius * (0.7 + Math.random() * 0.3),
          });
        }

        const x = centerX + Math.cos(particle.angle) * particle.radius + particle.driftX;
        const y = centerY + Math.sin(particle.angle) * particle.radius + particle.driftY;
        const brightness = 0.92 + (particle.radius / maxRadius) * 0.08;

        context.beginPath();
        context.fillStyle = `rgba(${particleColorRGB}, ${particle.alpha * brightness})`;
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />;
};

const Hero = () => {
  const { theme } = useTheme();
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const starColor = isDarkMode ? "#F9D949" : "#D9692A";

  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden bg-background pt-32 pb-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Diagonal Grid Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.1]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px),
              repeating-linear-gradient(-45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 20px)
            `,
            backgroundSize: "40px 40px",
            color: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)"
          }}
        />

        <div className="absolute inset-0 opacity-80">
          <BlackholeParticles />
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden dark:block">
          <div className="relative h-[29rem] w-[29rem] max-w-none animate-[spin_8s_linear_infinite] opacity-40 [will-change:transform] sm:h-[37rem] sm:w-[37rem] lg:h-[51rem] lg:w-[51rem]">
            <img
              src={HeroBg1}
              alt=""
              className="relative h-full w-full select-none object-contain drop-shadow-[0_0_36px_rgba(var(--brand-rgb),0.28)]"
              draggable="false"
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden dark:block">
          <div className="relative h-[29rem] w-[29rem] animate-[spin_8s_linear_infinite_reverse] opacity-70 [will-change:transform] sm:h-[29rem] sm:w-[29rem] lg:h-[35rem] lg:w-[35rem]">
            <img
              src={HeroBg2}
              alt=""
              className="relative h-full w-full select-none object-contain drop-shadow-[0_0_42px_rgba(var(--brand-rgb),0.36)]"
              draggable="false"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <Badge
          variant="outline"
          className="mb-3 inline-flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-full bg-background/35 px-4 py-1.5 text-[0.64rem] font-medium leading-none backdrop-blur-md sm:mb-9 sm:max-w-none sm:gap-2 sm:px-5 sm:text-sm border-black/10 dark:border-white/10"
        >
          <Star className="size-3.5 shrink-0 sm:size-4" style={{ fill: starColor, color: starColor }} />
          <ShinyText
            speed={4}
            text={
              <div className="flex items-center gap-1.5">
                <span className="px-1 font-bold">
                  <NumberTicker value={10000} className="text-inherit" />+
                </span>
                <span>Projects delivered on Catalance</span>
              </div>
            }
          />
        </Badge>

        <h1 className="max-w-4xl text-[2.1rem] font-medium leading-[1.1] tracking-tight text-foreground dark:text-white sm:text-[2.75rem] md:text-[3.4rem] lg:text-[4.4rem]">
          <AnimatedHeroText
            staticText="Find Talent You Can"
            titles={["Expertly Trust", "Verify Today", "Safely Hire", "Clearly Vetted", "Top-Tier Only"]}
            className="flex flex-col items-center"
          />
        </h1>

        <p className="mt-6 mb-6 max-w-4xl text-balance text-sm font-normal leading-relaxed text-foreground/80 dark:text-white/90 sm:mt-7 sm:mb-7 sm:text-base md:text-lg">
          Hire trusted experts focused on reliable and timely delivery.
        </p>

        <Button
          asChild
          size="lg"
          className="mb-12 px-8 text-lg font-semibold text-primary-foreground shadow-[0_14px_36px_rgba(var(--brand-rgb),0.22)]"
        >
          <Link to="/service">Hire Expert</Link>
        </Button>
      </div>

      {/* Integrated Brand Marquee at the bottom */}
      <div className="relative z-20 w-full pt-10">
        <BrandMarquee isIntegrated={true} />
      </div>
    </section>
  );
};

export default Hero;
