import React from "react";
import { useNavigate } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

import cataLogo from "@/assets/logos/logo.svg";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/shared/lib/utils";

const SERVICE_LOGO_MODULES = import.meta.glob("../../assets/icons/*.png", {
  eager: true,
  import: "default",
});

const normalizeServiceLogoKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const SERVICE_LOGOS_BY_KEY = Object.entries(SERVICE_LOGO_MODULES).reduce(
  (acc, [path, source]) => {
    const fileName =
      String(path || "").split("/").pop()?.replace(/\.png$/i, "") || "";
    const key = normalizeServiceLogoKey(fileName);

    if (key) {
      acc[key] = source;
    }

    return acc;
  },
  {},
);

const SERVICE_LOGO_KEYS = Object.keys(SERVICE_LOGOS_BY_KEY);

const SERVICE_LOGO_ALIASES = {
  branding: "branding and brand identity",
  "branding kit": "branding and brand identity",
  "web development": "website development",
  website: "website development",
  "website uiux": "website development",
  "website ui ux": "website development",
  seo: "seo optimization",
  "seo search engine optimisation": "seo optimization",
  "seo search engine optimization": "seo optimization",
  "social media marketing organic": "social media management",
  "paid advertising performance": "performance marketing",
  "performance marketing": "performance marketing",
  "app development android ios cross platform": "app development",
  "software development web saas custom systems": "software development",
  "writing content": "writing and content",
  "whatsapp chatbot": "whatsapp chat bot",
  "creative design": "creative and design",
  "modeling 3d": "3d modeling",
  "cgi video services": "cgi video",
  "crm erp integrated solutions": "crm and erp solutions",
  "crm and erp integrated solutions": "crm and erp solutions",
};

const isLogoUrl = (value = "") =>
  /^(?:https?:\/\/|\/|data:image\/)/i.test(String(value || "").trim());

const resolveServiceLogoSrc = (service = {}) => {
  const explicitLogo = [
    service.logo,
    service.logoUrl,
    service.logo_url,
    service.image,
    service.imageUrl,
    service.image_url,
  ].find((value) => isLogoUrl(value));

  if (explicitLogo) return explicitLogo;

  const candidates = [service.slug, service.id, service.title, service.name];

  for (const candidate of candidates) {
    const normalized = normalizeServiceLogoKey(candidate);
    if (!normalized) continue;

    const mappedKey = SERVICE_LOGO_ALIASES[normalized] || normalized;
    if (SERVICE_LOGOS_BY_KEY[mappedKey]) return SERVICE_LOGOS_BY_KEY[mappedKey];

    const fuzzyKey = SERVICE_LOGO_KEYS.find(
      (key) => key.includes(mappedKey) || mappedKey.includes(key),
    );

    if (fuzzyKey) return SERVICE_LOGOS_BY_KEY[fuzzyKey];
  }

  return cataLogo;
};

const HOME_SERVICES = [
  {
    id: "website-development",
    title: "Website Development",
    description: "Custom and platform-based websites built for performance, speed, and growth.",
  },
  {
    id: "app-development",
    title: "App Development",
    description: "Mobile apps designed to engage users and scale businesses.",
  },
  {
    id: "software-development",
    title: "Software Development",
    description: "Custom software solutions built to solve real business problems.",
  },
  {
    id: "lead-generation",
    title: "Lead Generation",
    description: "Targeted campaigns that turn prospects into qualified business leads.",
  },
  {
    id: "video-services",
    title: "Video Editing",
    description: "Creative videos that tell stories and boost brand engagement.",
  },
  {
    id: "cgi-videos",
    title: "CGI Videos",
    description: "High-impact CGI visuals for products, ads, and storytelling.",
  },
  {
    id: "3d-modeling",
    title: "3D Modeling",
    description: "Detailed 3D models for products, visuals, and digital experiences.",
  },
  {
    id: "seo-optimization",
    title: "SEO Optimization",
    description: "Improve search rankings and drive consistent organic traffic.",
  },
  {
    id: "social-media-management",
    title: "Social Media Management",
    description: "Content and community management to grow your brand online.",
  },
  {
    id: "influencer-marketing",
    title: "Influencer Marketing",
    description: "Collaborate with creators to build trust and audience reach.",
  },
  {
    id: "ugc-marketing",
    title: "UGC Marketing",
    description: "Authentic creator content that boosts credibility and conversions.",
  },
  {
    id: "performance-marketing",
    title: "Performance Marketing",
    description: "Data-driven advertising campaigns focused on measurable results.",
  },
  {
    id: "creative-design",
    title: "Creative & Design",
    description: "Visual designs that strengthen branding and communication.",
  },
  {
    id: "branding",
    title: "Branding Kit",
    description: "Build strong brand identities that people remember and trust.",
  },
  {
    id: "writing-content",
    title: "Writing & Content",
    description: "Compelling content that informs, engages, and converts audiences.",
  },
  {
    id: "customer-support",
    title: "Customer Support",
    description: "Reliable support services that improve satisfaction and retention.",
  },
  {
    id: "crm-erp-solutions",
    title: "CRM & ERP Solutions",
    description: "Systems that streamline operations and centralize business data.",
  },
  {
    id: "ai-automation",
    title: "AI Automation",
    description: "Automate workflows to save time and improve team productivity.",
  },
  {
    id: "voice-agent",
    title: "Voice Agent",
    description: "AI voice automation for sales, support, and faster follow-ups.",
  },
  {
    id: "whatsapp-chatbot",
    title: "WhatsApp Chat Bot",
    description: "Automated conversations for faster support and conversion flows.",
  },
];

const HOME_SERVICE_PRICES = {
  "website-development": "₹10,000/-",
  "app-development": "₹80,000/-",
  "software-development": "₹50,000/-",
  "lead-generation": "₹15,000/- Month",
  "video-services": "₹1,000/- Video",
  "cgi-videos": "₹10,000/- Video",
  "3d-modeling": "₹2,000/- Model",
  "seo-optimization": "₹7,000/- Month",
  "social-media-management": "₹8,000/- Month",
  "influencer-marketing": "₹20,000/-",
  "ugc-marketing": "₹20,000/-",
  "performance-marketing": "₹15,000/- Month",
  "creative-design": "₹500/- Creative",
  branding: "₹10,000/-",
  "writing-content": "₹500/- Article",
  "customer-support": "₹10,000/- Month",
  "crm-erp-solutions": "₹50,000/-",
  "ai-automation": "₹25,000/-",
  "voice-agent": "₹50,000/-",
  "whatsapp-chatbot": "₹10,000/-",
};

const HOME_SERVICE_CARDS = HOME_SERVICES.map((service, index) => ({
  ...service,
  price: HOME_SERVICE_PRICES[service.id] || "₹10,000/-",
  logoSrc: resolveServiceLogoSrc(service),
  isPriority: index < 4,
}));

const ServiceRailCard = React.memo(function ServiceRailCard({
  service,
  onSelect,
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-label={`Explore ${service.title}`}
      className="group relative flex h-full min-h-[21.5rem] w-full flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 text-left text-card-foreground shadow-[0_10px_28px_-26px_rgba(0,0,0,0.58)] transition-colors duration-300 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-[22rem] sm:rounded-[2.1rem]"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.03] via-transparent to-transparent" />
      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="relative flex h-24 w-full items-center justify-center self-center sm:h-28">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-lg" />
            <img
              src={service.logoSrc}
              alt={service.title}
              loading={service.isPriority ? "eager" : "lazy"}
              fetchPriority={service.isPriority ? "high" : "low"}
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
  const [api, setApi] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const serviceCount = HOME_SERVICE_CARDS.length;

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

  const syncCarouselState = React.useCallback((emblaApi) => {
    if (!emblaApi || serviceCount === 0) return;
    setSelectedIndex(emblaApi.selectedScrollSnap() % serviceCount);
  }, [serviceCount]);

  React.useEffect(() => {
    if (!api) return;

    syncCarouselState(api);
    api.on("select", syncCarouselState);
    api.on("reInit", syncCarouselState);

    return () => {
      api.off("select", syncCarouselState);
      api.off("reInit", syncCarouselState);
    };
  }, [api, serviceCount, syncCarouselState]);

  const handleScrollPrev = React.useCallback(() => {
    if (!api) return;
    api.scrollPrev();
  }, [api]);

  const handleScrollNext = React.useCallback(() => {
    if (!api) return;
    api.scrollNext();
  }, [api]);

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-background py-12 sm:py-16">
      <div className="relative mx-auto flex w-full max-w-[92rem] flex-col justify-center gap-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <h2 className="w-full max-w-none text-[2rem] font-medium leading-[1.05] tracking-tight text-white sm:text-[2.7rem] md:whitespace-nowrap md:text-[3.2rem] lg:text-[3.95rem] xl:text-[4.2rem]">
            Freelancers <span className="text-primary">Who</span> Don&apos;t
            Ghost You
          </h2>
          <p className="mt-3 max-w-5xl text-balance text-sm font-normal leading-relaxed text-white sm:mt-4 sm:text-base md:text-lg">
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

        <div className="relative">
          <button
            type="button"
            onClick={handleScrollPrev}
            aria-label="Previous services"
            className="absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/95 text-card-foreground shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-colors duration-200 hover:border-primary/35 hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            disabled={!api}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleScrollNext}
            aria-label="Next services"
            className="absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card/95 text-card-foreground shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-colors duration-200 hover:border-primary/35 hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            disabled={!api}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-14 bg-gradient-to-r from-background via-background/82 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-14 bg-gradient-to-l from-background via-background/82 to-transparent lg:block" />

          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
              duration: 34,
            }}
            className="w-full px-12 py-2 sm:px-14 lg:px-16"
          >
            <CarouselContent className="items-stretch [backface-visibility:hidden] [will-change:transform]">
              {HOME_SERVICE_CARDS.map((service) => (
                <CarouselItem
                  key={service.id}
                  className="basis-[82%] sm:basis-[48%] lg:basis-[calc((100%-2rem)/3)] xl:basis-[calc((100%-3rem)/4)] 2xl:basis-[calc((100%-4rem)/5)]"
                >
                  <ServiceRailCard service={service} onSelect={handleSelectService} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {serviceCount > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: serviceCount }).map((_, index) => (
              <button
                key={`service-carousel-dot-${index}`}
                type="button"
                aria-label={`Go to service slide ${index + 1}`}
                onClick={() => api?.scrollTo(index)}
                disabled={!api}
                className={cn(
                  "h-2.5 rounded-full bg-white/22 transition-all duration-300 hover:bg-white/38 disabled:pointer-events-none disabled:opacity-40",
                  index === selectedIndex ? "w-7 bg-primary" : "w-2.5",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceCardsCarousel;
