"use client";

import { useEffect, useRef, useState } from "react";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useFavorites } from "@/hooks/use-favorites";
import type { PropertyCardData } from "@/types/property";

const SLIDE_MS = 220;

export default function FavoritesPage() {
  const { data, isLoading, isError, refetch } = useFavorites();
  const [rendered, setRendered] = useState<PropertyCardData[]>([]);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;
    const nextIds = new Set(data.map((p) => p._id));
    const prevIds = prevIdsRef.current;
    const removed = [...prevIds].filter((id) => !nextIds.has(id));

    if (removed.length === 0) {
      setRendered(data);
      prevIdsRef.current = nextIds;
      return;
    }

    setLeaving((s) => {
      const next = new Set(s);
      removed.forEach((id) => next.add(id));
      return next;
    });

    const timer = window.setTimeout(() => {
      setRendered(data);
      setLeaving((s) => {
        const next = new Set(s);
        removed.forEach((id) => next.delete(id));
        return next;
      });
      prevIdsRef.current = nextIds;
    }, SLIDE_MS);

    return () => window.clearTimeout(timer);
  }, [data]);

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10">
        <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Saved
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
          Your favorites
          {data ? (
            <span className="ml-3 align-middle text-base font-medium text-muted-foreground tabular-nums">
              {data.length}
            </span>
          ) : null}
        </h1>
      </header>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading && !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : rendered.length === 0 ? (
        <EmptyState
          title="You have not saved any properties yet"
          description="Tap the heart on any listing to save it here."
          action={{
            label: "Browse properties",
            href: "/properties",
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {rendered.map((p) => {
            const isLeaving = leaving.has(p._id);
            return (
              <div
                key={p._id}
                className="transition-all duration-200 ease-out motion-reduce:transition-none"
                style={
                  isLeaving
                    ? { opacity: 0, transform: "translateX(24px)", pointerEvents: "none" }
                    : undefined
                }
                aria-hidden={isLeaving || undefined}
              >
                <PropertyCard property={p} isFavorited={!isLeaving} />
              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
