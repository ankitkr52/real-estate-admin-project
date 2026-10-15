import { NextRequest } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/response";
import { Property } from "@/models/Property";
import { Review } from "@/models/Review";
import { recalcPropertyRating } from "@/lib/rating";
import { reviewUpdateSchema } from "@/lib/validations/review";

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

async function readPropertyDenorm(propertyId: Types.ObjectId) {
  const prop = await Property.findById(
    propertyId,
    "averageRating reviewCount",
  ).lean<{ averageRating: number; reviewCount: number } | null>();
  return prop
    ? { averageRating: prop.averageRating, reviewCount: prop.reviewCount }
    : { averageRating: 0, reviewCount: 0 };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid review id.", 400);

    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = reviewUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    await connectDB();

    const review = await Review.findById(id);
    if (!review) return fail("Review not found.", 404);

    if (review.user.toString() !== session.sub) {
      return fail("You do not have permission to do that.", 403);
    }

    if (parsed.data.rating !== undefined) review.rating = parsed.data.rating;
    if (parsed.data.comment !== undefined) review.comment = parsed.data.comment;
    await review.save();

    await recalcPropertyRating(review.property);

    const [populated, denorm] = await Promise.all([
      Review.findById(review._id)
        .populate<{ user: PopulatedReviewUser }>("user", "name avatar")
        .lean<LeanReview | null>(),
      readPropertyDenorm(review.property),
    ]);

    if (!populated) return fail("Review not found.", 404);

    return ok({
      review: shapeReview(populated, session.sub),
      property: denorm,
    });
  } catch (err) {
    return handleError(err, "PATCH /api/reviews/[id]");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Invalid review id.", 400);

    await connectDB();

    const review = await Review.findById(id);
    if (!review) return fail("Review not found.", 404);

    if (review.user.toString() !== session.sub) {
      return fail("You do not have permission to do that.", 403);
    }

    const propertyId = review.property;
    await review.deleteOne();
    await recalcPropertyRating(propertyId);

    const denorm = await readPropertyDenorm(propertyId);
    return ok({ deleted: true, property: denorm });
  } catch (err) {
    return handleError(err, "DELETE /api/reviews/[id]");
  }
}
