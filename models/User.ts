import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone: string;
  avatar?: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  favorites: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    avatar: { type: String },
    role: { type: String, required: true, enum: ["user", "admin"], default: "user" },
    isEmailVerified: { type: Boolean, required: true, default: false },
    favorites: {
      type: [{ type: Schema.Types.ObjectId, ref: "Property" }],
      default: [],
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});
// The unique index on `email` is declared via `unique: true` on the field.

export const User =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", userSchema);
