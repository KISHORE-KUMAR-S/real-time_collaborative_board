// Initial fetch + cache of board state via React Query.
import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { Board } from "@/types"

export const boardKey = (boardId: string) => ["board", boardId] as const

export function useBoard(boardId: string) {
  return useQuery<Board>({
    queryKey: boardKey(boardId),
    queryFn: () => api.getBoard(boardId),
    // Socket events keep the cache fresh; avoid redundant background refetches.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
