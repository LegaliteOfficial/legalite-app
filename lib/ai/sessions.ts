import type { AskResponse, FeedbackThumbs } from './types'

/**
 * Lightweight localStorage cache of LegaLite AI sessions.
 *
 * The FastAPI `/ask` endpoint uses `session_id` as the memory key — passing
 * the same id lets the LLM see prior turns. We persist the id and the
 * UI-rendered turns locally so the sidebar can list "recent conversations"
 * and the user can resume one after a refresh.
 *
 * Storage shape (single key, JSON-encoded):
 *
 *     ll:ai:sessions = {
 *       order: string[],                  // most-recent-first session_ids
 *       map: { [id]: SessionRecord }
 *     }
 *
 * Capped at MAX_SESSIONS to avoid unbounded growth.
 */

const STORAGE_KEY = 'll:ai:sessions'
const MAX_SESSIONS = 30

/** Local mirror of the latest server-side feedback for an assistant turn. */
export interface TurnFeedback {
  thumbs: FeedbackThumbs
  comment: string | null
  /** ISO timestamp of the most recent submit — used to ack the user. */
  submitted_at: string
}

export interface AssistantTurn {
  role: 'assistant'
  /** Full structured response — render via AnswerCard. */
  response: AskResponse
  created_at: string
  /** Present once the user has voted. Re-votes overwrite in place. */
  feedback?: TurnFeedback | null
}

export interface UserTurn {
  role: 'user'
  content: string
  created_at: string
}

export type Turn = UserTurn | AssistantTurn

export interface SessionRecord {
  id: string
  title: string
  created_at: string
  updated_at: string
  turns: Turn[]
}

interface Store {
  order: string[]
  map: Record<string, SessionRecord>
}

const emptyStore: Store = { order: [], map: {} }

function read(): Store {
  if (typeof window === 'undefined') return emptyStore
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore
    const parsed = JSON.parse(raw) as Store
    if (!parsed?.order || !parsed?.map) return emptyStore
    return parsed
  } catch {
    return emptyStore
  }
}

function write(store: Store) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota exceeded — silently drop. Users won't notice missing history,
    // and they'd notice a lot more if we crashed the page.
  }
}

export function listSessions(): SessionRecord[] {
  const store = read()
  return store.order.map((id) => store.map[id]).filter(Boolean)
}

export function getSession(id: string): SessionRecord | null {
  return read().map[id] ?? null
}

/**
 * Append a user question to an existing session, or create a new session
 * with this question as the first turn. Returns the session id.
 */
export function appendUserTurn(
  existingId: string | null,
  question: string,
  now: string,
): { id: string; record: SessionRecord } {
  const store = read()
  const id = existingId ?? cryptoRandomId()
  const existing = store.map[id]
  const turn: UserTurn = { role: 'user', content: question, created_at: now }

  const title = existing?.title ?? deriveTitle(question)
  const record: SessionRecord = existing
    ? { ...existing, updated_at: now, turns: [...existing.turns, turn] }
    : { id, title, created_at: now, updated_at: now, turns: [turn] }

  store.map[id] = record
  store.order = [id, ...store.order.filter((x) => x !== id)].slice(0, MAX_SESSIONS)
  // Drop any sessions that got pushed off the end.
  for (const key of Object.keys(store.map)) {
    if (!store.order.includes(key)) delete store.map[key]
  }
  write(store)
  return { id, record }
}

/**
 * Append an assistant turn. If the server rotated the session id, pass
 * `previousId` so we can migrate the record in-place — otherwise the
 * lookup would miss and the answer would silently drop.
 */
export function appendAssistantTurn(
  id: string,
  response: AskResponse,
  now: string,
  previousId?: string,
): SessionRecord | null {
  const store = read()
  // Resolve the record, migrating the key if the server rotated.
  let existing = store.map[id]
  if (!existing && previousId && previousId !== id && store.map[previousId]) {
    const moved = { ...store.map[previousId], id }
    store.map[id] = moved
    delete store.map[previousId]
    store.order = store.order.map((x) => (x === previousId ? id : x))
    existing = moved
  }
  if (!existing) return null
  const turn: AssistantTurn = { role: 'assistant', response, created_at: now }
  const record: SessionRecord = {
    ...existing,
    updated_at: now,
    turns: [...existing.turns, turn],
  }
  store.map[id] = record
  write(store)
  return record
}

/**
 * Drop the most recent assistant turn from a session — used when the
 * request fails so we don't store a half-rendered answer. The original
 * user question stays so the user can retry without retyping.
 */
export function dropLastAssistantTurn(id: string): void {
  const store = read()
  const existing = store.map[id]
  if (!existing) return
  const last = existing.turns[existing.turns.length - 1]
  if (last?.role !== 'assistant') return
  store.map[id] = { ...existing, turns: existing.turns.slice(0, -1) }
  write(store)
}

/**
 * Persist (or clear) feedback on a specific assistant turn, located by
 * the server's `message_id`. Pass `feedback: null` to revert an
 * optimistic update that the server rejected.
 *
 * Returns the updated session record so the caller can rebuild its
 * in-memory turns array from the canonical source. Returns null when
 * the session or message id isn't found (the bar shouldn't render in
 * that case, so the caller will never have reached this).
 */
export function setTurnFeedback(
  sessionId: string,
  messageId: string,
  feedback: TurnFeedback | null,
): SessionRecord | null {
  const store = read()
  const existing = store.map[sessionId]
  if (!existing) return null
  let mutated = false
  const turns = existing.turns.map((t) => {
    if (t.role !== 'assistant') return t
    if (t.response.message_id !== messageId) return t
    mutated = true
    return { ...t, feedback }
  })
  if (!mutated) return null
  const record: SessionRecord = { ...existing, turns }
  store.map[sessionId] = record
  write(store)
  return record
}

export function deleteSession(id: string): void {
  const store = read()
  delete store.map[id]
  store.order = store.order.filter((x) => x !== id)
  write(store)
}

export function clearAllSessions(): void {
  write(emptyStore)
}

// ── helpers ────────────────────────────────────────────────────────────────

function deriveTitle(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, ' ')
  if (cleaned.length <= 60) return cleaned
  return cleaned.slice(0, 57).trimEnd() + '…'
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for ancient browsers — not cryptographically strong, fine for
  // a UI session id.
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}
