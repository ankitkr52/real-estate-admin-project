"use client";

import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  description?: string;
  onRetry: () => void;
};

export function ErrorState({
  title = "Something went wrong.",
  description = "We could not load this section. Please try again.",
  onRetry,
}: Props) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-lg)] border border-destructive/40 bg-destructive/5 p-6 text-center"
    >
      <h3 className="font-display text-lg font-semibold text-destructive">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">
        <Button variant="outline" size="lg" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
