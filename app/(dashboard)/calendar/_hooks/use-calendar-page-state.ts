'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Deadline } from '@/hooks/use-deadlines'
import {
  EVENT_TYPE_OPTIONS,
  HOUR_HEIGHT,
  type EventTypeKey,
  type SlotPrefill,
  type ViewMode,
} from '../_constants'
import {
  addDays,
  addMonths,
  monthGridDays,
  sameDay,
  startOfWeek,
} from '../_lib/date'

interface EventDialogState {
  open: boolean
  prefill: SlotPrefill | null
  editing: Deadline | null
}

/**
 * Owns ALL calendar UI state — anchor date, view mode, event/reminder
 * dialogs, type filter, current time tick — and derives `visibleDays`,
 * `eventsByDay`, and the month label.
 *
 * Keep the page component purely presentational by reading from this
 * hook's returned object instead of new useState() calls.
 */
export function useCalendarPageState(deadlines: Deadline[] | undefined) {
  // Anchor date — the focus is on the week that contains this date.
  const [anchor, setAnchor] = useState<Date>(() => new Date())
  const [view, setView] = useState<ViewMode>('Week')

  // Dialog handles both create AND edit. `editing` carries the existing
  // Deadline when we're editing it; `prefill` carries the day + times
  // for a new event from a slot click. Mutually exclusive while open.
  const [eventDialog, setEventDialog] = useState<EventDialogState>({
    open: false,
    prefill: null,
    editing: null,
  })

  const openCreateDialog = useCallback((prefill?: SlotPrefill) => {
    setEventDialog({ open: true, prefill: prefill ?? null, editing: null })
  }, [])

  const openEditDialog = useCallback((deadline: Deadline) => {
    setEventDialog({ open: true, prefill: null, editing: deadline })
  }, [])

  // Only flip `open`; keep `editing`/`prefill` until the next open so
  // the title doesn't flash during the close animation.
  const closeEventDialog = useCallback(() => {
    setEventDialog((s) => ({ ...s, open: false }))
  }, [])

  // Standalone reminder composer.
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)

  // Tracks which event-type buckets the user wants to see.
  const [visibleTypes, setVisibleTypes] = useState<Set<EventTypeKey>>(
    () => new Set(EVENT_TYPE_OPTIONS.map((o) => o.key)),
  )
  const toggleType = useCallback((key: EventTypeKey) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Days visible in the grid — drives every downstream loop.
  const visibleDays = useMemo(() => {
    if (view === 'Day') return [anchor]
    if (view === 'Work week') {
      // Sunday → 6 days back; Mon → 0; … Sat → 5.
      const back = (anchor.getDay() + 6) % 7
      const monday = addDays(anchor, -back)
      monday.setHours(0, 0, 0, 0)
      return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
    }
    if (view === 'Month') return monthGridDays(anchor)
    const weekStart = startOfWeek(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [anchor, view])

  // Move the anchor one "page" forward or backward. Page-size depends on view.
  const stepAnchor = useCallback((direction: -1 | 1) => {
    setAnchor((d) => {
      if (view === 'Day') return addDays(d, direction)
      if (view === 'Month') return addMonths(d, direction)
      return addDays(d, direction * 7)
    })
  }, [view])

  const stepLabel = useMemo(() => {
    if (view === 'Day') return { prev: 'Previous day', next: 'Next day' }
    if (view === 'Month') return { prev: 'Previous month', next: 'Next month' }
    return { prev: 'Previous week', next: 'Next week' }
  }, [view])

  // Current time line — re-renders every 60s.
  const [now, setNow] = useState<Date>(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Auto-scroll the time grid to "now" on first mount.
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!scrollerRef.current) return
    const minutes = now.getHours() * 60 + now.getMinutes()
    const target = (minutes / 60) * HOUR_HEIGHT - 80
    scrollerRef.current.scrollTop = Math.max(target, 0)
    // Mount-only — subsequent now-ticks shouldn't hijack scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bucket events by visible-day index. Filter by ticked event types.
  const eventsByDay = useMemo(() => {
    const map = new Map<number, Deadline[]>()
    for (let i = 0; i < visibleDays.length; i++) map.set(i, [])
    for (const d of deadlines ?? []) {
      if (!visibleTypes.has(d.priority as EventTypeKey)) continue
      const due = new Date(d.due_date)
      for (let i = 0; i < visibleDays.length; i++) {
        if (sameDay(due, visibleDays[i])) {
          map.get(i)!.push(d)
          break
        }
      }
    }
    return map
  }, [deadlines, visibleDays, visibleTypes])

  // Month label for the toolbar — shows the month(s) the visible range covers.
  const monthLabel = useMemo(() => {
    if (view === 'Month') {
      return `${anchor.toLocaleString('default', { month: 'long' })} ${anchor.getFullYear()}`
    }
    const first = visibleDays[0]
    const last = visibleDays[visibleDays.length - 1]
    const startMonth = first.toLocaleString('default', { month: 'long' })
    const endMonth = last.toLocaleString('default', { month: 'long' })
    const year = last.getFullYear()
    return startMonth === endMonth ? `${startMonth} ${year}` : `${startMonth} / ${endMonth} ${year}`
  }, [visibleDays, view, anchor])

  return {
    // dates / view
    anchor, setAnchor,
    view, setView,
    visibleDays,
    stepAnchor, stepLabel,
    monthLabel,
    now,
    scrollerRef,
    // event dialog
    eventDialog,
    openCreateDialog,
    openEditDialog,
    closeEventDialog,
    // reminder dialog
    reminderDialogOpen, setReminderDialogOpen,
    // type filter
    visibleTypes, toggleType,
    // derived data
    eventsByDay,
  }
}

export type CalendarPageState = ReturnType<typeof useCalendarPageState>
