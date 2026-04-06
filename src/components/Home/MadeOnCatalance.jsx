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

const placeCards = [
  {
    image: project1,
  },
  {
    image: project2,
  },
  {
    image: project3,
  },
  {
    image: project4,
  },
  {
    image: project5,
  },
  {
    image: project6,
  },
  {
    image: project7,
  },
  {
    image: project8,
  },
  {
    image: project9,
  },
  {
    image: project10,
  },
  {
    image: project11,
  },
  {
    image: project12,
  },
  {
    image: project13,
  },
  {
    image: project14,
  },
];

function PlaceCard({ place }) {
  return (
    <article
      className="group relative overflow-hidden rounded-4xl border border-border bg-background"
    >
      <div className="relative aspect-4/5 overflow-hidden">
        <img
          src={place.image}
          alt={`${place.name}, ${place.region}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>
    </article>
  );
}

const verticalLanes = Array.from({ length: 4 }, (_, laneIndex) => ({
  key: `lane-${laneIndex}`,
  items: placeCards.slice(laneIndex * 3, laneIndex * 3 + 3),
  reverse: laneIndex % 2 === 1,
}));

const MadeOnCatalance = () => {
  return (
    <section className="relative h-screen overflow-hidden bg-background text-foreground">

      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Made on <span className="text-primary">CATALANCE</span>
          </h2>
          <p className="mt-4 max-w-5xl text-sm leading-6 text-muted-foreground sm:text-base">
            A full-screen vertical marquee of place imagery, built to move continuously without text inside the cards.
          </p>
        </header>

        <div className="relative grid flex-1 min-h-0 grid-cols-2 gap-4 py-6 lg:grid-cols-4 lg:gap-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-linear-to-b from-background via-background/90 to-transparent sm:h-28" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-linear-to-t from-background via-background/90 to-transparent sm:h-28" />

          {verticalLanes.map((lane) => (
            <Marquee
              key={lane.key}
              vertical
              className="h-full min-h-0 flex-1 p-0 [--gap:1.25rem]"
              pauseOnHover={false}
              repeat={5}
              reverse={lane.reverse}
            >
              {lane.items.map((place) => (
                <PlaceCard key={place.name} place={place} />
              ))}
            </Marquee>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MadeOnCatalance;