"use client";

import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { CityBento } from "@/components/home/city-bento";
import { CtaBanner } from "@/components/home/cta-banner";
import { Footer } from "@/components/layout/footer";
import { PropertyGrid } from "@/components/property/property-grid";
import { useProperties } from "@/hooks/use-properties";
import { useFavorites } from "@/hooks/use-favorites";

export default function HomePage() {
  const newest = useProperties({ limit: 6, sort: "newest" });
  const { favoriteIds } = useFavorites();

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 md:py-24">
        <div className="mb-10 max-w-[48ch]">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            By city
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
            Browse where you&rsquo;d want to live.
          </h2>
        </div>
        <CityBento />
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-[1280px] px-4 py-20 md:px-8 md:py-24">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div className="max-w-[48ch]">
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Newest
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
                Fresh on the portal.
              </h2>
            </div>
            <Link
              href="/properties"
              className="hidden text-sm font-medium underline-offset-4 hover:underline md:inline"
            >
              View all →
            </Link>
          </div>

          <PropertyGrid
            properties={newest.data?.properties}
            isLoading={newest.isLoading}
            isError={newest.isError}
            favoriteIds={favoriteIds}
            skeletonCount={6}
            onRetry={() => newest.refetch()}
            emptyTitle="New listings coming soon"
            emptyDescription="Check back shortly."
          />

          <div className="mt-8 md:hidden">
            <Link
              href="/properties"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>
      </section>

      <CtaBanner />
      <Footer />
    </>
  );
}
