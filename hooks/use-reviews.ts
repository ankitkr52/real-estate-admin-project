"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import type { PropertyDetailResponse } from "@/types/property";

export type ReviewUser = { _id: string; name: string; avatar?: string };
export type Review = {
  _id: string;
  rating: number;
  comment: string;
  user: ReviewUser;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
};
export type MyReview = {
  _id: string;
  rating: number;
  comment: string;
} | null;
export type ReviewsResponse = {
  reviews: Review[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  myReview: MyReview;
};
type PropertyDenorm = { averageRating: number; reviewCount: number };
type MutationResponse = { review: Review; property: PropertyDenorm };

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

async function parse<T>(r: Response): Promise<T> {
  const j = (await r.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!r.ok || !j || !j.success) {
    const msg =
      (j && !j.success && j.message) || "Something went wrong.";
    const err = new Error(msg) as Error & { status?: number };
    err.status = r.status;
    throw err;
  }
  return j.data;
}

export function useReviews(propertyId: string, page = 1) {
  const { data: user } = useAuth();
  return useQuery({
    queryKey: ["reviews", propertyId, page],
    queryFn: async () => {
      const r = await fetch(
        `/api/properties/${propertyId}/reviews?page=${page}`,
        { credentials: "include" },
      );
      return parse<ReviewsResponse>(r);
    },
    enabled: !!user && !!propertyId,
    staleTime: 30_000,
  });
}

function patchPropertyCache(
  qc: ReturnType<typeof useQueryClient>,
  propertyId: string,
  denorm: PropertyDenorm,
) {
  qc.setQueryData<PropertyDetailResponse>(["property", propertyId], (prev) =>
    prev
      ? {
          ...prev,
          property: {
            ...prev.property,
            averageRating: denorm.averageRating,
            reviewCount: denorm.reviewCount,
          },
        }
      : prev,
  );
}

export function useCreateReview(propertyId: string) {
  const qc = useQueryClient();
  return useMutation<
    MutationResponse,
    Error & { status?: number },
    { rating: number; comment: string }
  >({
    mutationFn: async (input) => {
      const r = await fetch(`/api/properties/${propertyId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      return parse<MutationResponse>(r);
    },
    onSuccess: (data) => {
      patchPropertyCache(qc, propertyId, data.property);
    },
    onError: (err) => {
      if (err.status !== 409) toast.error(err.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["reviews", propertyId] });
      qc.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useUpdateReview(propertyId: string) {
  const qc = useQueryClient();
  return useMutation<
    MutationResponse,
    Error & { status?: number },
    { reviewId: string; rating?: number; comment?: string }
  >({
    mutationFn: async ({ reviewId, ...body }) => {
      const r = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      return parse<MutationResponse>(r);
    },
    onSuccess: (data) => {
      patchPropertyCache(qc, propertyId, data.property);
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["reviews", propertyId] });
      qc.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}

export function useDeleteReview(propertyId: string) {
  const qc = useQueryClient();
  return useMutation<
    { deleted: true; property: PropertyDenorm },
    Error & { status?: number },
    { reviewId: string }
  >({
    mutationFn: async ({ reviewId }) => {
      const r = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      return parse<{ deleted: true; property: PropertyDenorm }>(r);
    },
    onSuccess: (data) => {
      patchPropertyCache(qc, propertyId, data.property);
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["reviews", propertyId] });
      qc.invalidateQueries({ queryKey: ["property", propertyId] });
    },
  });
}
