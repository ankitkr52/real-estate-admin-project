import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/response";
import { verifyEmailSchema } from "@/lib/validations/auth";
import { verifyActionToken } from "@/lib/token";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }
    const userId = verifyActionToken(parsed.data.token, "verify-email");
    const user = await User.findById(userId);
    if (!user) return fail("Account not found.", 404);
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }
    return ok({ message: "Email verified. You can now log in." });
  } catch (err) {
    return handleError(err, "POST /api/auth/verify-email");
  }
}
