// Zod schemas for member-management endpoints.
import { z } from "zod";

export const roleSchema = z.enum(["owner", "editor", "viewer"]);

export const addMemberSchema = z.object({
  email: z.string().trim().email().max(255),
  role: roleSchema,
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  role: roleSchema,
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
