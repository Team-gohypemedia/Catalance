import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import img1 from "@/assets/img1.png";
import img2 from "@/assets/img2.png";
import img3 from "@/assets/img3.png";
import img4 from "@/assets/img4.png";

const ProcessVideo = () => {
  return (
    <section id="how-it-works" className="relative w-full pt-8 pb-2 lg:py-24 bg-background">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">
          
          {/* Left: Text & CTA */}
          <div className="flex flex-col items-start text-left max-w-xl mx-auto lg:mx-0">
            <h2 className="text-[40px] font-weight-[600] tracking-tight text-foreground sm:text-6xl lg:text-[68px] leading-[1.1] lg:leading-[1.05]">
              Find the right <br className="hidden lg:block" />
              experts to grow <br className="hidden lg:block" />
              your business <br className="hidden lg:block" />
              <span className="text-primary">faster.</span>
            </h2>
            <p className="mt-8 max-w-[460px] text-lg sm:text-[19px] text-muted-foreground leading-relaxed">
              Connect with verified freelancers and agencies who deliver quality work, on time and on budget.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                to="/service"
                className="inline-flex h-[52px] items-center justify-center rounded-full bg-primary px-8 text-[15px] font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02]"
              >
                Explore Services
              </Link>
              <Link
                to="/signin/phone?role=freelancer"
                className="inline-flex h-[52px] items-center justify-center rounded-full border-2 border-border/80 bg-transparent px-8 text-[15px] font-bold text-primary transition-all hover:bg-muted dark:border-white/10 dark:hover:bg-white/5 hover:scale-[1.02]"
              >
                Join as Freelancer
              </Link>
            </div>
          </div>

          {/* Right: Collage */}
          <div className="relative hidden lg:flex h-[480px] w-full max-w-[600px] mx-auto lg:max-w-none gap-4 sm:gap-6 sm:h-[600px] lg:h-[720px]">
            {/* Left Tall Image */}
            <div className="w-[45%] h-full flex items-center justify-center">
              <div className="relative w-full aspect-[3/5] overflow-hidden rounded-[2rem] sm:rounded-[3rem] shadow-xl">
                <img
                  src={img3}
                  alt="Team collaboration"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Right Stacked Images */}
            <div className="flex w-[55%] flex-col gap-4 sm:gap-6 py-2 pr-2 sm:pr-4">
              {/* Top Image */}
              <div className="relative flex-1 w-[90%] self-end overflow-hidden rounded-[24px] sm:rounded-[32px] sm:-translate-x-12  shadow-lg skew-x-6 sm:skew-x-12 transition-transform hover:scale-[1.02]">
                <img
                  src={img1}
                  alt="Experts working"
                  className="absolute inset-0 h-full w-full object-cover -skew-x-6 sm:-skew-x-12 scale-[1.25]"
                />
              </div>
              
              {/* Middle Image */}
              <div className="relative flex-1 w-[100%] self-end overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-2xl z-10 -ml-4 sm:-ml-8 transition-transform hover:scale-[1.02]">
                <img
                  src={img2}
                  alt="Creative process"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Bottom Image */}
              <div className="relative flex-1 w-[90%] self-end overflow-hidden rounded-[24px] sm:rounded-[32px] sm:-translate-x-12  shadow-lg -skew-x-6 sm:-skew-x-12 transition-transform hover:scale-[1.02]">
                <img
                  src={img4}
                  alt="Freelancer working"
                  className="absolute inset-0 h-full w-full object-cover skew-x-6 sm:skew-x-12 scale-[1.25]"
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default ProcessVideo;
