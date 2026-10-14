"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CITIES } from "@/lib/constants";

export function CtaBanner() {
  const router = useRouter();
  const [city, setCity] = useState<string | null>(null);

  const go = () => {
    router.push(city ? `/properties?city=${encodeURIComponent(city)}` : "/properties");
  };

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-10 px-4 py-20 md:flex-row md:items-end md:justify-between md:px-8 md:py-24">
        <div className="max-w-[32ch]">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-primary-foreground/70">
            Start here
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
            Browse the properties worth your time.
          </h2>
        </div>
        <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 p-1.5">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger
              className="flex-1 border-0 bg-transparent px-4 text-primary-foreground hover:bg-primary-foreground/10 focus-visible:ring-0"
              aria-label="City"
            >
              <SelectValue placeholder="Choose a city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="lg"
            onClick={go}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Browse
          </Button>
        </div>
      </div>
    </section>
  );
}
