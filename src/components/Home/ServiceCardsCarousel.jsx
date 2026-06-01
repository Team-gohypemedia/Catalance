import React from "react";
import { useNavigate } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";

import cataLogo from "@/assets/logos/logo.svg";
import { Button } from "@/components/ui/button";

import voiceAgentImg from "@/assets/cards/voice-agent.png";
import aiAutomationImg from "@/assets/cards/ai-automation.png";
import crmErpImg from "@/assets/cards/crm-erp-solutions.png";
import customerSupportImg from "@/assets/cards/customer-support.png";

const HOME_SERVICES = [
  {
    id: "voice_agent",
    title: "Voice Agent",
    description: "Voice Agent (AI Voice Bot / Call Automation) for sales, support, and follow-ups.",
    cardImg: voiceAgentImg,
    price: "₹50,000/-",
  },
  {
    id: "ai_automation",
    title: "AI Automation",
    description: "Automate workflows to save time and improve productivity.",
    cardImg: aiAutomationImg,
    price: "₹25,000/-",
  },
  {
    id: "crm_erp_integrated_solutions",
    title: "CRM & ERP Solutions",
    description: "Systems that streamline operations and centralize business data.",
    cardImg: crmErpImg,
    price: "₹50,000/-",
  },
  {
    id: "customer_support",
    title: "Customer Support",
    description: "Reliable support services that improve customer satisfaction and retention.",
    cardImg: customerSupportImg,
    price: "₹10,000/- Month",
  },
];

const HOME_SERVICE_CARDS = HOME_SERVICES.map((service, index) => ({
  ...service,
  isPriority: true,
}));

const ServiceRailCard = React.memo(function ServiceRailCard({ service, onSelect }) {
  if (service.cardImg) {
    return (
      <button
        type="button"
        onClick={() => onSelect(service)}
        aria-label={`Explore ${service.title}`}
        className="group relative flex h-[24rem] w-[16rem] flex-shrink-0 flex-col overflow-hidden rounded-[2rem] border border-border/10 bg-transparent shadow-[0_10px_28px_-26px_rgba(0,0,0,0.58)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:h-[27rem] sm:w-[18rem] sm:rounded-[2.1rem]"
      >
        <img
          src={service.cardImg}
          alt={service.title}
          loading={service.isPriority ? "eager" : "lazy"}
          fetchpriority={service.isPriority ? "high" : "low"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-label={`Explore ${service.title}`}
      className="group relative flex h-full min-h-[21.5rem] w-[16rem] flex-shrink-0 flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 text-left text-card-foreground shadow-[0_10px_28px_-26px_rgba(0,0,0,0.58)] transition-colors duration-300 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-[22rem] sm:w-[18rem] sm:rounded-[2.1rem]"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.03] via-transparent to-transparent" />

      <div className="relative flex h-full flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="relative flex h-24 w-full items-center justify-center self-center sm:h-28">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-lg" />
            <img
              src={service.logoSrc}
              alt={service.title}
              loading={service.isPriority ? "eager" : "lazy"}
              fetchpriority={service.isPriority ? "high" : "low"}
              decoding="async"
              className="relative z-10 h-24 w-24 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.24)] sm:h-40 sm:w-40"
            />
          </div>

          <div className="flex w-full justify-center text-center">
            <h3 className="mx-auto max-w-[12.5rem] text-center text-lg font-bold leading-tight text-card-foreground transition-colors duration-300 group-hover:text-primary">
              {service.title}
            </h3>
          </div>
        </div>

        <div className="flex w-full items-end justify-between gap-4 border-t border-border/60 pt-4 text-left">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Starting At
            </p>
            <p className="text-lg font-bold text-card-foreground transition-colors duration-300 group-hover:text-primary">
              {service.price}
            </p>
          </div>

          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors duration-300 group-hover:border-primary group-hover:text-primary">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
});

const ServiceCardsCarousel = () => {
  const navigate = useNavigate();
  const trackRef = React.useRef(null);

  const handleGetFreeProposal = React.useCallback(() => {
    navigate("/service");
  }, [navigate]);

  const handleSelectService = React.useCallback(
    (service) => {
      navigate("/service", {
        state: {
          openChat: true,
          serviceTitle: service.title,
          serviceId: service.id,
        },
      });
    },
    [navigate],
  );

  // Pause on hover
  const handleMouseEnter = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  };
  const handleMouseLeave = () => {
    if (trackRef.current) trackRef.current.style.animationPlayState = "running";
  };

  // Duplicate cards for seamless loop (4 times to look smooth with 4 unique items)
  const allCards = [
    ...HOME_SERVICE_CARDS,
    ...HOME_SERVICE_CARDS,
    ...HOME_SERVICE_CARDS,
    ...HOME_SERVICE_CARDS,
  ];

  return (
    <section className="relative flex w-full items-center overflow-hidden bg-background pt-10 pb-10 sm:pt-16 sm:pb-16">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center gap-10 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
          <h2 className="w-full max-w-none text-[2rem] font-medium leading-[1.05] tracking-tight text-[#1C1B1F] dark:text-white sm:text-[2.7rem] md:whitespace-nowrap md:text-[3.2rem] lg:text-[3.95rem] xl:text-[4.2rem]">
            Freelancers <span className="text-primary italic font-medium">Who</span> Don&apos;t Ghost You
          </h2>

          <p className="mt-1 max-w-5xl text-balance text-sm font-normal leading-relaxed text-[#1C1B1F]/60 dark:text-white/60 sm:mt-3 sm:text-base md:text-lg">
            Trusted freelancers who deliver work on time.
          </p>

          <Button
            type="button"
            onClick={handleGetFreeProposal}
            className="mt-8 h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:px-7 sm:text-base"
          >
            Get Your Free Proposal
          </Button>
        </div>

        {/* Auto-scrolling marquee */}
        <div
          className="relative w-full overflow-hidden py-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent sm:w-40" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent sm:w-40" />

          <div
            ref={trackRef}
            className="flex gap-4 sm:gap-5"
            style={{
              width: "max-content",
              animation: "marquee-scroll 55s linear infinite",
            }}
          >
            {allCards.map((service, i) => (
              <ServiceRailCard
                key={`${service.id}-${i}`}
                service={service}
                onSelect={handleSelectService}
              />
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={() => navigate("/service")}
          variant="outline"
          className="self-center mt-4 hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-colors duration-300"
        >
          View All
        </Button>

      </div>

      {/* Keyframe style */}
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};

export default ServiceCardsCarousel;
