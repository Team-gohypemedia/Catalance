import React from "react";
import CatalanceHero from "@/components/sections/home/CatalanceHero";
import ServiceCategoryCards from "@/components/sections/home/ServiceCategoryCards";
import VibeCodingHelp from "@/components/sections/home/VibeCodingHelp";
import PortfolioGallery from "@/components/sections/home/PortfolioGallery";
import FreelancerJoinSection from "@/components/sections/home/FreelancerJoinSection";

const Home = () => {
  React.useEffect(() => {
    document.documentElement.classList.add("home-page");
    return () => {
      document.documentElement.classList.remove("home-page");
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CatalanceHero />
      <ServiceCategoryCards />
      <VibeCodingHelp />
      <PortfolioGallery />
      <FreelancerJoinSection />
    </div>
  );
};

export default Home;
