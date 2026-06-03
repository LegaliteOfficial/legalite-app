import type { AskRequest, AskResponse } from './types'

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
