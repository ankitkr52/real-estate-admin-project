"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type {
  PropertyListResponse,
  PropertyDetailResponse,
} from "@/types/property";

export type PropertyQueryParams = Record<string, string | number | undefined>;

async function fetchProperties(
  params: PropertyQueryParams,
): Promise<PropertyListResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const r = await fetch(`/api/properties?${qs.toString()}`);
  if (!r.ok) throw new Error("Failed to load properties");
  const j = (await r.json()) as { success: boolean; data: PropertyListResponse };
  return j.data;
}

async function fetchProperty(id: string): Promise<PropertyDetailResponse> {
  const r = await fetch(`/api/properties/${id}`);
  if (r.status === 404) {
    const err = new Error("Property not found");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }
  if (!r.ok) throw new Error("Failed to load property");
  const j = (await r.json()) as {
    success: boolean;
    data: PropertyDetailResponse;
  };
  return j.data;
}

export function useProperties(params: PropertyQueryParams) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: () => fetchProperties(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}
