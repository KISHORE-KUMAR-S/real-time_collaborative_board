// Holds the authenticated user + token, persisted across refreshes. The token
// itself lives in authToken (localStorage); this provider mirrors the user for
// rendering and exposes login/signup/logout.
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/services/api"
import { authToken } from "@/services/authToken"
import type { User } from "@/types"

const USER_KEY = "collab-board-user"

function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw || !authToken.get()) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  const persist = (u: User, token: string) => {
    authToken.set(token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email, password) => {
        const res = await api.login({ email, password })
        persist(res.user, res.token)
      },
      signup: async (email, name, password) => {
        const res = await api.signup({ email, name, password })
        persist(res.user, res.token)
      },
      logout: () => {
        authToken.clear()
        localStorage.removeItem(USER_KEY)
        setUser(null)
      },
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
