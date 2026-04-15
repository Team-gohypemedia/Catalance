import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Bot from "lucide-react/dist/esm/icons/bot";
import Box from "lucide-react/dist/esm/icons/box";
import Clapperboard from "lucide-react/dist/esm/icons/clapperboard";
import Code from "lucide-react/dist/esm/icons/code";
import Film from "lucide-react/dist/esm/icons/film";
import Globe from "lucide-react/dist/esm/icons/globe";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Mic from "lucide-react/dist/esm/icons/mic";
import Palette from "lucide-react/dist/esm/icons/palette";
import PenTool from "lucide-react/dist/esm/icons/pen-tool";
import Search from "lucide-react/dist/esm/icons/search";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import Smartphone from "lucide-react/dist/esm/icons/smartphone";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Star from "lucide-react/dist/esm/icons/star";
import Target from "lucide-react/dist/esm/icons/target";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Video from "lucide-react/dist/esm/icons/video";

import { cn } from "@/shared/lib/utils";

const iconRegistry = {
  barChart3: BarChart3,
  bot: Bot,
  box: Box,
  clapperboard: Clapperboard,
  code: Code,
  film: Film,
  globe: Globe,
  messageCircle: MessageCircle,
  messageSquare: MessageSquare,
  mic: Mic,
  palette: Palette,
  penTool: PenTool,
  search: Search,
  share2: Share2,
  smartphone: Smartphone,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  trendingUp: TrendingUp,
  video: Video,
};

const FreelancerServicesSlide = ({
  slide,
  selectedServices,
  onToggleService,
}) => {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] text-primary sm:text-4xl lg:text-[3.1rem] lg:leading-[1.04]">
            {slide.title}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {slide.description}
          </p>
        </div>

        <div className="grid justify-center gap-3.5 [grid-template-columns:repeat(2,minmax(0,172px))] md:[grid-template-columns:repeat(3,172px)] xl:[grid-template-columns:repeat(5,172px)]">
          {slide.services.map((service) => {
            const Icon = iconRegistry[service.icon];
            const isSelected = selectedServices.includes(service.id);

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onToggleService(service.id)}
                className={cn(
                  "flex aspect-[1.18] w-full flex-col items-center justify-center rounded-[18px] border bg-card px-3 py-2.5 text-center transition-all duration-200",
                  isSelected
                    ? "border-primary shadow-[0_0_0_1px_rgba(250,204,21,0.22)]"
                    : "border-white/10 hover:border-white/20"
                )}
                aria-pressed={isSelected}
              >
                <Icon
                  className={cn(
                    "mb-3 h-5 w-5",
                    isSelected ? "text-primary" : "text-white/80"
                  )}
                />

                <span
                  className={cn(
                    "text-[13px] font-semibold leading-[1.3]",
                    isSelected ? "text-primary" : "text-white"
                  )}
                >
                  {service.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FreelancerServicesSlide;
