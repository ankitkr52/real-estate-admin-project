"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/shared/image-upload";
import { useAuth } from "@/hooks/use-auth";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/user";
import type { AuthUser } from "@/types/auth";

export default function ProfilePage() {
  const { data: user, isLoading } = useAuth();

  return (
    <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <header className="mb-8">
        <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Account
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
          Profile
        </h1>
      </header>

      {isLoading || !user ? <ProfileSkeleton /> : <ProfileForm user={user} />}
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6">
      <Skeleton className="h-28 w-28 rounded-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function ProfileForm({ user }: { user: AuthUser }) {
  const qc = useQueryClient();
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { name: user.name, phone: user.phone },
  });

  const mutation = useMutation({
    mutationFn: async (payload: ProfileUpdateInput) => {
      const r = await fetch("/api/user/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await r.json()) as
        | { success: true; data: { user: AuthUser } }
        | { success: false; message: string; errors?: Record<string, string[]> };
      if (!r.ok || !j.success) {
        throw new Error(j.success ? "Save failed." : j.message);
      }
      return j.data.user;
    },
    onSuccess: (nextUser) => {
      qc.setQueryData(["auth", "me"], nextUser);
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message || "Could not save."),
  });

  function onAvatarChange(url: string) {
    setAvatar(url);
    mutation.mutate({ avatar: url });
  }

  function onSubmit(values: ProfileUpdateInput) {
    const payload: ProfileUpdateInput = {};
    if (values.name && values.name !== user.name) payload.name = values.name;
    if (values.phone && values.phone !== user.phone) payload.phone = values.phone;
    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to save.");
      return;
    }
    mutation.mutate(payload);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col items-center md:items-start">
        <ImageUpload
          value={avatar}
          onChange={onAvatarChange}
          folder="realestate/avatars"
          circle
          label="Change photo"
          alt={user.name}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" inputMode="numeric" autoComplete="tel" {...form.register("phone")} />
        {form.formState.errors.phone ? (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <div className="flex items-center gap-2">
          <Input id="email" value={user.email} readOnly disabled className="flex-1" />
          <span
            className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-secondary/15 px-2 py-1 text-xs font-medium text-secondary-foreground"
            title="Verified email cannot be changed"
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Verified
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>

      <Button type="submit" size="lg" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
