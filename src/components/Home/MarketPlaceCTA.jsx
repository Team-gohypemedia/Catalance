import React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import MascotCTA from "@/assets/videos/mascot-cta.mp4";
import MascotPoster from "@/assets/mascot.png";

const MARKETPLACE_STATS = [
  {
    label: "Brands Onboarded",
    value: "20k+",
  },
  {
    label: "Successful Projects",
    value: "1000+",
  },
  {
    label: "Freelancers Enrolled",
    value: "10+",
  },
];

const MarketPlaceCTA = () => {
  return (
    <section className="relative isolate w-full overflow-hidden bg-background">
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[1fr_auto] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="flex items-center">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="flex justify-center lg:justify-start">
              <video
                src={MascotCTA}
                poster={MascotPoster}
                aria-label="Mascot animation"
                draggable="false"
                className="block w-full max-w-[20rem] select-none object-contain sm:max-w-[30rem] lg:max-w-[40rem]"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                onEnded={(event) => {
                  event.currentTarget.currentTime = 0;
                  const playPromise = event.currentTarget.play();

                  if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {});
                  }
                }}
              />
            </div>

            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h2 className="whitespace-nowrap text-[clamp(1.5rem,5vw,4rem)] font-medium leading-[0.98] tracking-tight text-white">
                Work Done On Your Terms
              </h2>

              <p className="mt-1 sm:mt-3 max-w-xl text-pretty text-[0.98rem] leading-relaxed text-white/78 sm:text-lg lg:max-w-2xl">
                No delays, no excuses, just great work.
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketPlaceCTA;
