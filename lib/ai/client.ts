import type {
  AskRequest,
  AskResponse,
  AskStreamEvent,
  BulkJobStatusResponse,
  BulkUploadResponse,
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
 * POST /ask?stream=true — same pipeline as {@link ask}, but consumed as
 * Server-Sent Events so ``direct_answer`` text can be rendered as the
 * model generates it instead of waiting for the full response.
 *
 * Yields events in order: ``retrieval_started``, ``sources_found``, zero
 * or more ``answer_delta``, then either ``refused`` (terminal) or
 * ``reasoning`` → ``citations`` → ``completed`` (terminal). See
 * {@link AskStreamEvent} — the ``refused`` payload is authoritative and
 * may not match what the ``answer_delta`` events already showed; the
 * caller must replace, not merge.
 */
export async function* askStream(
  payload: AskRequest,
  options: { signal?: AbortSignal } = {},
): AsyncGenerator<AskStreamEvent, void, void> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }

  let res: Response
  try {
    res = await fetch(`${AI_BASE_URL}/ask?stream=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
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
  if (!res.body) {
    throw new AiServiceError('The AI service returned an empty stream.', 0)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let sepIndex: number
      // SSE frames are separated by a blank line. A frame's line
      // endings may be "\r\n" depending on the proxy in front of the
      // service, so parseSSEFrame strips trailing "\r" per line rather
      // than assuming "\n\n" is the only separator variant.
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawFrame = buffer.slice(0, sepIndex)
        buffer = buffer.slice(sepIndex + 2)
        const parsed = parseSSEFrame(rawFrame)
        if (parsed) yield parsed
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSSEFrame(rawFrame: string): AskStreamEvent | null {
  let eventName: string | null = null
  let dataLine: string | null = null
  for (const line of rawFrame.split('\n')) {
    const clean = line.endsWith('\r') ? line.slice(0, -1) : line
    if (clean.startsWith('event:')) {
      eventName = clean.slice('event:'.length).trim()
    } else if (clean.startsWith('data:')) {
      dataLine = clean.slice('data:'.length).trim()
    }
  }
  if (!eventName || dataLine === null) return null
  try {
    return { event: eventName, data: JSON.parse(dataLine) } as AskStreamEvent
  } catch {
    // A frame split mid-byte-sequence by the decoder would corrupt the
    // JSON; drop it rather than crash the whole stream over one frame.
    return null
  }
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

/**
 * Server-side cap on files per POST /upload-law/bulk request — mirrors
 * ``settings.bulk_upload_max_files`` in legalite-ai/app/core/config.py.
 * Batches larger than this are rejected outright (413) rather than
 * partially processed, so the caller must chunk before sending.
 */
export const BULK_UPLOAD_MAX_FILES = 25

/**
 * Server-side cap on ids per GET /ingestion/jobs/bulk request — mirrors
 * ``_BULK_STATUS_MAX_IDS`` in legalite-ai/app/api/routes/jobs.py.
 */
export const BULK_STATUS_MAX_IDS = 50

/**
 * POST /upload-law/bulk — enqueue up to {@link BULK_UPLOAD_MAX_FILES} PDFs
 * in one request. Legacy contract: anonymous, GLOBAL visibility, one
 * ``doc_type`` applied to the whole batch (see
 * legalite-ai/app/api/routes/documents.py::upload_law_bulk).
 *
 * The endpoint returns 202 for any batch with at least one accepted file
 * (even if others were rejected/skipped), 200 when nothing was accepted
 * but some were skipped as duplicates, and 422 only when every file in
 * the batch was a hard rejection — all three are "successful" responses
 * from the caller's point of view and should be parsed the same way, so
 * this function does not special-case the status code.
 */
export async function uploadLawsBulk(
  files: File[],
  docType: string,
  options: { signal?: AbortSignal } = {},
): Promise<BulkUploadResponse> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }
  if (files.length === 0) {
    throw new AiServiceError('No files to upload.', 0)
  }

  const form = new FormData()
  for (const file of files) form.append('files', file, file.name)
  form.append('doc_type', docType)

  let res: Response
  try {
    res = await fetch(`${AI_BASE_URL}/upload-law/bulk`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
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

  // 422 with no accepted/skipped files is still a well-formed
  // BulkUploadResponse body (every file was rejected) — only treat this
  // as a hard error when the body isn't the expected shape at all.
  let body: BulkUploadResponse | { detail?: string }
  try {
    body = await res.json()
  } catch {
    throw new AiServiceError(
      res.ok
        ? 'The AI service returned an unreadable response.'
        : `Bulk upload failed (${res.status}).`,
      res.status,
    )
  }

  if (!res.ok && !('jobs' in body)) {
    const detail = (body as { detail?: string })?.detail
    const message =
      res.status === 413
        ? (detail ?? `Batch too large — split into groups of ${BULK_UPLOAD_MAX_FILES} or fewer.`)
        : res.status >= 500
          ? 'The AI service is having trouble right now. Please try again shortly.'
          : (detail ?? `Bulk upload failed (${res.status}).`)
    throw new AiServiceError(message, res.status, detail)
  }

  return body as BulkUploadResponse
}

/**
 * GET /ingestion/jobs/bulk?ids=... — poll status for up to
 * {@link BULK_STATUS_MAX_IDS} ingestion jobs in one round trip. Pass the
 * ``job_id``s returned by {@link uploadLawsBulk}; unknown or
 * not-visible ids come back in ``missing`` rather than as an error (see
 * legalite-ai/app/api/routes/jobs.py::get_jobs_bulk).
 */
export async function getIngestionJobsBulk(
  jobIds: string[],
  options: { signal?: AbortSignal } = {},
): Promise<BulkJobStatusResponse> {
  if (!AI_BASE_URL) {
    throw new AiServiceError(
      'AI service URL is not configured. Set NEXT_PUBLIC_LEGALITE_AI_URL.',
      0,
    )
  }
  if (jobIds.length === 0) return { found: [], missing: [] }

  let res: Response
  try {
    res = await fetch(
      `${AI_BASE_URL}/ingestion/jobs/bulk?ids=${jobIds.map(encodeURIComponent).join(',')}`,
      { method: 'GET', headers: { Accept: 'application/json' }, signal: options.signal },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new AiServiceError(
      'Network error while checking upload progress.',
      0,
      err instanceof Error ? err.message : undefined,
    )
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const errBody = (await res.json()) as { detail?: string }
      detail = errBody?.detail
    } catch {
      // body wasn't JSON
    }
    throw new AiServiceError(
      detail ?? `Failed to check upload progress (${res.status}).`,
      res.status,
      detail,
    )
  }

  return (await res.json()) as BulkJobStatusResponse
}
