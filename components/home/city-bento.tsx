"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { cn } from "cn";
import type { PropertyListResponse } from "@/types/property";

const CITY_IMAGES: Record<string, string> = {
  Mumbai:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976514/realestate/seed/apartment-mumbai-bandra.jpg",
  Bengaluru:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976535/realestate/seed/apartment-bengaluru-indiranagar.jpg",
  Delhi:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976627/realestate/seed/commercial-delhi-nehru.jpg",
  Pune:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976558/realestate/seed/house-pune-baner.jpg",
  Hyderabad:
    "https://res.cloudinary.com/dubscrn25/image/upload/v1791976581/realestate/seed/villa-hyderabad-jubilee.jpg",
};

const BENTO_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad"] as const;

async function fetchCityCount(city: string): Promise<number> {
  const r = await fetch(`/api/properties?city=${encodeURIComponent(city)}&limit=1`);
  if (!r.ok) throw new Error("count unavailable");
  const j = (await r.json()) as { success: boolean; data: PropertyListResponse };
  return j.data.pagination.total;
}

export function CityBento() {
  const counts = useQueries({
    queries: BENTO_CITIES.map((city) => ({
      queryKey: ["city-count", city],
      queryFn: () => fetchCityCount(city),
      staleTime: 5 * 60_000,
    })),
  });

  const countFor = (city: string) => {
    const idx = BENTO_CITIES.indexOf(city as (typeof BENTO_CITIES)[number]);
    const q = counts[idx];
    if (!q || q.isLoading || q.isError || q.data === undefined) return null;
    return q.data;
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-6 lg:grid-rows-2 lg:gap-5">
      <Tile city="Mumbai" count={countFor("Mumbai")} className="lg:col-span-3 lg:row-span-2 aspect-[4/3] md:col-span-2 lg:aspect-auto" />
      <Tile city="Delhi" count={countFor("Delhi")} className="aspect-[4/3] lg:col-span-2 lg:aspect-auto" />
      <Tile city="Bengaluru" count={countFor("Bengaluru")} className="aspect-[4/3] lg:col-span-1 lg:aspect-auto" />
      <Tile city="Pune" count={countFor("Pune")} className="aspect-[4/3] lg:col-span-2 lg:aspect-auto" />
      <Tile city="Hyderabad" count={countFor("Hyderabad")} className="aspect-[4/3] lg:col-span-1 lg:aspect-auto" />
    </div>
  );
}

function Tile({
  city,
  count,
  className,
}: {
  city: string;
  count: number | null;
  className?: string;
}) {
  const label =
    count === null
      ? "—"
      : count === 1
        ? "1 property"
        : `${count.toLocaleString("en-IN")} properties`;

  return (
    <Link
      href={`/properties?city=${encodeURIComponent(city)}`}
      className={cn(
        "group relative block overflow-hidden rounded-[var(--radius-xl)] bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 lg:min-h-56",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CITY_IMAGES[city] ?? ""}
        alt={`Properties in ${city}`}
        className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-primary-foreground">
        <p className="font-display text-2xl font-semibold tracking-[-0.01em]">
          {city}
        </p>
        <p className="mt-1 text-sm text-primary-foreground/80">{label}</p>
      </div>
    </Link>
  );
}
