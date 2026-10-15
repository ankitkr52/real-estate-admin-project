"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StarRating } from "@/components/review/star-rating";
import { useDeleteReview, type Review } from "@/hooks/use-reviews";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

type Props = {
  review: Review;
  propertyId: string;
  pinned?: boolean;
  onEdit?: () => void;
};

export function ReviewItem({ review, propertyId, pinned, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const del = useDeleteReview(propertyId);

  const edited =
    new Date(review.updatedAt).getTime() -
      new Date(review.createdAt).getTime() >
    1000;

  return (
    <article
      className={
        pinned
          ? "border-l-2 border-primary pl-4 py-1"
          : "border-l-2 border-transparent pl-4 py-1"
      }
    >
      <div className="flex items-start gap-3">
        <Avatar>
          {review.user.avatar ? (
            <AvatarImage src={review.user.avatar} alt={review.user.name} />
          ) : null}
          <AvatarFallback>{initials(review.user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{review.user.name}</span>
            {pinned ? (
              <span className="text-[11px] uppercase tracking-wider text-primary">
                Your review
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {DATE_FMT.format(new Date(review.createdAt))}
              {edited ? " · edited" : ""}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {review.comment}
          </p>
          {review.isOwn ? (
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
              <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogTrigger
                  render={<Button type="button" variant="outline" size="sm" />}
                >
                  Delete
                </AlertDialogTrigger>
                <AlertDialogPortal>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your review?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          del.mutate({ reviewId: review._id });
                          setOpen(false);
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogPortal>
              </AlertDialog>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
