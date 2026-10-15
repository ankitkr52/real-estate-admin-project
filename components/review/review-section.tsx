"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useReviews } from "@/hooks/use-reviews";
import { ReviewList } from "@/components/review/review-list";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewSkeleton } from "@/components/review/review-skeleton";

type Props = {
  propertyId: string;
  averageRating: number;
  reviewCount: number;
};

function SummaryHeader({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
          Reviews
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {count > 0 ? (
            <>
              <span className="font-semibold text-foreground tabular-nums">
                {avg.toFixed(1)}
              </span>{" "}
              average from {count.toLocaleString("en-IN")}{" "}
              {count === 1 ? "review" : "reviews"}
            </>
          ) : (
            "No ratings yet"
          )}
        </p>
      </div>
    </div>
  );
}

export function ReviewSection({
  propertyId,
  averageRating,
  reviewCount,
}: Props) {
  const { data: user, isPending: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const q = useReviews(propertyId, page);
  const pathname = usePathname();

  const header = (
    <SummaryHeader avg={averageRating} count={reviewCount} />
  );

  if (authLoading) {
    return (
      <>
        {header}
        <ReviewSkeleton />
      </>
    );
  }

  if (!user) {
    return (
      <>
        {header}
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Log in to read and write reviews.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-4`}
          >
            Log in
          </Link>
        </div>
      </>
    );
  }

  if (q.isPending) {
    return (
      <>
        {header}
        <ReviewSkeleton />
      </>
    );
  }

  if (q.isError || !q.data) {
    return (
      <>
        {header}
        <p className="mt-6 text-sm text-destructive">
          Could not load reviews.
        </p>
      </>
    );
  }

  const { reviews, myReview, pagination } = q.data;
  const showForm = !myReview || editing;

  return (
    <>
      {header}
      <ReviewList
        propertyId={propertyId}
        myReview={myReview}
        reviews={reviews}
        pagination={pagination}
        onEdit={() => setEditing(true)}
        onPageChange={setPage}
      />
      {myReview && !editing ? (
        <p className="mt-6 rounded-[var(--radius-md)] bg-muted px-4 py-3 text-sm text-muted-foreground">
          You reviewed this property.
        </p>
      ) : null}
      {showForm ? (
        <ReviewForm
          propertyId={propertyId}
          mode={myReview ? "edit" : "create"}
          initial={
            myReview
              ? {
                  reviewId: myReview._id,
                  rating: myReview.rating,
                  comment: myReview.comment,
                }
              : undefined
          }
          onDone={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}
