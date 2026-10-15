"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, use } from "react";
import { toast } from "sonner";
import { Phone, MessageCircle, Share2, Star, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { PropertyGallery } from "@/components/property/property-gallery";
import { FavoriteButton } from "@/components/property/favorite-button";
import { ErrorState } from "@/components/shared/error-state";
import { ReviewSection } from "@/components/review/review-section";
import { useProperty } from "@/hooks/use-properties";
import { formatPriceINRFull } from "@/lib/format";
import { buildWaLink } from "@/lib/format";

const BHK_HIDDEN = new Set(["Plot", "Commercial"]);

type PageParams = { id: string };

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PropertyDetailInner params={params} />
    </Suspense>
  );
}

function PropertyDetailInner({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params);

  const query = useProperty(id);

  if (query.isError) {
    const status = (query.error as Error & { status?: number } | null)?.status;
    if (status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
        <ErrorState onRetry={() => query.refetch()} />
      </div>
    );
  }

  if (query.isLoading || !query.data) {
    return <DetailSkeleton />;
  }

  const { property, isFavorited } = query.data;
  const showBhk =
    property.bhk !== undefined && !BHK_HIDDEN.has(property.type);
  const showRating = property.reviewCount > 0;

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const waHref = buildWaLink(
    property.contactWhatsApp,
    pageUrl,
    property.title,
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Please copy from the address bar.");
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 pb-32 md:px-8 md:py-10 lg:pb-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/properties" className="hover:underline">
              Properties
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/properties?city=${encodeURIComponent(property.city)}`}
              className="hover:underline"
            >
              {property.city}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="line-clamp-1 text-foreground">{property.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <header className="mb-6">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {property.city}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              {property.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{property.type}</span>
              {showBhk ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{property.bhk} BHK</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {property.area.toLocaleString("en-IN")} sq ft
              </span>
              {property.furnishing ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{property.furnishing}</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {property.viewCount.toLocaleString("en-IN")} views
              </span>
              {showRating ? (
                <span
                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground"
                  aria-label={`Rated ${property.averageRating.toFixed(1)} out of 5 from ${property.reviewCount} reviews`}
                >
                  <Star className="h-3 w-3 fill-accent stroke-accent" />
                  <span className="tabular-nums">
                    {property.averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({property.reviewCount})
                  </span>
                </span>
              ) : null}
            </div>
          </header>

          <PropertyGallery
            images={[property.coverImage, ...property.images.filter((i) => i !== property.coverImage)]}
            title={property.title}
            city={property.city}
          />

          <div className="mt-10">
            <p className="font-display text-3xl font-semibold tracking-[-0.01em] tabular-nums">
              {formatPriceINRFull(property.price)}
            </p>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
              About this property
            </h2>
            <p className="mt-4 max-w-[720px] whitespace-pre-line text-base leading-7 text-foreground">
              {property.description}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
              Details
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
              <DetailRow label="Type" value={property.type} />
              {showBhk ? (
                <DetailRow label="BHK" value={String(property.bhk)} />
              ) : null}
              <DetailRow
                label="Area"
                value={`${property.area.toLocaleString("en-IN")} sq ft`}
              />
              {property.furnishing ? (
                <DetailRow label="Furnishing" value={property.furnishing} />
              ) : null}
              <DetailRow label="City" value={property.city} />
              <DetailRow label="Address" value={property.address} />
            </dl>
          </section>

          <section className="mt-10 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="lg" onClick={handleCopyLink}>
              <Share2 className="h-4 w-4" />
              Copy link
            </Button>
            <a
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </a>
            <FavoriteButton
              propertyId={property._id}
              isFavorited={isFavorited}
              variant="detail"
              title={property.title}
            />
          </section>

          <section className="mt-12 border-t border-border pt-10">
            <ReviewSection
              propertyId={property._id}
              averageRating={property.averageRating}
              reviewCount={property.reviewCount}
            />
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="hidden lg:block lg:sticky lg:top-24">
            <ContactCard
              phone={property.contactPhone}
              waHref={waHref}
              price={property.price}
            />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3 lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-1">
          <a
            className={`${buttonVariants({ size: "lg" })} flex-1`}
            href={`tel:+91${property.contactPhone}`}
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            className={`${buttonVariants({ variant: "secondary", size: "lg" })} flex-1`}
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-right">{value}</dd>
    </div>
  );
}

function ContactCard({
  phone,
  waHref,
  price,
}: {
  phone: string;
  waHref: string;
  price: number;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-background p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        Price
      </p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums tracking-[-0.01em]">
        {formatPriceINRFull(price)}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <a
          className={buttonVariants({ size: "lg" })}
          href={`tel:+91${phone}`}
        >
          <Phone className="h-4 w-4" />
          Call {phone}
        </a>
        <a
          className={buttonVariants({ variant: "secondary", size: "lg" })}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Contact the owner directly. We never charge a brokerage fee.
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8">
      <Skeleton className="mb-4 h-4 w-80" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="mb-4 h-10 w-5/6" />
          <Skeleton className="mb-6 h-5 w-96" />
          <Skeleton className="aspect-[16/10] w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="mt-10 h-8 w-56" />
          <Skeleton className="mt-6 h-6 w-full max-w-[720px]" />
          <Skeleton className="mt-2 h-6 w-full max-w-[720px]" />
          <Skeleton className="mt-2 h-6 w-3/4 max-w-[720px]" />
        </div>
        <aside className="lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />
        </aside>
      </div>
    </div>
  );
}
