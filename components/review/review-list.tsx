"use client";

import { Button } from "@/components/ui/button";
import { ReviewItem } from "@/components/review/review-item";
import type { Review, ReviewsResponse } from "@/hooks/use-reviews";

type Props = {
  propertyId: string;
  myReview: ReviewsResponse["myReview"];
  reviews: Review[];
  pagination: ReviewsResponse["pagination"];
  onEdit: () => void;
  onPageChange: (p: number) => void;
};

export function ReviewList({
  propertyId,
  myReview,
  reviews,
  pagination,
  onEdit,
  onPageChange,
}: Props) {
  const pinnedId = myReview?._id ?? null;
  const pinned = pinnedId
    ? (reviews.find((r) => r._id === pinnedId) ?? null)
    : null;
  const rest = pinnedId ? reviews.filter((r) => r._id !== pinnedId) : reviews;

  if (!pinned && rest.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No reviews yet. Be the first.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {pinned ? (
        <ReviewItem
          review={pinned}
          propertyId={propertyId}
          pinned
          onEdit={onEdit}
        />
      ) : null}
      {rest.map((r) => (
        <ReviewItem
          key={r._id}
          review={r}
          propertyId={propertyId}
          onEdit={r.isOwn ? onEdit : undefined}
        />
      ))}
      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
