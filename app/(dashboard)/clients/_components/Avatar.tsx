'use client'

import { useMemo } from 'react'
import { initialsOf } from '../_lib/initials'

/**
 * Initials avatar — round, gold-tinted, with the first letters of the
 * name. Used in the Client column so each row reads quickly even when
 * long names get truncated.
 */
export function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => initialsOf(name), [name])
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center h-7 w-7 rounded-full text-[10.5px] font-semibold shrink-0"
      style={{
        background: 'var(--accent-today-tint-strong)',
        color: 'var(--accent-today)',
      }}
    >
      {initials}
    </span>
  )
}
