import { z } from "zod";

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60).optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
      .optional(),
    avatar: z.string().url("Enter a valid URL").optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
