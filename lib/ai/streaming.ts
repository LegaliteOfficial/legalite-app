import type { AskResponse } from '@/lib/ai/types'

/**
 * Builds a provisional AskResponse from live `answer_delta` text so the
 * in-progress turn can render through the same `<AnswerCard streaming />`
 * used for the committed turn — one bubble that fills in, rather than a
 * separate loading component swapped out from under the user once the
 * stream finishes. See AnswerCard's `streaming` prop for which sections
 * it hides while the rest of this shape is still unknown.
 */
export function buildStreamingResponse(text: string): AskResponse {
  return {
    answer: text,
    citations: [],
    confidence: 'low',
    disclaimer: '',
    sources_used: [],
    reasoning_summary: '',
    session_id: null,
    structured_answer: {
      direct_answer: text,
      applicable_law: [],
      relevant_public_cases: [],
      firm_similar_cases: [],
      legal_reasoning: '',
      confidence_assessment: '',
      citations: [],
    },
    query_intent: null,
    query_intent_confidence: null,
    message_id: null,
  }
}
