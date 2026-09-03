import React from "react";
import SeoMeta from "@/components/common/SeoMeta";
import { SEO_DATA } from "@/shared/lib/seo-config";
import Hero from "@/components/Home/Hero";
import FreelancerClientCards from "@/components/Home/FreelancerClientCards";
import ServiceCardsCarousel from "@/components/Home/ServiceCardsCarousel";
import MarketPlaceCTA from "@/components/Home/MarketPlaceCTA";
import MadeOnCatalance from "@/components/Home/MadeOnCatalance";
import Testimonidals from "@/components/Home/Testimonidals";
import ClientCTA from "@/components/Home/ClientCTA";

import BrandMarquee from "@/components/Home/BrandMarquee";

const Home = () => {
  React.useEffect(() => {
    document.documentElement.classList.add("home-page");
    return () => {
      document.documentElement.classList.remove("home-page");
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <SeoMeta
        title={SEO_DATA.home.title}
        description={SEO_DATA.home.description}
        canonicalUrl="https://catalance.in/"
      />
      <Hero/>
      <FreelancerClientCards />
      <ServiceCardsCarousel />
      <MarketPlaceCTA />
      <MadeOnCatalance />
      <Testimonidals />
      <ClientCTA />
    </main>
  );
};

export default Home;
