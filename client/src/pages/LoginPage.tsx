// Login / signup screen. Single form, toggled between the two modes.
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/providers/AuthProvider"
import { ApiError } from "@/services/api"
import { Eye, EyeOff } from "lucide-react"

export function LoginPage() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === "signup"

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignup) await signup(email.trim(), name.trim(), password)
      else await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isSignup ? "Create account" : "Sign in"}</CardTitle>
          <CardDescription>
            {isSignup
              ? "Sign up to access the collaborative board."
              : "Use owner@board.test / password123 for the seeded demo."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder={isSignup ? "Email" : "owner@board.test"}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {isSignup && (
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={isSignup ? "Password" : "password123"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff data-icon="inline-start" />
                ) : (
                  <Eye data-icon="inline-start" />
                )}
              </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="mt-4 flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={busy}>
              {isSignup ? "Sign up" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode(isSignup ? "login" : "signup")
                setError(null)
              }}
            >
              {isSignup
                ? "Have an account? Sign in"
                : "Need an account? Sign up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
