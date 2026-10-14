import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/response";
import { User } from "@/models/User";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDB();
    const user = await User.findById(session.sub).lean();
    if (!user) return fail("Account not found.", 404);
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
    return handleError(err, "GET /api/auth/me");
  }
}
