import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import {
  ArrowRight,
  Bot,
  Workflow,
  Users,
  Mic,
  Database,
  LineChart,
  Video,
  Smartphone,
  Sparkles,
  Palette,
  PenTool,
  Megaphone,
  Rocket,
  Share2,
  Camera,
  Film,
  Globe
} from "lucide-react";

const HOME_SERVICES = [
  {
    id: "web_development",
    title: "Website Development",
    icon: Globe,
    cardBg: "#f1f2f0",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/web%20development.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/web%20dev%201.png",
    price: "₹45,000/-",
  },
  {
    id: "app_dev",
    title: "Mobile App",
    icon: Smartphone,
    cardBg: "#f0f0ed",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/app%20development.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/app%20dev%201.png",
    price: "₹80,000/-",
  },
  {
    id: "ai_automation",
    title: "AI Automation",
    icon: Bot,
    cardBg: "#e3e1db",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/ai%20automation.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/ai%20automation%201.png",
    price: "₹25,000/-",
  },
  {
    id: "crm_erp",
    title: "CRM & ERP Integrated Solutions",
    icon: Workflow,
    cardBg: "#efefec",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/crm%20%26%20epr%20solutions.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/crm%20%26%20epr%20solutions%201.png",
    price: "₹50,000/-",
  },
  {
    id: "seo",
    title: "SEO / GMB",
    icon: LineChart,
    cardBg: "#eff0eb",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/seo.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/seo%201.png",
    price: "₹15,000/- Month",
  },

  {
    id: "social_media_marketing",
    title: "Social Media Marketing",
    icon: Share2,
    cardBg: "#eeefea",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/social%20media%20management.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/social%20media%20marketing%201.png",
    price: "₹15,000/- Month",
  },

  {
    id: "creative_design",
    title: "Creative & Design",
    icon: Palette,
    cardBg: "#e9e6df",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/creative%20%26%20design.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/creative%20%26%20design%201.png",
    price: "₹12,000/-",
  },
  {
    id: "brandkit",
    title: "Branding Kit",
    icon: Sparkles,
    cardBg: "#eae6df",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/brandkit.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/brand%20kit%201.png",
    price: "₹15,000/-",
  },
  {
    id: "paid_advertising",
    title: "Paid Advertising",
    icon: Rocket,
    cardBg: "#f1f1ec",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/paid%20advertising.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/paid%20advertising%201.png",
    price: "₹20,000/- Month",
  },
  {
    id: "content_writing",
    title: "Writing & Content",
    icon: PenTool,
    cardBg: "#eff0eb",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/content%20%26%20writing.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/content%20%26%20writing%201.png",
    price: "₹8,000/-",
  },
  {
    id: "video_services",
    title: "Video Services",
    icon: Film,
    cardBg: "#efefee",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/video%20services.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/video%20services%201.png",
    price: "₹15,000/-",
  },
  {
    id: "ai_video_generation",
    title: "AI Video Generation",
    icon: Video,
    cardBg: "#ecede8",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/ai%20video%20gen.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/ai%20video%20gen%201.png",
    price: "₹20,000/-",
  },
  {
    id: "cgi_video_services",
    title: "3D Animation",
    icon: Database,
    cardBg: "#f1f1ed",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/3D%20medeling.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/3D%20modeling%201.png",
    price: "₹30,000/-",
  },
  {
    id: "voice_agent",
    title: "Voice Agent",
    icon: Mic,
    cardBg: "#ccccc6",
    illustrationUrl: "https://assets.catalance.in/lite%20service%20icons/voice%20agnet.png",
    darkIllustrationUrl: "https://assets.catalance.in/dark%20theme%20icons/voice%20agent%201.png",
    price: "₹50,000/-",
  },
];

const HOME_SERVICE_CARDS = HOME_SERVICES.map((service, index) => ({
  ...service,
  isPriority: index < 4,
}));

const ServiceRailCard = React.memo(function ServiceRailCard({ service, isDark, onSelect }) {
  const imageUrl = isDark && service.darkIllustrationUrl ? service.darkIllustrationUrl : service.illustrationUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-label={`Explore ${service.title}`}
      className="group relative flex h-[20rem] w-[16rem] flex-shrink-0 flex-col justify-between overflow-hidden rounded-[2rem] border border-black/[0.06] dark:border-white/[0.08] bg-card p-6 text-left shadow-[0_12px_30px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:h-[23rem] sm:w-[18rem] sm:rounded-[2.1rem]"
    >
      {/* Top section: Title */}
      <div className="flex flex-col gap-3.5 relative z-10 w-full">

        {/* Title */}
        <h3 className="text-xl text-center font-semibold tracking-tight text-foreground leading-tight sm:text-2xl sm:font-bold">
          {service.title}
        </h3>
      </div>

      {/* Bottom section: 3D Illustration */}
      <div className="relative w-full flex items-center justify-center h-40 sm:h-48 mt-auto">
        {/* Subtle drop shadow / glow behind image */}
        <div className="absolute w-20 h-6 bg-black/[0.04] dark:bg-white/[0.04] blur-xl rounded-full bottom-2 transition-all duration-300 group-hover:scale-110 group-hover:opacity-60" />

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.title}
            className={`h-full w-full object-contain select-none z-10 transition-transform duration-500 -translate-y-6 group-hover:scale-[1.08] group-hover:-translate-y-8 ${!isDark ? "mix-blend-multiply" : ""}`}
            loading={service.isPriority ? "eager" : "lazy"}
            draggable={false}
          />
        ) : null}
      </div>
    </button>
  );
});

const ServiceCardsCarousel = () => {
  const navigate = useNavigate();
  const trackRef = React.useRef(null);
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const isHovered = React.useRef(false);

  React.useEffect(() => {
    let animationId;
    const scroll = () => {
      if (trackRef.current && !isHovered.current) {
        trackRef.current.scrollLeft += 1;
        // Reset scroll position for seamless infinite loop
        if (trackRef.current.scrollLeft >= trackRef.current.scrollWidth / 2) {
          trackRef.current.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };
    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleMouseEnter = () => {
    isHovered.current = true;
  };

  const handleMouseLeave = () => {
    isHovered.current = false;
  };

  const handleGetFreeProposal = React.useCallback(() => {
    navigate("/service");
  }, [navigate]);

  const handleSelectService = React.useCallback(
    (service) => {
      navigate(`/service?service=${service.id}`);
    },
    [navigate],
  );

  // Duplicate cards for seamless loop
  const allCards = [
    ...HOME_SERVICE_CARDS,
    ...HOME_SERVICE_CARDS,
  ];

  return (
    <section className="relative flex w-full items-center overflow-hidden bg-background pt-10 pb-10 sm:pt-16 sm:pb-8">
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
            className="mt-4 h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:px-7 sm:text-base"
          >
            Get Your Free Proposal
          </Button>
        </div>

        {/* Scrollable list */}
        <div
          className="relative w-full py-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseEnter}
          onTouchEnd={handleMouseLeave}
        >
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent sm:w-16" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent sm:w-16" />

          <div
            ref={trackRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide px-4 sm:px-8 pb-4"
          >
            {allCards.map((service, i) => (
              <ServiceRailCard
                key={`${service.id}-${i}`}
                service={service}
                isDark={isDark}
                onSelect={handleSelectService}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Hide scrollbar style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default ServiceCardsCarousel;
