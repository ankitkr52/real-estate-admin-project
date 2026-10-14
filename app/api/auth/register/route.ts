import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/response";
import { registerSchema } from "@/lib/validations/auth";
import { User } from "@/models/User";
import { createActionToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!rateLimit(clientIp(req), "register")) {
      return fail("Too many attempts. Try again later.", 429);
    }
    await connectDB();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }
    const { name, email, phone, password } = parsed.data;
    const existing = await User.findOne({ email }).lean();
    if (existing) return fail("That email is already registered.", 409);

    const user = await new User({ name, email, phone, password }).save();
    const token = createActionToken(user._id.toString(), "verify-email");
    try {
      await sendVerificationEmail(email, token);
    } catch (sendErr) {
      console.error("[register] sendVerificationEmail failed", sendErr);
    }
    return ok(
      { message: "Registration successful. Check your email to verify your account." },
      201,
    );
  } catch (err) {
    return handleError(err, "POST /api/auth/register");
  }
}
