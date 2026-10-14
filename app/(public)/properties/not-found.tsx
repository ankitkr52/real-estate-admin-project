import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function PropertyNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[480px] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em]">
        Property not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This listing may have been removed or the link may be incorrect.
      </p>
      <Link href="/properties" className={`${buttonVariants({ size: "lg" })} mt-6`}>
        Browse properties
      </Link>
    </div>
  );
}
