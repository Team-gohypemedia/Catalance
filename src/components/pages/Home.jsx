import React from "react";
import CatalanceHero from "@/components/sections/home/CatalanceHero";
import ServiceCategoryCards from "@/components/sections/home/ServiceCategoryCards";
import LogoCloud from "@/components/sections/home/logo-cloud";
import VibeCodingHelp from "@/components/sections/home/VibeCodingHelp";
import PortfolioGallery from "@/components/sections/home/PortfolioGallery";
import DelphiHero from "@/components/sections/home/DelphiHero";

const Home = () => {
  React.useEffect(() => {
    document.documentElement.classList.add("home-page");
    return () => {
      document.documentElement.classList.remove("home-page");
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <CatalanceHero />
      <ServiceCategoryCards />
      <LogoCloud />
      <VibeCodingHelp />
      <PortfolioGallery />
    </div>
  );
};

export default Home;
