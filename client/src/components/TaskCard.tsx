// A single card: edit title inline, move between columns, delete.
import { useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COLUMNS, type BoardCard, type Column } from "@/types"

export function TaskCard({
  card,
  canUpdate,
  canDelete,
  onMove,
  onRename,
  onDelete,
}: {
  card: BoardCard
  canUpdate: boolean
  canDelete: boolean
  onMove: (id: string, column: Column) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.title)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== card.title) {
      onRename(card.id, trimmed)
    } else {
      setDraft(card.title) // reset if empty/unchanged
    }
    setEditing(false)
  }

  return (
    <Card className="gap-0 py-3">
      <CardContent className="flex flex-col gap-2 px-3">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            maxLength={255}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") {
                setDraft(card.title)
                setEditing(false)
              }
            }}
          />
        ) : (
          <p
            className="text-sm break-words"
            onDoubleClick={() => canUpdate && setEditing(true)}
          >
            {card.title}
          </p>
        )}

        {(canUpdate || canDelete) && (
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate && (
            <>
              <Select
                value={card.column}
                onValueChange={(v) => onMove(card.id, v as Column)}
              >
                <SelectTrigger
                  size="sm"
                  className="flex-1"
                  aria-label="Move card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit card"
                onClick={() => setEditing(true)}
              >
                <PencilIcon data-icon="inline-start" />
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete card"
              onClick={() => onDelete(card.id)}
            >
              <Trash2Icon data-icon="inline-start" />
            </Button>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  )
}
