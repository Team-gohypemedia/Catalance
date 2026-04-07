import React from "react";
import { Link } from "react-router-dom";
import Briefcase from "lucide-react/dist/esm/icons/briefcase-business";
import Clock3 from "lucide-react/dist/esm/icons/clock-3";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import UserRoundSearch from "lucide-react/dist/esm/icons/user-round-search";
import Globe from "lucide-react/dist/esm/icons/globe";
import Brain from "lucide-react/dist/esm/icons/brain";
import ShieldAlert from "lucide-react/dist/esm/icons/shield-alert";
import Handshake from "lucide-react/dist/esm/icons/handshake";
import ChartNoAxesCombined from "lucide-react/dist/esm/icons/chart-no-axes-combined";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";
import MessageSquareDot from "lucide-react/dist/esm/icons/message-square-dot";
import { Button } from "@/components/ui/button";
import Mascot1 from "@/assets/mascot/mascot1.png";

const businessFeatures = [
  { icon: BadgeCheck, text: " Pre-vetted professionals only" },
  { icon: Users, text: "AI-powered talent matching" },
  { icon: ShieldCheck, text: "Safe & secure payments" },
  { icon: Clock3, text: "Transparent project tracking" },
];

const freelancerFeatures = [
  { icon: Handshake, text: "Collaborate with vetted organizations" },
  { icon: ChartNoAxesCombined, text: "Reliable high-quality opportunities" },
  { icon: ShieldCheck, text: "Secure structured payments" },
  { icon: MessageSquareDot, text: "Professional dispute support" },
];

const featureClassName =
  "flex items-center gap-3 text-[1.05rem] leading-relaxed text-white/62";

const cardClassName =
  "relative isolate flex min-h-[31rem] flex-col rounded-[2rem] border border-white/15 bg-white/6 px-10 pb-8 pt-8 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-[28px]";

const FreelancerClientCards = () => {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,204,0,0.03),rgba(0,0,0,0)_14%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center">
        <div className="mx-auto w-full max-w-7xl text-center">
          <h2 className="text-[2.1rem] font-medium leading-[1.05] tracking-tight whitespace-nowrap text-white sm:text-[2.75rem] md:text-[3.4rem] lg:text-[4.4rem]">
            Hire <span className="text-primary">Freelancers</span> Who Don&apos;t Disappear
          </h2>
          <p className="mx-auto mt-6 max-w-5xl text-balance text-sm font-normal leading-relaxed text-white sm:mt-7 sm:text-base md:text-lg">
            Reliable talent focused on quality and timely delivery.
          </p>
        </div>

        <div className="mt-20 grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] lg:gap-10">
          <div className="relative group overflow-visible">
            <img
              src={Mascot1}
              alt=""
              aria-hidden
              draggable="false"
              className="pointer-events-none absolute bottom-6 -left-16 z-0 w-44 select-none opacity-0 rotate-[-30deg] transform-gpu transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-8 group-hover:opacity-100"
            />

            <article className={`${cardClassName} z-10`}>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-11 flex items-center justify-between gap-4">
                  <Briefcase className="size-7 text-primary" />
                  <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/58">
                    For Businesses
                  </span>
                </div>

                <h3 className="max-w-xs text-[2.05rem] font-semibold leading-tight text-white">
                  Hire Reliable Talent Faster
                </h3>

                <div className="mt-10 space-y-5">
                  {businessFeatures.map(({ icon: Icon, text }) => (
                    <div key={text} className={featureClassName}>
                      <Icon className="size-[1.1rem] shrink-0 text-primary" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="mt-12 h-[3.75rem] rounded-2xl text-xl font-medium"
                >
                  <Link to="/service">Hire Now</Link>
                </Button>
              </div>
            </article>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="relative isolate flex size-[5.5rem] items-center justify-center rounded-full border border-white/15 bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-[28px]">
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/18 blur-[4px]"
              />
              <div className="relative z-10 flex size-full items-center justify-center rounded-full border-[3px] border-primary bg-transparent shadow-[0px_0px_45px_0px_rgba(255,204,0,1)]">
                <span className="text-[2rem] font-semibold tracking-tight text-primary">
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

            <article className={`${cardClassName} z-10`}>
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-11 flex items-center justify-between gap-4">
                  <UserRoundSearch className="size-7 text-primary" />
                  <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/58">
                    For Freelancers
                  </span>
                </div>

                <h3 className="max-w-sm text-[2.05rem] font-semibold leading-tight text-white">
                  Grow Your Career with Trusted Clients
                </h3>

                <div className="mt-10 space-y-5">
                  {freelancerFeatures.map(({ icon: Icon, text }) => (
                    <div key={text} className={featureClassName}>
                      <Icon className="size-[1.1rem] shrink-0 text-primary" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className="mt-12 h-[3.75rem] rounded-2xl text-xl font-medium"
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
