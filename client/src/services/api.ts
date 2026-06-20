// Thin REST client. The DB is the source of truth; this is how we read it.
import { config } from "@/config"
import { authToken } from "@/services/authToken"
import type {
  AuthResponse,
  Board,
  BoardCard,
  BoardMember,
  Column,
  Role,
} from "@/types"

// Thrown on non-2xx so callers (and React Query) can branch on status.
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authToken.get()
  const res = await fetch(`${config.apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  signup: (input: { email: string; name: string; password: string }) =>
    request<AuthResponse>(`/api/v1/auth/signup`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    request<AuthResponse>(`/api/v1/auth/login`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getBoard: (id: string) => request<Board>(`/api/v1/boards/${id}`),

  createCard: (input: { boardId: string; title: string; column?: Column }) =>
    request<BoardCard>(`/api/v1/cards`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateCard: (id: string, input: { title?: string; column?: Column }) =>
    request<BoardCard>(`/api/v1/cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteCard: (id: string) =>
    request<void>(`/api/v1/cards/${id}`, { method: "DELETE" }),

  // --- Member management ---
  getMembers: (boardId: string) =>
    request<BoardMember[]>(`/api/v1/boards/${boardId}/members`),

  addMember: (boardId: string, input: { email: string; role: Role }) =>
    request<BoardMember>(`/api/v1/boards/${boardId}/members`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateMember: (boardId: string, userId: string, role: Role) =>
    request<{ userId: string; role: Role }>(
      `/api/v1/boards/${boardId}/members/${userId}`,
      { method: "PATCH", body: JSON.stringify({ role }) }
    ),

  removeMember: (boardId: string, userId: string) =>
    request<void>(`/api/v1/boards/${boardId}/members/${userId}`, {
      method: "DELETE",
    }),
}
