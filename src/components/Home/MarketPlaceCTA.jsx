import React from "react";
import { Link } from "react-router-dom";

import LightRays from "@/components/ui/LightRays";
import { Button } from "@/components/ui/button";
import Mascot1 from "@/assets/mascot/mascot1.png";

const MARKETPLACE_STATS = [
  {
    label: "Brands Onboarded",
    value: "20k+",
    description: "7,000+ businesses and brands using Catalance.",
  },
  {
    label: "Successful Projects",
    value: "1000+",
    description: "10,000+ projects completed successfully through the platform.",
  },
  {
    label: "Freelancers Enrolled",
    value: "10+",
    description: "Skilled freelancers who have joined the Catalance network.",
  },
];

const MarketPlaceCTA = () => {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#0b0b0b]">
      <div aria-hidden className="absolute inset-0 bg-[#0b0b0b]" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[72%] bg-[linear-gradient(180deg,rgba(98,78,8,0.94)_0%,rgba(70,56,8,0.8)_18%,rgba(44,36,8,0.52)_38%,rgba(21,18,7,0.24)_62%,rgba(11,11,11,0.04)_82%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[84%] bg-[radial-gradient(ellipse_at_top,rgba(255,204,0,0.28)_0%,rgba(255,204,0,0.16)_20%,rgba(255,204,0,0.06)_46%,transparent_78%)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-[-10rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#ffcc00]/34 blur-[140px] sm:h-[44rem] sm:w-[44rem]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[30rem] w-[85%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,204,0,0.18)_0%,rgba(255,204,0,0.08)_38%,transparent_74%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[76%] [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]"
      >
        <LightRays
         raysOrigin="top-center"
        raysColor="#000000"
        raysSpeed={1}
        lightSpread={0.5}
        rayLength={3}
        followMouse={true}
        mouseInfluence={0}
        noiseAmount={0}
        distortion={0}
        className="custom-rays"
        pulsating={false}
        fadeDistance={0.5}
        saturation={2}
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[1fr_auto] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="flex items-center">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="flex justify-center lg:justify-start">
              <img
                src={Mascot1}
                alt="Catalance mascot wearing a yellow suit"
                loading="lazy"
                decoding="async"
                draggable="false"
                className="w-full max-w-[15rem] select-none object-contain drop-shadow-[0_24px_60px_rgba(255,204,0,0.18)] sm:max-w-[19rem] lg:max-w-[25rem]"
              />
            </div>

            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h2 className="text-[2.35rem] font-medium leading-[0.98] tracking-tight text-white sm:text-[3.2rem] lg:text-[4.4rem]">
                <span className="block">Freelancers You Can</span>
                <span className="block">Count On</span>
              </h2>

              <p className="mt-6 max-w-xl text-pretty text-[0.98rem] leading-relaxed text-white/78 sm:text-lg lg:max-w-2xl">
                Vetted talent. Protected payments. Managed projects. The
                platform built for clients who expect professionals to act like
                professionals.
              </p>

              <Button
                asChild
                className="mt-8 h-12 rounded-md bg-[#ffcc00] px-6 text-sm font-semibold text-black hover:bg-[#ffcc00]/90 sm:h-12 sm:px-7 sm:text-base"
              >
                <Link to="/talent">Browse Talent</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-10 border-t border-white/10 pt-10 text-center md:grid-cols-3 md:gap-8 lg:pt-12">
          {MARKETPLACE_STATS.map((stat) => (
            <div key={stat.label} className="mx-auto max-w-xs">
              <p className="text-sm font-medium text-white/88 sm:text-base">
                {stat.label}
              </p>
              <p className="mt-4 text-[2.6rem] font-medium leading-none tracking-tight text-white sm:text-[3.4rem]">
                {stat.value}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/62 sm:text-[0.95rem]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketPlaceCTA;
