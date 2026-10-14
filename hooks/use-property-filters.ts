"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type FilterKey =
  | "city"
  | "type"
  | "minPrice"
  | "maxPrice"
  | "bhk"
  | "minArea"
  | "maxArea"
  | "furnishing"
  | "sort"
  | "page";

const FILTER_KEYS: readonly FilterKey[] = [
  "city",
  "type",
  "minPrice",
  "maxPrice",
  "bhk",
  "minArea",
  "maxArea",
  "furnishing",
] as const;

const DEBOUNCED_KEYS = new Set<FilterKey>([
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
]);

const DEBOUNCE_MS = 400;

export function usePropertyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on external resets (chip removal, clear all, non-write filter actions)
  // so uncontrolled inputs can be remounted without being wiped mid-typing.
  const [resetSignal, setResetSignal] = useState(0);

  const filters = useMemo(() => {
    const o: Partial<Record<FilterKey, string>> = {};
    for (const k of [...FILTER_KEYS, "sort", "page"] as FilterKey[]) {
      const v = searchParams.get(k);
      if (v) o[k] = v;
    }
    return o;
  }, [searchParams]);

  const activeFilterCount = useMemo(
    () => FILTER_KEYS.reduce((n, k) => (filters[k] ? n + 1 : n), 0),
    [filters],
  );

  const push = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setFilter = useCallback(
    (key: FilterKey, value: string | null) => {
      const base = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") base.delete(key);
      else base.set(key, value);
      if (key !== "page") base.delete("page");

      if (DEBOUNCED_KEYS.has(key)) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => push(base), DEBOUNCE_MS);
      } else {
        if (timer.current) clearTimeout(timer.current);
        push(base);
      }
    },
    [push, searchParams],
  );

  const removeFilter = useCallback(
    (key: FilterKey) => {
      setFilter(key, null);
      setResetSignal((n) => n + 1);
    },
    [setFilter],
  );

  const clearAll = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    router.push(pathname, { scroll: false });
    setResetSignal((n) => n + 1);
  }, [pathname, router]);

  return {
    filters,
    activeFilterCount,
    hasAny: activeFilterCount > 0,
    setFilter,
    removeFilter,
    clearAll,
    resetSignal,
  };
}
