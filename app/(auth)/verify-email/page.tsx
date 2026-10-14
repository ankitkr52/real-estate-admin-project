"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type State =
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "expired" }
  | { kind: "invalid" };

function Verify() {
  const params = useSearchParams();
  const token = params.get("token");
  const fired = useRef(false);
  const [state, setState] = useState<State>(() =>
    token ? { kind: "verifying" } : { kind: "invalid" },
  );

  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    (async () => {
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (r.ok) {
        setState({ kind: "success" });
        return;
      }
      const j = (await r.json()) as { message?: string };
      if (/expired/i.test(j.message ?? "")) setState({ kind: "expired" });
      else setState({ kind: "invalid" });
    })();
  }, [token]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">
          {state.kind === "verifying" && "Verifying…"}
          {state.kind === "success" && "Email verified"}
          {state.kind === "expired" && "Link expired"}
          {state.kind === "invalid" && "Invalid link"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {state.kind === "verifying" && (
          <p className="text-muted-foreground">Checking your verification link…</p>
        )}
        {state.kind === "success" && (
          <>
            <p className="text-muted-foreground">Your email is verified. You can now log in.</p>
            <Link href="/login" className={buttonVariants()}>
              Continue to login
            </Link>
          </>
        )}
        {state.kind === "expired" && (
          <>
            <p className="text-muted-foreground">
              This link has expired. Register again with the same email to receive a fresh one.
            </p>
            <Link href="/register" className={buttonVariants({ variant: "outline" })}>
              Back to register
            </Link>
          </>
        )}
        {state.kind === "invalid" && (
          <>
            <p className="text-muted-foreground">
              This link is not valid. If you have an account, try signing in; otherwise create one.
            </p>
            <div className="flex gap-2">
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Sign in
              </Link>
              <Link href="/register" className={buttonVariants()}>
                Register
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <Verify />
    </Suspense>
  );
}
