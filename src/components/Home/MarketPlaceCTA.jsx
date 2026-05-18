import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import NumberTicker from "@/components/ui/number-ticker";
import { Button } from "@/components/ui/button";
import MascotCTA from "@/assets/videos/mascot-cta.mp4";
import MascotPoster from "@/assets/mascot.png";

const MARKETPLACE_STATS = [
  {
    label: "Brands Onboarded",
    value: 20,
    suffix: "k+",
  },
  {
    label: "Successful Projects",
    value: 1000,
    suffix: "+",
  },
  {
    label: "Freelancers Enrolled",
    value: 10,
    suffix: "+",
  },
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
      green > 96 &&
      greenDelta > 24 &&
      green > red * 1.18 &&
      green > blue * 1.1;

    if (isGreenScreenPixel) {
      const nextAlpha = Math.max(0, 255 - greenDelta * 6);

      data[index + 3] = nextAlpha < 28 ? 0 : nextAlpha;
      data[index + 1] = Math.max(
        dominantNonGreen,
        green - Math.round(greenDelta * 0.85),
      );

      continue;
    }

    if (greenDelta > 8) {
      data[index + 1] = Math.max(
        dominantNonGreen,
        green - Math.round(greenDelta * 0.7),
      );
    }
  }

  return frame;
};

const MarketPlaceCTA = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement) {
      return undefined;
    }

    const drawingContext = canvasElement.getContext("2d", {
      willReadFrequently: true,
    });

    if (!drawingContext) {
      return undefined;
    }

    let animationFrameId = 0;
    let isDisposed = false;
    let hasSignalledFirstFrame = false;

    const syncCanvasSize = () => {
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        return;
      }

      // Optimization: Limit the processing resolution to 480p equivalent
      const scale = Math.min(1, 480 / videoElement.videoHeight);
      const targetWidth = Math.round(videoElement.videoWidth * scale);
      const targetHeight = Math.round(videoElement.videoHeight * scale);

      if (
        canvasElement.width !== targetWidth ||
        canvasElement.height !== targetHeight
      ) {
        canvasElement.width = targetWidth;
        canvasElement.height = targetHeight;
      }
    };

    const renderFrame = () => {
      if (isDisposed) {
        return;
      }

      if (
        videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !videoElement.paused &&
        !videoElement.ended
      ) {
        syncCanvasSize();

        if (canvasElement.width && canvasElement.height) {
          drawingContext.drawImage(
            videoElement,
            0,
            0,
            canvasElement.width,
            canvasElement.height,
          );

          const processedFrame = applyChromaKey(
            drawingContext.getImageData(
              0,
              0,
              canvasElement.width,
              canvasElement.height,
            ),
          );

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

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }

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
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">

        {/* ── Centered headline ── */}
        <h2 className="mb-10 text-center text-[clamp(1.6rem,3.8vw,3rem)] font-medium leading-[1.1] tracking-tight text-foreground sm:mb-12 lg:mb-14 lg:whitespace-nowrap">
          Work Done On Your Terms, Every Single Time
        </h2>

        {/* ── Two-column: mascot LEFT, description + CTA RIGHT — vertically centered ── */}
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">

          {/* Left – mascot */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              {!hasRenderedFrame ? (
                <img
                  src={MascotPoster}
                  alt="Catalance mascot"
                  draggable="false"
                  className={MASCOT_MEDIA_CLASSNAME}
                />
              ) : null}

              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Mascot animation"
                className={`${MASCOT_MEDIA_CLASSNAME} ${
                  hasRenderedFrame ? "opacity-100" : "absolute inset-0 opacity-0"
                }`}
              />

              <video
                ref={videoRef}
                src={MascotCTA}
                poster={MascotPoster}
                aria-hidden="true"
                draggable="false"
                className="pointer-events-none absolute h-px w-px opacity-0"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
              />
            </div>
          </div>

          {/* Right – description + CTA + stats */}
          <div className="flex flex-col">
            <p className="max-w-md text-sm leading-relaxed text-foreground/60 sm:text-base">
              Our platform connects businesses with verified, top-tier
              freelancers. From concept to completion, we help you ship
              faster without compromising quality.
            </p>

            <Button
              asChild
              className="mt-6 w-fit h-11 rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_14px_36px_rgba(var(--brand-rgb),0.22)] hover:bg-primary/90"
            >
              <Link to="/talent">Browse Talent</Link>
            </Button>

            {/* Stats — inside right column */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
              {MARKETPLACE_STATS.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <div className="flex items-baseline gap-0.5 text-[clamp(1.5rem,3.5vw,2.6rem)] font-medium leading-none tracking-tight text-foreground">
                    <NumberTicker value={stat.value} className="text-foreground" />
                    <span>{stat.suffix}</span>
                  </div>
                  <p className="mt-1.5 text-[0.72rem] font-medium leading-tight text-foreground/50 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MarketPlaceCTA;

