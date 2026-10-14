import { destroySession, requireUser } from "@/lib/auth";
import { handleError, ok } from "@/lib/response";

export async function POST() {
  try {
    await requireUser();
    await destroySession();
    return ok({ message: "Logged out." });
  } catch (err) {
    return handleError(err, "POST /api/auth/logout");
  }
}
