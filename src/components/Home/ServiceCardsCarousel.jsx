import React from "react";
import { useNavigate } from "react-router-dom";
import Activity from "lucide-react/dist/esm/icons/activity";
import Bot from "lucide-react/dist/esm/icons/bot";
import Code from "lucide-react/dist/esm/icons/code";
import Database from "lucide-react/dist/esm/icons/database";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Globe from "lucide-react/dist/esm/icons/globe";
import Headphones from "lucide-react/dist/esm/icons/headphones";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import Mic from "lucide-react/dist/esm/icons/mic";
import Palette from "lucide-react/dist/esm/icons/palette";
import PhoneCall from "lucide-react/dist/esm/icons/phone-call";
import Search from "lucide-react/dist/esm/icons/search";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Target from "lucide-react/dist/esm/icons/target";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Users from "lucide-react/dist/esm/icons/users";
import Video from "lucide-react/dist/esm/icons/video";

import { Skiper47 } from "@/components/ui/skiper-ui/skiper47";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

const SERVICE_CARD_THEMES = [
  "from-[#7dd3fc] via-[#2563eb] to-[#1d4ed8]",
  "from-[#a78bfa] via-[#7c3aed] to-[#4c1d95]",
  "from-[#fb7185] via-[#e11d48] to-[#881337]",
  "from-[#f59e0b] via-[#ea580c] to-[#c2410c]",
  "from-[#34d399] via-[#059669] to-[#065f46]",
  "from-[#67e8f9] via-[#0891b2] to-[#155e75]",
  "from-[#c084fc] via-[#a21caf] to-[#701a75]",
  "from-[#bef264] via-[#65a30d] to-[#3f6212]",
  "from-[#fda4af] via-[#f43f5e] to-[#9f1239]",
  "from-[#f9a8d4] via-[#db2777] to-[#831843]",
  "from-[#fdba74] via-[#f97316] to-[#9a3412]",
  "from-[#fde68a] via-[#d97706] to-[#92400e]",
  "from-[#93c5fd] via-[#3b82f6] to-[#1e40af]",
  "from-[#5eead4] via-[#0d9488] to-[#134e4a]",
  "from-[#86efac] via-[#22c55e] to-[#166534]",
  "from-[#ddd6fe] via-[#8b5cf6] to-[#5b21b6]",
  "from-[#fca5a5] via-[#ef4444] to-[#991b1b]",
  "from-[#99f6e4] via-[#14b8a6] to-[#115e59]",
  "from-[#d8b4fe] via-[#9333ea] to-[#6b21a8]",
  "from-[#fde047] via-[#ca8a04] to-[#854d0e]",
];

const HOME_SERVICES = [
  {
    id: "website-development",
    title: "Website Development",
    description: "Custom and platform-based websites built for performance, speed, and growth.",
    watermark: "WEBSITE",
    icon: Globe,
  },
  {
    id: "app-development",
    title: "App Development",
    description: "Mobile apps designed to engage users and scale businesses.",
    watermark: "APP",
    icon: Smartphone,
  },
  {
    id: "software-development",
    title: "Software Development",
    description: "Custom software solutions built to solve real business problems.",
    watermark: "SOFTWARE",
    icon: Terminal,
  },
  {
    id: "lead-generation",
    title: "Lead Generation",
    description: "Targeted campaigns that turn prospects into qualified business leads.",
    watermark: "LEADS",
    icon: Target,
  },
  {
    id: "video-services",
    title: "Video Services",
    description: "Creative videos that tell stories and boost brand engagement.",
    watermark: "VIDEO",
    icon: Video,
  },
  {
    id: "cgi-videos",
    title: "CGI Videos",
    description: "High-impact CGI visuals for products, ads, and storytelling.",
    watermark: "CGI",
    icon: Video,
  },
  {
    id: "3d-modeling",
    title: "3D Modeling",
    description: "Detailed 3D models for products, visuals, and digital experiences.",
    watermark: "3D",
    icon: Code,
  },
  {
    id: "seo-optimization",
    title: "SEO Optimization",
    description: "Improve search rankings and drive consistent organic traffic.",
    watermark: "SEO",
    icon: Search,
  },
  {
    id: "social-media-management",
    title: "Social Media Management",
    description: "Content and community management to grow your brand online.",
    watermark: "SOCIAL",
    icon: Share2,
  },
  {
    id: "influencer-marketing",
    title: "Influencer Marketing",
    description: "Collaborate with creators to build trust and audience reach.",
    watermark: "CREATORS",
    icon: Users,
  },
  {
    id: "ugc-marketing",
    title: "UGC Marketing",
    description: "Authentic creator content that boosts credibility and conversions.",
    watermark: "UGC",
    icon: Mic,
  },
  {
    id: "performance-marketing",
    title: "Performance Marketing",
    description: "Data-driven advertising campaigns focused on measurable results.",
    watermark: "PERFORMANCE",
    icon: Activity,
  },
  {
    id: "creative-design",
    title: "Creative & Design",
    description: "Visual designs that strengthen branding and communication.",
    watermark: "DESIGN",
    icon: Palette,
  },
  {
    id: "branding",
    title: "Branding Kit",
    description: "Build strong brand identities that people remember and trust.",
    watermark: "BRAND",
    icon: Palette,
  },
  {
    id: "writing-content",
    title: "Writing & Content",
    description: "Compelling content that informs, engages, and converts audiences.",
    watermark: "CONTENT",
    icon: FileText,
  },
  {
    id: "customer-support",
    title: "Customer Support",
    description: "Reliable support services that improve satisfaction and retention.",
    watermark: "SUPPORT",
    icon: Headphones,
  },
  {
    id: "crm-erp-solutions",
    title: "CRM & ERP Solutions",
    description: "Systems that streamline operations and centralize business data.",
    watermark: "SYSTEMS",
    icon: Database,
  },
  {
    id: "ai-automation",
    title: "AI Automation",
    description: "Automate workflows to save time and improve team productivity.",
    watermark: "AI",
    icon: Bot,
  },
  {
    id: "voice-agent",
    title: "Voice Agent",
    description: "AI voice automation for sales, support, and faster follow-ups.",
    watermark: "VOICE",
    icon: PhoneCall,
  },
  {
    id: "whatsapp-chatbot",
    title: "WhatsApp Chat Bot",
    description: "Automated conversations for faster support and conversion flows.",
    watermark: "WHATSAPP",
    icon: MessageCircle,
  },
];

const SERVICE_CAROUSEL_BREAKPOINTS = {
  0: {
    slidesPerView: 1.08,
    spaceBetween: 16,
  },
  640: {
    slidesPerView: 1.28,
    spaceBetween: 18,
  },
  768: {
    slidesPerView: 1.65,
    spaceBetween: 22,
  },
  1024: {
    slidesPerView: 2.1,
    spaceBetween: 26,
  },
  1280: {
    slidesPerView: 2.45,
    spaceBetween: 30,
  },
};

const ServiceCardsCarousel = () => {
  const navigate = useNavigate();

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

  const renderServiceSlide = React.useCallback(
    (service, index) => {
      const Icon = service.icon;
      const themeClassName = SERVICE_CARD_THEMES[index % SERVICE_CARD_THEMES.length];

      return (
        <button
          type="button"
          onClick={() => handleSelectService(service)}
          aria-label={`Explore ${service.title}`}
          className={cn(
            "group relative block aspect-[1.38] min-h-[18.5rem] w-full overflow-hidden rounded-[2rem] border border-white/12 text-left text-white shadow-[0_0_0_1px_hsl(var(--background)/0.82),0_24px_80px_-35px_rgba(0,0,0,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_hsl(var(--background)/0.82),0_30px_90px_-35px_rgba(0,0,0,0.68)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:aspect-[1.46] sm:min-h-[21rem] lg:min-h-[23rem]",
            "sm:rounded-[2.25rem]",
          )}>
          <div className={cn("absolute inset-0 bg-gradient-to-br", themeClassName)} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.08))]" />
          <div className="absolute left-0 top-0 h-[58%] w-[42%] rounded-br-[2.6rem] border-b border-r border-white/6 bg-black/5" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),transparent_42%,rgba(0,0,0,0.08)_100%)]" />

          <div className="pointer-events-none absolute right-3 top-3 h-[88%] overflow-hidden text-white/10 sm:right-4 sm:top-4">
            <span className="block text-[3.4rem] font-black uppercase leading-none tracking-[-0.1em] [writing-mode:vertical-rl] sm:text-[4.6rem]">
              {service.watermark}
            </span>
          </div>

          <div className="relative flex h-full flex-col p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm sm:h-12 sm:w-12">
              <Icon className="h-5 w-5 text-white sm:h-[22px] sm:w-[22px]" strokeWidth={1.7} />
            </div>

            <div className="mt-auto max-w-[72%]">
              <h3 className="text-xl font-semibold leading-tight sm:text-2xl">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/82 sm:text-[0.95rem]">
                {service.description}
              </p>
            </div>
          </div>
        </button>
      );
    },
    [handleSelectService],
  );

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-background py-12 sm:py-16">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center gap-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <h2 className="w-full max-w-none text-[2rem] font-medium leading-[1.05] tracking-tight text-white sm:text-[2.7rem] md:whitespace-nowrap md:text-[3.2rem] lg:text-[3.95rem] xl:text-[4.2rem]">
            Freelancers <span className="text-primary">Who</span> Don&apos;t
            Ghost You
          </h2>
          <p className="mt-3 max-w-5xl text-balance text-sm font-normal leading-relaxed text-white sm:mt-4 sm:text-base md:text-lg">
            Every freelancer checked. Every project protected | Browse experts who show up, do the work, and meet deadlines
          </p>

          <Button
            type="button"
            onClick={handleGetFreeProposal}
            className="mt-8 h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:px-7 sm:text-base"
          >
            Get Your Free Proposal
          </Button>
        </div>

        <Skiper47
          items={HOME_SERVICES}
          renderSlide={renderServiceSlide}
          wrapperClassName="bg-background"
          className="max-w-none"
          slideClassName="px-2 pt-4 pb-1 sm:px-3 sm:pt-5 sm:pb-2"
          showPagination
          loop
          autoplay={{
            delay: 2600,
            disableOnInteraction: false,
          }}
          breakpoints={SERVICE_CAROUSEL_BREAKPOINTS}
        />
      </div>
    </section>
  );
};

export default ServiceCardsCarousel;
