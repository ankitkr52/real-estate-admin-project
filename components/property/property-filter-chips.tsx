"use client";

import { X } from "lucide-react";
import { usePropertyFilters, type FilterKey } from "@/hooks/use-property-filters";
import { formatPriceINRShort } from "@/lib/format";

const LABELS: Record<FilterKey, string> = {
  city: "City",
  type: "Type",
  minPrice: "Min price",
  maxPrice: "Max price",
  bhk: "BHK",
  minArea: "Min area",
  maxArea: "Max area",
  furnishing: "Furnishing",
  sort: "Sort",
  page: "Page",
};

const CHIP_KEYS: FilterKey[] = [
  "city",
  "type",
  "minPrice",
  "maxPrice",
  "bhk",
  "minArea",
  "maxArea",
  "furnishing",
];

function formatValue(key: FilterKey, value: string) {
  if (key === "minPrice" || key === "maxPrice") {
    const n = Number(value);
    return Number.isFinite(n) ? formatPriceINRShort(n) : value;
  }
  if (key === "minArea" || key === "maxArea") return `${value} sq ft`;
  if (key === "bhk") return `${value} BHK`;
  return value;
}

export function PropertyFilterChips() {
  const { filters, removeFilter, clearAll, hasAny } = usePropertyFilters();
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHIP_KEYS.filter((k) => filters[k]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => removeFilter(k)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pr-2 pl-3 text-xs font-medium transition-colors hover:bg-muted"
          aria-label={`Remove ${LABELS[k]} filter`}
        >
          <span className="text-muted-foreground">{LABELS[k]}:</span>
          <span>{formatValue(k, filters[k]!)}</span>
          <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
