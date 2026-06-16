'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ROLE_LABEL, type Assignee } from '@/hooks/use-client-assignees'
import type { Client } from '@/types'

/**
 * Multi-select dialog for adding / removing firm members from a
 * client's roster. Persists into the page-local override map so the
 * table reflects the new pile immediately; backend mutation slots in
 * here when integrations release.
 *
 * Selection state is held in a local `useState` initialised from the
 * `current` prop each time the dialog opens. Cancelling discards
 * changes naturally without resetting on every render.
 */
export function ManageAssigneesDialog({
  client,
  allMembers,
  current,
  onOpenChange,
  onSave,
}: {
  client: Client | null
  allMembers: Assignee[]
  current: Assignee[]
  onOpenChange: (open: boolean) => void
  onSave: (next: Assignee[]) => void
}) {
  const open = !!client
  // Key the state with the client id so the draft resets every time
  // a different client's dialog opens.
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set())
  const dialogKey = client?.id ?? '__none__'

  // Initialise / reset the draft whenever the dialog opens for a
  // (possibly different) client.
  useMemo(() => {
    if (open) setDraftIds(new Set(current.map((a) => a.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogKey, open])

  const toggle = (id: string) =>
    setDraftIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleSave = () => {
    // Preserve allMembers order so the saved list is stable across
    // re-renders (the table renders avatars in this order).
    const next = allMembers.filter((m) => draftIds.has(m.id))
    onSave(next)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Manage assignees
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 py-1">
          <p
            className="text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Pick the firm members who should be assigned to{' '}
            <span style={{ color: 'var(--text-primary)' }}>
              {client?.full_name}
            </span>
            . Selected members appear in the row&apos;s avatar stack.
          </p>

          <div
            className="max-h-72 overflow-y-auto rounded-md border"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {allMembers.length === 0 ? (
              <div
                className="px-3 py-4 text-[12.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No firm members on file yet.
              </div>
            ) : (
              allMembers.map((m) => {
                const checked = draftIds.has(m.id)
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    style={{
                      background: checked
                        ? 'var(--accent-today-tint)'
                        : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(m.id)}
                      className="h-4 w-4 rounded cursor-pointer"
                      style={{ accentColor: 'var(--gold)' }}
                    />
                    <span className="flex-1 min-w-0">
                      <span
                        className="block text-[13px] truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {m.name}
                      </span>
                      <span
                        className="block text-[11.5px] truncate"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {ROLE_LABEL[m.role]}
                      </span>
                    </span>
                  </label>
                )
              })
            )}
          </div>

          <p
            className="text-[11.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {draftIds.size} member{draftIds.size === 1 ? '' : 's'} selected.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
          >
            Save assignees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
