// Board data access. The DB is the source of truth for initial load +
// reconnection refetch.
import { prisma } from "../prisma/client";
import { BoardDTO, Role, UserBoardDTO } from "../types";
import { permissionsFor } from "../auth/permissions";
import { toCardDTO } from "./cardRepository";

// Board + cards for a member. Role/permissions are derived from the membership
// the auth middleware already resolved.
export async function getBoardForUser(
  id: string,
  role: Role
): Promise<BoardDTO | null> {
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      // Stable ordering so every client renders cards the same way.
      cards: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!board) return null;

  return {
    id: board.id,
    role,
    permissions: permissionsFor(role),
    cards: board.cards.map(toCardDTO),
  };
}

export async function boardExists(id: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id },
    select: { id: true },
  });
  return board !== null;
}

// Boards the user belongs to, with their role on each.
export async function listBoardsForUser(
  userId: string
): Promise<UserBoardDTO[]> {
  const memberships = await prisma.boardMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({ id: m.boardId, role: m.role as Role }));
}
