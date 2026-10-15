import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
};

export function StarRating({ value, count, size = "md", className }: Props) {
  const filled = Math.round(value);
  const dim = size === "sm" ? "size-3.5" : "size-4";
  const label =
    count === undefined
      ? `Rated ${value.toFixed(1)} out of 5`
      : `Rated ${value.toFixed(1)} out of 5 from ${count} reviews`;

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            dim,
            n <= filled
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
