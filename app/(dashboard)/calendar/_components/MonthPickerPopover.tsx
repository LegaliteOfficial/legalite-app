'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { addDays, sameDay, startOfWeek } from '../_lib/date'

/**
 * Trigger renders the current month label (e.g. "May 2026"). Opening
 * shows a popover with a 7-column grid; picking a day calls
 * `onSelect(date)` so the parent can shift its view. The popover has
 * its own month state so the user can browse months without committing
 * — only clicking a day commits.
 *
 * Highlight rules:
 *   - Today  → filled gold circle so the user can find "now" at a glance
 *   - The week containing `anchorDate` → gold row tint
 *   - Days outside the viewed month → muted color
 */
export function MonthPickerPopover({
  anchorDate,
  label,
  onSelect,
}: {
  anchorDate: Date
  label: string
  onSelect: (d: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const [viewedMonth, setViewedMonth] = useState(
    () => new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1),
  )
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Click-outside closes.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Resync the picker month whenever the popover opens — covers the case
  // where the user navigated the main calendar while the picker was closed.
  useEffect(() => {
    if (!open) return
    setViewedMonth(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1))
  }, [open, anchorDate])

  // 6 × 7 day grid starting at the Sunday on/before the 1st.
  const days = useMemo(() => {
    const first = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), 1)
    const gridStart = addDays(first, -first.getDay())
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [viewedMonth])

  const today = new Date()
  const anchorWeekStart = startOfWeek(anchorDate)
  const anchorWeekEnd = addDays(anchorWeekStart, 6)

  const monthHeader = viewedMonth.toLocaleDateString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[14px] font-semibold cursor-pointer transition-colors"
        style={{
          color: open ? 'var(--accent-today)' : 'var(--text-primary)',
          background: open ? 'var(--accent-today-tint-strong)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (open) return
          e.currentTarget.style.background = 'var(--surface-sunken)'
        }}
        onMouseLeave={(e) => {
          if (open) return
          e.currentTarget.style.background = 'transparent'
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label}
        <CaretDown size={13} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl border p-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 320,
          }}
          role="dialog"
          aria-label="Pick a date"
        >
          <PopoverHeader
            label={monthHeader}
            onPrev={() => setViewedMonth(addMonthsLocal(viewedMonth, -1))}
            onNext={() => setViewedMonth(addMonthsLocal(viewedMonth, 1))}
          />
          <WeekdayHeader />
          <DayGrid
            days={days}
            viewedMonth={viewedMonth.getMonth()}
            today={today}
            anchorDate={anchorDate}
            anchorWeekStart={anchorWeekStart}
            anchorWeekEnd={anchorWeekEnd}
            onSelect={(d) => {
              onSelect(d)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── Internal pieces ────────────────────────────────────────────────────────

function PopoverHeader({
  label,
  onPrev,
  onNext,
}: {
  label: string
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {label}
      </div>
      <div className="inline-flex items-center gap-1">
        <NavButton onClick={onPrev} ariaLabel="Previous month">
          <CaretLeft size={14} strokeWidth={1.75} />
        </NavButton>
        <NavButton onClick={onNext} ariaLabel="Next month">
          <CaretRight size={14} strokeWidth={1.75} />
        </NavButton>
      </div>
    </div>
  )
}

function NavButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

function WeekdayHeader() {
  return (
    <div
      className="grid grid-cols-7 gap-0.5 mb-1 text-[11px] font-semibold text-center"
      style={{ color: 'var(--text-muted)' }}
    >
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <div key={i} className="py-1">{d}</div>
      ))}
    </div>
  )
}

function DayGrid({
  days,
  viewedMonth,
  today,
  anchorDate,
  anchorWeekStart,
  anchorWeekEnd,
  onSelect,
}: {
  days: Date[]
  viewedMonth: number
  today: Date
  anchorDate: Date
  anchorWeekStart: Date
  anchorWeekEnd: Date
  onSelect: (d: Date) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-0.5">
      {days.map((d, i) => {
        const inMonth = d.getMonth() === viewedMonth
        const isToday = sameDay(d, today)
        const inAnchorWeek = d >= anchorWeekStart && d <= anchorWeekEnd
        const isAnchor = sameDay(d, anchorDate)
        const weekBg = inAnchorWeek ? 'var(--accent-today-tint-strong)' : 'transparent'
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(d)}
            className="relative h-9 inline-flex items-center justify-center text-[12.5px] tabular-nums cursor-pointer transition-colors"
            style={{
              color: inMonth ? 'var(--text-primary)' : 'var(--text-subtle)',
              background: weekBg,
              // Pill rounding on the left/right edges of the selected
              // week so the strip reads as a single band.
              borderTopLeftRadius:    inAnchorWeek && d.getDay() === 0 ? 999 : 6,
              borderBottomLeftRadius: inAnchorWeek && d.getDay() === 0 ? 999 : 6,
              borderTopRightRadius:   inAnchorWeek && d.getDay() === 6 ? 999 : 6,
              borderBottomRightRadius:inAnchorWeek && d.getDay() === 6 ? 999 : 6,
            }}
            onMouseEnter={(e) => {
              if (inAnchorWeek) return
              e.currentTarget.style.background = 'var(--surface-sunken)'
            }}
            onMouseLeave={(e) => {
              if (inAnchorWeek) return
              e.currentTarget.style.background = 'transparent'
            }}
            aria-pressed={isAnchor}
            aria-current={isToday ? 'date' : undefined}
          >
            {isToday && (
              <span
                aria-hidden
                className="absolute inset-0 m-auto inline-block h-7 w-7 rounded-full"
                style={{ background: 'var(--accent-today)' }}
              />
            )}
            <span
              className="relative"
              style={{
                color: isToday
                  ? 'var(--navy)'
                  : inMonth
                    ? 'var(--text-primary)'
                    : 'var(--text-subtle)',
                fontWeight: isToday ? 700 : 500,
              }}
            >
              {d.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Local addMonths to avoid the date-clamping in lib/date — popover's
 *  "step a month" doesn't need day clamping since it pins to the 1st. */
function addMonthsLocal(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
