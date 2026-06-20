import { Router } from "express";
import { getBoardHandler } from "../controllers/boardController";
import {
  addMemberHandler,
  listMembersHandler,
  removeMemberHandler,
  updateMemberHandler,
} from "../controllers/memberController";
import { asyncHandler } from "../middleware/validate";
import { authenticate, requirePermission } from "../middleware/auth";

export const boardRoutes = Router();

const boardId = (req: { params: Record<string, string> }) => req.params.id;

// Read the board — any member with board:read (viewer+).
boardRoutes.get(
  "/:id",
  authenticate,
  requirePermission("board:read", boardId),
  asyncHandler(getBoardHandler)
);

// --- Member management (owner only, via member:* permissions) ---
boardRoutes.get(
  "/:id/members",
  authenticate,
  requirePermission("member:read", boardId),
  asyncHandler(listMembersHandler)
);

boardRoutes.post(
  "/:id/members",
  authenticate,
  requirePermission("member:manage", boardId),
  asyncHandler(addMemberHandler)
);

boardRoutes.patch(
  "/:id/members/:userId",
  authenticate,
  requirePermission("member:manage", boardId),
  asyncHandler(updateMemberHandler)
);

boardRoutes.delete(
  "/:id/members/:userId",
  authenticate,
  requirePermission("member:manage", boardId),
  asyncHandler(removeMemberHandler)
);
