import React from "react";
import ServiceCategoryCards from "@/components/sections/home/ServiceCategoryCards";
import VibeCodingHelp from "@/components/sections/home/VibeCodingHelp";
import PortfolioGallery from "@/components/sections/home/PortfolioGallery";
import FreelancerJoinSection from "@/components/sections/home/FreelancerJoinSection";
import Hero from "@/components/Home/Hero";
import FreelancerClientCards from "@/components/Home/FreelancerClientCards";

const Home = () => {
  React.useEffect(() => {
    document.documentElement.classList.add("home-page");
    return () => {
      document.documentElement.classList.remove("home-page");
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Hero/>
      <FreelancerClientCards />
      <ServiceCategoryCards />
      <VibeCodingHelp />
      <PortfolioGallery />
      <FreelancerJoinSection />
    </div>
  );
};

export default Home;
