"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITIES, PROPERTY_TYPES, FURNISHING } from "@/lib/constants";
import { usePropertyFilters } from "@/hooks/use-property-filters";

const BHK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

function FilterGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <FilterGroup>
      <Label className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </FilterGroup>
  );
}

function FilterControls({ compact }: { compact: boolean }) {
  const { filters, setFilter, resetSignal } = usePropertyFilters();

  // Range inputs are uncontrolled with `defaultValue`; the hook debounces writes.
  // `key` includes resetSignal so chip removal / Clear all remounts the input,
  // but typing never remounts mid-stroke.
  return (
    <div
      className={cn(
        "grid gap-4",
        compact
          ? "grid-cols-1"
          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:items-end",
      )}
    >
      <Field label="City">
        <Select
          value={filters.city ?? null}
          onValueChange={(v) => setFilter("city", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any city" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Type">
        <Select
          value={filters.type ?? null}
          onValueChange={(v) => setFilter("type", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Price (INR)">
        <div className="flex items-center gap-2">
          <Input
            key={`min-price-${resetSignal}`}
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={filters.minPrice ?? ""}
            placeholder="Min"
            onChange={(e) => setFilter("minPrice", e.target.value)}
            aria-label="Minimum price"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            –
          </span>
          <Input
            key={`max-price-${resetSignal}`}
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={filters.maxPrice ?? ""}
            placeholder="Max"
            onChange={(e) => setFilter("maxPrice", e.target.value)}
            aria-label="Maximum price"
          />
        </div>
      </Field>

      <Field label="BHK">
        <div
          role="radiogroup"
          aria-label="BHK"
          className="inline-flex w-fit items-center gap-1 rounded-[var(--radius-md)] border border-border bg-background p-1"
        >
          {BHK_OPTIONS.map((n) => {
            const active = filters.bhk === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFilter("bhk", active ? null : n)}
                className={cn(
                  "min-w-10 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {n === "5" ? "5+" : n}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Area (sq ft)">
        <div className="flex items-center gap-2">
          <Input
            key={`min-area-${resetSignal}`}
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={filters.minArea ?? ""}
            placeholder="Min"
            onChange={(e) => setFilter("minArea", e.target.value)}
            aria-label="Minimum area"
          />
          <span aria-hidden="true" className="text-muted-foreground">
            –
          </span>
          <Input
            key={`max-area-${resetSignal}`}
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={filters.maxArea ?? ""}
            placeholder="Max"
            onChange={(e) => setFilter("maxArea", e.target.value)}
            aria-label="Maximum area"
          />
        </div>
      </Field>

      <Field label="Furnishing">
        <Select
          value={filters.furnishing ?? null}
          onValueChange={(v) => setFilter("furnishing", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            {FURNISHING.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

export function PropertyFiltersBar() {
  const { activeFilterCount, clearAll } = usePropertyFilters();

  return (
    <>
      <div className="hidden md:block rounded-[var(--radius-lg)] border border-border bg-background p-5">
        <FilterControls compact={false} />
      </div>

      <div className="md:hidden">
        <Sheet>
          <div className="flex items-center justify-between">
            <SheetTrigger
              render={
                <Button variant="outline" size="lg" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              }
            />
            {activeFilterCount > 0 ? (
              <Button variant="ghost" size="lg" onClick={clearAll}>
                Clear
              </Button>
            ) : null}
          </div>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <FilterControls compact={true} />
            </div>
            <SheetFooter className="flex-row gap-2">
              <SheetClose
                render={
                  <Button variant="outline" className="flex-1">
                    Done
                  </Button>
                }
              />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
