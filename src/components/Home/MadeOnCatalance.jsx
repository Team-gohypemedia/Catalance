import React, { useEffect, useRef } from "react";
import { Marquee } from "@/components/ui/marquee";
import project1 from "@/assets/images/projects/project-1.jpg";
import project2 from "@/assets/images/projects/project-2.jpg";
import project3 from "@/assets/images/projects/project-3.jpg";
import project4 from "@/assets/images/projects/project-4.jpg";
import project5 from "@/assets/images/projects/project-5.jpg";
import project6 from "@/assets/images/projects/project-6.jpg";
import project7 from "@/assets/images/projects/project-7.jpg";
import project8 from "@/assets/images/projects/project-8.jpg";
import project9 from "@/assets/images/projects/project-9.jpg";
import project10 from "@/assets/images/projects/project-10.jpg";
import project11 from "@/assets/images/projects/project-11.jpg";
import project12 from "@/assets/images/projects/project-12.jpg";
import project13 from "@/assets/images/projects/project-13.jpg";
import project14 from "@/assets/images/projects/project-14.jpg";
import video1 from "@/assets/videos/moc/video1.mp4";
import video2 from "@/assets/videos/moc/video2.mp4";
import video3 from "@/assets/videos/moc/video3.mp4";
import video4 from "@/assets/videos/moc/video4.mp4";
import video5 from "@/assets/videos/moc/video5.mp4";
import video6 from "@/assets/videos/moc/video6.mp4";
import video7 from "@/assets/videos/moc/video7.mp4";

const imageCards = [
  {
    type: "image",
    image: project1,
    label: "Catalance project showcase 1",
  },
  {
    type: "image",
    image: project2,
    label: "Catalance project showcase 2",
  },
  {
    type: "image",
    image: project3,
    label: "Catalance project showcase 3",
  },
  {
    type: "image",
    image: project4,
    label: "Catalance project showcase 4",
  },
  {
    type: "image",
    image: project5,
    label: "Catalance project showcase 5",
  },
  {
    type: "image",
    image: project6,
    label: "Catalance project showcase 6",
  },
  {
    type: "image",
    image: project7,
    label: "Catalance project showcase 7",
  },
  {
    type: "image",
    image: project8,
    label: "Catalance project showcase 8",
  },
  {
    type: "image",
    image: project9,
    label: "Catalance project showcase 9",
  },
  {
    type: "image",
    image: project10,
    label: "Catalance project showcase 10",
  },
  {
    type: "image",
    image: project11,
    label: "Catalance project showcase 11",
  },
  {
    type: "image",
    image: project12,
    label: "Catalance project showcase 12",
  },
  {
    type: "image",
    image: project13,
    label: "Catalance project showcase 13",
  },
  {
    type: "image",
    image: project14,
    label: "Catalance project showcase 14",
  },
];

const videoCards = [
  {
    type: "video",
    src: video1,
    label: "Catalance reel 1",
  },
  {
    type: "video",
    src: video2,
    label: "Catalance reel 2",
  },
  {
    type: "video",
    src: video3,
    label: "Catalance reel 3",
  },
  {
    type: "video",
    src: video4,
    label: "Catalance reel 4",
  },
  {
    type: "video",
    src: video5,
    label: "Catalance reel 5",
  },
  {
    type: "video",
    src: video6,
    label: "Catalance reel 6",
  },
  {
    type: "video",
    src: video7,
    label: "Catalance reel 7",
  },
];

const showcaseCards = [...imageCards, ...videoCards];

function ShowcaseVideo({ src, label }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return undefined;

    const ensurePlayback = () => {
      const playPromise = videoElement.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") ensurePlayback();
    };

    ensurePlayback();
    videoElement.addEventListener("loadeddata", ensurePlayback);
    videoElement.addEventListener("canplay", ensurePlayback);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      videoElement.removeEventListener("loadeddata", ensurePlayback);
      videoElement.removeEventListener("canplay", ensurePlayback);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      aria-label={label}
      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onEnded={(event) => {
        event.currentTarget.currentTime = 0;
        const playPromise = event.currentTarget.play();

        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      }}
    />
  );
}

function PlaceCard({ place }) {
  return (
    <article
      className="group relative overflow-hidden rounded-4xl border border-border bg-background"
    >
      <div
        className={`relative overflow-hidden ${
          place.type === "video" ? "aspect-video" : "aspect-4/5"
        }`}
      >
        {place.type === "video" ? (
          <ShowcaseVideo src={place.src} label={place.label} />
        ) : (
          <img
            src={place.image}
            alt={place.label}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </article>
  );
}

const verticalLanes = Array.from({ length: 4 }, (_, laneIndex) => {
  const items = showcaseCards.filter((_, itemIndex) => itemIndex % 4 === laneIndex);

  return {
    key: `lane-${laneIndex}`,
    items,
    reverse: laneIndex % 2 === 1,
  };
});

const laneFadeMaskClassName =
  "[mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] [mask-size:100%_100%] [-webkit-mask-size:100%_100%]";

const MadeOnCatalance = () => {
  return (
    <section className="relative h-screen overflow-hidden bg-background text-foreground">

      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Made on <span className="text-primary">CATALANCE</span>
          </h2>
        </header>

        <div className="relative grid min-h-0 flex-1 grid-cols-2 gap-4 py-6 lg:grid-cols-4 lg:gap-6">
          {verticalLanes.map((lane) => (
            <Marquee
              key={lane.key}
              vertical
              className={`h-full min-h-0 flex-1 p-0 [--gap:1.25rem] ${laneFadeMaskClassName}`}
              pauseOnHover={false}
              repeat={1}
              reverse={lane.reverse}
            >
              {lane.items.map((place, placeIndex) => (
                <PlaceCard key={`${lane.key}-${placeIndex}`} place={place} />
              ))}
            </Marquee>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MadeOnCatalance;
