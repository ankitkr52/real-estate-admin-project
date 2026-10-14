import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

async function ProfileContent() {
  const session = await requireUser();
  await connectDB();
  const user = await User.findById(session.sub).lean();
  if (!user) return null;
  return (
    <dl className="mt-6 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Name</dt>
      <dd>{user.name}</dd>
      <dt className="text-muted-foreground">Email</dt>
      <dd>{user.email}</dd>
      <dt className="text-muted-foreground">Phone</dt>
      <dd>{user.phone}</dd>
      <dt className="text-muted-foreground">Role</dt>
      <dd>{user.role}</dd>
    </dl>
  );
}

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Your profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Phase 2 stub. The full profile page lands in Phase 4.
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading…</p>}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
