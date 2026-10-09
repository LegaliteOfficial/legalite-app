'use client'

/**
 * Drag a fixed-position element around the viewport.
 *
 * Built for the floating timer, which otherwise sits in the bottom right
 * corner and covers whatever is underneath it. The partner can now move it
 * out of the way without stopping the timer.
 *
 * Behaviour that matters:
 *
 *   - Pointer events, so a mouse, a finger and a pen all work from one
 *     code path.
 *   - A small movement threshold before a press counts as a drag, so
 *     clicking a button inside the widget does not nudge it.
 *   - The element is clamped inside the viewport on drag, on resize and on
 *     restore. A widget dragged to the edge and then reopened on a smaller
 *     screen would otherwise be unreachable, with no way to recover it.
 *   - The position is remembered per browser, because having to move it
 *     again after every navigation would be worse than not moving it.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  width: number
  height: number
}

/**
 * Keeps a box fully inside the viewport, leaving a margin so it never
 * sits flush against an edge. Exported for tests: this is the part that
 * silently loses the widget if it is wrong.
 */
export function clampToViewport(
  pos: Point,
  size: Bounds,
  viewport: Bounds,
  margin = 8,
): Point {
  // A box wider than the viewport pins to the left rather than drifting
  // off the right, which would hide its controls.
  const maxX = Math.max(margin, viewport.width - size.width - margin)
  const maxY = Math.max(margin, viewport.height - size.height - margin)
  return {
    x: Math.min(Math.max(pos.x, margin), maxX),
    y: Math.min(Math.max(pos.y, margin), maxY),
  }
}

/** Default resting place: bottom right, matching where it used to be fixed. */
export function defaultPosition(size: Bounds, viewport: Bounds, offset = 20): Point {
  return clampToViewport(
    { x: viewport.width - size.width - offset, y: viewport.height - size.height - offset },
    size,
    viewport,
    offset,
  )
}

function readStored(key: string): Point | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Point>
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return null
    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null
    return { x: parsed.x, y: parsed.y }
  } catch {
    // Private browsing, cleared storage, or a corrupt value: fall back.
    return null
  }
}

export function useDraggable({
  storageKey,
  disabled = false,
}: {
  /** localStorage key for the remembered position. */
  storageKey: string
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<Point | null>(null)
  const [dragging, setDragging] = useState(false)

  // Pointer offset within the element, so the widget does not jump to put
  // its corner under the cursor when the drag begins.
  const grab = useRef<Point>({ x: 0, y: 0 })
  const moved = useRef(false)

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })
  const size = useCallback((): Bounds => {
    const r = ref.current?.getBoundingClientRect()
    return { width: r?.width ?? 260, height: r?.height ?? 56 }
  }, [])

  // Place it on mount: stored position if there is one, otherwise the
  // bottom right corner it has always used.
  useEffect(() => {
    if (pos !== null) return
    const id = requestAnimationFrame(() => {
      const stored = readStored(storageKey)
      const next = stored
        ? clampToViewport(stored, size(), viewport())
        : defaultPosition(size(), viewport())
      setPos(next)
    })
    return () => cancelAnimationFrame(id)
  }, [pos, storageKey, size])

  // A window that shrinks must not strand the widget off screen.
  useEffect(() => {
    const onResize = () => {
      setPos((p) => (p ? clampToViewport(p, size(), viewport()) : p))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [size])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return
      // Let buttons, links and inputs inside the widget behave normally.
      if ((e.target as HTMLElement).closest('button,a,input,select,textarea')) return

      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      grab.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      moved.current = false
      setDragging(true)
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [disabled],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      // Ignore sub-pixel jitter so a press is not mistaken for a drag.
      if (!moved.current) {
        const rect = ref.current?.getBoundingClientRect()
        if (rect) {
          const dx = Math.abs(e.clientX - rect.left - grab.current.x)
          const dy = Math.abs(e.clientY - rect.top - grab.current.y)
          if (dx < 3 && dy < 3) return
        }
        moved.current = true
      }
      e.preventDefault()
      setPos(
        clampToViewport(
          { x: e.clientX - grab.current.x, y: e.clientY - grab.current.y },
          size(),
          viewport(),
        ),
      )
    },
    [dragging, size],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      setDragging(false)
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
      if (!moved.current || !pos) return
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(pos))
      } catch {
        // Storage unavailable: the widget still moved for this session.
      }
    },
    [dragging, pos, storageKey],
  )

  return {
    ref,
    /** Null until measured, so the widget is not painted in the wrong spot first. */
    position: pos,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
