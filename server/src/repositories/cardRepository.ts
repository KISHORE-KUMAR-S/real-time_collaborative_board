// Card data access. Each function returns the final persisted state, which the
// controller both responds with and broadcasts. Last Write Wins is enforced
// implicitly: every PATCH overwrites the row and bumps updatedAt.
import { Card } from "@prisma/client";
import { prisma } from "../prisma/client";
import { CardDTO } from "../types";
import { CreateCardInput, UpdateCardInput } from "../validation/cardSchemas";

export function toCardDTO(card: Card): CardDTO {
  return {
    id: card.id,
    boardId: card.boardId,
    title: card.title,
    column: card.column,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

export async function findCard(id: string) {
  return prisma.card.findUnique({ where: { id } });
}

export async function createCard(input: CreateCardInput): Promise<CardDTO> {
  const card = await prisma.card.create({
    data: {
      boardId: input.boardId,
      title: input.title,
      column: input.column,
    },
  });
  return toCardDTO(card);
}

export async function updateCard(
  id: string,
  input: UpdateCardInput
): Promise<CardDTO> {
  // Throws Prisma P2025 if the card no longer exists -> 404 via errorHandler.
  const card = await prisma.card.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.column !== undefined ? { column: input.column } : {}),
    },
  });
  return toCardDTO(card);
}

export async function deleteCard(id: string): Promise<void> {
  await prisma.card.delete({ where: { id } });
}
