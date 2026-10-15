import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/response";
import { Property } from "@/models/Property";
import { Review } from "@/models/Review";
import { recalcPropertyRating } from "@/lib/rating";
import {
  reviewCreateSchema,
  reviewListQuerySchema,
} from "@/lib/validations/review";

type PopulatedReviewUser = { _id: Types.ObjectId; name: string; avatar?: string };
type LeanReview = {
  _id: Types.ObjectId;
  rating: number;
  comment: string;
  user: PopulatedReviewUser;
  createdAt: Date;
  updatedAt: Date;
};

function shapeReview(r: LeanReview, sessionSub: string) {
  return {
    _id: r._id.toString(),
    rating: r.rating,
    comment: r.comment,
    user: {
      _id: r.user._id.toString(),
      name: r.user.name,
      avatar: r.user.avatar,
    },
    isOwn: r.user._id.toString() === sessionSub,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid property id.", 400);

    const parsed = reviewListQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    if (!parsed.success) {
      return fail(
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }
    const { page, limit } = parsed.data;

    await connectDB();

    const exists = await Property.exists({ _id: id });
    if (!exists) return fail("Property not found.", 404);

    const [rawReviews, total, rawMine] = await Promise.all([
      Review.find({ property: id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate<{ user: PopulatedReviewUser }>("user", "name avatar")
        .lean<LeanReview[]>(),
      Review.countDocuments({ property: id }),
      Review.findOne({ property: id, user: session.sub }).lean<{
        _id: Types.ObjectId;
        rating: number;
        comment: string;
      } | null>(),
    ]);

    const reviews = rawReviews.map((r) => shapeReview(r, session.sub));
    const myReview = rawMine
      ? {
          _id: rawMine._id.toString(),
          rating: rawMine.rating,
          comment: rawMine.comment,
        }
      : null;

    return ok({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      myReview,
    });
  } catch (err) {
    return handleError(err, "GET /api/properties/[id]/reviews");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid property id.", 400);

    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = reviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    await connectDB();

    const published = await Property.exists({ _id: id, status: "published" });
    if (!published) return fail("Property not found.", 404);

    const existing = await Review.exists({ property: id, user: session.sub });
    if (existing) return fail("You have already reviewed this property.", 409);

    let createdId: Types.ObjectId;
    try {
      const created = await Review.create({
        property: id,
        user: session.sub,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      });
      createdId = created._id;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        return fail("You have already reviewed this property.", 409);
      }
      throw err;
    }

    await recalcPropertyRating(new Types.ObjectId(id));

    const [populated, prop] = await Promise.all([
      Review.findById(createdId)
        .populate<{ user: PopulatedReviewUser }>("user", "name avatar")
        .lean<LeanReview | null>(),
      Property.findById(id, "averageRating reviewCount").lean<{
        averageRating: number;
        reviewCount: number;
      } | null>(),
    ]);

    if (!populated || !prop) {
      return fail("Review created but could not be read back.", 500);
    }

    return ok(
      {
        review: shapeReview(populated, session.sub),
        property: {
          averageRating: prop.averageRating,
          reviewCount: prop.reviewCount,
        },
      },
      201,
    );
  } catch (err) {
    return handleError(err, "POST /api/properties/[id]/reviews");
  }
}
