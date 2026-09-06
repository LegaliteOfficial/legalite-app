'use client'

/**
 * Gently reveals its children when they scroll into view (and on first load if
 * already visible). Slides in from a side with a soft fade. Respects the user's
 * reduced-motion preference by showing instantly.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'

type From = 'left' | 'right' | 'up'

export function Reveal({
  children,
  from = 'up',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  from?: From
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hidden =
    from === 'left'
      ? '-translate-x-10 opacity-0'
      : from === 'right'
        ? 'translate-x-10 opacity-0'
        : 'translate-y-8 opacity-0'

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-out will-change-transform ${
        shown ? 'translate-x-0 translate-y-0 opacity-100' : hidden
      } ${className}`}
    >
      {children}
    </div>
  )
}
