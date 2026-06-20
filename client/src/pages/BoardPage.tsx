// Top-level board view: fetch state, render columns, wire mutations.
import { useEffect, useMemo } from "react"
import { Column } from "@/components/Column"
import { MembersDialog } from "@/components/MembersDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useBoard } from "@/hooks/useBoard"
import { useCardMutations } from "@/hooks/useCardMutations"
import { useSocketStatus } from "@/providers/SocketProvider"
import { useAuth } from "@/providers/AuthProvider"
import { ApiError } from "@/services/api"
import {
  COLUMNS,
  type BoardCard,
  type Column as ColumnType,
  type Permission,
} from "@/types"

export function BoardPage({ boardId }: { boardId: string }) {
  const { data: board, isLoading, isError, error } = useBoard(boardId)
  const { create, update, remove } = useCardMutations(boardId)
  const { connected } = useSocketStatus()
  const { user, logout } = useAuth()

  // A stale/expired token surfaces as a 401 here — drop the session.
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) logout()
  }, [error, logout])

  // Permission-driven UI gating — mirrors the server policy, never replaces it.
  const has = (p: Permission) => board?.permissions.includes(p) ?? false
  const canCreate = has("card:create")
  const canUpdate = has("card:update")
  const canDelete = has("card:delete")
  const canManageMembers = has("member:manage")
  const readOnly = board != null && !canCreate && !canUpdate && !canDelete

  // Group cards by column once per data change.
  const cardsByColumn = useMemo(() => {
    const groups: Record<ColumnType, BoardCard[]> = {
      todo: [],
      doing: [],
      done: [],
    }
    board?.cards.forEach((card) => groups[card.column].push(card))
    return groups
  }, [board])

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold sm:text-2xl">Collaborative Board</h1>
          {board && <Badge variant="outline">{board.role}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "● Live" : "○ Reconnecting…"}
          </Badge>
          {canManageMembers && <MembersDialog boardId={boardId} />}
          <span className="text-muted-foreground text-sm">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      {readOnly && !isLoading && !isError && (
        <Alert className="mb-4">
          <AlertTitle>Read-only access</AlertTitle>
          <AlertDescription>
            Your role (<strong>{board?.role}</strong>) cannot modify this board.
          </AlertDescription>
        </Alert>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load board</AlertTitle>
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? COLUMNS.map(({ key }) => (
              <Skeleton key={key} className="h-64 w-full rounded-lg" />
            ))
          : COLUMNS.map(({ key, label }) => (
              <Column
                key={key}
                column={key}
                label={label}
                cards={cardsByColumn[key]}
                canCreate={canCreate}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onCreate={(title, column) => create.mutate({ title, column })}
                onMove={(id, column) => update.mutate({ id, column })}
                onRename={(id, title) => update.mutate({ id, title })}
                onDelete={(id) => remove.mutate(id)}
              />
            ))}
      </div>
    </div>
  )
}
