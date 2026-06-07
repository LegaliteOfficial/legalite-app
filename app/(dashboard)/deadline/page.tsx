'use client'

import { useState, useCallback, useEffect } from 'react'
import { Timer, Plus, Warning, CheckCircle, Clock, Trash, Pencil, Calendar, Bell, BellSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Spinner } from '@/components/shared/Spinner'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { useDeadlines, useDeadlineStats, useCreateDeadline, useUpdateDeadline, useDeleteDeadline } from '@/hooks/use-deadlines'
import { useCases } from '@/hooks/use-cases'
import { toast } from 'sonner'
import {
  isNotificationSupported,
  getNotificationPreference,
  requestNotificationPermission,
  disableNotifications,
  checkAndNotifyDeadlines,
} from '@/lib/notifications'

type StatusFilter = 'all' | 'Pending' | 'Done' | 'Missed'

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

function daysUntil(dueDate: string): string {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `${diff} days`
}

export default function DeadlinePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  type DeadlinePriority = 'High' | 'Medium' | 'Low'
  type DeadlineStatus = 'Pending' | 'Done' | 'Missed'
  interface DeadlineForm {
    title: string
    description: string
    due_date: string
    priority: DeadlinePriority
    status: DeadlineStatus
    case_id: string
    reminder_days: number
  }
  const [form, setForm] = useState<DeadlineForm>({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium',
    status: 'Pending',
    case_id: '',
    reminder_days: 3,
  })

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference())

  const handleToggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      disableNotifications()
      setNotificationsEnabled(false)
      toast.success('Deadline notifications disabled.')
    } else {
      const granted = await requestNotificationPermission()
      if (granted) {
        setNotificationsEnabled(true)
        toast.success('Deadline notifications enabled. You will be reminded before due dates.')
      } else {
        toast.error('Notification permission was denied. Please enable it in your browser settings.')
      }
    }
  }, [notificationsEnabled])

  const { data: deadlines, isLoading } = useDeadlines(statusFilter === 'all' ? undefined : statusFilter)
  const { data: stats } = useDeadlineStats()
  const { data: cases } = useCases()
  const createMutation = useCreateDeadline()
  const updateMutation = useUpdateDeadline()
  const deleteMutation = useDeleteDeadline()

  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (deadlines && notificationsEnabled) {
      checkAndNotifyDeadlines(deadlines)
    }
  }, [deadlines, notificationsEnabled])

  const resetForm = useCallback(() => {
    setForm({ title: '', description: '', due_date: '', priority: 'Medium', status: 'Pending', case_id: '', reminder_days: 3 })
    setEditId(null)
    setShowForm(false)
  }, [])

  const handleEdit = useCallback((d: (typeof deadlines extends (infer T)[] | undefined ? T : never)) => {
    if (!d) return
    setForm({
      title: d.title,
      description: d.description ?? '',
      due_date: d.due_date?.split('T')[0] ?? '',
      priority: d.priority,
      status: d.status,
      case_id: d.case_id ?? '',
      reminder_days: d.reminder_days ?? 3,
    })
    setEditId(d.id)
    setShowForm(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!form.title) { toast.error('Please enter a title.'); return }
    if (!form.due_date) { toast.error('Please select a due date.'); return }
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: form })
        toast.success('Deadline updated successfully.')
      } else {
        await createMutation.mutateAsync(form)
        toast.success('Deadline created successfully.')
      }
      resetForm()
    } catch {
      toast.error('Unable to save deadline. Please try again.')
    }
  }, [form, editId, createMutation, updateMutation, resetForm])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Deadline removed.')
    } catch {
      toast.error('Unable to delete deadline.')
    }
  }, [deleteMutation])

  const handleMarkDone = useCallback(async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: 'Done' } })
      toast.success('Deadline marked as done.')
    } catch {
      toast.error('Unable to update deadline.')
    }
  }, [updateMutation])

  if (isLoading) return <PageSkeleton />

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Done', label: 'Completed' },
    { id: 'Missed', label: 'Missed' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <PageHeader
          title="Deadlines"
          description={
            stats?.overdue_count
              ? `${stats.overdue_count} overdue · ${stats?.upcoming_this_week?.length ?? 0} due this week`
              : `${stats?.upcoming_this_week?.length ?? 0} due this week`
          }
          actions={
            <>
              {isNotificationSupported() && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleToggleNotifications}
                  className="rounded-lg"
                  style={{
                    borderColor: notificationsEnabled ? 'var(--gold)' : 'var(--border-default)',
                    color: notificationsEnabled ? 'var(--gold)' : 'var(--text-secondary)',
                  }}
                >
                  {notificationsEnabled ? <Bell size={14} strokeWidth={1.75} /> : <BellSlash size={14} strokeWidth={1.75} />}
                  {notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                </Button>
              )}
              <Button onClick={() => { resetForm(); setShowForm(true) }} size="lg" className="rounded-lg">
                <Plus size={14} strokeWidth={2} />
                Add deadline
              </Button>
            </>
          }
        />

        <div className="mt-6 grid grid-cols-3 gap-4">
          <DeadlineStat
            Icon={Warning}
            label="Overdue"
            value={stats?.overdue_count ?? 0}
            valueColor={stats?.overdue_count ? '#C0392B' : undefined}
          />
          <DeadlineStat Icon={Clock} label="This week" value={stats?.upcoming_this_week?.length ?? 0} />
          <DeadlineStat Icon={CheckCircle} label="Total" value={deadlines?.length ?? 0} />
        </div>

        <div className="mt-6 flex items-center gap-1">
          {filters.map((f) => {
            const isActive = statusFilter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--surface-sunken)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          {!deadlines?.length ? (
            <div
              className="rounded-2xl border px-6 py-16 text-center"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'var(--surface-sunken)' }}
              >
                <Timer size={18} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                No deadlines found
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Click &quot;Add deadline&quot; to create one.
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                {deadlines.map((d) => {
                  const overdue = d.status === 'Pending' && isOverdue(d.due_date)
                  const dotColor = d.status === 'Done' ? '#2E7D4F' : overdue ? '#C0392B' : 'var(--gold)'
                  const StatusIcon = d.status === 'Done' ? CheckCircle : overdue ? Warning : Calendar
                  return (
                    <li
                      key={d.id}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface-overlay)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--surface-sunken)' }}
                      >
                        <StatusIcon size={14} strokeWidth={1.75} style={{ color: dotColor }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3
                            className="text-[13.5px] font-medium truncate"
                            style={{
                              color: 'var(--text-primary)',
                              textDecoration: d.status === 'Done' ? 'line-through' : 'none',
                              opacity: d.status === 'Done' ? 0.6 : 1,
                            }}
                          >
                            {d.title}
                          </h3>
                          <StatusBadge status={d.priority} />
                        </div>
                        <div className="flex items-center gap-2 text-[11.5px] flex-wrap" style={{ color: 'var(--text-muted)' }}>
                          <span className="tabular-nums">
                            {new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {d.case_title && <><span>·</span><span>{d.case_title}</span></>}
                          <span>·</span>
                          <span
                            className="font-medium"
                            style={{
                              color: overdue ? '#C0392B' : d.status === 'Done' ? '#2E7D4F' : 'var(--text-secondary)',
                            }}
                          >
                            {d.status === 'Done' ? 'Completed' : daysUntil(d.due_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.status === 'Pending' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleMarkDone(d.id)}
                            aria-label="Mark done"
                          >
                            <CheckCircle size={13} style={{ color: '#2E7D4F' }} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(d)}
                          aria-label="Edit"
                        >
                          <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(d.id)}
                          aria-label="Delete"
                        >
                          <Trash size={13} style={{ color: 'var(--text-muted)' }} />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg" style={{ color: 'var(--text-primary)' }}>
                {editId ? 'Edit deadline' : 'New deadline'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. File Statement of Defence"
                  className="h-10"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Due date">
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                    className="h-10"
                  />
                </Field>
                <Field label="Priority">
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm((p) => ({ ...p, priority: (v ?? 'Medium') as DeadlinePriority }))}
                  >
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Linked case">
                <Select value={form.case_id} onValueChange={(v) => setForm((p) => ({ ...p, case_id: v ?? '' }))}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select case" /></SelectTrigger>
                  <SelectContent>
                    {(cases ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional notes…"
                  rows={3}
                />
              </Field>
            </div>
            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? <><Spinner size={14} /> Saving…</> : editId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function DeadlineStat({
  Icon, label, value, valueColor,
}: {
  Icon: typeof Warning
  label: string
  value: number
  valueColor?: string
}) {
  return (
    <Card padding="lg">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <Icon size={16} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <div
        className="font-heading text-[28px] font-semibold leading-none tracking-tight"
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {value}
      </div>
      <div className="mt-2 text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label
        className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </Label>
      {children}
    </div>
  )
}
