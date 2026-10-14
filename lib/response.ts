import { NextResponse } from "next/server";

export const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (
  message: string,
  status = 400,
  errors?: Record<string, string[]>,
) =>
  NextResponse.json(
    { success: false, message, ...(errors && { errors }) },
    { status },
  );

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function handleError(err: unknown, route: string) {
  if (err instanceof HttpError) return fail(err.message, err.status);
  console.error(`[${route}]`, err);
  return fail("Something went wrong.", 500);
}
