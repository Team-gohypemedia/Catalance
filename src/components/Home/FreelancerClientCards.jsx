import React from "react";
import { Link } from "react-router-dom";
import Briefcase from "lucide-react/dist/esm/icons/briefcase-business";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import Users from "lucide-react/dist/esm/icons/users";
import UserRoundSearch from "lucide-react/dist/esm/icons/user-round-search";
import Handshake from "lucide-react/dist/esm/icons/handshake";
import ChartNoAxesCombined from "lucide-react/dist/esm/icons/chart-no-axes-combined";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import MessageSquareDot from "lucide-react/dist/esm/icons/message-square-dot";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import Mascot1 from "@/assets/mascot/mascot1.png";

const businessFeatures = [
  { icon: BadgeCheck, text: "Verified professionals" },
  { icon: Users, text: "Smart talent matching" },
  { icon: ShieldCheck, text: "Secure payments" },
  { icon: Clock3, text: "Project tracking" },
];

const freelancerFeatures = [
  { icon: Handshake, text: "Trusted clients" },
  { icon: ChartNoAxesCombined, text: "Quality opportunities" },
  { icon: ShieldCheck, text: "Secure payments" },
  { icon: MessageSquareDot, text: "Quick support" },
];

const featureClassName =
  "flex items-center gap-3 text-[1.05rem] leading-relaxed";

const FreelancerClientCards = () => {
  const { theme } = useTheme();
  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const brandColor = isDarkMode ? "#F9D949" : "#D9692A";
  
  const cardClassName = isDarkMode
    ? "relative isolate flex min-h-0 sm:min-h-[26rem] flex-col rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 text-left shadow-2xl backdrop-blur-xl transition-all duration-500 ease-in-out"
    : "relative isolate flex min-h-0 sm:min-h-[26rem] flex-col rounded-[2rem] border border-black/5 bg-white p-5 sm:p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-500 ease-in-out group-hover:!bg-[#D9692A] group-hover:border-transparent group-hover:shadow-[0_24px_80px_rgba(217,105,42,0.35)]";

  const textHeadingClass = isDarkMode
    ? "text-white"
    : "text-[#1C1B1F] group-hover:!text-[#ffffff] transition-colors duration-500 ease-in-out";

  const textMutedClass = isDarkMode
    ? "text-white/50"
    : "text-[#1C1B1F]/50 group-hover:!text-[#ffffff]/70 transition-colors duration-500 ease-in-out";

  const textFeatureClass = isDarkMode
    ? "text-white/70"
    : "text-[#1C1B1F] group-hover:!text-[#ffffff] transition-colors duration-500 ease-in-out";

  const iconContainerClass = isDarkMode
    ? "bg-white/5"
    : "bg-transparent group-hover:!bg-white/20 transition-colors duration-500 ease-in-out";

  const iconClass = isDarkMode
    ? "text-[#F9D949]"
    : "text-[#1C1B1F]/60 group-hover:!text-[#ffffff] transition-colors duration-500 ease-in-out";

  const buttonClass = isDarkMode
    ? "bg-[#F9D949] text-[#1C1B1F]"
    : "bg-[#D9692A] text-white keep-white border border-transparent group-hover:!bg-white group-hover:!text-[#D9692A] transition-colors duration-500 ease-in-out shadow-sm group-hover:shadow-lg";

  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-[#fafaf9] dark:bg-[#020202] px-4 pt-10 pb-10 sm:pt-16 sm:pb-16 sm:px-6 lg:px-8 transition-colors duration-500">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--brand-rgb),0.05),rgba(0,0,0,0)_50%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center">
        <div className="mx-auto w-full max-w-7xl text-center">
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-tight text-[#1C1B1F] dark:text-white sm:text-[2.75rem] md:text-[3.2rem] lg:text-[3.8rem]">
            Built for <span className="text-primary italic font-medium">Freelancers</span>
            <br className="sm:hidden" />
            <span className="mx-2 sm:mx-0"> & </span>
            <br className="sm:hidden" />
            <span className="text-primary italic font-medium">Business Owners</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-sm font-medium leading-relaxed text-[#1C1B1F]/60 dark:text-white/60 sm:text-base md:text-lg">
            Designed to support your growth at every stage of your professional journey.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-5xl items-center gap-8 sm:mt-14 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] lg:gap-10">
          {/* For Businesses Card */}
          <div className="relative group overflow-visible">
            <img
              src={Mascot1}
              alt=""
              aria-hidden
              draggable="false"
              className="pointer-events-none absolute bottom-6 -left-16 z-0 w-44 select-none opacity-0 rotate-[-30deg] transform-gpu transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-8 group-hover:opacity-100"
            />

            <article className={`${cardClassName} z-10`}>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-6 sm:mb-11 flex items-center justify-between gap-4">
                  <Briefcase className={`size-7 ${iconClass}`} />
                  <span className={`text-sm font-semibold uppercase tracking-[0.28em] transition-colors duration-500 ease-in-out ${isDarkMode ? "text-white/50" : "text-[#1C1B1F]/50 group-hover:!text-white"}`}>
                    For Businesses
                  </span>
                </div>

                <h3 className={`max-w-xs text-xl sm:text-[2.05rem] font-semibold leading-tight ${textHeadingClass}`}>
                  Hire Reliable Talent Faster
                </h3>

                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  {businessFeatures.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 sm:gap-4 group/feature">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconContainerClass}`}>
                        <Icon className={`size-[1.1rem] ${iconClass}`} />
                      </div>
                      <span className={`text-[1.05rem] font-normal sm:font-medium leading-tight ${textFeatureClass}`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/service"
                  className={`mt-6 sm:mt-8 flex items-center justify-center h-[3.25rem] sm:h-[3.75rem] rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold transition-transform hover:scale-[1.02] ${buttonClass}`}
                >
                  Hire Now
                </Link>
              </div>
            </article>
          </div>

          {/* OR Divider */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative isolate flex size-24 items-center justify-center rounded-full border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 shadow-2xl backdrop-blur-2xl">
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[12px]"
                style={{ backgroundColor: `${brandColor}30` }}
              />
              <div className="relative z-10 flex size-full items-center justify-center rounded-full border-[2.5px] bg-transparent shadow-xl" style={{ borderColor: brandColor }}>
                <span className="text-2xl font-black tracking-tighter" style={{ color: brandColor }}>
                  OR
                </span>
              </div>
            </div>
          </div>

          {/* For Freelancers Card */}
          <div className="relative group overflow-visible">
            <img
              src={Mascot1}
              alt=""
              aria-hidden
              draggable="false"
              className="pointer-events-none absolute bottom-6 -right-16 z-0 w-48 select-none opacity-0 rotate-[30deg] transform-gpu transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-6 group-hover:opacity-100"
            />

            <article className={`${cardClassName} z-10`}>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-6 sm:mb-11 flex items-center justify-between gap-4">
                  <UserRoundSearch className={`size-7 ${iconClass}`} />
                  <span className={`text-sm font-semibold uppercase tracking-[0.28em] transition-colors duration-500 ease-in-out ${isDarkMode ? "text-white/50" : "text-[#1C1B1F]/50 group-hover:!text-white"}`}>
                    For Freelancers
                  </span>
                </div>

                <h3 className={`max-w-sm text-xl sm:text-[2.05rem] font-semibold leading-tight ${textHeadingClass}`}>
                  Grow Your Career with Trusted Clients
                </h3>

                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  {freelancerFeatures.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 sm:gap-4 group/feature">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconContainerClass}`}>
                        <Icon className={`size-[1.1rem] ${iconClass}`} />
                      </div>
                      <span className={`text-[1.05rem] font-normal sm:font-medium leading-tight ${textFeatureClass}`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup?role=freelancer"
                  className={`mt-6 sm:mt-8 flex items-center justify-center h-[3.25rem] sm:h-[3.75rem] rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold transition-transform hover:scale-[1.02] ${buttonClass}`}
                >
                  Get Hired Now
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};;

export default FreelancerClientCards;
