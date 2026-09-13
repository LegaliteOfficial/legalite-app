'use client'

/**
 * Shows the first illustration and cross fades to the second on hover
 * (pointer devices) or tap (touch devices). Both images are rendered so the
 * swap has no load delay. Falls back to the first image with no motion when
 * the user prefers reduced motion.
 */

import { useState } from 'react'

export function IllustrationSwap({
  first,
  second,
  alt,
}: {
  first: string
  second: string
  alt: string
}) {
  const [active, setActive] = useState(false)

  // Mouse hovers; touch and pen toggle on tap. Splitting the handlers by
  // pointer type stops a tap from firing enter and click together, which
  // would cancel itself out and leave the second image hidden.
  return (
    <div
      role="img"
      aria-label={alt}
      tabIndex={0}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setActive(true)
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setActive(false)
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') setActive((v) => !v)
      }}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setActive((v) => !v)
        }
      }}
      className="group relative block aspect-[4/3] w-full cursor-pointer select-none overflow-hidden rounded-2xl border border-white/10 outline-none transition focus-visible:border-[#C9972B]/50"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, rgba(201,151,43,0.12), transparent 62%), rgba(255,255,255,0.03)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={first}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain p-8 transition-all duration-500 ease-out motion-reduce:transition-none ${
          active ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={second}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain p-8 transition-all duration-500 ease-out motion-reduce:transition-none ${
          active ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
        }`}
      />

      {/* Affordance so people know there is a second state */}
      <span
        className={`pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#1F2937]/80 px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/50 backdrop-blur transition ${
          active ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="h-1 w-1 rounded-full bg-[#C9972B]" />
        Hover
      </span>
    </div>
  )
}
