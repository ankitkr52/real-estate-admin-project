import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/response";
import { User } from "@/models/User";
import "@/models/Property";
import type { IProperty } from "@/models/Property";
import type { Types } from "mongoose";

type PopulatedProperty = Pick<
  IProperty,
  | "_id"
  | "title"
  | "type"
  | "price"
  | "bhk"
  | "area"
  | "furnishing"
  | "city"
  | "coverImage"
  | "averageRating"
  | "reviewCount"
  | "createdAt"
>;

const CARD_FIELDS =
  "title type price bhk area furnishing city coverImage averageRating reviewCount createdAt";

export async function GET() {
  try {
    const session = await requireUser();
    await connectDB();

    const user = await User.findById(session.sub, { favorites: 1 })
      .populate<{ favorites: (PopulatedProperty | null)[] }>({
        path: "favorites",
        match: { status: "published" },
        select: CARD_FIELDS,
      })
      .lean();

    if (!user) return fail("Account not found.", 404);

    const favorites = (user.favorites ?? []).filter(
      (p): p is PopulatedProperty => p !== null,
    );

    const properties = favorites.map((p) => ({
      _id: (p._id as Types.ObjectId).toString(),
      title: p.title,
      type: p.type,
      price: p.price,
      bhk: p.bhk,
      area: p.area,
      furnishing: p.furnishing,
      city: p.city,
      coverImage: p.coverImage,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      createdAt: p.createdAt,
    }));

    return ok({ properties });
  } catch (err) {
    return handleError(err, "GET /api/user/favorites");
  }
}
