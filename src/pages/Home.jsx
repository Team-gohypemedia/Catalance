import React from "react";
import ServiceCategoryCards from "@/components/sections/home/ServiceCategoryCards";
import VibeCodingHelp from "@/components/sections/home/VibeCodingHelp";
import PortfolioGallery from "@/components/sections/home/PortfolioGallery";
import FreelancerJoinSection from "@/components/sections/home/FreelancerJoinSection";
import Hero from "@/components/Home/Hero";
import FreelancerClientCards from "@/components/Home/FreelancerClientCards";
import ServiceCardsCarousel from "@/components/Home/ServiceCardsCarousel";
import MarketPlaceCTA from "@/components/Home/MarketPlaceCTA";
import MadeOnCatalance from "@/components/Home/MadeOnCatalance";
import Testimonidals from "@/components/Home/Testimonidals";
import Client from "@/components/features/client/Client";
import ClientCTA from "@/components/Home/ClientCTA";

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
      <ServiceCardsCarousel />
      <MarketPlaceCTA />
      <MadeOnCatalance />
      <Testimonidals />
      <ClientCTA />
      {/* <ServiceCategoryCards />
      <VibeCodingHelp />
      <PortfolioGallery />
      <FreelancerJoinSection /> */}
    </div>
  );
};

export default Home;
