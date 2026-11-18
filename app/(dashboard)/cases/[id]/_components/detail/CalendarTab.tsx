'use client'

/**
 * Hearings, meetings and deadlines linked to the case, split into upcoming
 * and past. Attendees are the event's real attendees; past events show
 * the recorded outcome, if any.
 */

import { useState } from 'react'
import { CalendarBlank, CaretDown, MapPin, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/hooks/use-calendar'
import { cn } from '@/lib/utils'
import { daysUntil, titleCase, toDate } from '../../_lib/case-details'
import { Avatar, DueBadge, Panel } from './primitives'

export function splitEvents(events: CalendarEvent[], now = new Date()) {
  const live = events.filter((e) => e.status !== 'cancelled')
  const upcoming = live
    .filter((e) => new Date(e.end_time || e.start_time) >= now)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  const past = live
    .filter((e) => new Date(e.end_time || e.start_time) < now)
    .sort((a, b) => b.start_time.localeCompare(a.start_time))
  return { upcoming, past, cancelled: events.length - live.length }
}

export function CalendarTab({ events, onAdd }: { events: CalendarEvent[]; onAdd: () => void }) {
  const { upcoming, past } = splitEvents(events)
  const [showPast, setShowPast] = useState(upcoming.length === 0)

  return (
    <Panel
      title="Calendar"
      icon={<CalendarBlank size={15} weight="duotone" />}
      count={upcoming.length}
      action={
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus size={13} weight="bold" /> Add event
        </Button>
      }
    >
      {events.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--border-soft)' }}>
          <CalendarBlank size={28} weight="duotone" style={{ color: 'var(--gold)' }} />
          <p className="mt-2 text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>Nothing scheduled</p>
          <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
            Add hearings, meetings and filing deadlines so the team is reminded in time.
          </p>
          <Button size="sm" className="mt-4" onClick={onAdd}>
            <Plus size={13} weight="bold" /> Add an event
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 ? (
            <ul className="space-y-2">
              {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
            </ul>
          ) : (
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No upcoming events.</p>
          )}
          {past.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                aria-expanded={showPast}
                className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--text-muted)' }}
              >
                <CaretDown size={11} className={cn('transition-transform', !showPast && '-rotate-90')} />
                Past ({past.length})
              </button>
              {showPast && (
                <ul className="space-y-2">
                  {past.map((e) => <EventCard key={e.id} event={e} past />)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

function timeRange(e: CalendarEvent) {
  if (e.all_day) return 'All day'
  const s = toDate(e.start_time)
  const end = toDate(e.end_time)
  if (!s) return ''
  const t = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return end ? `${t(s)} – ${t(end)}` : t(s)
}

export function EventCard({ event, past, compact }: { event: CalendarEvent; past?: boolean; compact?: boolean }) {
  const d = toDate(event.start_time)
  const days = daysUntil(event.start_time)
  const people = event.attendees ?? []
  return (
    <li
      className={cn('flex items-start gap-3 rounded-xl border p-3 transition-colors', past && 'opacity-80')}
      style={{ borderColor: 'var(--border-soft)', background: days !== null && days >= 0 && days <= 2 && !past ? 'rgba(201,151,43,0.05)' : undefined }}
    >
      <div
        className="flex w-12 shrink-0 flex-col items-center rounded-lg py-1.5"
        style={{ background: past ? 'var(--surface-sunken)' : 'var(--navy)', color: past ? 'var(--text-muted)' : '#fff' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {d?.toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="font-heading text-[18px] leading-none">{d?.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
          {!past && <DueBadge date={event.start_time} />}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          <span>{d?.toLocaleDateString('en-GB', { weekday: 'short' })} · {timeRange(event)}</span>
          {event.event_type && <span>· {titleCase(event.event_type)}</span>}
          {event.location && (
            <span className="inline-flex items-center gap-0.5">
              · <MapPin size={11} /> {event.location}
            </span>
          )}
        </p>
        {past && event.outcome_status && (
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Outcome: <span className="font-medium">{titleCase(event.outcome_status)}</span>
            {event.outcome_notes ? ` · ${event.outcome_notes}` : ''}
          </p>
        )}
      </div>
      {!compact && people.length > 0 && (
        <span className="hidden shrink-0 -space-x-1.5 sm:flex" title={people.map((p) => p.name).join(', ')}>
          {people.slice(0, 4).map((p) => (
            <span key={p.id} className="rounded-full ring-2 ring-white">
              <Avatar name={p.name} src={p.avatar_url} size={24} />
            </span>
          ))}
          {people.length > 4 && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-white" style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
              +{people.length - 4}
            </span>
          )}
        </span>
      )}
    </li>
  )
}
