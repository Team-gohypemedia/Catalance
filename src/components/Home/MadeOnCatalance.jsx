import React from "react";
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

const imageSources = [
  project1,
  project2,
  project3,
  project4,
  project5,
  project6,
  project7,
  project8,
  project9,
  project10,
  project11,
  project12,
  project13,
  project14,
];

const videoSources = [video1, video2, video3, video4, video5, video6, video7];

const placeCards = imageSources.flatMap((src, index) => {
  const cards = [
    {
      type: "image",
      src,
      alt: `Catalance project showcase ${index + 1}`,
    },
  ];

  if (index % 2 === 1) {
    const videoIndex = Math.floor(index / 2);
    cards.push({
      type: "video",
      src: videoSources[videoIndex],
      alt: `Catalance project video showcase ${videoIndex + 1}`,
    });
  }

  return cards;
});

function PlaceCard({ place }) {
  return (
    <article className="group relative overflow-hidden rounded-4xl border border-border bg-background">
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {place.type === "video" ? (
          <video
            src={place.src}
            aria-label={place.alt}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </article>
  );
}

const verticalLanes = Array.from({ length: 4 }, (_, laneIndex) => ({
  key: `lane-${laneIndex}`,
  items: placeCards.filter((_, itemIndex) => itemIndex % 4 === laneIndex),
  reverse: laneIndex % 2 === 1,
}));

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
              repeat={2}
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
