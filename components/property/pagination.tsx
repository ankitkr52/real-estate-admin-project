"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

type Props = {
  page: number;
  totalPages: number;
};

function pageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}

export function Pagination({ page, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={prevDisabled}
        aria-label="Previous page"
        className="inline-flex h-10 items-center gap-1 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <ul className="hidden items-center gap-1 sm:flex">
        {pageList(page, totalPages).map((p, i) =>
          p === "..." ? (
            <li key={`gap-${i}`} className="px-2 text-sm text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => go(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 min-w-10 items-center justify-center rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background hover:bg-muted",
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      <span className="text-sm text-muted-foreground sm:hidden">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={nextDisabled}
        aria-label="Next page"
        className="inline-flex h-10 items-center gap-1 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
