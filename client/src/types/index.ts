export type Column = "todo" | "doing" | "done"
export type Role = "owner" | "editor" | "viewer"

export type Permission =
  | "board:read"
  | "board:update"
  | "board:delete"
  | "card:create"
  | "card:update"
  | "card:delete"
  | "member:read"
  | "member:manage"

export interface BoardCard {
  id: string
  boardId: string
  title: string
  column: Column
  createdAt: string
  updatedAt: string
}

export interface Board {
  id: string
  role: Role
  permissions: Permission[]
  cards: BoardCard[]
}

export interface User {
  id: string
  email: string
  name: string
}

export interface BoardMember {
  userId: string
  email: string
  name: string
  role: Role
}

export interface AuthResponse {
  token: string
  user: User
}

export const COLUMNS: { key: Column; label: string }[] = [
  { key: "todo", label: "Todo" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
]

export const ROLE_OPTIONS: Role[] = ["owner", "editor", "viewer"]

// Socket event names — must match the server.
export const SOCKET_EVENTS = {
  joinBoard: "join-board",
  cardCreated: "card-created",
  cardUpdated: "card-updated",
  cardDeleted: "card-deleted",
} as const
