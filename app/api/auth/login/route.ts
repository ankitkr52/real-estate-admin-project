import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/response";
import { loginSchema } from "@/lib/validations/auth";
import { User } from "@/models/User";
import { createSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!rateLimit(clientIp(req), "login")) {
      return fail("Too many attempts. Try again later.", 429);
    }
    await connectDB();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return fail("Invalid email or password.", 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return fail("Invalid email or password.", 401);

    if (!user.isEmailVerified) {
      return fail("Verify your email before logging in.", 403);
    }

    await createSession(user._id.toString(), user.role);
    return ok({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    return handleError(err, "POST /api/auth/login");
  }
}
