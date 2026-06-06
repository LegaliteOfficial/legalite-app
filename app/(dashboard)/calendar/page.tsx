'use client'

/**
 * Calendar page — composition root only.
 *
 * State + derived data live in _hooks/use-calendar-page-state; rendering
 * chunks live in _components; pure helpers in _lib; static
 * types/constants in _types and _constants.
 */

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { eventToDeadline } from './_lib/adapt'

import { CalendarHeader } from './_components/CalendarHeader'
import { CalendarToolbar } from './_components/CalendarToolbar'
import { DayHeaderRow } from './_components/DayHeaderRow'
import { EventDialog } from './_components/EventDialog'
import { MonthGrid } from './_components/MonthGrid'
import { ReminderDialog } from './_components/ReminderDialog'
import { TimeGridBody } from './_components/TimeGridBody'
import { useCalendarPageState } from './_hooks/use-calendar-page-state'

export default function CalendarPage() {
  const { data: events } = useCalendarEvents()
  const router = useRouter()
  const deadlines = useMemo(() => events?.map(eventToDeadline), [events])
  const state = useCalendarPageState(deadlines)

  return (
    // Single page-wide `--surface-card` so header / toolbar / grid all
    // sit on the same surface.
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--surface-card)' }}
    >
      <CalendarHeader
        onOpenReminder={() => state.setReminderDialogOpen(true)}
        onOpenCreate={() => state.openCreateDialog()}
      />

      <CalendarToolbar
        anchor={state.anchor}
        view={state.view}
        monthLabel={state.monthLabel}
        stepLabel={state.stepLabel}
        visibleTypes={state.visibleTypes}
        onToday={() => state.setAnchor(new Date())}
        onStep={state.stepAnchor}
        onPickDate={(d) => state.setAnchor(d)}
        onViewChange={state.setView}
        onToggleType={state.toggleType}
        onCalendarFeeds={() => router.push('/calendar/feeds')}
      />

      {state.view !== 'Month' && (
        <>
          <DayHeaderRow visibleDays={state.visibleDays} now={state.now} />
          <TimeGridBody
            ref={state.scrollerRef}
            visibleDays={state.visibleDays}
            now={state.now}
            eventsByDay={state.eventsByDay}
            onSlotClick={(day, slot) =>
              state.openCreateDialog({ date: day, ...slot })
            }
            onEventClick={state.openEditDialog}
          />
        </>
      )}

      {state.view === 'Month' && (
        <MonthGrid
          days={state.visibleDays}
          anchorMonth={state.anchor.getMonth()}
          today={state.now}
          eventsByDay={state.eventsByDay}
          onDayClick={(day) =>
            state.openCreateDialog({
              date: day,
              startMinutes: 9 * 60,
              endMinutes: 10 * 60,
            })
          }
          onEventClick={state.openEditDialog}
        />
      )}

      <EventDialog
        open={state.eventDialog.open}
        onOpenChange={(o) => (o ? null : state.closeEventDialog())}
        prefill={state.eventDialog.prefill}
        editing={state.eventDialog.editing}
      />
      <ReminderDialog
        open={state.reminderDialogOpen}
        onOpenChange={state.setReminderDialogOpen}
      />
    </div>
  )
}
