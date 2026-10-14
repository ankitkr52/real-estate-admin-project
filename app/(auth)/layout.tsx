import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="mb-6 font-display text-2xl font-semibold tracking-tight"
      >
        Estates
      </Link>
      <div className="w-full max-w-[420px]">{children}</div>
    </main>
  );
}
