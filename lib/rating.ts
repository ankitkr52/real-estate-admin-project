import { Types } from "mongoose";
import { Property } from "@/models/Property";
import { Review } from "@/models/Review";

export async function recalcPropertyRating(propertyId: Types.ObjectId): Promise<void> {
  const [agg] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { property: propertyId } },
    { $group: { _id: "$property", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Property.findByIdAndUpdate(propertyId, {
    averageRating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
}
