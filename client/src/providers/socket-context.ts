// Socket status context + hook, kept separate from SocketProvider so the
// provider file only exports a component (required for React Fast Refresh).
import { createContext, useContext } from "react"

export interface SocketContextValue {
  connected: boolean
}

export const SocketContext = createContext<SocketContextValue>({
  connected: false,
})

export function useSocketStatus() {
  return useContext(SocketContext)
}
