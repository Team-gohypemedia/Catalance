import { Hero } from "@/components/marketing/landing/Hero";
import { StatsBand } from "@/components/marketing/landing/StatsBand";
import { PopularCourses } from "@/components/marketing/landing/PopularCourses";
import { FindYourPath } from "@/components/marketing/landing/FindYourPath";
import { HowCampusWorks } from "@/components/marketing/landing/HowCampusWorks";
import { LanguageTutor } from "@/components/marketing/landing/LanguageTutor";
import { Mentors } from "@/components/marketing/landing/Mentors";
import { Testimonials } from "@/components/marketing/landing/Testimonials";
import { PayLater } from "@/components/marketing/landing/PayLater";
import { ForParents } from "@/components/marketing/landing/ForParents";
import { LandingFaq } from "@/components/marketing/landing/LandingFaq";
import { FinalCta } from "@/components/marketing/landing/FinalCta";
import { usePlatformConfig } from "@/lib/platform";

/**
 * Landing page. Background rhythm: cream → white stats band → cream courses → white path picker →
 * cream timeline → the one dark section (language + AI tutor, only while flags.aiTutor is on) → cream mentors →
 * white stories → orange pricing band → cream parents → white FAQ → final CTA.
 */
export default function Landing() {
  const { flags } = usePlatformConfig();
  return (
    <>
      <Hero />
      <StatsBand />
      <PopularCourses />
      <FindYourPath />
      <HowCampusWorks />
      {flags.aiTutor && <LanguageTutor />}
      <Mentors />
      <Testimonials />
      <PayLater />
      <ForParents />
      <LandingFaq />
      <FinalCta />
    </>
  );
}
