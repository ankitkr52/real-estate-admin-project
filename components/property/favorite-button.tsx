"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "cn";
import { useAuth } from "@/hooks/use-auth";
import { useToggleFavorite } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";

type Props = {
  propertyId: string;
  isFavorited: boolean;
  variant: "card" | "detail";
  title?: string;
  className?: string;
};

export function FavoriteButton({ propertyId, isFavorited, variant, title, className }: Props) {
  const { data: user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toggle = useToggleFavorite();

  const label = isFavorited
    ? `Remove ${title ?? "property"} from favorites`
    : `Save ${title ?? "property"}`;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      const qs = searchParams.toString();
      const next = `${pathname}${qs ? `?${qs}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    toggle.mutate({ propertyId, nextFavorited: !isFavorited });
  }

  if (variant === "detail") {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleClick}
        aria-pressed={isFavorited}
        aria-label={label}
        className={className}
      >
        <Heart
          className={cn("h-4 w-4", isFavorited ? "fill-destructive stroke-destructive" : "")}
        />
        {isFavorited ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isFavorited}
      onClick={handleClick}
      className={cn(
        "absolute top-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          isFavorited ? "fill-destructive stroke-destructive" : "stroke-foreground",
        )}
      />
    </button>
  );
}
