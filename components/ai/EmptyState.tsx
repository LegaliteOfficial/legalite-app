'use client'

import { Scales, BookOpen, MagnifyingGlass } from '@phosphor-icons/react'

const SUGGESTIONS = [
  { Icon: Scales, text: 'What are the grounds for judicial review in Ghana?' },
  { Icon: BookOpen, text: 'Summarize the Matrimonial Causes Act provisions on divorce.' },
  { Icon: MagnifyingGlass, text: 'Find precedents on breach of contract in commercial disputes.' },
]

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
      <div className="h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/favicon.ico" alt="LegaLite" className="h-14 w-14 object-cover" />
      </div>
      <h2
        className="font-heading text-[22px] font-semibold mb-2 tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        How can I help you today?
      </h2>
      <p
        className="text-[13.5px] mb-8 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Ask about Ghana law, find case precedents, or get help drafting legal arguments.
      </p>
      <div className="w-full space-y-2">
        {SUGGESTIONS.map((s, i) => {
          const Icon = s.Icon
          return (
            <button
              key={i}
              onClick={() => onPick(s.text)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-[13px] transition-colors"
              style={{
                background: 'var(--surface-card)',
                borderColor: 'var(--border-soft)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-xs)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-card-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-card)')}
            >
              <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
              {s.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
