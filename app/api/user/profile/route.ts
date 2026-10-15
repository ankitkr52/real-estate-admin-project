import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/response";
import { User } from "@/models/User";
import { profileUpdateSchema } from "@/lib/validations/user";

export async function PATCH(req: Request) {
  try {
    const session = await requireUser();
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = profileUpdateSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return fail(
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(session.sub, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();
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
    return handleError(err, "PATCH /api/user/profile");
  }
}
