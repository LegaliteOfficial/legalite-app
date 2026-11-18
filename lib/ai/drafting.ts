/**
 * Client for POST /draft on the LegaLite AI service: AI drafting inside
 * the document studio. Same host and auth as /ask (see lib/ai/client.ts
 * for why the browser calls the AI service directly).
 *
 * Always a Server-Sent Events stream:
 *   sources_found  library passages the draft may cite
 *   status         progress line
 *   delta          (write modes) HTML text as it is generated; provisional
 *   review         (review mode) summary + issues
 *   completed      terminal; `text` is the cleaned, canonical HTML
 *   error          terminal; `message` is safe to show
 */

import { readToken } from '@/lib/apollo'
import { AiServiceError } from './client'

const AI_BASE_URL = process.env.NEXT_PUBLIC_LEGALITE_AI_URL

export type DraftMode = 'generate' | 'rewrite' | 'continue' | 'review'

export type RewriteAction =
  | 'improve'
  | 'formalise'
  | 'shorten'
  | 'expand'
  | 'plain_english'
  | 'add_authority'

/** Server-side caps (legalite-ai app/schemas/drafting.py). */
export const DRAFT_LIMITS = {
  instruction: 4_000,
  document: 60_000,
  selection: 20_000,
  matter: 6_000,
} as const

export interface DraftRequest {
  mode: DraftMode
  instruction?: string
  action?: RewriteAction | null
  document_title?: string | null
  document?: string | null
  selection?: string | null
  matter?: string | null
  use_authorities?: boolean
}

export interface DraftSource {
  ref: number
  label: string
  law: string
  section: string
  excerpt: string
}

export type ReviewSeverity = 'high' | 'medium' | 'low'

export interface ReviewIssue {
  severity: ReviewSeverity
  category: string
  title: string
  detail: string
  quote: string
  suggestion: string
}

export interface ReviewResult {
  summary: string
  issues: ReviewIssue[]
}

export type DraftStreamEvent =
  | { event: 'sources_found'; data: { count: number; sources: DraftSource[] } }
  | { event: 'status'; data: { phase: string; message: string } }
  | { event: 'delta'; data: { text: string } }
  | { event: 'review'; data: ReviewResult }
  | { event: 'completed'; data: { mode: DraftMode; text: string; sources: DraftSource[] } }
  | { event: 'error'; data: { message: string } }

export const REWRITE_ACTIONS: ReadonlyArray<{ id: RewriteAction; label: string; hint: string }> = [
  { id: 'improve', label: 'Improve', hint: 'Clearer and more precise' },
  { id: 'formalise', label: 'Formalise', hint: 'Court-ready legal English' },
  { id: 'shorten', label: 'Shorten', hint: 'Same points, fewer words' },
  { id: 'expand', label: 'Expand', hint: 'Fuller reasoning and particulars' },
  { id: 'plain_english', label: 'Plain English', hint: 'For a lay client' },
  { id: 'add_authority', label: 'Add authority', hint: 'Cite statutes from the library' },
]

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  const token = readToken()
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function* draftStream(
  payload: DraftRequest,
  options: { signal?: AbortSignal } = {},
): AsyncGenerator<DraftStreamEvent, void, void> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }

  let res: Response
  try {
    res = await fetch(`${AI_BASE_URL}/draft`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
      signal: options.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new AiServiceError('Network error reaching the AI service. Check your connection.', 0)
  }

  if (!res.ok) {
    const message =
      res.status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : res.status === 422
          ? 'That request could not be drafted. Check the selection or instruction and try again.'
          : res.status >= 500
            ? 'The AI service is having trouble right now. Please try again shortly.'
            : `Request failed (${res.status}).`
    throw new AiServiceError(message, res.status)
  }
  if (!res.body) throw new AiServiceError('The AI service returned an empty stream.', 0)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = parseFrame(buffer.slice(0, sep))
        buffer = buffer.slice(sep + 2)
        if (frame) yield frame
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function parseFrame(raw: string): DraftStreamEvent | null {
  let name: string | null = null
  let data: string | null = null
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim()
    else if (line.startsWith('data:')) data = line.slice(5).trim()
  }
  if (!name || data === null) return null
  try {
    return { event: name, data: JSON.parse(data) } as DraftStreamEvent
  } catch {
    return null
  }
}
