// Shared domain/wire types. Validation schemas live in ../validation,
// the RBAC policy lives in ../auth/permissions.
import { Column } from "../validation/cardSchemas";
import type { Permission } from "../auth/permissions";

export type { Column };
export type { Permission };

export type Role = "owner" | "editor" | "viewer";

export interface UserDTO {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

// A user's membership on a board, used by the member-management UI.
export interface MemberDTO {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface UserBoardDTO {
  id: string;
  role: Role;
}

// Card as returned over the wire. Dates are ISO strings after JSON serialization.
export interface CardDTO {
  id: string;
  boardId: string;
  title: string;
  column: Column;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDTO {
  id: string;
  // The requesting user's role + resolved permissions (drives client UI gating).
  role: Role;
  permissions: Permission[];
  cards: CardDTO[];
}

// Socket event names, kept in one place to avoid typos across files.
export const SOCKET_EVENTS = {
  joinBoard: "join-board",
  cardCreated: "card-created",
  cardUpdated: "card-updated",
  cardDeleted: "card-deleted",
} as const;
