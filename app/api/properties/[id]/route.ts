import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { User } from "@/models/User";
import { ok, fail, handleError } from "@/lib/response";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return fail("Invalid property id.", 400);
    }

    await connectDB();

    const property = await Property.findOneAndUpdate(
      { _id: id, status: "published" },
      { $inc: { viewCount: 1 } },
      {
        new: true,
        lean: true,
        projection: {
          status: 0,
          createdBy: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
    );

    if (!property) {
      return fail("Property not found.", 404);
    }

    const session = await getSession();
    let isFavorited = false;
    if (session) {
      const user = await User.findById(session.sub, { favorites: 1 }).lean();
      isFavorited =
        user?.favorites?.some((fid) => fid.toString() === property._id.toString()) ??
        false;
    }

    return ok({
      property: {
        ...property,
        _id: property._id.toString(),
      },
      isFavorited,
    });
  } catch (err) {
    return handleError(err, "GET /api/properties/[id]");
  }
}
