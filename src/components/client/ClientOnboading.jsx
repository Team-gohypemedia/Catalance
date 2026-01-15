import { useState, useEffect } from "react";
import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { EvervaultCard, CardPattern, generateRandomString } from "@/components/ui/evervault-card";
import { useMotionValue, useMotionTemplate, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AIChat from "@/components/ai/AIChat";
import {
  Code,
  Target,
  Video,
  Megaphone,
  Palette,
  FileText,
  Heart,
  Headphones,
  ClipboardList,
  Search,
  Share2,
  Activity,
  Mic,
  Database,
  Workflow,
  MessageCircle,
  PhoneCall,
  Users,
  Globe,
  Smartphone,
  Terminal,
  Check
} from "lucide-react";

// ... features array remains the same ...
const features = [
  {
    title: "Website Development",
    description: "Custom websites built for performance, speed, and business growth.",
    price: "Starting at ₹15,000",
    icon: Globe,
    image: "/src/assets/icons/web-icon.png",
  },
  {
    title: "App Development",
    description: "Mobile apps designed to engage users and scale businesses.",
    price: "Starting at ₹25,000",
    icon: Smartphone,
    image: "/src/assets/icons/android-icon.png",
  },
  {
    title: "Software Development",
    description: "Custom software solutions built to solve real business problems.",
    price: "Starting at ₹30,000",
    icon: Terminal,
  },
  {
    title: "Lead Generation",
    description: "Targeted campaigns that turn prospects into qualified business leads.",
    price: "Starting at ₹15,000",
    icon: Target,
  },
  {
    title: "Video Services",
    description: "Creative videos that tell stories and boost brand engagement.",
    price: "Starting at ₹7,500",
    icon: Video,
  },
  {
    title: "CGI Videos",
    description: "High-impact CGI visuals for products, ads, and storytelling.",
    price: "Starting at INR 15,000",
    icon: Video,
  },
  {
    title: "3D Modeling",
    description: "Detailed 3D models for products, visuals, and digital experiences.",
    price: "Starting at INR 5,000 per model",
    icon: Code,
  },
  {
    title: "SEO Optimization",
    description: "Improve search rankings and drive consistent organic traffic.",
    price: "Starting at ₹8,000",
    icon: Search,
    image: "/src/assets/icons/seo-icon.png",
  },
  {
    title: "Social Media Management",
    description: "Content and community management to grow your brand online.",
    price: "Starting at ₹12,000",
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
    price: "Starting at ₹2,000 per video",
    icon: Mic,
  },
  {
    title: "Performance Marketing",
    description: "Data-driven advertising campaigns focused on measurable results.",
    price: "Starting at ₹15,000",
    icon: Activity,
  },
  {
    title: "Creative & Design",
    description: "Visual designs that strengthen branding and communication.",
    price: "Starting at ₹3,500",
    icon: Palette,
  },
  {
    title: "Branding (Naming, Logo & Brand Identity)",
    description: "Build strong brand identities that people remember and trust.",
    price: "Starting at INR 25,000",
    icon: Palette,
  },
  {
    title: "Writing & Content",
    description: "Compelling content that informs, engages, and converts audiences.",
    price: "Starting at ₹2,000",
    icon: FileText,
  },
  {
    title: "Customer Support",
    description: "Reliable support services that improve customer satisfaction and retention.",
    price: "Starting at ₹8,000",
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
    price: "Starting at ₹20,000",
    icon: Workflow,
  },
  {
    title: "Voice Agent (AI Voice Bot / Call Automation)",
    description: "AI-powered voice agents for sales, support, and follow-ups.",
    price: "Starting at ₹130,000",
    icon: PhoneCall,
    image: "/src/assets/icons/voice-agent-icon.png",
  },
  {
    title: "WhatsApp Chat Bot",
    description: "Automated WhatsApp conversations for faster customer support and sales.",
    price: "Starting at ₹10,000",
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

  const openChat = useCallback((message) => {
    setChatPrefill(message || "");
    setIsChatOpen(true);
  }, []);

  // Matrix effect state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    const str = generateRandomString(20000);
    setRandomString(str);

    const handleMouseMove = (event) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);

      // Optional: Regenerate string on movement for dynamic effect
      const str = generateRandomString(20000);
      setRandomString(str);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle auto-open from dashboard
  useEffect(() => {
    if (location.state?.openChat && location.state?.serviceTitle) {
      const feature = features.find(
        (f) => f.title === location.state.serviceTitle
      );
      if (feature) {
        setMultiSelectEnabled(false);
        setSelectedServices([]);
        openChat(`I need help with ${feature.title}.`);
      }
    }
  }, [location.state, openChat]);

  const handleCardClick = (feature) => {
    if (multiSelectEnabled) {
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

    openChat(`I need help with ${feature.title}.`);
  };

  const handleToggleMultiSelect = (checked) => {
    setMultiSelectEnabled(checked);
    if (!checked) {
      setSelectedServices([]);
    }
  };

  const handleStartMultiChat = () => {
    if (!selectedServices.length) return;
    const selectedNames = selectedServices.map((item) => item.title).join(", ");
    openChat(`I need help with ${selectedNames}.`);
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
          <div
            key={index}
            onClick={() => handleCardClick(feature)}
            className="cursor-pointer relative bg-background rounded-2xl border border-amber-500"
          >
            <div
              className={`
                h-[300px] rounded-2xl transition-all duration-300 flex flex-col group relative overflow-hidden shadow-xl
                ${selectedServices.some((item) => item.title === feature.title) && multiSelectEnabled
                  ? "ring-2 ring-primary shadow-[0_0_30px_-5px_rgba(250,204,21,0.4)]"
                  : "hover:shadow-2xl"}
              `}
            >
              {/* Icon */}
              <div className="h-32 w-full flex items-center justify-center p-4 relative">
                {feature.image ? (
                  <img src={feature.image} alt={feature.title} className="w-30 h-24 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <feature.icon className="w-16 h-16 text-primary drop-shadow-lg group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                )}
              </div>

              {/* Card Content */}
              <div className="flex flex-col px-1 pt-1 pb-1 mt-auto">
                <h3 className="text-lg font-bold text-white mb-2 text-center group-hover:text-yellow-400 transition-colors line-clamp-2">
                  {feature.title}
                </h3>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed text-center mb-2 line-clamp-2">
                  {feature.description}
                </p>

                {/* Chat Now Button */}
                <Button className="w-full bg-[#ffc800] text-[#181710] font-bold py-6 text-base shadow-md rounded-none rounded-b-xl">
                  Chat Now
                </Button>
              </div>
            </div>
            {multiSelectEnabled && (
              <div className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border text-xs ${selectedServices.some((item) => item.title === feature.title) ? "bg-primary text-primary-foreground border-primary" : "bg-background/80 text-muted-foreground border-border"}`}>
                {selectedServices.some((item) => item.title === feature.title) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  "+"
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="w-[96vw] max-w-5xl h-[85vh] border-0 bg-transparent p-0">
          <DialogTitle className="sr-only">Chat with Catalance</DialogTitle>
          <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <AIChat embedded prefill={chatPrefill} />
          </div>
        </DialogContent>
      </Dialog>

    </section >
  );
};

export default ClientOnboading;








