"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { buttonVariants } from "@/components/ui/button";
import { CITIES } from "@/lib/constants";
import type { PropertyListResponse } from "@/types/property";

const HERO_IMAGE =
  "https://res.cloudinary.com/dubscrn25/image/upload/v1791976514/realestate/seed/apartment-mumbai-bandra.jpg";

async function fetchHeroStats(): Promise<number> {
  const r = await fetch("/api/properties?limit=1");
  if (!r.ok) throw new Error("stats unavailable");
  const j = (await r.json()) as { success: boolean; data: PropertyListResponse };
  return j.data.pagination.total;
}

export function Hero() {
  const { data: total } = useQuery({
    queryKey: ["hero-stats"],
    queryFn: fetchHeroStats,
    staleTime: 5 * 60_000,
  });

  const stats = [
    { label: "Properties", value: total !== undefined ? total.toLocaleString("en-IN") : "—" },
    { label: "Cities", value: String(CITIES.length) },
    { label: "Verified listings", value: "100%" },
  ];

  return (
    <section className="px-4 pt-6 md:px-8 md:pt-8">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-primary/20" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100svh-6rem)] max-w-[1280px] flex-col justify-end px-5 py-14 text-primary-foreground md:px-12 md:py-20">
          <p className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-primary-foreground/80 motion-reduce:animate-none">
            Buy &middot; Browse &middot; Decide
          </p>
          <h1 className="mt-4 max-w-[18ch] animate-in fade-in slide-in-from-bottom-6 duration-700 font-display font-semibold leading-[1.05] tracking-[-0.03em] motion-reduce:animate-none text-[clamp(2.5rem,6vw,4.5rem)]">
            A quieter way to find a home you&rsquo;ll want to live in.
          </h1>
          <p className="mt-5 max-w-[52ch] animate-in fade-in slide-in-from-bottom-8 duration-700 text-base text-primary-foreground/85 motion-reduce:animate-none md:text-lg">
            Hand-picked properties across eight Indian cities. No brokers,
            no bidding wars, no inflated noise.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 motion-reduce:animate-none">
            <Link
              href="/properties"
              className={buttonVariants({ size: "lg" }) + " bg-accent text-accent-foreground hover:bg-accent/90"}
            >
              Browse properties
            </Link>
            <Link
              href="/properties?sort=price_asc"
              className={buttonVariants({ variant: "outline", size: "lg" }) + " border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"}
            >
              Starting from
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 animate-in fade-in duration-1000 motion-reduce:animate-none">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground/70">
                  {s.label}
                </dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
