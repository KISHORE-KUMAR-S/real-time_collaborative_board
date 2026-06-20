import { Request, Response } from "express";
import {
  createCard,
  deleteCard,
  findCard,
  updateCard,
} from "../repositories/cardRepository";
import { createCardSchema, updateCardSchema } from "../validation/cardSchemas";
import { broadcast } from "../sockets";

// POST /api/cards  (requireBoardRole 'editor' already enforced on body.boardId)
export async function createCardHandler(req: Request, res: Response) {
  const input = createCardSchema.parse(req.body);
  const card = await createCard(input);
  broadcast.cardCreated(card);
  res.status(201).json(card);
}

// PATCH /api/cards/:id  (covers edit title AND move column)
export async function updateCardHandler(req: Request, res: Response) {
  const input = updateCardSchema.parse(req.body);
  const card = await updateCard(req.params.id, input);
  broadcast.cardUpdated(card);
  res.json(card);
}

// DELETE /api/cards/:id
export async function deleteCardHandler(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await findCard(id);
  // Authorization middleware already confirmed the card exists + role; this is
  // a final guard against a delete-after-delete race.
  if (!existing) return res.status(204).send();

  await deleteCard(id);
  broadcast.cardDeleted(existing.boardId, id);
  res.status(204).send();
}
