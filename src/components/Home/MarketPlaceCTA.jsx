import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import { useTheme } from "@/components/providers/theme-provider";

const MarketPlaceCTA = () => {
  const { theme } = useTheme();
  const isDarkMode = 
    theme === "dark" || 
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const videoSrc = isDarkMode
    ? "https://assets.catalance.in/assets/Darktheme.mp4"
    : "https://assets.catalance.in/assets/WhatsApp%20Video%202026-06-03%20at%2012.28.59%20PM.mp4";

  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Control play/pause states based on viewport visibility
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative isolate w-full overflow-hidden bg-background dark:bg-black">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-6 sm:px-8 sm:py-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

          {/* LEFT — description + CTA */}
          <div className="flex flex-col items-start justify-center gap-6 z-10 lg:pr-10 lg:self-center">
            <h2 className="text-3xl sm:text-4xl lg:text-[3.2rem] font-extrabold leading-[1.15] tracking-tight text-foreground text-balance">
              Work Done On Your Terms, Every Single Time.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-md">
              Hire verified freelancers and expert agencies for fast, high-quality project delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/marketplace?view=freelancers#specialists-section"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-[0_8px_24px_rgba(217,105,42,0.25)]"
              >
                Browse Talent
                
              </Link>
            </div>
          </div>

          {/* RIGHT — Video (lazy-loaded, plays only when visible) */}
          <div className="relative flex items-center justify-center w-full mt-10 lg:mt-0 lg:self-center">
            <video
              key={videoSrc}
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full max-w-[640px] h-auto object-contain relative z-10 hover:scale-[1.02] transition-transform duration-700 ease-out rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketPlaceCTA;
