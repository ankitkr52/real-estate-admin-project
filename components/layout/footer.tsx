import Link from "next/link";
import { CITIES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground/80">
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <p className="font-display text-xl font-semibold text-primary-foreground">
              Real Estate Portal
            </p>
            <p className="mt-3 text-sm">
              Buy and sell properties across eight Indian cities. Admin-curated,
              owner-contact, broker-free.
            </p>
          </div>

          <nav aria-label="Quick links">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground/60">
              Explore
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-primary-foreground hover:underline" href="/">Home</Link></li>
              <li><Link className="hover:text-primary-foreground hover:underline" href="/properties">Properties</Link></li>
              <li><Link className="hover:text-primary-foreground hover:underline" href="/login">Log in</Link></li>
              <li><Link className="hover:text-primary-foreground hover:underline" href="/register">Register</Link></li>
            </ul>
          </nav>

          <nav aria-label="Popular cities">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground/60">
              Popular cities
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {CITIES.slice(0, 5).map((city) => (
                <li key={city}>
                  <Link
                    className="hover:text-primary-foreground hover:underline"
                    href={`/properties?city=${encodeURIComponent(city)}`}
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-primary-foreground/60">
              Contact
            </p>
            <address className="mt-3 space-y-2 text-sm not-italic">
              <p>Mumbai, India</p>
              <p>support@realestate.example</p>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60">
          <p>&copy; 2026 Real Estate Portal. Portfolio project.</p>
        </div>
      </div>
    </footer>
  );
}
