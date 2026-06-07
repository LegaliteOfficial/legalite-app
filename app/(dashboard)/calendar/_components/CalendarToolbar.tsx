'use client'

import { Calendar as CalendarIcon, CalendarPlus, Check, CaretDown, CaretLeft, CaretRight, Funnel, DotsThree, RssSimple, Gear } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EVENT_TYPE_OPTIONS, VIEW_MODES, type EventTypeKey, type ViewMode } from '../_constants'
import { MonthPickerPopover } from './MonthPickerPopover'
import { ViewIcon } from './ViewIcon'

/**
 * Toolbar below the title row. Today + prev/next + month picker on the
 * left; "Synced" status, view-mode dropdown, event-type filter, and
 * the More menu on the right.
 */
export function CalendarToolbar({
  anchor,
  view,
  monthLabel,
  stepLabel,
  visibleTypes,
  onToday,
  onStep,
  onPickDate,
  onViewChange,
  onToggleType,
  onCalendarFeeds,
}: {
  anchor: Date
  view: ViewMode
  monthLabel: string
  stepLabel: { prev: string; next: string }
  visibleTypes: Set<EventTypeKey>
  onToday: () => void
  onStep: (direction: -1 | 1) => void
  onPickDate: (d: Date) => void
  onViewChange: (v: ViewMode) => void
  onToggleType: (key: EventTypeKey) => void
  onCalendarFeeds: () => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-6 py-3 border-b shrink-0"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          <CalendarIcon size={13} strokeWidth={1.75} />
          Today
        </Button>
        <div className="inline-flex items-center">
          <ChevronButton onClick={() => onStep(-1)} ariaLabel={stepLabel.prev} side="left">
            <CaretLeft size={14} strokeWidth={1.75} />
          </ChevronButton>
          <ChevronButton onClick={() => onStep(1)} ariaLabel={stepLabel.next} side="right">
            <CaretRight size={14} strokeWidth={1.75} />
          </ChevronButton>
        </div>
        <MonthPickerPopover
          anchorDate={anchor}
          label={monthLabel}
          onSelect={onPickDate}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[12px] mr-1" style={{ color: 'var(--text-muted)' }}>
          Synced
        </span>

        {/* View-mode dropdown. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
              >
                <ViewIcon mode={view} />
                {view}
                <CaretDown size={13} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-40">
            {VIEW_MODES.map((m) => (
              <DropdownMenuItem
                key={m}
                onClick={() => onViewChange(m)}
                className="text-[13px] cursor-pointer"
              >
                <ViewIcon mode={m} />
                {m}
                {view === m && (
                  <Check
                    size={12}
                    strokeWidth={2}
                    className="ml-auto"
                    style={{ color: 'var(--text-muted)' }}
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Event-type filter — multi-select. Badge shows how many are hidden. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Filter by event type"
              >
                <Funnel size={13} strokeWidth={1.75} />
                Event Types
                {visibleTypes.size < EVENT_TYPE_OPTIONS.length && (
                  <span
                    className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10.5px] font-semibold"
                    style={{
                      background: 'var(--accent-today-tint-strong)',
                      color: 'var(--accent-today)',
                    }}
                    aria-label={`${EVENT_TYPE_OPTIONS.length - visibleTypes.size} hidden`}
                  >
                    {EVENT_TYPE_OPTIONS.length - visibleTypes.size}
                  </span>
                )}
                <CaretDown size={13} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            {EVENT_TYPE_OPTIONS.map((opt) => {
              const active = visibleTypes.has(opt.key)
              return (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={(e) => {
                    // Keep the menu open as the user toggles multiple types.
                    e.preventDefault?.()
                    onToggleType(opt.key)
                  }}
                  className="text-[13px] cursor-pointer"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: `var(${opt.dotVar})` }}
                  />
                  {opt.label}
                  {active && (
                    <Check
                      size={12}
                      strokeWidth={2}
                      className="ml-auto"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More menu — calendar-management entry points. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium cursor-pointer"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                }}
                aria-label="More calendar actions"
              >
                <DotsThree size={13} strokeWidth={1.75} />
                More
                <CaretDown size={13} strokeWidth={1.75} />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => toast.info('Multiple calendars ship with the matter-team workspace.')}
              className="text-[13px] cursor-pointer"
            >
              <CalendarPlus size={13} strokeWidth={1.75} />
              Add new calendar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.info('Calendar settings open from Settings → Calendar.')}
              className="text-[13px] cursor-pointer"
            >
              <Gear size={13} strokeWidth={1.75} />
              Calendar settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onCalendarFeeds}
              className="text-[13px] cursor-pointer"
            >
              <RssSimple size={13} strokeWidth={1.75} />
              Calendar feeds
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function ChevronButton({
  onClick,
  ariaLabel,
  side,
  children,
}: {
  onClick: () => void
  ariaLabel: string
  side: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center h-9 w-9 border cursor-pointer ${
        side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg border-l-0'
      }`}
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-card)',
        color: 'var(--text-secondary)',
      }}
      aria-label={ariaLabel}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-card)' }}
    >
      {children}
    </button>
  )
}
