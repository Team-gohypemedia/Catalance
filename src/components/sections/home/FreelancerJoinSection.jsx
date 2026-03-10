import React from "react";
import { Link } from "react-router-dom";
import Grid3X3 from "lucide-react/dist/esm/icons/grid-3x3";
import BadgeCheck from "lucide-react/dist/esm/icons/badge-check";
import Zap from "lucide-react/dist/esm/icons/zap";
import MessagesSquare from "lucide-react/dist/esm/icons/messages-square";
import { Button } from "@/components/ui/button";

const benefitItems = [
  {
    title: "Access a pool of top talent across 700 categories",
    icon: Grid3X3,
  },
  {
    title: "Enjoy a simple, easy-to-use matching experience",
    icon: BadgeCheck,
  },
  {
    title: "Get quality work done quickly and within budget",
    icon: Zap,
  },
  {
    title: "Only pay when you’re happy",
    icon: MessagesSquare,
  },
];

const FreelancerJoinSection = () => {
  return (
    <section className="w-full bg-[#efede8] px-4 py-16 md:px-8 md:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="rounded-[2rem] bg-[#efede8] px-4 py-4 md:px-6">
          <div className="space-y-12 rounded-[1.75rem] border border-black/5 bg-[#f4f2ee] px-6 py-10 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.45)] md:px-10 md:py-14 lg:px-14">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-medium tracking-tight text-[#2f4057] md:text-5xl">
                Make it all happen with freelancers
              </h2>
            </div>

            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
              {benefitItems.map(({ title, icon: Icon }) => (
                <div key={title} className="space-y-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-[#4f5561] shadow-sm">
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <p className="max-w-[16rem] text-lg leading-8 text-[#24364d]">
                    {title}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                asChild
                className="h-12 rounded-xl bg-[#1f2329] px-8 text-base font-semibold text-white hover:bg-[#15191f]"
              >
                <Link to="/get-started?for=freelancer">Join now</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-[#5a1024] px-6 py-12 text-center shadow-[0_35px_90px_-55px_rgba(46,8,18,0.9)] md:px-10 md:py-16">
          <div className="mx-auto max-w-5xl space-y-8">
            <h3 className="text-4xl font-medium tracking-tight text-[#f7f2ec] md:text-6xl">
              Freelance services at your{" "}
              <span className="font-serif text-[#ff7a3d]">fingertips</span>
            </h3>

            <Button
              asChild
              className="h-12 rounded-xl bg-[#f5f2ed] px-8 text-base font-semibold text-[#1d2430] hover:bg-white"
            >
              <Link to="/get-started?for=freelancer">Join Catalance</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerJoinSection;
