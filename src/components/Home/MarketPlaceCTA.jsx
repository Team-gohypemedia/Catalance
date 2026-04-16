import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import MascotCTA from "@/assets/videos/mascot-cta.mp4";
import MascotPoster from "@/assets/mascot.png";

const MARKETPLACE_STATS = [
  {
    label: "Brands Onboarded",
    value: "20k+",
  },
  {
    label: "Successful Projects",
    value: "1000+",
  },
  {
    label: "Freelancers Enrolled",
    value: "10+",
  },
];

const MASCOT_MEDIA_CLASSNAME =
  "block h-auto max-h-[16rem] w-full max-w-[16rem] select-none object-contain sm:max-h-[22rem] sm:max-w-[22rem] lg:max-h-[28rem] lg:max-w-[28rem]";

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

      if (
        canvasElement.width !== videoElement.videoWidth ||
        canvasElement.height !== videoElement.videoHeight
      ) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
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
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[1fr_auto] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="flex items-center">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                {!hasRenderedFrame ? (
                  <img
                    src={MascotPoster}
                    alt=""
                    aria-hidden="true"
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

            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <h2 className="whitespace-nowrap text-[clamp(1.5rem,5vw,4rem)] font-medium leading-[0.98] tracking-tight text-white">
                Work Done On Your Terms
              </h2>

              <p className="mt-1 sm:mt-3 max-w-xl text-pretty text-[0.98rem] leading-relaxed text-white/78 sm:text-lg lg:max-w-2xl">
                No delays, no excuses, just great work.
              </p>

              <Button
                asChild
                className="mt-8 h-12 rounded-md bg-[#ffcc00] px-6 text-sm font-semibold text-black hover:bg-[#ffcc00]/90 sm:h-12 sm:px-7 sm:text-base"
              >
                <Link to="/talent">Browse Talent</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-10 border-t border-white/10 pt-10 text-center md:grid-cols-3 md:gap-8 lg:pt-12">
          {MARKETPLACE_STATS.map((stat) => (
            <div key={stat.label} className="mx-auto max-w-xs">
              <p className="text-sm font-medium text-white/88 sm:text-base">
                {stat.label}
              </p>
              <p className="mt-4 text-[2.6rem] font-medium leading-none tracking-tight text-white sm:text-[3.4rem]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketPlaceCTA;
