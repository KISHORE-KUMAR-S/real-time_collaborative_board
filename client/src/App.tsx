import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/AuthProvider"
import { useAuth } from "@/providers/auth-context"
import { SocketProvider } from "@/providers/SocketProvider"
import { BoardPage } from "@/pages/BoardPage"
import { LoginPage } from "@/pages/LoginPage"
import { config } from "@/config"

const queryClient = new QueryClient()

// Chooses login vs board based on auth state.
function Gate() {
  const { user } = useAuth()
  if (!user) return <LoginPage />
  return (
    <SocketProvider boardId={config.boardId}>
      <BoardPage boardId={config.boardId} />
    </SocketProvider>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate />
        <Toaster richColors position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
