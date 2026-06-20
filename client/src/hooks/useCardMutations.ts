// Card mutations. We do NOT manually write the cache on success — the server
// broadcasts the final state to every client (including us) via Socket.IO, and
// SocketProvider applies it. Single, consistent update path; Last Write Wins is
// authoritative (the server's broadcast always wins).
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/services/api"
import type { Column } from "@/types"

export function useCardMutations(boardId: string) {
  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Something went wrong")

  const create = useMutation({
    mutationFn: (input: { title: string; column?: Column }) =>
      api.createCard({ boardId, ...input }),
    onError,
  })

  const update = useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string
      title?: string
      column?: Column
    }) => api.updateCard(id, input),
    onError,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCard(id),
    onError,
  })

  return { create, update, remove }
}
