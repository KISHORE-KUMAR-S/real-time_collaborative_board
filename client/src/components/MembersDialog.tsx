// Owner-only member management: list members, add by email, change role, remove.
// Gated by the member:manage permission at the call site (BoardPage).
import { type FormEvent, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api, ApiError } from "@/services/api"
import { ROLE_OPTIONS, type BoardMember, type Role } from "@/types"

const membersKey = (boardId: string) => ["members", boardId] as const

export function MembersDialog({ boardId }: { boardId: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("editor")

  const { data: members = [] } = useQuery({
    queryKey: membersKey(boardId),
    queryFn: () => api.getMembers(boardId),
    enabled: open, // only fetch when the dialog is open
  })

  const refresh = () =>
    qc.invalidateQueries({ queryKey: membersKey(boardId) })

  const onError = (e: unknown) =>
    toast.error(e instanceof ApiError ? e.message : "Something went wrong")

  const add = useMutation({
    mutationFn: () => api.addMember(boardId, { email: email.trim(), role }),
    onSuccess: () => {
      setEmail("")
      refresh()
      toast.success("Member added")
    },
    onError,
  })

  const changeRole = useMutation({
    mutationFn: (v: { userId: string; role: Role }) =>
      api.updateMember(boardId, v.userId, v.role),
    onSuccess: refresh,
    onError,
  })

  const remove = useMutation({
    mutationFn: (userId: string) => api.removeMember(boardId, userId),
    onSuccess: refresh,
    onError,
  })

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim()) add.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UsersIcon data-icon="inline-start" />
          Members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Board members</DialogTitle>
          <DialogDescription>
            Add existing users by email and manage their roles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={add.isPending || !email.trim()}>
            Add
          </Button>
        </form>

        <ul className="flex flex-col gap-2">
          {members.map((m: BoardMember) => (
            <li
              key={m.userId}
              className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.email}
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Select
                  value={m.role}
                  onValueChange={(v) =>
                    changeRole.mutate({ userId: m.userId, role: v as Role })
                  }
                >
                  <SelectTrigger size="sm" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove member"
                  onClick={() => remove.mutate(m.userId)}
                >
                  <Trash2Icon data-icon="inline-start" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
