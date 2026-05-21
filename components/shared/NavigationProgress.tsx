'use client'

import { useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const barRef = useRef<HTMLDivElement>(null)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    const bar = barRef.current
    if (!bar) return

    // Reset and animate
    bar.style.transition = 'none'
    bar.style.width = '0%'
    bar.style.opacity = '1'

    // Force reflow
    void bar.offsetWidth

    // Animate to 80%
    bar.style.transition = 'width 300ms ease-out'
    bar.style.width = '80%'

    // Then complete to 100% and fade
    const complete = setTimeout(() => {
      bar.style.transition = 'width 200ms ease-out, opacity 300ms ease-out'
      bar.style.width = '100%'
      bar.style.opacity = '0'
    }, 400)

    return () => clearTimeout(complete)
  })

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px]">
      <div
        ref={barRef}
        className="h-full"
        style={{
          width: '0%',
          background: 'linear-gradient(90deg, var(--gold), #E8B84B)',
          boxShadow: '0 0 10px rgba(201,151,43,0.5)',
          opacity: 0,
        }}
      />
    </div>
  )
}
