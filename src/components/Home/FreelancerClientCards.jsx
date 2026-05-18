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
  { icon: BadgeCheck, text: "Only verified professionals" },
  { icon: Users, text: "AI-powered talent matching" },
  { icon: ShieldCheck, text: "Safe & secure payments" },
  { icon: Clock3, text: "Transparent project tracking" },
];

const freelancerFeatures = [
  { icon: Handshake, text: "Work with trusted teams." },
  { icon: ChartNoAxesCombined, text: "Reliable high-quality opportunities" },
  { icon: ShieldCheck, text: "Secure structured payments" },
  { icon: MessageSquareDot, text: "Quick problem help" },
];

const featureClassName =
  "flex items-center gap-3 text-[1.05rem] leading-relaxed";

const FreelancerClientCards = () => {
  const { theme } = useTheme();
  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Light card (For Businesses)
  const lightCardClassName = isDarkMode
    ? "relative isolate flex min-h-[31rem] flex-col rounded-[2rem] border border-white/10 bg-white/5 px-10 pb-8 pt-8 text-left shadow-2xl backdrop-blur-xl"
    : "relative isolate flex min-h-[31rem] flex-col rounded-[2rem] border border-black/8 bg-[#F5F0E8] px-10 pb-8 pt-8 text-left shadow-[0_24px_80px_rgba(0,0,0,0.08)]";

  // Orange card (For Freelancers)
  const orangeCardClassName = isDarkMode
    ? "relative isolate flex min-h-[31rem] flex-col rounded-[2rem] border border-white/10 bg-white/5 px-10 pb-8 pt-8 text-left shadow-2xl backdrop-blur-xl"
    : "relative isolate flex min-h-[31rem] flex-col rounded-[2rem] px-10 pb-8 pt-8 text-left !bg-[#D9692A] shadow-[0_24px_80px_rgba(217,105,42,0.35)]";

  const brandColor = isDarkMode ? "#FFC107" : "#D9692A";
  const textColorLeft = isDarkMode ? "white" : "#1C1B1F";
  const textColorRight = "white";
  const buttonBgLeft = isDarkMode ? "#FFC107" : "#D9692A";
  const buttonTextLeft = isDarkMode ? "#1C1B1F" : "white";
  const buttonBgRight = isDarkMode ? "#FFC107" : "white";
  const buttonTextRight = isDarkMode ? "#1C1B1F" : "#D9692A";
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-[#fafaf9] dark:bg-[#020202] px-4 py-20 sm:py-32 sm:px-6 lg:px-8 transition-colors duration-500">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--brand-rgb),0.05),rgba(0,0,0,0)_50%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center">
        <div className="mx-auto w-full max-w-7xl text-center">
          <h2 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[#1C1B1F] dark:text-white sm:text-[3.2rem] md:text-[4rem] lg:text-[5rem]">
            Built for <span className="text-primary italic font-medium">Who</span> You Are
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-sm font-medium leading-relaxed text-[#1C1B1F]/60 dark:text-white/60 sm:text-base md:text-lg">
            Designed to support your growth at every stage of your professional journey.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-6xl items-center gap-8 sm:mt-14 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] lg:gap-10">
          <div className="relative group overflow-visible">
            <img
              src={Mascot1}
              alt=""
              aria-hidden
              draggable="false"
              className="pointer-events-none absolute bottom-6 -left-16 z-0 w-44 select-none opacity-0 rotate-[-30deg] transform-gpu transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-8 group-hover:opacity-100"
            />

            <article className={`${lightCardClassName} z-10`}>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-11 flex items-center justify-between gap-4">
                  <Briefcase className="size-7" style={{ color: brandColor }} />
                  <span className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: isDarkMode ? "white" : "#1C1B1F", opacity: 0.5 }}>
                    For Businesses
                  </span>
                </div>

                <h3 className="max-w-xs text-[2.05rem] font-semibold leading-tight" style={{ color: textColorLeft }}>
                  Hire Reliable Talent Faster
                </h3>

                <div className="mt-10 space-y-6">
                  {businessFeatures.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-4 group/feature">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors" style={{ backgroundColor: `${brandColor}20` }}>
                        <Icon className="size-[1.1rem]" style={{ color: brandColor }} />
                      </div>
                      <span className="text-[1.05rem] font-medium leading-tight transition-colors" style={{ color: isDarkMode ? "rgba(255,255,255,0.7)" : "rgba(28,27,31,0.7)" }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="mt-12 h-[3.75rem] rounded-2xl text-xl font-bold border-0 shadow-lg transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: buttonBgLeft, color: buttonTextLeft }}
                >
                  <Link to="/service">Hire Now</Link>
                </Button>
              </div>
            </article>
          </div>

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

          <div className="relative group overflow-visible">
            <img
              src={Mascot1}
              alt=""
              aria-hidden
              draggable="false"
              className="pointer-events-none absolute bottom-6 -right-16 z-0 w-48 select-none opacity-0 rotate-[30deg] transform-gpu transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-6 group-hover:opacity-100"
            />

            <article className={`${orangeCardClassName} z-10`}>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-11 flex items-center justify-between gap-4">
                  <UserRoundSearch className="size-7 !text-white" style={{ color: isDarkMode ? brandColor : "white" }} />
                  <span className="text-sm font-semibold uppercase tracking-[0.28em] !text-white/70" style={{ color: isDarkMode ? "white" : "white" }}>
                    For Freelancers
                  </span>
                </div>

                <h3 className="max-w-sm text-[2.05rem] font-semibold leading-tight !text-white">
                  Grow Your Career with Trusted Clients
                </h3>

                <div className="mt-10 space-y-6">
                  {freelancerFeatures.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-4 group/feature">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors" style={{ backgroundColor: isDarkMode ? `${brandColor}20` : "rgba(255,255,255,0.2)" }}>
                        <Icon className="size-[1.1rem] !text-white" style={{ color: isDarkMode ? brandColor : "white" }} />
                      </div>
                      <span className="text-[1.05rem] font-medium leading-tight transition-colors !text-white/85 group-hover/feature:!text-white">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="mt-12 h-[3.75rem] rounded-2xl text-xl font-bold border-0 shadow-lg transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: buttonBgRight, color: buttonTextRight }}
                >
                  <Link to="/signup?role=freelancer">Get Hired Now</Link>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerClientCards;
