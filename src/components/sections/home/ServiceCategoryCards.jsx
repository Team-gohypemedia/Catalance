import React from "react";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Layout from "lucide-react/dist/esm/icons/layout";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import PenTool from "lucide-react/dist/esm/icons/pen-tool";
import Video from "lucide-react/dist/esm/icons/video";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Music from "lucide-react/dist/esm/icons/music";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import { useTheme } from "@/components/providers/theme-provider";
import { CoverflowCarousel } from "@/components/ui/coverflow-carousel";
import { useNavigate } from "react-router-dom";
import cardNoise from "@/assets/card-noise.png";

const categories = [
  {
    id: 1,
    name: "Programming & Tech",
    description: "Custom software, web apps, and technical solutions.",
    icon: Monitor,
    gradient: "from-blue-600 to-indigo-900",
  },
  {
    id: 2,
    name: "Graphics & Design",
    description: "Logos, branding, UI/UX, and visual identity.",
    icon: Layout,
    gradient: "from-purple-600 to-pink-900",
  },
  {
    id: 3,
    name: "Digital Marketing",
    description: "SEO, social media, and performance marketing.",
    icon: Smartphone,
    gradient: "from-orange-500 to-red-900",
  },
  {
    id: 4,
    name: "Writing & Translation",
    description: "Copywriting, translation, and content creation.",
    icon: PenTool,
    gradient: "from-emerald-500 to-teal-900",
  },
  {
    id: 5,
    name: "Video & Animation",
    description: "Video editing, animation, and motion graphics.",
    icon: Video,
    gradient: "from-cyan-500 to-blue-900",
  },
  {
    id: 6,
    name: "AI Services",
    description: "AI integration, machine learning, and automation.",
    icon: Sparkles,
    gradient: "from-fuchsia-500 to-purple-900",
  },
  {
    id: 7,
    name: "Music & Audio",
    description: "Composition, mixing, and voice-over services.",
    icon: Music,
    gradient: "from-rose-500 to-pink-900",
  },
  {
    id: 8,
    name: "Business",
    description: "Business planning, strategy, and consulting.",
    icon: Briefcase,
    gradient: "from-amber-500 to-orange-900",
  },
  {
    id: 9,
    name: "Consulting",
    description: "Expert advice and professional guidance.",
    icon: UserCheck,
    gradient: "from-lime-500 to-green-900",
  },
];

const toServiceKey = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ServiceCategoryCards = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    // Find the category object to get the name
    const category = categories.find((c) => c.id === item.id);
    if (category) {
      navigate("/service", {
        state: {
          openChat: true,
          serviceTitle: category.name,
          serviceId: toServiceKey(category.name),
        },
      });
    }
  };

  const carouselItems = React.useMemo(
    () =>
      categories.map((cat) => ({
        id: cat.id,
        content: (
          <div
            className={`w-full h-full bg-linear-to-br ${cat.gradient} p-6 flex flex-col justify-between relative overflow-hidden group`}
          >
            {/* Abstract Background Pattern */}
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay bg-cover bg-center"
              style={{ backgroundImage: `url(${cardNoise})` }}
            ></div>

            {/* Background Watermark Text */}
            <div className="absolute top-10 -right-4 pointer-events-none opacity-10 select-none">
              <span
                className="text-8xl font-black text-white leading-none tracking-tighter"
                style={{ writingMode: "vertical-rl" }}
              >
                {cat.name}
              </span>
            </div>
            {/* Icon in Glass Box */}
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
                <cat.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
            </div>
            {/* Text Content at Bottom */}
            <div className="relative z-10 mt-auto">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md leading-tight">
                {cat.name}
              </h3>
              <p className="text-white/80 text-sm font-medium leading-relaxed drop-shadow-sm">
                {cat.description}
              </p>
            </div>
          </div>
        ),
      })),
    [],
  );

  return (
    <section
      className={`w-full py-20 overflow-hidden ${
        isDark ? "bg-black" : "bg-white"
      } flex items-center justify-center`}
    >
      <div className="max-w-7xl mx-auto px-4 w-full flex flex-col items-center gap-4">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Explore Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the perfect talent for your next big project.
          </p>
        </div>
        <div className="w-full">
          <CoverflowCarousel
            items={carouselItems}
            onCardClick={handleCardClick}
          />
        </div>
      </div>
    </section>
  );
};

export default ServiceCategoryCards;
