import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        Phase 0 placeholder
      </p>
      <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground">
        Real Estate Portal
      </h1>
      <p className="font-sans text-base text-muted-foreground max-w-prose text-center">
        Scaffolding verified. The real home page lands in Phase 3.
      </p>
      <Button>Explore properties</Button>
    </main>
  );
}
