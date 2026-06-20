// A board column: its cards plus the add-card form.
import { TaskCard } from "@/components/TaskCard"
import { CardForm } from "@/components/CardForm"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import type { BoardCard, Column as ColumnType } from "@/types"

export function Column({
  column,
  label,
  cards,
  canCreate,
  canUpdate,
  canDelete,
  onCreate,
  onMove,
  onRename,
  onDelete,
}: {
  column: ColumnType
  label: string
  cards: BoardCard[]
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onCreate: (title: string, column: ColumnType) => void
  onMove: (id: string, column: ColumnType) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </h2>
        <Badge variant="secondary">{cards.length}</Badge>
      </header>

      <Separator />

      <div className="flex flex-col gap-2">
        {cards.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyDescription>No cards yet</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          cards.map((card) => (
            <TaskCard
              key={card.id}
              card={card}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onMove={onMove}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {canCreate && <CardForm column={column} onSubmit={onCreate} />}
    </section>
  )
}
