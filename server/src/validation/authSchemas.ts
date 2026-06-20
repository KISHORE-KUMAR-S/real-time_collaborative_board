// Zod request schemas for auth endpoints.
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;
