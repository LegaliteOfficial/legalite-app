'use client'

import { useState, useCallback, useEffect } from 'react'
import { Timer, Plus, AlertTriangle, CheckCircle2, Clock, Trash2, Pencil, Calendar, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Spinner } from '@/components/shared/Spinner'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
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

  // Check deadlines for notifications when data changes
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

  // Moved to module-scope pure functions below

  if (isLoading) return <PageSkeleton />

  const filters: { id: StatusFilter; label: string; icon: typeof Clock }[] = [
    { id: 'all', label: 'All', icon: Clock },
    { id: 'Pending', label: 'Pending', icon: Timer },
    { id: 'Done', label: 'Completed', icon: CheckCircle2 },
    { id: 'Missed', label: 'Missed', icon: AlertTriangle },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold" style={{ color: 'var(--navy)' }}>Deadline Engine</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            {stats?.overdue_count ? `${stats.overdue_count} overdue` : 'All deadlines on track'}
            {' '}&middot;{' '}
            {stats?.upcoming_this_week?.length ?? 0} due this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isNotificationSupported() && (
            <Button
              variant="outline"
              onClick={handleToggleNotifications}
              className="h-10 px-4 text-sm font-medium gap-2"
              style={{
                borderColor: notificationsEnabled ? 'var(--gold)' : 'var(--border)',
                color: notificationsEnabled ? 'var(--gold)' : '#6B7280',
                background: notificationsEnabled ? 'rgba(201,151,43,0.06)' : 'white',
              }}
            >
              {notificationsEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
            </Button>
          )}
          <Button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="h-10 px-5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, var(--gold), #B8860B)' }}
          >
            <Plus size={16} className="mr-1.5" />
            Add Deadline
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(192,57,43,0.08)' }}>
              <AlertTriangle size={16} style={{ color: '#C0392B' }} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Overdue</span>
          </div>
          <p className="font-heading text-2xl font-bold" style={{ color: stats?.overdue_count ? '#C0392B' : 'var(--navy)' }}>
            {stats?.overdue_count ?? 0}
          </p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,151,43,0.08)' }}>
              <Clock size={16} style={{ color: '#C9972B' }} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>This Week</span>
          </div>
          <p className="font-heading text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            {stats?.upcoming_this_week?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(46,125,79,0.08)' }}>
              <CheckCircle2 size={16} style={{ color: '#2E7D4F' }} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Total</span>
          </div>
          <p className="font-heading text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            {deadlines?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {filters.map((f) => {
          const Icon = f.icon
          const isActive = statusFilter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? 'var(--navy)' : 'white',
                color: isActive ? 'white' : '#374151',
                border: `1px solid ${isActive ? 'var(--navy)' : 'var(--border)'}`,
              }}
            >
              <Icon size={14} />
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Deadlines List */}
      {!deadlines?.length ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'white', borderColor: 'var(--border)' }}>
          <Timer size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No deadlines found.</p>
          <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>Click &quot;Add Deadline&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((d) => {
            const overdue = d.status === 'Pending' && isOverdue(d.due_date)
            return (
              <div
                key={d.id}
                className="group rounded-xl border p-4 flex items-center gap-4 transition-all hover:shadow-sm"
                style={{
                  background: 'white',
                  borderColor: overdue ? 'rgba(192,57,43,0.3)' : 'var(--border)',
                  borderLeft: overdue ? '4px solid #C0392B' : d.status === 'Done' ? '4px solid #2E7D4F' : '4px solid var(--gold)',
                }}
              >
                {/* Priority indicator */}
                <div className="flex-shrink-0">
                  {d.status === 'Done' ? (
                    <CheckCircle2 size={20} style={{ color: '#2E7D4F' }} />
                  ) : overdue ? (
                    <AlertTriangle size={20} style={{ color: '#C0392B' }} />
                  ) : (
                    <Calendar size={20} style={{ color: 'var(--gold)' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-heading text-sm font-bold truncate" style={{ color: 'var(--navy)', textDecoration: d.status === 'Done' ? 'line-through' : 'none' }}>
                      {d.title}
                    </h3>
                    <StatusBadge status={d.priority} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: '#6B7280' }}>
                    <span>{new Date(d.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {d.case_title && <span>&middot; {d.case_title}</span>}
                    <span
                      className="font-semibold"
                      style={{ color: overdue ? '#C0392B' : d.status === 'Done' ? '#2E7D4F' : '#C9972B' }}
                    >
                      {d.status === 'Done' ? 'Completed' : daysUntil(d.due_date)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.status === 'Pending' && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMarkDone(d.id)}>
                      <CheckCircle2 size={14} style={{ color: '#2E7D4F' }} />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(d)}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(d.id)}>
                    <Trash2 size={13} className="text-red-400" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg" style={{ color: 'var(--navy)' }}>
              {editId ? 'Edit Deadline' : 'New Deadline'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. File Statement of Defence" className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Due Date *</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} className="h-10" />
              </div>
              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: (v ?? 'Medium') as DeadlinePriority }))}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Linked Case</Label>
              <Select value={form.case_id} onValueChange={(v) => setForm((p) => ({ ...p, case_id: v ?? '' }))}>
                <SelectTrigger className="h-10"><SelectValue placeholder="-- Select case --" /></SelectTrigger>
                <SelectContent>
                  {(cases ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: '#6B7280' }}>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Optional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter className="rounded-b-2xl pt-3" style={{ background: 'rgba(13,27,42,0.02)' }}>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="text-white"
              style={{ background: 'var(--gold)' }}
            >
              {isPending ? <><Spinner size={14} /> Saving...</> : editId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
