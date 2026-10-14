"use client";

import { useState } from "react";
import { cn } from "cn";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

type Props = {
  images: string[];
  title: string;
  city: string;
};

export function PropertyGallery({ images, title, city }: Props) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [index, setIndex] = useState(0);

  const safeImages = images.length > 0 ? images.slice(0, 5) : [];
  const alt = `${title} in ${city}`;

  function goTo(i: number) {
    setIndex(i);
    api?.scrollTo(i);
  }

  if (safeImages.length === 0) {
    return (
      <div className="aspect-[16/10] w-full rounded-[var(--radius-lg)] bg-muted" />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Carousel
        setApi={(a) => {
          setApi(a);
          a?.on("select", () => setIndex(a.selectedScrollSnap()));
        }}
        className="relative"
      >
        <CarouselContent>
          {safeImages.map((src, i) => (
            <CarouselItem key={src}>
              <div className="aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${alt} — image ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {safeImages.length > 1 ? (
          <>
            <CarouselPrevious className="left-3" />
            <CarouselNext className="right-3" />
          </>
        ) : null}
      </Carousel>

      {safeImages.length > 1 ? (
        <>
          <div
            className="hidden gap-2 md:flex"
            role="tablist"
            aria-label="Property images"
          >
            {safeImages.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`View image ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-16 w-24 overflow-hidden rounded-[var(--radius-sm)] border transition-colors",
                  i === index ? "border-primary" : "border-border",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          <div
            className="flex items-center justify-center gap-1.5 md:hidden"
            aria-hidden="true"
          >
            {safeImages.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
