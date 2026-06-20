// Board membership data access — the authorization source of truth.
import { prisma } from "../prisma/client";
import { MemberDTO, Role } from "../types";

export async function getMemberRole(
  boardId: string,
  userId: string
): Promise<Role | null> {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  return member ? (member.role as Role) : null;
}

export async function listMembers(boardId: string): Promise<MemberDTO[]> {
  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => ({
    userId: m.userId,
    email: m.user.email,
    name: m.user.name,
    role: m.role as Role,
  }));
}

export async function upsertMember(
  boardId: string,
  userId: string,
  role: Role
): Promise<void> {
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId, userId } },
    update: { role },
    create: { boardId, userId, role },
  });
}

export async function removeMember(
  boardId: string,
  userId: string
): Promise<void> {
  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId, userId } },
  });
}

// Guard for the "last owner" invariant — a board must always keep one owner.
export async function countOwners(boardId: string): Promise<number> {
  return prisma.boardMember.count({ where: { boardId, role: "owner" } });
}
