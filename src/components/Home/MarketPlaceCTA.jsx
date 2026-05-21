import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/providers/theme-provider";
import NumberTicker from "@/components/ui/number-ticker";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Tag from "lucide-react/dist/esm/icons/tag";
import Briefcase from "lucide-react/dist/esm/icons/briefcase";
import Users from "lucide-react/dist/esm/icons/users";
import MascotCTA from "@/assets/videos/mascot-cta.mp4";
import MascotPoster from "@/assets/mascot.png";

const MARKETPLACE_STATS = [
  { icon: Tag,       label: "Brands Onboarded",    value: 20,   suffix: "k+" },
  { icon: Briefcase, label: "Successful Projects",  value: 1000, suffix: "+"  },
  { icon: Users,     label: "Freelancers Enrolled", value: 10,   suffix: "+"  },
];


const MASCOT_MEDIA_CLASSNAME =
  "block h-auto max-h-[18rem] w-full max-w-[18rem] select-none object-contain sm:max-h-[24rem] sm:max-w-[24rem] lg:max-h-[30rem] lg:max-w-[30rem]";

const applyChromaKey = (frame) => {
  const { data } = frame;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const dominantNonGreen = Math.max(red, blue);
    const greenDelta = green - dominantNonGreen;
    const isGreenScreenPixel =
      green > 96 && greenDelta > 24 && green > red * 1.18 && green > blue * 1.1;
    if (isGreenScreenPixel) {
      const nextAlpha = Math.max(0, 255 - greenDelta * 6);
      data[index + 3] = nextAlpha < 28 ? 0 : nextAlpha;
      data[index + 1] = Math.max(dominantNonGreen, green - Math.round(greenDelta * 0.85));
      continue;
    }
    if (greenDelta > 8) {
      data[index + 1] = Math.max(dominantNonGreen, green - Math.round(greenDelta * 0.7));
    }
  }
  return frame;
};

const MarketPlaceCTA = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);

  const { theme } = useTheme();
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const accentColor  = isDarkMode ? "#F9D949" : "#D9692A";
  const accentBg     = isDarkMode ? "bg-[#F9D949]" : "bg-[#D9692A]";
  const accentText   = isDarkMode ? "text-[#F9D949]" : "text-[#D9692A]";
  const accentBorder = isDarkMode ? "border-[#F9D949]/30" : "border-[#D9692A]/30";
  const iconBg       = isDarkMode ? "bg-zinc-800" : "bg-zinc-100";

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return undefined;

    const drawingContext = canvasElement.getContext("2d", { willReadFrequently: true });
    if (!drawingContext) return undefined;

    let animationFrameId = 0;
    let isDisposed = false;
    let hasSignalledFirstFrame = false;

    const syncCanvasSize = () => {
      if (!videoElement.videoWidth || !videoElement.videoHeight) return;
      const scale = Math.min(1, 480 / videoElement.videoHeight);
      const targetWidth = Math.round(videoElement.videoWidth * scale);
      const targetHeight = Math.round(videoElement.videoHeight * scale);
      if (canvasElement.width !== targetWidth || canvasElement.height !== targetHeight) {
        canvasElement.width = targetWidth;
        canvasElement.height = targetHeight;
      }
    };

    const renderFrame = () => {
      if (isDisposed) return;
      if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !videoElement.paused && !videoElement.ended) {
        syncCanvasSize();
        if (canvasElement.width && canvasElement.height) {
          drawingContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          const processedFrame = applyChromaKey(drawingContext.getImageData(0, 0, canvasElement.width, canvasElement.height));
          drawingContext.putImageData(processedFrame, 0, 0);
          if (!hasSignalledFirstFrame) {
            hasSignalledFirstFrame = true;
            setHasRenderedFrame(true);
          }
        }
      }
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    const playPromise = videoElement.play();
    if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});

    animationFrameId = window.requestAnimationFrame(renderFrame);
    videoElement.addEventListener("loadedmetadata", syncCanvasSize);

    return () => {
      isDisposed = true;
      videoElement.removeEventListener("loadedmetadata", syncCanvasSize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative isolate w-full overflow-hidden bg-background">
      {/* Far-right edge chevron */}
      <span className={`${accentText} absolute right-4 top-1/2 -translate-y-1/2 text-3xl font-black opacity-40 select-none z-10 hidden lg:block`}>〉</span>
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

        {/* ── Heading with Sparkles ── */}
        <div className="flex justify-center mb-12 lg:mb-16">
          <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-extrabold leading-[1.25] tracking-tight text-foreground dark:text-white text-center flex flex-col items-center">
            <span className="relative px-2">
              {/* Top-Left Spark */}
              <span className="absolute -top-3 -left-6 sm:-top-4 sm:-left-8 text-primary select-none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="w-5 h-5 sm:w-7 sm:h-7">
                  <path d="M16 10V2" />
                  <path d="M12 12L4 4" />
                  <path d="M10 16H2" />
                </svg>
              </span>
              Work Done On Your Terms,
            </span>
            <span className="relative px-2 mt-1">
              <span className="text-primary italic font-medium">Every Single Time</span>
              {/* Bottom-Right Spark */}
              <span className="absolute -bottom-3 -right-6 sm:-bottom-4 sm:-right-8 text-primary select-none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="w-5 h-5 sm:w-7 sm:h-7">
                  <path d="M8 14V22" />
                  <path d="M12 12L20 20" />
                  <path d="M14 8H22" />
                </svg>
              </span>
            </span>
          </h2>
        </div>

        {/* ── 3-column layout: Left text | Center mascot | Right stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-center">

          {/* LEFT — description + CTA */}
          <div className="flex flex-col items-start justify-center gap-6 lg:pr-12">
            <span className={`${accentText} text-2xl font-black opacity-40 select-none -ml-1`}>〈</span>

            <p className="text-sm sm:text-base leading-relaxed text-foreground/60 dark:text-white/60 max-w-xs">
              Our platform connects businesses with verified, top-tier
              freelancers. From concept to completion, we help you ship
              faster without compromising quality.
            </p>

            <Link
              to="/talent"
              className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg ${accentBg} ${isDarkMode ? "text-black" : "text-[#ffffff]"}`}
              style={{ boxShadow: `0 8px 28px ${accentColor}45` }}
            >
              Browse Talent
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CENTER — mascot */}
          <div className="flex items-center justify-center">
            <div
              className="relative w-60 h-60 sm:w-72 sm:h-72 lg:w-[300px] lg:h-[300px] rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: isDarkMode
                  ? "radial-gradient(circle, #2a2a2a 60%, #111 100%)"
                  : "radial-gradient(circle, #e8e8e8 60%, #d0d0d0 100%)",
                boxShadow: "0 0 60px 10px rgba(0,0,0,0.35) inset, 0 0 0 1px rgba(255,255,255,0.05)"
              }}
            >
              <div className={`absolute inset-0 rounded-full border-2 ${accentBorder} opacity-25`} />

              {/* Mascot image fallback */}
              {!hasRenderedFrame && (
                <img src={MascotPoster} alt="Catalance mascot" draggable="false" className={MASCOT_MEDIA_CLASSNAME} />
              )}

              {/* Chroma-keyed video canvas */}
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Mascot animation"
                className={`${MASCOT_MEDIA_CLASSNAME} ${hasRenderedFrame ? "opacity-100" : "absolute inset-0 opacity-0"}`}
              />

              <video
                ref={videoRef}
                src={MascotCTA}
                poster={MascotPoster}
                aria-hidden="true"
                draggable="false"
                className="pointer-events-none absolute h-px w-px opacity-0"
                autoPlay loop muted playsInline preload="auto" disablePictureInPicture
              />
            </div>
          </div>

          {/* RIGHT — vertical stats */}
          <div className="flex flex-col items-start justify-center gap-6 lg:pl-12 lg:border-l border-border">

            {MARKETPLACE_STATS.map(({ icon: Icon, label, value, suffix }) => (
              <div key={label} className="flex items-center gap-4">
                {/* Icon badge */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${accentBorder} ${iconBg} shrink-0`}>
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div className="flex flex-col">
                  <div className={`text-2xl sm:text-3xl font-extrabold leading-none ${accentText} flex items-baseline`}>
                    <NumberTicker value={value} className={accentText} />
                    <span>{suffix}</span>
                  </div>
                  <p className="text-[11px] uppercase tracking-widest text-foreground/45 dark:text-white/40 mt-1">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketPlaceCTA;
