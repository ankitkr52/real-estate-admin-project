import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/response";
import { User } from "@/models/User";
import { Property } from "@/models/Property";

type Params = { params: Promise<{ propertyId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await requireUser();
    const { propertyId } = await params;
    if (!mongoose.isValidObjectId(propertyId)) {
      return fail("Invalid property id.", 400);
    }

    await connectDB();

    const exists = await Property.exists({ _id: propertyId, status: "published" });
    if (!exists) return fail("Property not found.", 404);

    await User.findByIdAndUpdate(session.sub, { $addToSet: { favorites: propertyId } });
    return ok({ favorited: true });
  } catch (err) {
    return handleError(err, "POST /api/user/favorites/[propertyId]");
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireUser();
    const { propertyId } = await params;
    if (!mongoose.isValidObjectId(propertyId)) {
      return fail("Invalid property id.", 400);
    }

    await connectDB();
    await User.findByIdAndUpdate(session.sub, { $pull: { favorites: propertyId } });
    return ok({ favorited: false });
  } catch (err) {
    return handleError(err, "DELETE /api/user/favorites/[propertyId]");
  }
}
