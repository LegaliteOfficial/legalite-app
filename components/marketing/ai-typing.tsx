'use client'

/**
 * Animated AI search bar for the marketing legal-AI section.
 *
 * Reproduces the "Ask LegaLite AI anything..." bar with a flowing gradient
 * glow, then types a sample question with a blinking caret and loops. There
 * is deliberately no answer, it only shows the question being asked.
 */

import { useEffect, useState } from 'react'

const QUESTION = 'Who is a legal practitioner in Ghana?'

export function AiSearchTyping() {
  const [text, setText] = useState('')

  useEffect(() => {
    let i = 0
    let dir: 'type' | 'erase' = 'type'
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      if (cancelled) return
      if (dir === 'type') {
        i += 1
        setText(QUESTION.slice(0, i))
        if (i >= QUESTION.length) {
          dir = 'erase'
          timer = setTimeout(tick, 2600) // hold the full question
          return
        }
        timer = setTimeout(tick, 60 + Math.random() * 60)
      } else {
        i -= 1
        setText(QUESTION.slice(0, Math.max(i, 0)))
        if (i <= 0) {
          dir = 'type'
          timer = setTimeout(tick, 900) // pause on the placeholder
          return
        }
        timer = setTimeout(tick, 28)
      }
    }

    timer = setTimeout(tick, 900)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const empty = text.length === 0

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute -inset-[2px] rounded-full opacity-80 blur-[7px]"
        style={{
          background: 'linear-gradient(90deg,#6ea8ff,#a06bff,#ff5c8a,#ffab5c,#6ea8ff)',
          backgroundSize: '200% 100%',
          animation: 'ai-glow 6s linear infinite',
        }}
        aria-hidden
      />
      <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-[#0B0F16] px-5 py-4">
        <div className="min-w-0 flex-1 truncate text-sm md:text-base">
          {empty ? (
            <span className="text-white/35">Ask LegaLite AI anything...</span>
          ) : (
            <span className="text-white/90">{text}</span>
          )}
          <span
            className="ml-[1px] inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-[#E8B84B]"
            style={{ animation: 'ai-caret 1s steps(1) infinite' }}
            aria-hidden
          />
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f6bff]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 19V6M12 6l-6 6M12 6l6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  )
}
