// Zod request schemas + inferred input types for card endpoints.
import { z } from "zod";

export const columnSchema = z.enum(["todo", "doing", "done"]);
export type Column = z.infer<typeof columnSchema>;

// POST /api/cards
export const createCardSchema = z.object({
  boardId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(255),
  column: columnSchema.default("todo"),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

// PATCH /api/cards/:id — both fields optional, but at least one required.
export const updateCardSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    column: columnSchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.column !== undefined, {
    message: "Provide at least one of: title, column",
  });
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
