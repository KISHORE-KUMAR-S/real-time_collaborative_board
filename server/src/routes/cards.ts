import { Router } from "express";
import {
  createCardHandler,
  deleteCardHandler,
  updateCardHandler,
} from "../controllers/cardController";
import { asyncHandler } from "../middleware/validate";
import { authenticate, requirePermission } from "../middleware/auth";
import { findCard } from "../repositories/cardRepository";
import { HttpError } from "../middleware/errorHandler";

export const cardRoutes = Router();

// Resolve the board a card belongs to (for PATCH/DELETE authorization).
async function boardIdFromCard(id: string): Promise<string> {
  const card = await findCard(id);
  if (!card) throw new HttpError(404, "Card not found");
  return card.boardId;
}

cardRoutes.post(
  "/",
  authenticate,
  requirePermission("card:create", (req) => String(req.body?.boardId ?? "")),
  asyncHandler(createCardHandler)
);

cardRoutes.patch(
  "/:id",
  authenticate,
  requirePermission("card:update", (req) => boardIdFromCard(req.params.id)),
  asyncHandler(updateCardHandler)
);

cardRoutes.delete(
  "/:id",
  authenticate,
  requirePermission("card:delete", (req) => boardIdFromCard(req.params.id)),
  asyncHandler(deleteCardHandler)
);
