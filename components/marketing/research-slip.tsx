'use client'

/**
 * Animated research slip for the marketing legal AI section.
 *
 * Deliberately not a chat or search bar. The metaphor is a ruled research
 * slip from a legal pad: a question is drafted on the lines, then the
 * Ghanaian authorities it rests on are entered underneath, the way a
 * researcher notes the sources behind an opinion. It cycles through a few
 * questions and never shows an answer, only the question and its grounding.
 */

import { useEffect, useState } from 'react'

const QUERIES = [
  {
    question: 'Who qualifies as a legal practitioner in Ghana?',
    authorities: ['Legal Profession Act, 1960 (Act 32)', 'General Legal Council'],
  },
  {
    question: 'What notice must I give to end an employment contract?',
    authorities: ['Labour Act, 2003 (Act 651)', 'Contract of employment'],
  },
  {
    question: 'How is a company limited by shares incorporated?',
    authorities: ['Companies Act, 2019 (Act 992)', 'Office of the Registrar'],
  },
]

const TYPE_MS = 48
const HOLD_AFTER_TYPE = 420
const AUTHORITY_GAP = 520
const HOLD_COMPLETE = 2600

export function ResearchSlip() {
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState(0)
  const [revealed, setRevealed] = useState(0)

  const current = QUERIES[index]

  useEffect(() => {
    // Respect reduced motion by showing a finished slip and stopping.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTyped(current.question.length)
      setRevealed(current.authorities.length)
      return
    }

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const at = (ms: number, fn: () => void) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms))
    }

    setTyped(0)
    setRevealed(0)

    // Draft the question one character at a time.
    for (let i = 1; i <= current.question.length; i += 1) {
      at(i * TYPE_MS, () => setTyped(i))
    }

    // Enter each authority underneath once the question is written.
    const typingDone = current.question.length * TYPE_MS + HOLD_AFTER_TYPE
    current.authorities.forEach((_, i) => {
      at(typingDone + i * AUTHORITY_GAP, () => setRevealed(i + 1))
    })

    // Hold the finished slip, then move to the next question.
    const complete = typingDone + current.authorities.length * AUTHORITY_GAP
    at(complete + HOLD_COMPLETE, () => setIndex((n) => (n + 1) % QUERIES.length))

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [index, current.question, current.authorities])

  const text = current.question.slice(0, typed)
  const typingFinished = typed >= current.question.length

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#0D1B2A] bg-[#0D1B2A] shadow-[0_30px_60px_-34px_rgba(13,27,42,0.6)]">
      {/* Slip header, in the register of a case file rather than an app chrome */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
        <span className="text-[10px] uppercase tracking-[2.5px] text-white/35">
          Research slip
        </span>
        <span className="rounded-sm border border-[#C9972B]/30 px-2 py-0.5 text-[10px] uppercase tracking-[1.5px] text-[#C9972B]">
          Ghana
        </span>
      </div>

      {/* Ruled writing area with a gold margin rule down the left */}
      <div className="relative px-5 py-7 sm:px-7">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0 31px, rgba(255,255,255,0.05) 31px 32px)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-10 w-px bg-[#C9972B]/25 sm:left-12"
          aria-hidden
        />

        <p className="relative min-h-[4.5rem] pl-7 text-lg leading-[32px] text-white [font-family:Literata,'Times_New_Roman',serif] sm:pl-9 sm:text-xl">
          {text}
          <span
            className="ml-[2px] inline-block h-[0.95em] w-[2px] translate-y-[2px] bg-[#C9972B] align-middle"
            style={{ animation: 'caret-blink 1s steps(1) infinite' }}
            aria-hidden
          />
        </p>
      </div>

      {/* The sources the answer would rest on, entered one by one */}
      <div className="border-t border-white/[0.07] px-5 py-5 sm:px-7">
        <div className="text-[10px] uppercase tracking-[2.5px] text-white/30">
          Grounded in
        </div>
        <div className="mt-3 flex min-h-[64px] flex-col gap-2">
          {current.authorities.map((a, i) => (
            <div
              key={a}
              className={`flex items-start gap-2.5 text-[13px] leading-snug transition-all duration-500 ${
                i < revealed
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-1 opacity-0'
              }`}
            >
              <span
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#C9972B]"
                aria-hidden
              />
              <span className="text-white/65">{a}</span>
            </div>
          ))}
        </div>

        <div
          className={`mt-1 text-[11px] text-white/25 transition-opacity duration-500 ${
            typingFinished && revealed >= current.authorities.length
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          Every answer cites the source it came from.
        </div>
      </div>
    </div>
  )
}
