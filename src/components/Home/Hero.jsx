import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Star from "lucide-react/dist/esm/icons/star";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HeroBg1 from "@/assets/images/hero-bg1.png";
import HeroBg2 from "@/assets/images/hero-bg2.png";

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
    const particleCount = 160;

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

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

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

        const x =
          centerX + Math.cos(particle.angle) * particle.radius + particle.driftX;
        const y =
          centerY + Math.sin(particle.angle) * particle.radius + particle.driftY;
        const brightness = 0.92 + (particle.radius / maxRadius) * 0.08;

        context.beginPath();
        context.fillStyle = `rgba(255, 255, 255, ${particle.alpha * brightness})`;
        context.shadowBlur = 6;
        context.shadowColor = "rgba(255, 255, 255, 1)";
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
  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-80">
          <BlackholeParticles />
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[29rem] w-[29rem] max-w-none animate-[spin_8s_linear_infinite] opacity-40 [will-change:transform] sm:h-[37rem] sm:w-[37rem] lg:h-[51rem] lg:w-[51rem]">
            <img
              src={HeroBg1}
              alt=""
              className="relative h-full w-full select-none object-contain drop-shadow-[0_0_36px_rgba(255,204,0,0.28)]"
              draggable="false"
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[29rem] w-[29rem] animate-[spin_8s_linear_infinite_reverse] opacity-70 [will-change:transform] sm:h-[29rem] sm:w-[29rem] lg:h-[35rem] lg:w-[35rem]">
            <img
              src={HeroBg2}
              alt=""
              className="relative h-full w-full select-none object-contain drop-shadow-[0_0_42px_rgba(255,204,0,0.36)]"
              draggable="false"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <Badge
          variant="outline"
          className="mb-7 inline-flex gap-1.5 rounded-full bg-background/35 px-4 py-1 text-sm font-medium text-white backdrop-blur-md sm:mb-9"
        >
          <Star className="size-4 fill-primary text-primary" />
          <span className="font-semibold text-primary">10,000+</span>
          <span className="text-white/90">Projects delivered on Catalance</span>
        </Badge>

        <h1 className="max-w-4xl text-[2.1rem] font-medium leading-[1.05] tracking-tight text-white sm:text-[2.75rem] md:text-[3.4rem] lg:text-[4.4rem]">
          <span className="block">Find Talent You Can</span>
          <span className="block">Actually Trust</span>
        </h1>

        <p className="mt-6 max-w-4xl text-balance text-sm font-normal leading-relaxed text-white sm:mt-7 sm:text-base md:text-lg">
          98% success rate | Protected payments | Dedicated Project Managers
          tracking every deadline | This is freelancing without the friction
        </p>

        <Button
          asChild
          size="lg"
          className="px-8 text-lg font-semibold shadow-[0_14px_36px_rgba(255,204,0,0.22)] sm:mt-11"
        >
          <Link to="/talent">Browse Talent</Link>
        </Button>
      </div>
    </section>
  );
};

export default Hero;
