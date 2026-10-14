import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Property, type IProperty } from "@/models/Property";
import { ok, fail, handleError } from "@/lib/response";
import { propertyFiltersSchema } from "@/lib/validations/property";

type PropertyFilter = mongoose.QueryFilter<IProperty>;

const SORT_MAP = {
  newest: { createdAt: -1 as const },
  price_asc: { price: 1 as const },
  price_desc: { price: -1 as const },
};

const CARD_FIELDS = {
  title: 1,
  type: 1,
  price: 1,
  bhk: 1,
  area: 1,
  furnishing: 1,
  city: 1,
  coverImage: 1,
  averageRating: 1,
  reviewCount: 1,
  createdAt: 1,
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const raw = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = propertyFiltersSchema.safeParse(raw);
    if (!parsed.success) {
      return fail(
        "Validation failed",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const f = parsed.data;
    const filter: PropertyFilter = { status: "published" };
    if (f.city) filter.city = f.city;
    if (f.type) filter.type = f.type;
    if (f.bhk !== undefined) filter.bhk = f.bhk;
    if (f.furnishing) filter.furnishing = f.furnishing;
    if (f.minPrice !== undefined || f.maxPrice !== undefined) {
      const range: { $gte?: number; $lte?: number } = {};
      if (f.minPrice !== undefined) range.$gte = f.minPrice;
      if (f.maxPrice !== undefined) range.$lte = f.maxPrice;
      filter.price = range;
    }
    if (f.minArea !== undefined || f.maxArea !== undefined) {
      const range: { $gte?: number; $lte?: number } = {};
      if (f.minArea !== undefined) range.$gte = f.minArea;
      if (f.maxArea !== undefined) range.$lte = f.maxArea;
      filter.area = range;
    }

    const [docs, total] = await Promise.all([
      Property.find(filter, CARD_FIELDS)
        .sort(SORT_MAP[f.sort])
        .skip((f.page - 1) * f.limit)
        .limit(f.limit)
        .lean(),
      Property.countDocuments(filter),
    ]);

    const properties = docs.map((d) => ({
      _id: d._id.toString(),
      title: d.title,
      type: d.type,
      price: d.price,
      bhk: d.bhk,
      area: d.area,
      furnishing: d.furnishing,
      city: d.city,
      coverImage: d.coverImage,
      averageRating: d.averageRating,
      reviewCount: d.reviewCount,
      createdAt: d.createdAt,
    }));

    return ok({
      properties,
      pagination: {
        page: f.page,
        limit: f.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / f.limit)),
      },
    });
  } catch (err) {
    return handleError(err, "GET /api/properties");
  }
}
