'use client'

/**
 * A navy panel that grows out of the cream page as it scrolls into view.
 *
 * Instead of a hard full-bleed colour change, the panel starts as an inset,
 * rounded card (the same shape as the navy docket tile in the hero) and
 * widens toward the page edges as the visitor scrolls. It never reaches the
 * edges, so a cream margin always frames it and the page reads as one
 * surface. Children can read `--panel-progress` (0 to 1) and
 * `--panel-scale` (the visible width ratio) to move with it. Driven by a
 * clip-path inset so only compositing work happens on scroll. Under
 * reduced motion it renders in its final state.
 */

import { useEffect, useRef, type ReactNode } from 'react'

// Inset at the start and end of the reveal, as a fraction of viewport width.
const START_INSET = 0.1
const END_INSET = 0.012
const START_RADIUS = 48
const END_RADIUS = 28

export function ExpandingPanel({
  id,
  className = '',
  children,
}: {
  id?: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = (p: number) => {
      const vw = window.innerWidth
      const inset = (START_INSET + (END_INSET - START_INSET) * p) * vw
      const radius = START_RADIUS + (END_RADIUS - START_RADIUS) * p
      el.style.clipPath = `inset(0 ${inset}px round ${radius}px)`
      el.style.setProperty('--panel-progress', p.toFixed(3))
      // Scale the contents to the visible width so nothing is clipped while
      // the panel is still narrow.
      const visible = 1 - (2 * inset) / vw
      el.style.setProperty('--panel-scale', (visible / (1 - 2 * END_INSET)).toFixed(4))
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(1)
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when the panel's top edge enters at the bottom of the viewport,
      // 1 once it has climbed to 25% from the top.
      const raw = (vh - rect.top) / (vh * 0.75)
      apply(Math.min(1, Math.max(0, raw)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{ clipPath: `inset(0 ${START_INSET * 100}vw round ${START_RADIUS}px)` }}
    >
      {children}
    </section>
  )
}
