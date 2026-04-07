import React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import MascotCTA from "@/assets/videos/mascot-cta.gif";

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
    <section className="relative isolate w-full overflow-hidden bg-background">
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[1fr_auto] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="flex items-center">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="flex justify-center lg:justify-start">
              <img
                src={MascotCTA}
                alt="Mascot animation"
                loading="eager"
                decoding="async"
                draggable="false"
                className="w-full max-w-[15rem] select-none object-contain sm:max-w-[19rem] lg:max-w-[25rem]"
              />
            </div>

            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h2 className="text-[2.35rem] font-medium leading-[0.98] tracking-tight text-white sm:text-[3.2rem] lg:text-[4.4rem]">
                <span className="block">Freelancers You Can</span>
                <span className="block">Count On</span>
              </h2>

              <p className="mt-6 max-w-xl text-pretty text-[0.98rem] leading-relaxed text-white/78 sm:text-lg lg:max-w-2xl">
                Trusted professionals delivering quality work on time, consistently.
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
