import React from "react";

import { Marquee } from "@/components/ui/marquee";

const MADE_ON_CATALANCE_ASSET_BASE_URL =
  "https://assets.catalance.in/home/made-on-catalance";

const madeOnCatalanceImageUrl = (fileName) =>
  `${MADE_ON_CATALANCE_ASSET_BASE_URL}/images/${fileName}`;

const madeOnCatalanceVideoUrl = (fileName) =>
  `${MADE_ON_CATALANCE_ASSET_BASE_URL}/videos/${fileName}`;

const imageSources = [
  { src: madeOnCatalanceImageUrl("project-1.jpg"), width: 1200, height: 1200 },
  { src: madeOnCatalanceImageUrl("project-2.jpg"), width: 1200, height: 900 },
  { src: madeOnCatalanceImageUrl("project-3.jpg"), width: 960, height: 720 },
  { src: madeOnCatalanceImageUrl("project-4.jpg"), width: 1200, height: 900 },
  { src: madeOnCatalanceImageUrl("project-5.jpg"), width: 1200, height: 1200 },
  { src: madeOnCatalanceImageUrl("project-6.jpg"), width: 1200, height: 1200 },
  { src: madeOnCatalanceImageUrl("project-7.jpg"), width: 1000, height: 1911 },
  { src: madeOnCatalanceImageUrl("project-8.jpg"), width: 1000, height: 1379 },
  { src: madeOnCatalanceImageUrl("project-9.jpg"), width: 1000, height: 1164 },
  { src: madeOnCatalanceImageUrl("project-10.jpg"), width: 1200, height: 900 },
  { src: madeOnCatalanceImageUrl("project-11.jpg"), width: 1200, height: 1200 },
  { src: madeOnCatalanceImageUrl("project-12.jpg"), width: 1200, height: 1200 },
  { src: madeOnCatalanceImageUrl("project-13.jpg"), width: 960, height: 960 },
  { src: madeOnCatalanceImageUrl("project-14.jpg"), width: 960, height: 960 },
];

const videoSources = [
  {
    src: madeOnCatalanceVideoUrl("video1.mp4"),
    poster: imageSources[1].src,
    width: 1920,
    height: 1080,
  },
  {
    src: madeOnCatalanceVideoUrl("video2.mp4"),
    poster: imageSources[3].src,
    width: 1920,
    height: 1080,
  },
  {
    src: madeOnCatalanceVideoUrl("video3.mp4"),
    poster: imageSources[5].src,
    width: 1920,
    height: 1080,
  },
  {
    src: madeOnCatalanceVideoUrl("video4.mp4"),
    poster: imageSources[7].src,
    width: 1920,
    height: 1080,
  },
  {
    src: madeOnCatalanceVideoUrl("video5.mp4"),
    poster: imageSources[9].src,
    width: 1920,
    height: 1080,
  },
  {
    src: madeOnCatalanceVideoUrl("video6.mp4"),
    poster: imageSources[11].src,
    width: 1920,
    height: 1080,
  },
  {
    src: madeOnCatalanceVideoUrl("video7.mp4"),
    poster: imageSources[13].src,
    width: 1920,
    height: 1080,
  },
];

const placeCards = imageSources.flatMap((image, index) => {
  const cards = [
    {
      type: "image",
      src: image.src,
      width: image.width,
      height: image.height,
      alt: `Catalance project showcase ${index + 1}`,
    },
  ];

  // Optimization: Reduce video frequency from every 2nd to every 5th item
  if (index % 5 === 1) {
    const videoIndex = Math.floor(index / 5) % videoSources.length;
    const video = videoSources[videoIndex];

    cards.push({
      type: "video",
      src: video.src,
      poster: video.poster,
      width: video.width,
      height: video.height,
      alt: `Catalance project video showcase ${videoIndex + 1}`,
    });
  }

  return cards;
});

const DESKTOP_LANE_BREAKPOINT = 1024;
const galleryTopFadeStyle = {
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
  maskImage: "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};
const galleryBottomFadeStyle = {
  WebkitMaskImage: "linear-gradient(to top, black 0%, black 85%, transparent 100%)",
  maskImage: "linear-gradient(to top, black 0%, black 85%, transparent 100%)",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

function useLaneCount() {
  const [laneCount, setLaneCount] = React.useState(() =>
    typeof window !== "undefined" && window.innerWidth >= DESKTOP_LANE_BREAKPOINT ? 4 : 2
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_LANE_BREAKPOINT}px)`);

    const updateLaneCount = () => {
      setLaneCount(mediaQuery.matches ? 4 : 2);
    };

    updateLaneCount();
    mediaQuery.addEventListener("change", updateLaneCount);

    return () => mediaQuery.removeEventListener("change", updateLaneCount);
  }, []);

  return laneCount;
}

function createVerticalLanes(laneCount) {
  return Array.from({ length: laneCount }, (_, laneIndex) => ({
    key: `lane-${laneCount}-${laneIndex}`,
    items: placeCards.filter((_, itemIndex) => itemIndex % laneCount === laneIndex),
    reverse: laneIndex % 2 === 1,
  }));
}

function PlaceCard({ place }) {
  return (
    <article
      className="group relative overflow-hidden rounded-[20px] border border-border bg-background"
      style={{ aspectRatio: `${place.width} / ${place.height}` }}
    >
      <div className="relative h-full w-full overflow-hidden bg-muted">
        {place.type === "video" ? (
          <video
            src={place.src}
            poster={place.poster}
            aria-label={place.alt}
            className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            onEnded={(event) => {
              event.currentTarget.currentTime = 0;
              const playPromise = event.currentTarget.play();

              if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
              }
            }}
          />
        ) : (
          <img
            src={place.src}
            alt={place.alt}
            className="block h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </article>
  );
}

const MadeOnCatalance = () => {
  const laneCount = useLaneCount();
  const verticalLanes = createVerticalLanes(laneCount);
  const galleryGridClassName =
    laneCount === 4
      ? "relative grid min-h-0 flex-1 grid-cols-4 gap-6 overflow-hidden py-6"
      : "relative grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-hidden py-6";

  return (
    <section className="relative w-full overflow-hidden bg-background pt-4 pb-10 sm:pt-6 sm:pb-16">

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h2 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Made on <span className="text-primary italic font-medium">CATALANCE</span>
          </h2>
        </header>

        <div className="relative mt-16 h-[600px] sm:h-[800px]">
          <div className={galleryGridClassName + " h-full"}>
          {verticalLanes.map((lane) => (
            <Marquee
              key={lane.key}
              vertical
              className="h-full min-h-0 flex-1 p-0 [--gap:1.25rem]"
              pauseOnHover={false}
              repeat={2}
              reverse={lane.reverse}
            >
              {lane.items.map((place, placeIndex) => (
                <PlaceCard key={`${lane.key}-${placeIndex}`} place={place} />
              ))}
            </Marquee>
          ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-linear-to-b from-background via-background/80 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-linear-to-t from-background via-background/80 to-transparent"
          />
        </div>
      </div>
    </section>
  );
};

export default MadeOnCatalance;
