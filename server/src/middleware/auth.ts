// Authentication + per-board authorization middleware.
//
// Two layers:
//   authenticate       -> resolves the user from the Bearer token (sets req.userId)
//   requirePermission   -> loads the user's per-board role and checks it grants
//                          the required permission (see ../auth/permissions)
//
// Roles are resolved fresh from the DB on every request (not cached in the JWT)
// so a revoked/changed role takes effect immediately.
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth/jwt";
import { can, Permission } from "../auth/permissions";
import { getMemberRole } from "../repositories/membershipRepository";
import { HttpError } from "./errorHandler";
import { Role } from "../types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      boardId?: string;
      boardRole?: Role;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }
  try {
    const { sub } = verifyToken(header.slice(7));
    req.userId = sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

// resolveBoardId pulls the board id from wherever the route carries it.
type BoardIdResolver = (req: Request) => Promise<string> | string;

export function requirePermission(
  permission: Permission,
  resolveBoardId: BoardIdResolver
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new HttpError(401, "Not authenticated");

      const boardId = await resolveBoardId(req);
      const role = await getMemberRole(boardId, req.userId);
      if (!role) throw new HttpError(403, "Not a member of this board");

      if (!can(role, permission)) {
        throw new HttpError(403, `Missing permission: ${permission}`);
      }

      req.boardId = boardId;
      req.boardRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };
}
