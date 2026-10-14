"use client";

import { Suspense } from "react";
import { PropertyFiltersBar } from "@/components/property/property-filters";
import { PropertyFilterChips } from "@/components/property/property-filter-chips";
import { PropertySort } from "@/components/property/property-sort";
import { PropertyGrid } from "@/components/property/property-grid";
import { Pagination } from "@/components/property/pagination";
import { useProperties } from "@/hooks/use-properties";
import { usePropertyFilters } from "@/hooks/use-property-filters";
import { useAuth } from "@/hooks/use-auth";

function PropertiesListing() {
  const { filters, clearAll } = usePropertyFilters();
  const { data: me } = useAuth();
  const isLoggedIn = Boolean(me);

  const query = useProperties(filters);
  const page = Number(filters.page ?? 1);
  const total = query.data?.pagination.total ?? 0;
  const totalPages = query.data?.pagination.totalPages ?? 1;
  const resultLabel = query.data
    ? total === 1
      ? "1 property"
      : `${total.toLocaleString("en-IN")} properties`
    : "";

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Browse
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
            Properties{filters.city ? ` in ${filters.city}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{resultLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <PropertySort />
        </div>
      </header>

      <div className="mb-6">
        <PropertyFiltersBar />
      </div>

      <div className="mb-6">
        <PropertyFilterChips />
      </div>

      <PropertyGrid
        properties={query.data?.properties}
        isLoading={query.isLoading}
        isError={query.isError}
        isPreviousData={query.isPlaceholderData}
        isLoggedIn={isLoggedIn}
        onRetry={() => query.refetch()}
        onClearFilters={clearAll}
      />

      <div className="mt-10">
        <Pagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  // useSearchParams requires a Suspense boundary under Next 16 cacheComponents.
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <PropertiesListing />
    </Suspense>
  );
}
