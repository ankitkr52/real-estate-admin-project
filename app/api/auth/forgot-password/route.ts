import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/response";
import { forgotSchema } from "@/lib/validations/auth";
import { User } from "@/models/User";
import { createActionToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const GENERIC_SUCCESS = {
  message: "If that email is registered, a reset link has been sent.",
};

export async function POST(req: Request) {
  try {
    if (!rateLimit(clientIp(req), "forgot-password")) {
      return fail("Too many attempts. Try again later.", 429);
    }
    await connectDB();
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }
    const user = await User.findOne({ email: parsed.data.email });
    if (user) {
      const token = createActionToken(user._id.toString(), "reset-password");
      try {
        await sendPasswordResetEmail(user.email, token);
      } catch (sendErr) {
        console.error("[forgot-password] sendPasswordResetEmail failed", sendErr);
      }
    }
    return ok(GENERIC_SUCCESS);
  } catch (err) {
    return handleError(err, "POST /api/auth/forgot-password");
  }
}
