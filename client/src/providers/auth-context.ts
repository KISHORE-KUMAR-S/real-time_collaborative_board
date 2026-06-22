// Auth context + hook, kept separate from AuthProvider so the provider file
// only exports a component (required for React Fast Refresh).
import { createContext, useContext } from "react"
import type { User } from "@/types"

export interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
