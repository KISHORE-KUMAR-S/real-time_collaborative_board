// Inline form to add a card to a column.
import { type FormEvent, useState } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Column } from "@/types"

export function CardForm({
  column,
  onSubmit,
  disabled,
}: {
  column: Column
  onSubmit: (title: string, column: Column) => void
  disabled?: boolean
}) {
  const [title, setTitle] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit(trimmed, column)
    setTitle("")
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a card…"
        maxLength={255}
        disabled={disabled}
      />
      <Button type="submit" size="icon" disabled={disabled || !title.trim()}>
        <PlusIcon data-icon="inline-start" />
      </Button>
    </form>
  )
}
