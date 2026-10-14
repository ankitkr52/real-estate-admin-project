"use client";

import { PropertyCard, PropertyCardSkeleton } from "./property-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import type { PropertyCardData } from "@/types/property";

type Props = {
  properties?: PropertyCardData[];
  isLoading: boolean;
  isError: boolean;
  isLoggedIn: boolean;
  isPreviousData?: boolean;
  skeletonCount?: number;
  onRetry?: () => void;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function PropertyGrid({
  properties,
  isLoading,
  isError,
  isLoggedIn,
  isPreviousData,
  skeletonCount = 12,
  onRetry,
  onClearFilters,
  emptyTitle = "No properties match these filters",
  emptyDescription = "Try removing a filter or two to see more results.",
}: Props) {
  if (isError) {
    return <ErrorState onRetry={onRetry ?? (() => {})} />;
  }

  if (isLoading && !properties) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={onClearFilters ? { label: "Clear all filters", onClick: onClearFilters } : undefined}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${isPreviousData ? "opacity-60 transition-opacity" : ""}`}
    >
      {properties.map((p) => (
        <PropertyCard key={p._id} property={p} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}
