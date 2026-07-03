'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  OutcomeType,
  Worker,
} from '@/stores/performance-local.store'
import { usePerformanceStore } from '@/stores/performance-local.store'
import { useTasksLocalStore } from '@/stores/tasks-local.store'
import { OUTCOME_META, OUTCOME_TYPES } from '../_constants'

function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Capture a case/client outcome attributed to a worker on a date. */
export function RecordOutcomeDialog({
  open,
  onOpenChange,
  workers,
  lockedWorker,
  canAddKeyTask = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workers: Worker[]
  /** When set, the outcome is locked to this worker (member view). */
  lockedWorker?: Worker
  /** Admins can credit an important task toward performance. */
  canAddKeyTask?: boolean
}) {
  const addOutcome = usePerformanceStore((s) => s.addOutcome)
  const tasksMap = useTasksLocalStore((s) => s.tasks)

  const [workerId, setWorkerId] = useState('')
  const [type, setType] = useState<OutcomeType>('case_won')
  const [date, setDate] = useState(todayInput())
  const [label, setLabel] = useState('')
  const [taskId, setTaskId] = useState('')
  const [note, setNote] = useState('')

  // Reset on open; default to the locked worker (member) or first worker.
  // Rehydrate the tasks store so the key-task picker has current data.
  useEffect(() => {
    if (!open) return
    void useTasksLocalStore.persist.rehydrate()
    setWorkerId(lockedWorker?.id ?? workers[0]?.id ?? '')
    setType('case_won')
    setDate(todayInput())
    setLabel('')
    setTaskId('')
    setNote('')
  }, [open, workers, lockedWorker])

  // Key task is admin-only; hide it from the type grid otherwise.
  const availableTypes = useMemo(
    () => OUTCOME_TYPES.filter((t) => canAddKeyTask || !t.adminOnly),
    [canAddKeyTask],
  )

  const tasks = useMemo(
    () =>
      Object.values(tasksMap).sort((a, b) =>
        b.updated_at.localeCompare(a.updated_at),
      ),
    [tasksMap],
  )

  const subject = OUTCOME_META[type].subject
  const isKeyTask = type === 'key_task'

  const pickType = (next: OutcomeType) => {
    setType(next)
    // Switching in/out of key task clears the subject fields so a stale
    // task title doesn't leak onto a case outcome (or vice versa).
    setLabel('')
    setTaskId('')
  }

  const save = () => {
    if (!workerId) {
      toast.error('Pick a worker.')
      return
    }
    if (isKeyTask && !taskId) {
      toast.error('Pick a task to credit.')
      return
    }
    if (!label.trim()) {
      toast.error(isKeyTask ? 'Pick a task to credit.' : `Enter the ${subject} name.`)
      return
    }
    const saved = addOutcome({
      workerId,
      type,
      date: `${date}T12:00:00Z`,
      label: label.trim(),
      ...(isKeyTask && taskId ? { taskId } : {}),
      note: note.trim(),
    })
    const who = workers.find((w) => w.id === workerId)?.name ?? 'worker'
    toast.success(`Recorded: ${OUTCOME_META[saved.type].label} — ${who}.`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Record outcome</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="oc-worker">Worker</Label>
            {lockedWorker ? (
              <div
                className="h-10 w-full rounded-lg border px-3 flex items-center text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)', color: 'var(--text-secondary)' }}
              >
                {lockedWorker.name} — {lockedWorker.title}
              </div>
            ) : (
              <select
                id="oc-worker"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableTypes.map((t) => {
                const active = type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickType(t.id)}
                    className="rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors"
                    style={{
                      borderColor: active ? 'var(--gold)' : 'var(--border)',
                      background: active ? 'var(--gold-muted)' : 'var(--surface-card)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {isKeyTask ? (
            <div className="space-y-1.5">
              <Label htmlFor="oc-task">Task</Label>
              <select
                id="oc-task"
                value={taskId}
                onChange={(e) => {
                  const id = e.target.value
                  setTaskId(id)
                  setLabel(tasks.find((t) => t.id === id)?.title ?? '')
                }}
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              >
                <option value="">Choose a task…</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} · {t.status}
                  </option>
                ))}
              </select>
              {tasks.length === 0 && (
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  No tasks yet — create one on the Tasks board first.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="oc-label" className="capitalize">
                {subject} name
              </Label>
              <Input
                id="oc-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={subject === 'case' ? 'e.g. Mensah v. Adjei' : 'e.g. Golden Tulip Ltd'}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="oc-date">Date</Label>
            <Input
              id="oc-date"
              type="date"
              value={date}
              max={todayInput()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oc-note">Note (optional)</Label>
            <Textarea
              id="oc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any context worth keeping."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} style={{ background: 'var(--gold)', color: 'white' }}>
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
