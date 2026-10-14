import mongoose, { Schema, Types } from "mongoose";

export interface IReview {
  _id: Types.ObjectId;
  property: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: "rating must be an integer 1-5" },
    },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ property: 1, user: 1 }, { unique: true });
reviewSchema.index({ property: 1, createdAt: -1 });

export const Review =
  (mongoose.models.Review as mongoose.Model<IReview> | undefined) ??
  mongoose.model<IReview>("Review", reviewSchema);
