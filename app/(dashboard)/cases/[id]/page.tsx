'use client'

/**
 * Case detail.
 *
 *   Header      breadcrumb, editable title, status, primary actions
 *   Key facts   client, practice area / stage, court + suit, next court
 *               date, limitation date, open work: the things a lawyer
 *               checks first, each with a countdown where it matters
 *   Attention   missed or imminent dates, overdue tasks, no owner
 *   Tabs        Overview / Documents / Tasks / Calendar / Details
 *
 * The tab lives in the URL (?tab=) so a link can open a case on, say, its
 * tasks. All data is live: tasks, events, documents and the team come
 * from their own queries, filtered to this case.
 */

import { use, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Bank,
  CalendarBlank,
  CaretDown,
  CaretRight,
  Clock,
  Copy,
  DotsThree,
  FilePlus,
  Hourglass,
  ListChecks,
  PencilSimple,
  Plus,
  Scales,
  Trash,
  User,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { CaseEventComposerDialog } from '@/components/shared/CaseEventComposerDialog'
import { StartTimerDialog } from '@/components/shared/StartTimerDialog'
import { AttachmentsPanel } from '@/components/shared/AttachmentsPanel'
import { TaskComposerDialog } from '@/components/shared/TaskComposerDialog'
import { useCase, useDeleteCase, useUpdateCase } from '@/hooks/use-cases'
import { useCaseAssignments } from '@/hooks/use-case-assignments'
import { useClients } from '@/hooks/use-clients'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { useDocuments } from '@/hooks/use-documents'
import { useTasks } from '@/hooks/use-tasks'
import { displayCaseCode } from '@/lib/reference-code'
import { cn } from '@/lib/utils'
import { confirmAction } from '@/stores/confirm.store'
import type { CaseStatus } from '@/types'
import { CaseDocumentsSection } from './_components/CaseDocuments'
import { CalendarTab, splitEvents } from './_components/detail/CalendarTab'
import { DetailsTab } from './_components/detail/DetailsTab'
import { OverviewTab } from './_components/detail/OverviewTab'
import { EditableText } from './_components/detail/primitives'
import { TasksTab, splitTasks } from './_components/detail/TasksTab'
import {
  ageSince,
  attentionItems,
  daysUntil,
  fmtDate,
  parseCaseDetails,
  relativeDays,
  urgencyOf,
  URGENCY_STYLE,
  type CaseTab,
} from './_lib/case-details'
import { useCan } from '@/lib/access'

const STATUS: Record<CaseStatus, { dot: string; bg: string; fg: string; hint: string }> = {
  Open: { dot: '#12B76A', bg: 'rgba(18,183,106,0.12)', fg: '#067647', hint: 'Active work' },
  Pending: { dot: '#F79009', bg: 'rgba(247,144,9,0.14)', fg: '#B54708', hint: 'Waiting on a decision or party' },
  Closed: { dot: '#98A2B3', bg: 'rgba(13,27,42,0.06)', fg: '#475467', hint: 'No further work' },
}

const TABS: { id: CaseTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'details', label: 'Details' },
]

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { data: kase, isLoading, error } = useCase(id)
  const { data: clients } = useClients()
  const { data: allEvents, refetch: refetchEvents } = useCalendarEvents()
  const { data: allTasks } = useTasks()
  const { data: documents } = useDocuments({ caseId: id })
  const { data: assignments } = useCaseAssignments(id)
  const updateMutation = useUpdateCase()
  const deleteMutation = useDeleteCase()

  const [eventOpen, setEventOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [timerOpen, setTimerOpen] = useState(false)

  const tabParam = searchParams.get('tab') as CaseTab | null
  const tab: CaseTab = TABS.some((t) => t.id === tabParam) ? (tabParam as CaseTab) : 'overview'
  const goTo = useCallback(
    (next: CaseTab) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (next === 'overview') sp.delete('tab')
      else sp.set('tab', next)
      const qs = sp.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const details = useMemo(() => parseCaseDetails(kase?.details), [kase?.details])
  const client = useMemo(() => (clients ?? []).find((c) => c.id === kase?.client_id) ?? null, [clients, kase?.client_id])
  const events = useMemo(() => (allEvents ?? []).filter((e) => e.case_id === id), [allEvents, id])
  const tasks = useMemo(() => (allTasks ?? []).filter((t) => t.case_id === id), [allTasks, id])
  const taskGroups = useMemo(() => splitTasks(tasks), [tasks])
  const eventGroups = useMemo(() => splitEvents(events), [events])

  /** Saves core columns. Resolves false (and toasts) when the save fails. */
  const patch = useCallback(
    async (data: Record<string, unknown>, message = 'Case updated.') => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMutation.mutateAsync({ id, data: data as any })
        toast.success(message)
        return true
      } catch (err) {
        toast.error(err instanceof Error && err.message ? `Update failed: ${err.message}` : 'Update failed. Please try again.')
        return false
      }
    },
    [id, updateMutation],
  )

  const canEdit = useCan('edit-case-properties')
  const canDelete = useCan('delete-cases')
  if (isLoading) return <PageSkeleton />
  if (error || !kase) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-12">
          <div className="mx-auto max-w-md rounded-2xl border px-8 py-10 text-center" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)' }}>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{error ? 'Unable to load case' : 'Case not found'}</p>
            <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>The case may have been deleted or you may not have access.</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/cases')} className="mt-5">Back to cases</Button>
          </div>
        </div>
      </div>
    )
  }

  const code = displayCaseCode(kase.case_code)
  const attention = attentionItems({
    status: kase.status,
    nextCourtDate: kase.next_court_date,
    statuteDate: details.statute_of_limitations_date,
    statuteSatisfied: details.statute_of_limitations_satisfied,
    overdueTasks: taskGroups.overdue.length,
    responsible: kase.assigned_lawyer,
    teamSize: assignments?.length ?? 0,
  })
  const openTasks = tasks.length - taskGroups.done.length
  const counts: Partial<Record<CaseTab, number>> = {
    documents: documents?.length ?? 0,
    tasks: openTasks,
    calendar: eventGroups.upcoming.length,
  }

  const changeStatus = async (next: CaseStatus) => {
    if (next === kase.status) return
    if (next === 'Closed') {
      const pending = openTasks + eventGroups.upcoming.length
      await confirmAction({
        title: 'Close this case?',
        description: 'The close date is recorded and the case moves out of active work. You can reopen it later.',
        details: pending > 0
          ? [
              openTasks > 0 ? `${openTasks} open task${openTasks === 1 ? '' : 's'} will stay open` : '',
              eventGroups.upcoming.length > 0 ? `${eventGroups.upcoming.length} upcoming event${eventGroups.upcoming.length === 1 ? '' : 's'} stay on the calendar` : '',
            ].filter(Boolean)
          : undefined,
        tone: 'warning',
        confirmLabel: 'Close case',
        successLabel: 'Case closed',
        onConfirm: async () => {
          if (!(await patch({ status: next }, 'Case closed.'))) throw new Error('The case could not be closed.')
        },
      })
      return
    }
    await patch({ status: next }, `Case marked ${next.toLowerCase()}.`)
  }

  const deleteCase = async () => {
    const ok = await confirmAction({
      title: 'Delete this case?',
      description: (
        <>
          <strong style={{ color: 'var(--navy)' }}>{kase.title}</strong> will be permanently deleted. This cannot be undone.
        </>
      ),
      details: [
        'The case team assignments are removed',
        'Documents, tasks and events stay, unlinked from the case',
      ],
      requireText: code ?? 'delete',
      tone: 'danger',
      confirmLabel: 'Delete case',
      successLabel: 'Case deleted',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(id)
        } catch {
          toast.error('Delete failed. Please try again.')
          throw new Error('The case could not be deleted.')
        }
      },
    })
    if (!ok) return
    toast.success('Case deleted.')
    router.push('/cases')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + pathname)
      toast.success('Link copied.')
    } catch {
      toast.error('Unable to copy the link.')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-5 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          <Link href="/cases" className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-black/5 hover:text-[var(--navy)]">
            <ArrowLeft size={13} className="sm:hidden" /> Cases
          </Link>
          <CaretRight size={11} className="max-sm:hidden" />
          <span className="truncate max-sm:hidden" style={{ color: 'var(--text-primary)' }}>{code ?? kase.title}</span>
        </nav>

        {/* Header card */}
        <header
          className="case-hero overflow-hidden rounded-2xl border"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:px-6 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {code && (
                  <span className="rounded-md px-1.5 py-0.5 font-mono text-[11.5px] font-medium tracking-wide" style={{ background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
                    {code}
                  </span>
                )}
                <StatusMenu status={kase.status} onChange={(s) => void changeStatus(s)} />
                {kase.case_stage && (
                  <span className="rounded-full border px-2 py-0.5 text-[11.5px] font-medium" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-secondary)' }}>
                    {kase.case_stage}
                  </span>
                )}
              </div>
              <EditableText
                value={kase.title}
                placeholder="Untitled case"
                label="Rename case"
                onSave={(v) => (v ? patch({ title: v }, 'Case renamed.') : Promise.resolve(false))}
                displayClassName="font-heading text-[24px] leading-tight tracking-tight sm:text-[26px]"
              />
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {client || kase.client_name ? (
                  client ? (
                    <Link href={`/clients/${client.id}`} className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>
                      <User size={13} /> {client.full_name}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--text-primary)' }}><User size={13} /> {kase.client_name}</span>
                  )
                ) : null}
                {kase.opposing_party && <span>v. {kase.opposing_party}</span>}
                <span aria-hidden>·</span>
                <span>
                  Opened {fmtDate(kase.date_opened ?? kase.created_at)} ({ageSince(kase.date_opened ?? kase.created_at)})
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                variant="outline"
                className="h-9 rounded-xl"
                disabled={!client}
                title={client ? 'Start a billable timer for this case' : 'Link a client to record time'}
                onClick={() => setTimerOpen(true)}
              >
                <Clock size={14} /> Log time
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button className="h-9 rounded-xl" style={{ background: 'var(--navy)', color: '#fff' }}>
                      <Plus size={14} weight="bold" /> New <CaretDown size={11} />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => setTaskOpen(true)}>
                    <ListChecks size={14} /> Task
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => setEventOpen(true)}>
                    <CalendarBlank size={14} /> Event or hearing
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => router.push(`/documents?case=${kase.id}`)}>
                    <FilePlus size={14} /> Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" aria-label="More actions">
                      <DotsThree size={16} weight="bold" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  {canEdit && (
                    <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => router.push(`/cases/${id}/edit`)}>
                      <PencilSimple size={14} /> Edit all fields
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer text-[13px]" onClick={() => void copyLink()}>
                    <Copy size={14} /> Copy link
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-[13px]" style={{ color: '#B42318' }} onClick={() => void deleteCase()}>
                        <Trash size={14} /> Delete case
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Key facts */}
          <div
            className="grid grid-cols-2 border-t md:grid-cols-3 xl:grid-cols-6"
            style={{ borderColor: 'var(--border-soft)', background: 'rgba(13,27,42,0.015)' }}
          >
            <Fact icon={<Scales size={14} />} label="Practice area" value={kase.case_type} sub={kase.case_stage ?? undefined} />
            <Fact icon={<Bank size={14} />} label="Court" value={kase.court} sub={kase.suit_number ? `Suit ${kase.suit_number}` : undefined} />
            <DateFact
              icon={<CalendarBlank size={14} />}
              label="Next court date"
              date={kase.next_court_date}
              closed={kase.status === 'Closed'}
            />
            <DateFact
              icon={<Hourglass size={14} />}
              label="Limitation date"
              date={details.statute_of_limitations_date}
              closed={kase.status === 'Closed' || details.statute_of_limitations_satisfied}
              closedLabel={details.statute_of_limitations_satisfied ? 'Satisfied' : undefined}
            />
            <Fact
              icon={<ListChecks size={14} />}
              label="Open tasks"
              value={String(openTasks)}
              sub={taskGroups.overdue.length > 0 ? `${taskGroups.overdue.length} overdue` : tasks.length ? `${taskGroups.done.length} done` : 'None yet'}
              subTone={taskGroups.overdue.length > 0 ? URGENCY_STYLE.overdue.fg : undefined}
              onClick={() => goTo('tasks')}
            />
            <Fact
              icon={<CalendarBlank size={14} />}
              label="Upcoming events"
              value={String(eventGroups.upcoming.length)}
              sub={eventGroups.upcoming[0] ? `Next ${relativeDays(daysUntil(eventGroups.upcoming[0].start_time) ?? 0)}` : 'None scheduled'}
              onClick={() => goTo('calendar')}
            />
          </div>
        </header>

        {/* Attention */}
        {attention.length > 0 && (
          <div className="case-attention mt-4 space-y-2" role="status">
            {attention.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => a.tab && goTo(a.tab)}
                className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] transition-colors hover:brightness-[0.98]"
                style={{
                  animationDelay: `${i * 60}ms`,
                  borderColor: a.tone === 'danger' ? 'rgba(217,45,32,0.25)' : 'rgba(247,144,9,0.3)',
                  background: a.tone === 'danger' ? 'rgba(217,45,32,0.06)' : 'rgba(247,144,9,0.07)',
                  color: a.tone === 'danger' ? '#912018' : '#93370D',
                }}
              >
                {a.tone === 'danger' ? <WarningCircle size={16} weight="fill" /> : <Warning size={16} weight="fill" />}
                <span className="flex-1">{a.text}</span>
                {a.tab && <CaretRight size={12} />}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="sticky top-0 z-10 -mx-4 mt-4 px-4 sm:-mx-6 sm:px-6" style={{ background: 'var(--surface-page)' }}>
          <div role="tablist" aria-label="Case sections" className="scrollbar-none flex gap-1 overflow-x-auto border-b" style={{ borderColor: 'var(--border-soft)' }}>
            {TABS.map((t) => {
              const active = t.id === tab
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => goTo(t.id)}
                  className={cn('case-tab relative inline-flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13.5px] font-medium transition-colors', active ? '' : 'hover:text-[var(--navy)]')}
                  style={{ color: active ? 'var(--navy)' : 'var(--text-muted)' }}
                >
                  {t.label}
                  {counts[t.id] !== undefined && counts[t.id]! > 0 && (
                    <span
                      className="rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums"
                      style={{ background: active ? 'var(--gold-muted)' : 'var(--surface-sunken)', color: active ? 'var(--gold-dark)' : 'var(--text-muted)' }}
                    >
                      {counts[t.id]}
                    </span>
                  )}
                  {active && <span className="case-tab-ink absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: 'var(--gold)' }} />}
                </button>
              )
            })}
          </div>
        </div>

        <div key={tab} className="case-tab-panel mt-4" role="tabpanel">
          {tab === 'overview' && (
            <OverviewTab
              kase={kase}
              details={details}
              client={client}
              tasks={tasks}
              events={events}
              documents={documents ?? []}
              patch={patch}
              goTo={goTo}
            />
          )}
          {tab === 'documents' && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border [&>section]:border-b-0" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-xs)' }}>
                <CaseDocumentsSection kase={kase} />
              </div>
              <AttachmentsPanel entityType="case" entityId={id} />
            </div>
          )}
          {tab === 'tasks' && <TasksTab caseId={id} tasks={tasks} />}
          {tab === 'calendar' && <CalendarTab events={events} onAdd={() => setEventOpen(true)} />}
          {tab === 'details' && <DetailsTab kase={kase} details={details} clients={clients ?? []} patch={patch} />}
        </div>

        {tab !== 'details' && (
          <p className="mt-6 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Every field recorded on this case is under{' '}
            <button type="button" onClick={() => goTo('details')} className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--gold-dark)' }}>
              Details
            </button>
            . Last updated {fmtDate(kase.updated_at)}.
          </p>
        )}
      </div>

      <CaseEventComposerDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        caseId={kase.id}
        caseTitle={kase.title}
        onSaved={() => void refetchEvents()}
      />
      <TaskComposerDialog open={taskOpen} onOpenChange={setTaskOpen} defaultCaseId={kase.id} />
      <StartTimerDialog
        open={timerOpen}
        onOpenChange={setTimerOpen}
        clientId={client?.id ?? null}
        caseId={kase.id}
        initialDescription={`Work on ${kase.title}`}
      />
    </div>
  )
}

function StatusMenu({ status, onChange }: { status: CaseStatus; onChange: (s: CaseStatus) => void }) {
  const s = STATUS[status] ?? STATUS.Open
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold transition hover:brightness-95"
            style={{ background: s.bg, color: s.fg }}
            aria-label={`Status: ${status}. Change status`}
          >
            <span className="case-status-dot h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} data-live={status === 'Open' || undefined} />
            {status}
            <CaretDown size={10} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Case status</DropdownMenuLabel>
          {(Object.keys(STATUS) as CaseStatus[]).map((k) => (
            <DropdownMenuItem key={k} disabled={k === status} onClick={() => onChange(k)} className="cursor-pointer items-start gap-2.5 py-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS[k].dot }} />
              <span>
                <span className="block text-[13px] font-medium">{k}</span>
                <span className="block text-[11.5px]" style={{ color: 'var(--text-muted)' }}>{STATUS[k].hint}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Fact({
  icon,
  label,
  value,
  sub,
  subTone,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
  sub?: string
  subTone?: string
  onClick?: () => void
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
        {icon} {label}
      </span>
      <span className={cn('mt-1 block truncate text-[14px] font-semibold', !value && 'font-normal italic')} style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value || 'Not set'}
      </span>
      {sub && <span className="mt-0.5 block truncate text-[12px]" style={{ color: subTone ?? 'var(--text-muted)' }}>{sub}</span>}
    </>
  )
  const cls = 'case-fact min-w-0 border-b border-r px-5 py-3.5 text-left xl:border-b-0'
  const style = { borderColor: 'var(--border-soft)' }
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'transition-colors hover:bg-black/[0.02]')} style={style}>{body}</button>
  ) : (
    <div className={cls} style={style}>{body}</div>
  )
}

function DateFact({
  icon,
  label,
  date,
  closed,
  closedLabel,
}: {
  icon: React.ReactNode
  label: string
  date?: string | null
  closed?: boolean
  closedLabel?: string
}) {
  const days = daysUntil(date)
  const u = closed ? URGENCY_STYLE.none : URGENCY_STYLE[urgencyOf(days)]
  return (
    <div className="case-fact min-w-0 border-b border-r px-5 py-3.5 xl:border-b-0" style={{ borderColor: 'var(--border-soft)' }}>
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>
        {icon} {label}
      </span>
      {date ? (
        <>
          <span className="mt-1 block truncate text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{fmtDate(date)}</span>
          <span className="mt-0.5 inline-flex rounded-full px-1.5 py-px text-[11.5px] font-semibold" style={{ color: u.fg, background: u.bg }}>
            {closedLabel ?? (days !== null ? relativeDays(days) : '')}
          </span>
        </>
      ) : (
        <span className="mt-1 block text-[14px] italic" style={{ color: 'var(--text-muted)' }}>Not set</span>
      )}
    </div>
  )
}

