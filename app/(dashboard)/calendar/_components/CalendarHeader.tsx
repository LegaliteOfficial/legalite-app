'use client'

import { Bell, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Sticky title row: page title on the left, Set reminder + New event
 * buttons on the right. No date/view controls here — those live in
 * the CalendarToolbar below.
 */
export function CalendarHeader({
  onOpenReminder,
  onOpenCreate,
}: {
  onOpenReminder: () => void
  onOpenCreate: () => void
}) {
  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-3.5 border-b shrink-0"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <h1
        className="text-[20px] font-semibold leading-tight tracking-tight inline-flex items-center gap-2.5"
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-heading, "Playfair Display", serif)',
        }}
      >
        <span
          className="inline-flex items-center justify-center h-7 w-7 rounded-md"
          style={{
            background: 'var(--accent-today-tint-strong)',
            color: 'var(--accent-today)',
          }}
          aria-hidden
        >
          <CalendarIcon size={14} strokeWidth={2} />
        </span>
        Calendar
      </h1>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenReminder}>
          <Bell size={13} strokeWidth={1.75} />
          Set reminder
        </Button>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer whitespace-nowrap"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-dark)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--gold)' }}
        >
          <Plus size={14} strokeWidth={2.25} />
          New event
        </button>
      </div>
    </header>
  )
}
