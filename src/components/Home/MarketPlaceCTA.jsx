import React from "react";
import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Edit3 from "lucide-react/dist/esm/icons/edit-3";
import HeroMascotImage from "@/assets/images/hero-mascot-transparent.png";

const MarketPlaceCTA = () => {
  return (
    <section className="relative isolate w-full overflow-hidden bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* LEFT — description + CTA */}
          <div className="flex flex-col items-start justify-center gap-6 z-10 lg:pr-10">
            <h2 className="text-3xl sm:text-4xl lg:text-[3.2rem] font-extrabold leading-[1.15] tracking-tight text-foreground text-balance">
              Work Done On Your Terms, Every Single Time.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-md">
              Hire verified freelancers and expert agencies for fast, high-quality project delivery.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/talent"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-[0_8px_24px_rgba(217,105,42,0.25)]"
              >
                Browse Talent
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT — Visual Composition */}
          <div className="relative flex items-center justify-center w-full mt-10 lg:mt-0">
            {/* Uploaded Static Image */}
            <img 
              src={HeroMascotImage} 
              alt="Catalance Marketplace Platform" 
              className="w-full max-w-[500px] h-auto object-contain relative z-10 hover:scale-[1.02] transition-transform duration-700 ease-out"
              draggable="false"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketPlaceCTA;
