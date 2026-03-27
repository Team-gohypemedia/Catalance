import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Users from "lucide-react/dist/esm/icons/users";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import Target from "lucide-react/dist/esm/icons/target";
import Zap from "lucide-react/dist/esm/icons/zap";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import SparklesIcon from "@/components/ui/sparkles-icon";
import { Spotlight } from "@/components/sections/home/spotlight-new";
import DecorativeIcons from "@/components/ui/decorative-icons";
import MascotImage from "@/assets/mascot.png";

const CatalanceHero = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);
  const textColor = isDark ? "text-white" : "text-gray-900";
  const subTextColor = isDark ? "text-neutral-300" : "text-gray-600";
  const cardSurfaceClass = isDark
    ? "bg-linear-to-bl from-primary/40 via-black to-black border-white/10 shadow-card"
    : "bg-linear-to-b from-white via-white to-amber-50/70 border-black/10 shadow-[0_16px_48px_rgba(2,6,23,0.08)]";
  const cardTitleClass = isDark ? "text-white" : "text-neutral-900";
  const cardBodyClass = isDark ? "text-neutral-300" : "text-neutral-600";
  const cardFeatureClass = isDark ? "text-neutral-100/90" : "text-neutral-700";
  const cardEmphasisClass = isDark ? "text-primary" : "text-primary-strong";

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes subtlePulse {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.03);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}
      </style>
      <section
        className="relative isolate flex min-h-screen w-full flex-col items-center overflow-hidden bg-background text-foreground transition-colors duration-500"
      >
        {/* ================== BACKGROUND ================== */}
        <div
          aria-hidden
          className="absolute inset-0 -z-30 transition-opacity duration-500"
          style={{
            backgroundColor: "var(--background)",
          }}
        />

        {/* Matrix Rain Background */}
        {/* Matrix Rain Background - Removed */}

        {/* Spotlight Effect */}
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(48, 96%, 53%, .25) 0, hsla(48, 96%, 53%, .1) 50%, hsla(48, 96%, 53%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(48, 96%, 53%, .18) 0, hsla(48, 96%, 53%, .06) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(48, 96%, 53%, .14) 0, hsla(48, 96%, 53%, .04) 80%, transparent 100%)"
          duration={8}
          xOffset={80}
        />

        {/* Decorative Icons */}
        <DecorativeIcons isDark={isDark} />

        {/* Grid Background */}
        <div
          aria-hidden
          className={`absolute inset-0 z-[-28] ${isDark ? "opacity-30" : "opacity-40"
            }`}
          style={{
            backgroundImage: isDark
              ? `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`
              : `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
            backgroundSize: "200px 200px",
          }}
        />

        {/* Bottom Fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-80 -z-10"
          style={{
            background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
          }}
        />

        {/* ================== CONTENT ================== */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-14 sm:pt-12 md:py-20 text-center">
          {/* Badge */}
          <div
            className={`flex justify-center mb-5 mt-10 sm:mt-14 ${isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
          >
            <Badge
              className={`group [&>svg]:size-4 sm:[&>svg]:size-5 [&>svg]:pointer-events-auto ${isDark
                ? "bg-transparent hover:bg-white/5 text-white border-white/20"
                : "bg-white/80 hover:bg-white text-gray-900 border-gray-200 shadow-sm"
                } border backdrop-blur-md max-w-full justify-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-2.5 text-[10px] sm:text-sm font-medium whitespace-nowrap transition-all duration-300 cursor-pointer`}
            >
              <SparklesIcon size={20} className="text-primary" />
              <span className="text-primary font-semibold">10,000+</span>
              <span className="sm:hidden">freelancers earn on Catalance</span>
              <span className="hidden sm:inline">
                freelancers are already earning on Catalance
              </span>
            </Badge>
          </div>

          {/* Headlines */}
          <div
            className={` ${isMounted ? "animate-fadeInUp" : "opacity-0"}`}
            style={{ animationDelay: "100ms" }}
          >
            <h1
              className={`font-semibold tracking-tight leading-[1.08] text-[2.25rem] sm:text-5xl lg:text-6xl whitespace-normal lg:whitespace-nowrap text-balance max-w-[18ch] sm:max-w-4xl lg:max-w-none mx-auto mb-3 sm:mb-4 ${textColor}`}
            >
              Where <span className="text-primary">Great Work</span> Meets Great <span className="text-primary">Opportunities</span>.
            </h1>
          </div>

          {/* Subhead */}
          <p
            className={`text-base sm:text-lg md:text-xl lg:text-2xl ${subTextColor} max-w-[32ch] sm:max-w-3xl mx-auto mb-8 sm:mb-7 md:mb-8 font-normal leading-relaxed whitespace-normal text-balance ${isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            style={{ animationDelay: "200ms" }}
          >
            For clients who need reliability. For freelancers who deserve respect.
          </p>

          {/* Cards Container */}
          <div
            className={`relative max-w-3xl lg:max-w-5xl mx-auto mb-16 px-0 sm:px-4 ${isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            style={{ animationDelay: "300ms" }}
          >
            <div className="relative z-10 grid items-stretch gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-2">

              {/* Business Card */}
              <Link to="/service" className="block">
                <div className={`group relative p-5 sm:p-6 rounded-3xl flex flex-col border backdrop-blur-xl text-left min-h-[430px] sm:min-h-[450px] cursor-pointer transition-all duration-300 hover:scale-[1.02] ${cardSurfaceClass}`}>
                  <div className="mb-6 flex flex-col items-start">
                    <div className="px-0 py-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium uppercase tracking-wide text-primary">
                      For Businesses
                    </span>
                  </div>
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-medium mb-2 leading-tight ${cardTitleClass}`}>
                    Find Talent You Can Count On
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed min-h-[72px] ${cardBodyClass}`}>
                    Work with pre-vetted professionals who deliver quality work, meet deadlines, and communicate clearly. <span className={`${cardEmphasisClass} font-semibold`}>No surprises, no excuses.</span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-8">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        Verified expertise
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        50K+ professionals
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        Secure payments
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        Dedicated support
                      </span>
                    </div>
                  </div>
                  <div className="w-full mt-auto">
                    <Button
                      size="lg"
                      className="w-full group/btn font-semibold px-6 py-5 sm:py-6 text-base shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-orange-500/40"
                    >
                      Hire Now
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                  <div className={`absolute inset-0 rounded-3xl -z-10 blur-xl ${isDark ? "bg-linear-to-br from-orange-500/0 to-amber-500/0" : "bg-linear-to-br from-amber-200/30 to-white/0"}`} />
                </div>
              </Link>

              {/* OR Circle */}
              <div className="hidden lg:flex items-center justify-center">
                <div
                  className={`relative w-22 h-22 rounded-full ${isDark
                    ? "bg-black border-primary/50"
                    : "bg-white border-primary/50"
                    } border-2 flex items-center justify-center shadow-[0_0_20px_var(--color-primary)] backdrop-blur-sm`}
                >
                  <span className="text-foreground font-medium text-2xl tracking-wider">
                    OR
                  </span>
                  <div
                    className={`absolute inset-0 rounded-full ${isDark
                      ? "bg-linear-to-r from-primary/20 via-primary/40 to-primary/20"
                      : "bg-linear-to-r from-primary/10 via-primary/20 to-primary/10"
                      } blur-xl animate-pulse -z-10`}
                  />
                </div>
              </div>

              {/* Freelancer Card */}
              <Link to="/signup?role=freelancer" className="relative block">
                <div className="pointer-events-none absolute -right-24 bottom-2 z-0 hidden w-[215px] rotate-[45deg] md:block lg:-right-40 lg:bottom-3 lg:w-[310px]">
                  <div className="absolute inset-x-5 bottom-5 h-16 rounded-full bg-primary/24 blur-3xl" />
                  <img
                    src={MascotImage}
                    alt="Catalance mascot"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="relative z-10 w-full object-contain drop-shadow-[0_28px_38px_rgba(255,204,0,0.24)]"
                  />
                </div>

                <div className={`group relative z-10 p-5 sm:p-6 rounded-3xl flex flex-col border backdrop-blur-xl text-left min-h-[430px] sm:min-h-[450px] cursor-pointer transition-all duration-300 hover:scale-[1.02] ${cardSurfaceClass}`}>
                  <div className="mb-6 flex flex-col items-start">
                    <div className="px-0 py-2">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium uppercase tracking-wide text-primary">
                      For Freelancers
                    </span>
                  </div>
                  <h3 className={`text-2xl sm:text-3xl md:text-4xl font-medium mb-2 leading-tight ${cardTitleClass}`}>
                    Find Clients Who Value Your Work
                  </h3>
                  <p className={`text-sm mb-6 leading-relaxed min-h-[72px] ${cardBodyClass}`}>
                    Join a platform where your skills are respected, payments are protected, and opportunities match your ambitions. <span className={`${cardEmphasisClass} font-semibold`}>
                      No lowball offers, no payment delays.
                    </span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mb-8">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary-strong">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        0% commission
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary-strong">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        Global network
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary-strong">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        Secure payments
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 text-primary-strong">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${cardFeatureClass}`}>
                        Fast hiring
                      </span>
                    </div>
                  </div>
                  <div className="w-full mt-auto">
                    <Button
                      size="lg"
                      className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-5 sm:py-6 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40"
                    >
                      Get Hired Now
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                  <div className={`absolute inset-0 rounded-3xl -z-10 blur-xl ${isDark ? "bg-linear-to-br from-primary/0 to-primary/0" : "bg-linear-to-br from-primary/20 to-transparent"}`} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CatalanceHero;
