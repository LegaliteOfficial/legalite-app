'use client'

import type { FeedbackThumbs } from '@/lib/ai/types'
import type { Turn } from '@/lib/ai/sessions'
import { AnswerCard } from '@/components/ai/AnswerCard'

export function TurnBubble({
  turn,
  onSubmitFeedback,
}: {
  turn: Turn
  onSubmitFeedback?: (input: {
    thumbs: FeedbackThumbs
    comment: string | null
  }) => Promise<void>
}) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-primary)',
          }}
        >
          {turn.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] w-full">
        <AnswerCard
          response={turn.response}
          feedback={turn.feedback ?? null}
          onSubmitFeedback={onSubmitFeedback}
        />
      </div>
    </div>
  )
}
