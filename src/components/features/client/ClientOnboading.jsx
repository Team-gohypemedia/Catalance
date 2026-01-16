import { useState, useEffect, memo } from "react";
import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { EvervaultCard, CardPattern, generateRandomString } from "@/components/ui/evervault-card";
import { useMotionValue, useMotionTemplate, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AIChat from "@/components/features/ai/AIChat";
import Code from "lucide-react/dist/esm/icons/code";
import Target from "lucide-react/dist/esm/icons/target";
import Video from "lucide-react/dist/esm/icons/video";

import Palette from "lucide-react/dist/esm/icons/palette";
import FileText from "lucide-react/dist/esm/icons/file-text";

import Headphones from "lucide-react/dist/esm/icons/headphones";

import Search from "lucide-react/dist/esm/icons/search";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Activity from "lucide-react/dist/esm/icons/activity";
import Mic from "lucide-react/dist/esm/icons/mic";
import Database from "lucide-react/dist/esm/icons/database";
import Workflow from "lucide-react/dist/esm/icons/workflow";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import PhoneCall from "lucide-react/dist/esm/icons/phone-call";
import Users from "lucide-react/dist/esm/icons/users";
import Globe from "lucide-react/dist/esm/icons/globe";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Check from "lucide-react/dist/esm/icons/check";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";

// ... features array remains the same ...
const features = [
  {
    title: "Website Development",
    description: "Custom websites built for performance, speed, and business growth.",
    price: "Starting at ₹25,000",
    icon: Globe,
    image: "/src/assets/icons/web-icon.png",
  },
  {
    title: "App Development",
    description: "Mobile apps designed to engage users and scale businesses.",
    price: "Starting at ₹1,00,000",
    icon: Smartphone,
    image: "/src/assets/icons/android-icon.png",
  },
  {
    title: "Software Development",
    description: "Custom software solutions built to solve real business problems.",
    price: "Starting at ₹1,00,000",
    icon: Terminal,
  },
  {
    title: "Lead Generation",
    description: "Targeted campaigns that turn prospects into qualified business leads.",
    price: "Starting at ₹15,000/mo",
    icon: Target,
  },
  {
    title: "Video Services",
    description: "Creative videos that tell stories and boost brand engagement.",
    price: "Starting at ₹2,000/video",
    icon: Video,
  },
  {
    title: "CGI Videos",
    description: "High-impact CGI visuals for products, ads, and storytelling.",
    price: "Starting at ₹15,000",
    icon: Video,
  },
  {
    title: "3D Modeling",
    description: "Detailed 3D models for products, visuals, and digital experiences.",
    price: "Starting at ₹5,000/model",
    icon: Code,
  },
  {
    title: "SEO Optimization",
    description: "Improve search rankings and drive consistent organic traffic.",
    price: "Starting at ₹10,000/mo",
    icon: Search,
    image: "/src/assets/icons/seo-icon.png",
  },
  {
    title: "Social Media Management",
    description: "Content and community management to grow your brand online.",
    price: "Starting at ₹10,000/mo",
    icon: Share2,
  },
  {
    title: "Influencer Marketing",
    description: "Collaborate with creators to build trust and audience reach.",
    price: "Starting at ₹10,000",
    icon: Users,
  },
  {
    title: "UGC (User-Generated Content) Marketing",
    description: "Authentic creator content that boosts brand credibility and conversions.",
    price: "Starting at ₹2,000/video",
    icon: Mic,
  },
  {
    title: "Performance Marketing",
    description: "Data-driven advertising campaigns focused on measurable results.",
    price: "Starting at ₹25,000/mo",
    icon: Activity,
  },
  {
    title: "Creative & Design",
    description: "Visual designs that strengthen branding and communication.",
    price: "Starting at ₹10,000",
    icon: Palette,
  },
  {
    title: "Branding (Naming, Logo & Brand Identity)",
    description: "Build strong brand identities that people remember and trust.",
    price: "Starting at ₹25,000",
    icon: Palette,
  },
  {
    title: "Writing & Content",
    description: "Compelling content that informs, engages, and converts audiences.",
    price: "Starting at ₹1,000/piece",
    icon: FileText,
  },
  {
    title: "Customer Support",
    description: "Reliable support services that improve customer satisfaction and retention.",
    price: "Starting at ₹15,000/mo",
    icon: Headphones,
  },
  {
    title: "CRM & ERP Solutions",
    description: "Systems that streamline operations and centralize business data.",
    price: "Starting at ₹40,000",
    icon: Database,
  },
  {
    title: "AI Automation",
    description: "Automate workflows to save time and improve productivity.",
    price: "Starting at ₹25,000",
    icon: Workflow,
  },
  {
    title: "Voice Agent (AI Voice Bot / Call Automation)",
    description: "AI-powered voice agents for sales, support, and follow-ups.",
    price: "Starting at ₹1,30,000",
    icon: PhoneCall,
    image: "/src/assets/icons/voice-agent-icon.png",
  },
  {
    title: "WhatsApp Chat Bot",
    description: "Automated WhatsApp conversations for faster customer support and sales.",
    price: "Starting at ₹15,000",
    icon: MessageCircle,
  },
];

// Custom Matrix Pattern component for background - always visible (masked by mouse) without hover dependency
function MatrixPattern({ mouseX, mouseY, randomString }) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0.85) 20%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.15) 80%, transparent 100%)`; // Softer edges, more visible in light mode
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 mask-[linear-gradient(white,transparent)] opacity-20" /> {/* Base subtle pattern */}
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-primary to-orange-700 opacity-100 transition duration-500 backdrop-blur-xl" // Always visible, controlled by mask
        style={style}
      />
      <motion.div
        className="absolute inset-0 opacity-100 mix-blend-overlay transition duration-500" // Always visible, controlled by mask
        style={style}
      >
        <p className="absolute inset-x-0 h-full wrap-break-word whitespace-pre-wrap text-xs font-mono font-bold text-white transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const ClientOnboading = () => {
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPrefill, setChatPrefill] = useState("");
  const location = useLocation();

  const [selectedServiceTitle, setSelectedServiceTitle] = useState(null);

  const openChat = useCallback((message, serviceTitle = null) => {
    setChatPrefill(message || "");
    setSelectedServiceTitle(serviceTitle);
    setIsChatOpen(true);
  }, []);

  // Matrix effect state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // OPTIMIZED: Initialize string only once using lazy initialization
  const [randomString] = useState(() => generateRandomString(20000));

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Handle auto-open from dashboard
  useEffect(() => {
    if (location.state?.openChat && location.state?.serviceTitle) {
      const feature = features.find(
        (f) => f.title === location.state.serviceTitle
      );
      if (feature) {
        setMultiSelectEnabled(false);
        setSelectedServices([]);
        openChat(`I need help with ${feature.title}.`, feature.title);
      }
    }
  }, [location.state, openChat]);

  const handleCardClick = (feature) => {
    if (multiSelectEnabled) {
      // ... (existing multi-select logic)
      setSelectedServices((prev) => {
        const exists = prev.some((item) => item.title === feature.title);
        if (exists) {
          return prev.filter((item) => item.title !== feature.title);
        }
        if (prev.length >= 3) {
          toast.error("You can select up to 3 services.");
          return prev;
        }
        return [...prev, feature];
      });
      return;
    }

    openChat(`I need help with ${feature.title}.`, feature.title);
  };

  // ...

  const handleStartMultiChat = () => {
    if (!selectedServices.length) return;
    const selectedNames = selectedServices.map((item) => item.title).join(", ");
    openChat(`I need help with ${selectedNames}.`, "Multiple Services");
  };

  // ...

  // Render AIChat with serviceName prop
  // <AIChat embedded prefill={chatPrefill} serviceName={selectedServiceTitle} />

  // (Applying the edit to the render part in a separate chunk if needed, but here I'll try to target the relevant blocks)


  const handleToggleMultiSelect = (checked) => {
    setMultiSelectEnabled(checked);
    if (!checked) {
      setSelectedServices([]);
    }
  };



  return (
    <section
      className="mt-10 space-y-6 text-foreground transition-colors relative"
    >
      {/* Matrix Background Layer - Fixed to cover whole screen */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <MatrixPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
      </div>

      <div className="text-center space-y-2 relative z-10">
        <span className="inline-block px-6 py-2 text-lg uppercase tracking-[0.4em] bg-background text-primary rounded-full font-semibold shadow-md">
          Services
        </span>
        <h2 className="text-3xl font-semibold">
          Clarity across every step of the freelance lifecycle.
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <Switch checked={multiSelectEnabled} onCheckedChange={handleToggleMultiSelect} />
          <span className="text-sm font-medium">
            Select multiple services (up to 3)
          </span>
        </div>
        {multiSelectEnabled && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedServices.length} selected
            </span>
            <Button
              onClick={handleStartMultiChat}
              disabled={selectedServices.length === 0}
              className="text-xs"
            >
              Start Multi-Service Chat
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
        {features.map((feature, index) => (
          <ServiceCard
            key={index}
            feature={feature}
            selectedServices={selectedServices}
            multiSelectEnabled={multiSelectEnabled}
            onClick={() => handleCardClick(feature)}
          />
        ))}
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="w-[96vw] max-w-5xl h-[85vh] border-0 bg-transparent p-0">
          <DialogTitle className="sr-only">Chat with Catalance</DialogTitle>
          <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <AIChat embedded prefill={chatPrefill} serviceName={selectedServiceTitle} />
          </div>
        </DialogContent>
      </Dialog>

    </section >
  );
};

// Memoized Service Card Component to prevent re-renders
const ServiceCard = memo(({ feature, selectedServices, multiSelectEnabled, onClick }) => {
  const isSelected = selectedServices.some((item) => item.title === feature.title);

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-3xl border transition-all duration-500 cursor-pointer h-full
        ${isSelected
          ? "border-[#ffc800] shadow-[0_0_40px_-10px_rgba(255,200,0,0.3)] bg-background"
          : "border-white/20 bg-background shadow-[0_0_15px_-3px_rgba(255,255,255,0.05)] hover:border-[#ffc800]/50 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2"}
      `}
    >
      {/* Background Gradient Shine - Subtle premium feel */}
      <div className={`absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${isSelected ? "opacity-100" : "group-hover:opacity-100"}`} />

      {/* Selection Glow Overlay */}
      {isSelected && <div className="absolute inset-0 bg-[#ffc800]/5 pointer-events-none" />}

      <div className="flex flex-col h-full p-8 relative z-10">

        {/* Icon Container */}
        <div className="h-24 w-full flex items-center justify-start mb-6 relative">
          <div className="absolute -left-4 -top-4 w-32 h-32 bg-[#ffc800]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          {feature.image ? (
            <img src={feature.image} alt={feature.title} className="w-20 h-20 object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500 ease-out" />
          ) : (
            <feature.icon className="w-14 h-14 text-[#ffc800] drop-shadow-lg z-10 group-hover:scale-110 transition-transform duration-500 ease-out" strokeWidth={1.5} />
          )}
        </div>

        {/* Card Content */}
        <div className="flex flex-col grow">
          <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#ffc800] transition-colors duration-300">
            {feature.title}
          </h3>

          <p className="text-sm text-zinc-400 font-medium leading-relaxed mb-8 line-clamp-3 group-hover:text-zinc-300 transition-colors">
            {feature.description}
          </p>

          <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-5">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Starting at</p>
              <p className="text-white text-lg font-bold group-hover:text-[#ffc800] transition-colors duration-300">
                {feature.price.replace('Starting at ', '').replace('Starting at', '')}
              </p>
            </div>
            <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-[#ffc800] border-[#ffc800] text-black' : 'border-white/10 text-zinc-500 group-hover:border-[#ffc800] group-hover:text-[#ffc800]'}`}>
              {isSelected ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ClientOnboading;








