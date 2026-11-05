'use client'

import Image from 'next/image'

const LOADING_PHASE_TEXT: Record<'retrieving' | 'answering', string> = {
  retrieving: 'Thinking',
  answering: 'Drafting an answer',
}

export function LoadingTurn({
  phase = 'retrieving',
  message,
}: {
  phase?: 'retrieving' | 'answering' | null
  /** Live progress line from the agent's `status` SSE event, when present. */
  message?: string | null
}) {
  return (
    <div className="flex justify-start">
      <div
        className="rounded-2xl border px-4 py-3 flex items-center gap-3"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-soft)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <Image
            src="/gifs/gavel.gif"
            alt="Researching"
            fill
            sizes="36px"
            className="object-cover"
            unoptimized
            priority
          />
        </div>
        <div className="flex flex-col">
          <span
            className="text-[13px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Legaliting<span className="inline-block ml-0.5 typing-dots" aria-hidden>…</span>
          </span>
          <span
            className="text-[11.5px] line-clamp-2 max-w-[60ch]"
            style={{ color: 'var(--text-muted)' }}
          >
            {message || LOADING_PHASE_TEXT[phase ?? 'retrieving']}
          </span>
        </div>
        <style jsx>{`
          @keyframes pulse-dots {
            0%, 80%, 100% { opacity: 0.25; }
            40% { opacity: 1; }
          }
          .typing-dots {
            animation: pulse-dots 1.4s infinite;
          }
        `}</style>
      </div>
    </div>
  )
}
