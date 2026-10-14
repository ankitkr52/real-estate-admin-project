import mongoose, { Schema, Types } from "mongoose";
import { CITIES, PROPERTY_TYPES, FURNISHING } from "@/lib/constants";

export interface IProperty {
  _id: Types.ObjectId;
  title: string;
  description: string;
  type: "Apartment" | "House" | "Villa" | "Plot" | "Commercial";
  price: number;
  bhk?: number;
  area: number;
  furnishing?: "Furnished" | "Semi-Furnished" | "Unfurnished";
  city: string;
  address: string;
  images: string[];
  coverImage: string;
  contactPhone: string;
  contactWhatsApp: string;
  status: "draft" | "published";
  viewCount: number;
  averageRating: number;
  reviewCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    type: { type: String, required: true, enum: [...PROPERTY_TYPES] },
    price: { type: Number, required: true, min: 1 },
    bhk: { type: Number, min: 1, validate: { validator: Number.isInteger, message: "bhk must be an integer" } },
    area: { type: Number, required: true, min: 1 },
    furnishing: { type: String, enum: [...FURNISHING] },
    city: { type: String, required: true, enum: [...CITIES] },
    address: { type: String, required: true, trim: true },
    images: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: "A property can have at most 5 images.",
      },
    },
    coverImage: { type: String, required: true },
    contactPhone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    contactWhatsApp: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    status: { type: String, required: true, enum: ["draft", "published"], default: "draft" },
    viewCount: { type: Number, required: true, default: 0 },
    averageRating: { type: Number, required: true, default: 0 },
    reviewCount: { type: Number, required: true, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

propertySchema.index({ status: 1, createdAt: -1 });
propertySchema.index({ status: 1, price: 1 });
propertySchema.index({ status: 1, city: 1 });
propertySchema.index({ status: 1, type: 1 });

export const Property =
  (mongoose.models.Property as mongoose.Model<IProperty> | undefined) ??
  mongoose.model<IProperty>("Property", propertySchema);
