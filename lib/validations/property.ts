import { z } from "zod";
import { CITIES, PROPERTY_TYPES, FURNISHING } from "@/lib/constants";

export const propertyFiltersSchema = z
  .object({
    city: z.enum(CITIES).optional(),
    type: z.enum(PROPERTY_TYPES).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    bhk: z.coerce.number().int().positive().optional(),
    minArea: z.coerce.number().nonnegative().optional(),
    maxArea: z.coerce.number().positive().optional(),
    furnishing: z.enum(FURNISHING).optional(),
    sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  })
  .refine(
    (v) =>
      v.minPrice === undefined ||
      v.maxPrice === undefined ||
      v.minPrice <= v.maxPrice,
    { path: ["maxPrice"], message: "maxPrice must be greater than or equal to minPrice" },
  )
  .refine(
    (v) =>
      v.minArea === undefined ||
      v.maxArea === undefined ||
      v.minArea <= v.maxArea,
    { path: ["maxArea"], message: "maxArea must be greater than or equal to minArea" },
  );

export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
