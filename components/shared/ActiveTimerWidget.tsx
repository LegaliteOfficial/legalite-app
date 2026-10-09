'use client'

/**
 * ActiveTimerWidget
 * -----------------
 * Floating bottom-right indicator that shows whenever a billable
 * timer is running. Three jobs:
 *
 *   1. Constant visibility — so the partner can't forget the
 *      timer is on. The forgotten-timer failure mode is the whole
 *      reason for the 30-min prompt; this widget is the passive
 *      version of the same defence.
 *   2. Live readout — client name, elapsed time (ticking), accrued
 *      amount. Glance-able context without having to navigate
 *      anywhere.
 *   3. One-click stop — for partners who just want to end the
 *      session without waiting for the next prompt.
 *
 * Mounted at the dashboard layout level (via TimeTrackerBoot) so
 * it persists across navigations. Disappears whenever
 * `active_entry_id` is null — i.e. no timer running.
 *
 * Starts fixed bottom-right (above the mobile tab bar on phones) and
 * can be dragged anywhere — mouse, touch or pen — so it never sits on
 * top of something the user needs. Arrow keys move it when focused; a
 * double-click returns it to the corner. The position is remembered in
 * this browser and kept on screen when the window resizes. Z-index is
 * below the CheckInDialog overlay so the prompt always wins.
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Clock, DotsSixVertical, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useClients } from '@/hooks/use-clients'
import {
  formatDuration,
  getElapsedSeconds,
  useTimeTrackerStore,
} from '@/stores/time-tracker-local.store'

// Use the shared currency formatter so changing the firm currency
// in Billing Gear flows through to the floating timer widget
// without per-file maintenance.
import { formatCurrency as fmtMoney } from '@/lib/format-currency'

const POSITION_KEY = 'll:timer-widget-position'
/** Pixels the pointer must travel before a press becomes a drag. */
const DRAG_THRESHOLD = 4
const EDGE_GAP = 8
const KEY_STEP = 16

type Position = { x: number; y: number }

function readSavedPosition(): Position | null {
  try {
    const raw = window.localStorage.getItem(POSITION_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<Position>
    return typeof p.x === 'number' && typeof p.y === 'number' ? { x: p.x, y: p.y } : null
  } catch {
    return null
  }
}

function savePosition(p: Position | null) {
  try {
    if (p) window.localStorage.setItem(POSITION_KEY, JSON.stringify(p))
    else window.localStorage.removeItem(POSITION_KEY)
  } catch {
    // Storage unavailable (private mode, blocked): position just isn't remembered.
  }
}

/** Keeps the widget fully inside the viewport. */
function clampToViewport(p: Position, el: HTMLElement | null): Position {
  const w = el?.offsetWidth ?? 260
  const h = el?.offsetHeight ?? 60
  return {
    x: Math.min(Math.max(EDGE_GAP, p.x), window.innerWidth - w - EDGE_GAP),
    y: Math.min(Math.max(EDGE_GAP, p.y), window.innerHeight - h - EDGE_GAP),
  }
}

export function ActiveTimerWidget() {
  // Scalar subscriptions only — re-render when the active entry
  // changes, not on every tick of every other entry.
  const activeId = useTimeTrackerStore((s) => s.active_entry_id)
  const stopTimer = useTimeTrackerStore((s) => s.stopTimer)
  // revision lets us pick up rate/description edits to the running
  // entry, if those happen later.
  const revision = useTimeTrackerStore((s) => s.revision)
  void revision

  const entry =
    activeId == null
      ? null
      : useTimeTrackerStore.getState().entries[activeId] ?? null

  // 1-second tick for the live duration + amount. Only runs while
  // a timer is actually active — when activeId flips to null the
  // effect cleans up its interval.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!activeId) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [activeId])

  // ── Dragging ──────────────────────────────────────────────────────────
  const widgetRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position | null>(() =>
    typeof window === 'undefined' ? null : readSavedPosition(),
  )
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean; last: Position | null } | null>(null)

  // Keep a saved / dragged position on screen when the window resizes.
  useEffect(() => {
    if (!position) return
    const onResize = () => setPosition((p) => (p ? clampToViewport(p, widgetRef.current) : p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [position])

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    // The stop button keeps working as a plain button.
    if ((e.target as HTMLElement).closest('button')) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    drag.current = { startX: e.clientX, startY: e.clientY, originX: rect.left, originY: rect.top, moved: false, last: null }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
    }
    d.last = clampToViewport({ x: d.originX + dx, y: d.originY + dy }, widgetRef.current)
    setPosition(d.last)
  }, [])

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (d?.moved) {
      setDragging(false)
      savePosition(d.last)
    }
  }, [])

  const resetPosition = useCallback(() => {
    setPosition(null)
    savePosition(null)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    }
    const step = delta[e.key]
    if (!step || e.target !== e.currentTarget) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const next = clampToViewport({ x: rect.left + step[0], y: rect.top + step[1] }, widgetRef.current)
    setPosition(next)
    savePosition(next)
  }, [])

  const { data: clients } = useClients()
  const clientName =
    entry == null
      ? '—'
      : clients?.find((c) => c.id === entry.client_id)?.full_name ?? '—'

  if (!entry) return null

  const elapsedSec = getElapsedSeconds(entry)
  const accrued =
    Math.round((elapsedSec / 3600) * entry.rate_at_start * 100) / 100

  const handleStop = () => {
    stopTimer(entry.id)
    toast.success(
      `Timer stopped. ${formatDuration(elapsedSec)} logged against ${clientName} (${fmtMoney(accrued)}).`,
    )
  }

  return (
    <div
      ref={widgetRef}
      role="status"
      aria-label="Active billable timer. Drag or use the arrow keys to move it; double-click to reset."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        if (!(e.target as HTMLElement).closest('button')) resetPosition()
      }}
      onKeyDown={onKeyDown}
      // Default spot: bottom-right, lifted above the mobile tab bar
      // below lg. Once moved, left/top take over.
      className={position ? 'outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]' : 'bottom-5 right-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] max-lg:bottom-[calc(76px+env(safe-area-inset-bottom))] max-lg:right-3'}
      // zIndex 40 keeps us above page content but below the dialog
      // overlay (which sits at 50).
      style={{
        position: 'fixed',
        ...(position ? { left: position.x, top: position.y } : {}),
        touchAction: 'none',
        userSelect: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: 40,
        boxShadow: '0 14px 42px rgba(13,27,42,0.22)',
        background: 'var(--navy)',
        color: 'white',
        borderRadius: 14,
        padding: '10px 12px 10px 8px',
        minWidth: 260,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Grip — signals the widget can be moved. */}
      <DotsSixVertical
        aria-hidden
        size={16}
        weight="bold"
        style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0, marginRight: -4 }}
      />

      {/* Pulsing dot — communicates "live" without animating any
          actual numbers (which would distract from real-time UI). */}
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: 'var(--gold)',
          boxShadow: '0 0 0 0 rgba(201,151,43,0.6)',
          animation: 'll-timer-pulse 1.6s ease-in-out infinite',
          flexShrink: 0,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 600,
          }}
        >
          Timing
        </span>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 220,
          }}
          title={clientName}
        >
          {clientName}
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.78)',
            fontVariantNumeric: 'tabular-nums',
            marginTop: 1,
          }}
        >
          <Clock
            size={10}
            strokeWidth={2}
            style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }}
          />
          {formatDuration(elapsedSec)} · {fmtMoney(accrued)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleStop}
        aria-label="Stop timer"
        title="Stop timer"
        style={{
          marginLeft: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.16)',
          color: 'white',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(190,53,52,0.32)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        }}
      >
        <XCircle size={14} strokeWidth={2} />
      </button>

      {/* Inline keyframes scoped via a unique animation name so we
          don't pollute the global animation namespace. */}
      <style>{`
        @keyframes ll-timer-pulse {
          0% { box-shadow: 0 0 0 0 rgba(201,151,43,0.55); }
          70% { box-shadow: 0 0 0 12px rgba(201,151,43,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,151,43,0); }
        }
      `}</style>
    </div>
  )
}
