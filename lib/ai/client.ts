import type {
  AskRequest,
  AskResponse,
  DocumentView,
  FeedbackCreate,
  FeedbackResponse,
} from './types'

/**
 * Client for the LegaLite AI FastAPI service.
 *
 * The service runs separately from the NestJS backend (different repo,
 * different host) so we hit it directly from the browser. CORS is handled
 * by the FastAPI middleware; no auth header is required for /ask today
 * (legacy contract, see legalite-ai/app/core/service_auth.py).
 */
const AI_BASE_URL = process.env.NEXT_PUBLIC_LEGALITE_AI_URL

if (typeof window !== 'undefined' && !AI_BASE_URL) {
  // Surface misconfiguration early. The fetch below would fail with a
  // confusing "Failed to fetch" otherwise.
  // eslint-disable-next-line no-console
  console.warn(
    'NEXT_PUBLIC_LEGALITE_AI_URL is not set. /ask will not work until it is.',
  )
}

export class AiServiceError extends Error {
  status: number
  detail?: string

  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.name = 'AiServiceError'
    this.status = status
    this.detail = detail
  }
}

/**
 * POST /ask — ask the legal Q&A pipeline a question.
 *
 * - `signal` lets the caller abort if the user navigates away or sends
 *   another question before this one resolves.
 * - The pipeline can take 5–15s on a cold container; let the request
 *   run as long as it needs and use AbortController for cancellation.
 */
export async function ask(
  payload: AskRequest,
  options: { signal?: AbortSignal } = {},
): Promise<AskResponse> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }

  let res: Response
  try {
    res = await fetch(`${AI_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new AiServiceError(
      'Network error reaching the AI service. Check your connection.',
      0,
      err instanceof Error ? err.message : undefined,
    )
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = (await res.json()) as { detail?: string }
      detail = body?.detail
    } catch {
      // body wasn't JSON
    }
    const message =
      res.status === 429
        ? 'You are sending questions too quickly. Please wait a moment and try again.'
        : res.status >= 500
          ? 'The AI service is having trouble right now. Please try again shortly.'
          : detail ?? `Request failed (${res.status}).`
    throw new AiServiceError(message, res.status, detail)
  }

  return (await res.json()) as AskResponse
}

/**
 * POST /ask/{message_id}/feedback — attach 👍 / 👎 (+ optional comment)
 * to an assistant turn. Re-posting the same message_id UPDATES the
 * row server-side, so the client can call this freely when the user
 * toggles their vote — no need to track "have I submitted yet".
 *
 * - 404 means the message id is unknown or belongs to another tenant.
 *   We surface that as a normal AiServiceError so the UI can revert
 *   the optimistic state.
 * - 422 is reserved for bad bodies (non-up/down thumbs); the form
 *   prevents this so we treat it as a programmer error if it fires.
 */
export async function submitFeedback(
  messageId: string,
  payload: FeedbackCreate,
  options: { signal?: AbortSignal } = {},
): Promise<FeedbackResponse> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }
  if (!messageId) {
    // Defensive: the UI gates the feedback bar on response.message_id,
    // but if a stale turn from before the message_id rollout sneaks in
    // we want a loud error rather than a silent 400.
    throw new AiServiceError('Missing message id; cannot submit feedback.', 0)
  }

  let res: Response
  try {
    res = await fetch(
      `${AI_BASE_URL}/ask/${encodeURIComponent(messageId)}/feedback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: options.signal,
      },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new AiServiceError(
      'Network error sending feedback. Please try again.',
      0,
      err instanceof Error ? err.message : undefined,
    )
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = (await res.json()) as { detail?: string }
      detail = body?.detail
    } catch {
      // body wasn't JSON
    }
    const message =
      res.status === 404
        ? "That answer can't be found anymore — feedback won't be saved."
        : res.status >= 500
          ? 'The AI service is having trouble right now. Please try again shortly.'
          : detail ?? `Feedback failed (${res.status}).`
    throw new AiServiceError(message, res.status, detail)
  }

  return (await res.json()) as FeedbackResponse
}

/**
 * GET /documents/{id} — fetch the full text + signed PDF URL for a
 * source document. Used by the citation preview drawer.
 *
 * - 404 means the document doesn't exist OR belongs to another tenant.
 *   We surface that as a normal AiServiceError so the drawer can
 *   render an "unavailable" state.
 * - ``pdf_url`` in the response can be null even on a 200 — happens
 *   when Supabase Storage wasn't configured at ingest time or the
 *   upload failed. The drawer should degrade to text-only rendering
 *   in that case (hide the "Open original PDF" button).
 */
export async function getDocument(
  documentId: string,
  options: { signal?: AbortSignal } = {},
): Promise<DocumentView> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }
  if (!documentId) {
    throw new AiServiceError('Missing document id; cannot fetch source.', 0)
  }

  let res: Response
  try {
    res = await fetch(
      `${AI_BASE_URL}/documents/${encodeURIComponent(documentId)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: options.signal,
      },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new AiServiceError(
      'Network error reaching the source. Please try again.',
      0,
      err instanceof Error ? err.message : undefined,
    )
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = (await res.json()) as { detail?: string }
      detail = body?.detail
    } catch {
      // body wasn't JSON
    }
    const message =
      res.status === 404
        ? 'That source is no longer available.'
        : res.status >= 500
          ? 'The AI service is having trouble right now. Please try again shortly.'
          : detail ?? `Source request failed (${res.status}).`
    throw new AiServiceError(message, res.status, detail)
  }

  return (await res.json()) as DocumentView
}
