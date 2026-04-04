import React from "react";
import { Marquee } from "@/components/ui/marquee";

const placeCards = [
  {
    name: "Santorini",
    region: "Greece",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kyoto",
    region: "Japan",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Marrakech",
    region: "Morocco",
    image:
      "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Bali",
    region: "Indonesia",
    image:
      "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Reykjavik",
    region: "Iceland",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "New York",
    region: "USA",
    image:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Lisbon",
    region: "Portugal",
    image:
      "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Banff",
    region: "Canada",
    image:
      "https://images.unsplash.com/photo-1500043357865-c6b8827edf7a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Dubai",
    region: "UAE",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Cappadocia",
    region: "Turkey",
    image:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Maui",
    region: "Hawaii",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Seoul",
    region: "South Korea",
    image:
      "https://images.unsplash.com/photo-1538485399081-0a8b7fd7f0c2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Oslo",
    region: "Norway",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
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