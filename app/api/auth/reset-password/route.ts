import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/response";
import { resetSchema } from "@/lib/validations/auth";
import { verifyActionToken } from "@/lib/token";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }
    const userId = verifyActionToken(parsed.data.token, "reset-password");
    const user = await User.findById(userId).select("+password");
    if (!user) return fail("Account not found.", 404);
    user.password = parsed.data.newPassword;
    await user.save();
    return ok({ message: "Password updated. You can now log in." });
  } catch (err) {
    return handleError(err, "POST /api/auth/reset-password");
  }
}
