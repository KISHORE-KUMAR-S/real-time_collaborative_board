// Owns the socket lifecycle and wires socket events into the React Query cache.
//
// Realtime data flow:
//   server broadcast -> socket event -> update cache -> components re-render
//
// Reconnection: on every (re)connect we rejoin the board room AND invalidate
// the board query, so we never rely solely on websocket events that may have
// been missed while disconnected. The DB is the source of truth.
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { socket } from "@/services/socket"
import { boardKey } from "@/hooks/useBoard"
import { type Board, type BoardCard, SOCKET_EVENTS } from "@/types"
import { SocketContext } from "./socket-context"

export function SocketProvider({
  boardId,
  children,
}: {
  boardId: string
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const key = boardKey(boardId)

    const joinAndResync = () => {
      setConnected(true)
      socket.emit(SOCKET_EVENTS.joinBoard, boardId)
      // Refetch latest state to recover anything missed while offline.
      queryClient.invalidateQueries({ queryKey: key })
    }

    const onDisconnect = () => setConnected(false)

    // Idempotent cache upsert: replace if present, else append. Handles the
    // actor's own echo and out-of-order delivery without duplicating cards.
    const upsertCard = (incoming: BoardCard) => {
      queryClient.setQueryData<Board>(key, (prev) => {
        if (!prev) return prev
        const exists = prev.cards.some((c) => c.id === incoming.id)
        const cards = exists
          ? prev.cards.map((c) => (c.id === incoming.id ? incoming : c))
          : [...prev.cards, incoming]
        return { ...prev, cards }
      })
    }

    const removeCard = ({ id }: { id: string }) => {
      queryClient.setQueryData<Board>(key, (prev) =>
        prev ? { ...prev, cards: prev.cards.filter((c) => c.id !== id) } : prev
      )
    }

    socket.on("connect", joinAndResync)
    socket.io.on("reconnect", joinAndResync)
    socket.on("disconnect", onDisconnect)
    socket.on(SOCKET_EVENTS.cardCreated, upsertCard)
    socket.on(SOCKET_EVENTS.cardUpdated, upsertCard)
    socket.on(SOCKET_EVENTS.cardDeleted, removeCard)

    socket.connect()

    return () => {
      socket.off("connect", joinAndResync)
      socket.io.off("reconnect", joinAndResync)
      socket.off("disconnect", onDisconnect)
      socket.off(SOCKET_EVENTS.cardCreated, upsertCard)
      socket.off(SOCKET_EVENTS.cardUpdated, upsertCard)
      socket.off(SOCKET_EVENTS.cardDeleted, removeCard)
      socket.disconnect()
    }
  }, [boardId, queryClient])

  const value = useMemo(() => ({ connected }), [connected])

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}
