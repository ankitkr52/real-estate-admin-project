"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarInput } from "@/components/review/star-input";
import {
  reviewCreateSchema,
  type ReviewCreateInput,
} from "@/lib/validations/review";
import {
  useCreateReview,
  useUpdateReview,
} from "@/hooks/use-reviews";
import { toast } from "sonner";

type Props = {
  propertyId: string;
  mode: "create" | "edit";
  initial?: { reviewId: string; rating: number; comment: string };
  onDone?: () => void;
};

export function ReviewForm({ propertyId, mode, initial, onDone }: Props) {
  const create = useCreateReview(propertyId);
  const update = useUpdateReview(propertyId);
  const [raceError, setRaceError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    defaultValues: {
      rating: initial?.rating ?? 0,
      comment: initial?.comment ?? "",
    },
  });

  async function onSubmit(data: ReviewCreateInput) {
    setRaceError(null);
    try {
      if (mode === "edit" && initial) {
        await update.mutateAsync({
          reviewId: initial.reviewId,
          rating: data.rating,
          comment: data.comment,
        });
        toast.success("Review updated.");
      } else {
        await create.mutateAsync(data);
        toast.success("Review posted.");
      }
      onDone?.();
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 409) {
        setRaceError("You have already reviewed this property.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="review-rating">Your rating</Label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div id="review-rating" className="mt-2">
              <StarInput value={field.value} onChange={field.onChange} />
            </div>
          )}
        />
        {errors.rating ? (
          <p className="mt-1 text-sm text-destructive">
            {errors.rating.message}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="review-comment">Your review</Label>
        <Controller
          control={control}
          name="comment"
          render={({ field }) => (
            <>
              <Textarea
                id="review-comment"
                rows={4}
                className="mt-2"
                placeholder="What stood out? Minimum 5 characters."
                aria-describedby="review-comment-help"
                aria-invalid={!!errors.comment}
                maxLength={1000}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              <div
                id="review-comment-help"
                className="mt-1 flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>{(field.value ?? "").length}/1000</span>
                {errors.comment ? (
                  <span className="text-destructive">
                    {errors.comment.message}
                  </span>
                ) : null}
              </div>
            </>
          )}
        />
      </div>

      {raceError ? (
        <p className="text-sm text-destructive">{raceError}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Post review"}
        </Button>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
