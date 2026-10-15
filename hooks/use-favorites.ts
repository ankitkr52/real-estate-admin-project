"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import type { PropertyCardData, PropertyDetailResponse } from "@/types/property";

type FavoritesResponse = { properties: PropertyCardData[] };

async function fetchFavorites(): Promise<PropertyCardData[]> {
  const r = await fetch("/api/user/favorites", { credentials: "include" });
  if (!r.ok) throw new Error("Could not load favorites.");
  const j = (await r.json()) as { success: boolean; data: FavoritesResponse };
  return j.data.properties;
}

export function useFavorites() {
  const { data: user } = useAuth();
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled: !!user,
    staleTime: 60_000,
  });
  const favoriteIds = useMemo(
    () => new Set((query.data ?? []).map((p) => p._id)),
    [query.data],
  );
  return { ...query, favoriteIds };
}

type ToggleVars = { propertyId: string; nextFavorited: boolean; property?: PropertyCardData };

type ToggleContext = {
  prevList?: PropertyCardData[];
  prevDetail?: PropertyDetailResponse;
};

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<void, Error, ToggleVars, ToggleContext>({
    mutationFn: async ({ propertyId, nextFavorited }) => {
      const r = await fetch(`/api/user/favorites/${propertyId}`, {
        method: nextFavorited ? "POST" : "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({ message: "Something went wrong." }))) as {
          message?: string;
        };
        throw new Error(j.message ?? "Something went wrong.");
      }
    },
    onMutate: async ({ propertyId, nextFavorited, property }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["favorites"] }),
        qc.cancelQueries({ queryKey: ["property", propertyId] }),
      ]);
      const prevList = qc.getQueryData<PropertyCardData[]>(["favorites"]);
      const prevDetail = qc.getQueryData<PropertyDetailResponse>(["property", propertyId]);

      if (prevList) {
        qc.setQueryData<PropertyCardData[]>(
          ["favorites"],
          nextFavorited
            ? property && !prevList.some((p) => p._id === propertyId)
              ? [property, ...prevList]
              : prevList
            : prevList.filter((p) => p._id !== propertyId),
        );
      }
      if (prevDetail) {
        qc.setQueryData<PropertyDetailResponse>(["property", propertyId], {
          ...prevDetail,
          isFavorited: nextFavorited,
        });
      }
      return { prevList, prevDetail };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(["favorites"], ctx.prevList);
      if (ctx?.prevDetail) qc.setQueryData(["property", vars.propertyId], ctx.prevDetail);
      toast.error(err.message || "Could not update favorite.");
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["property", vars.propertyId] });
    },
  });
}
