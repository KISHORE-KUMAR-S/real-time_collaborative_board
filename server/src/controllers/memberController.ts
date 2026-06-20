import { Request, Response } from "express";
import {
  countOwners,
  getMemberRole,
  listMembers,
  removeMember,
  upsertMember,
} from "../repositories/membershipRepository";
import { findUserByEmail } from "../repositories/userRepository";
import { addMemberSchema, updateMemberSchema } from "../validation/memberSchemas";
import { HttpError } from "../middleware/errorHandler";

// GET /api/boards/:id/members
export async function listMembersHandler(req: Request, res: Response) {
  res.json(await listMembers(req.params.id));
}

// POST /api/boards/:id/members  — add an existing user by email
export async function addMemberHandler(req: Request, res: Response) {
  const boardId = req.params.id;
  const input = addMemberSchema.parse(req.body);

  const user = await findUserByEmail(input.email);
  if (!user) throw new HttpError(404, "No user with that email");

  await upsertMember(boardId, user.id, input.role);
  res.status(201).json({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: input.role,
  });
}

// PATCH /api/boards/:id/members/:userId  — change a member's role
export async function updateMemberHandler(req: Request, res: Response) {
  const { id: boardId, userId } = req.params;
  const input = updateMemberSchema.parse(req.body);

  const current = await getMemberRole(boardId, userId);
  if (!current) throw new HttpError(404, "Member not found");

  // Don't allow demoting the last remaining owner.
  if (current === "owner" && input.role !== "owner") {
    if ((await countOwners(boardId)) <= 1) {
      throw new HttpError(409, "A board must keep at least one owner");
    }
  }

  await upsertMember(boardId, userId, input.role);
  res.json({ userId, role: input.role });
}

// DELETE /api/boards/:id/members/:userId
export async function removeMemberHandler(req: Request, res: Response) {
  const { id: boardId, userId } = req.params;

  const current = await getMemberRole(boardId, userId);
  if (!current) return res.status(204).send();

  if (current === "owner" && (await countOwners(boardId)) <= 1) {
    throw new HttpError(409, "A board must keep at least one owner");
  }

  await removeMember(boardId, userId);
  res.status(204).send();
}
