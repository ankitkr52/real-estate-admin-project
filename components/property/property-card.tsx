"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, Heart, Star } from "lucide-react";
import { cn } from "cn";
import { formatPriceINRShort } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { PropertyCardData } from "@/types/property";

type Props = {
  property: PropertyCardData;
  isLoggedIn: boolean;
  isFavorited?: boolean;
};

const BHK_HIDDEN = new Set(["Plot", "Commercial"]);

export function PropertyCard({ property, isLoggedIn, isFavorited = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showRating = property.reviewCount > 0;
  const showBhk = property.bhk !== undefined && !BHK_HIDDEN.has(property.type);
  const alt = `${property.title} in ${property.city}`;

  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(current)}`);
      return;
    }
    // Phase 4 wires the favorite mutation here.
  }

  return (
    <Link
      href={`/properties/${property._id}`}
      className="group block rounded-[var(--radius-lg)] border border-border bg-background transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.coverImage}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading="lazy"
        />
        <button
          type="button"
          aria-label={isFavorited ? `Remove ${property.title} from favorites` : `Save ${property.title}`}
          aria-pressed={isFavorited}
          onClick={handleHeartClick}
          className="absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          <Heart
            className={cn(
              "h-5 w-5",
              isFavorited ? "fill-destructive stroke-destructive" : "stroke-foreground",
            )}
          />
        </button>
        {showRating ? (
          <div
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur-sm"
            aria-label={`Rated ${property.averageRating.toFixed(1)} out of 5 from ${property.reviewCount} ${property.reviewCount === 1 ? "review" : "reviews"}`}
          >
            <Star className="h-3 w-3 fill-accent stroke-accent" />
            <span className="tabular-nums">{property.averageRating.toFixed(1)}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-5">
        <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {property.city}
        </p>
        <h3 className="font-display text-xl font-semibold leading-tight tracking-[-0.01em] line-clamp-2">
          {property.title}
        </h3>
        <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
          {showBhk ? (
            <>
              <span>{property.bhk} BHK</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span className="tabular-nums">{property.area.toLocaleString("en-IN")} sq ft</span>
          {property.furnishing ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{property.furnishing}</span>
            </>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-2xl font-semibold tracking-[-0.01em] tabular-nums">
            {formatPriceINRShort(property.price)}
          </span>
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background">
      <Skeleton className="aspect-[4/3] w-full rounded-t-[var(--radius-lg)] rounded-b-none" />
      <div className="flex flex-col gap-2 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
