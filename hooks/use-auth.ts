"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/types/auth";

async function fetchMe(): Promise<AuthUser | null> {
  const r = await fetch("/api/auth/me", { credentials: "include" });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error("auth lookup failed");
  const j = (await r.json()) as { success: boolean; data: { user: AuthUser } };
  return j.data.user;
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 60_000,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error("logout failed");
    },
    onSuccess: () => {
      qc.setQueryData(["auth", "me"], null);
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
