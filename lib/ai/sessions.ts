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
  /**
   * When true, the session is pinned to the top of the sidebar and
   * exempt from the MAX_SESSIONS eviction cap. Mirrors Claude
   * Desktop's "Starred" affordance — useful for long-running
   * research threads the partner returns to over days/weeks.
   * Optional so old persisted records (pre-pin) deserialise cleanly.
   */
  pinned?: boolean
  /**
   * When true, the partner has manually renamed this session and
   * the auto-title refinement (`refineTitle`) should leave it
   * alone. Set by `renameSession`; unset means the title was
   * machine-derived and may be refined when better signals arrive.
   */
  title_locked?: boolean
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
  // Eviction respects pins: pinned sessions never get dropped from
  // `order`, so the effective cap on unpinned sessions is
  // MAX_SESSIONS minus the pinned count. Without this, a partner
  // who pins 5 long-running threads would silently lose the next
  // 5 recent ones.
  const next = [id, ...store.order.filter((x) => x !== id)]
  const pinned = next.filter((x) => store.map[x]?.pinned)
  const unpinned = next.filter((x) => !store.map[x]?.pinned)
  const trimmedUnpinned = unpinned.slice(
    0,
    Math.max(0, MAX_SESSIONS - pinned.length),
  )
  // Preserve insertion order: pinned first only on writes happen to
  // place them there; in storage we keep the recency order so the
  // sidebar can render the actual chronology. Pinning is a display
  // concern handled by the sidebar component.
  store.order = next.filter(
    (x) => pinned.includes(x) || trimmedUnpinned.includes(x),
  )
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

/**
 * Rename a session's display title. Empty / whitespace-only inputs
 * fall back to the existing title so the sidebar never renders a
 * blank row. The `updated_at` timestamp is *not* bumped — renaming
 * isn't activity in the chronological sense, and bumping it would
 * shuffle the row out of its expected recency group.
 */
export function renameSession(id: string, title: string): SessionRecord | null {
  const store = read()
  const existing = store.map[id]
  if (!existing) return null
  const cleaned = title.trim().slice(0, 80)
  if (!cleaned) return existing
  // Manual rename locks the title — `refineTitle` will skip this
  // session forever after, so the partner's chosen name isn't
  // silently overwritten the next time the assistant replies.
  const next: SessionRecord = { ...existing, title: cleaned, title_locked: true }
  store.map[id] = next
  write(store)
  return next
}

/**
 * Toggle a session's pinned state. Pinned sessions are exempt from
 * the MAX_SESSIONS eviction cap (see appendUserTurn) and render in
 * a separate "Pinned" group at the top of the sidebar.
 */
export function pinSession(id: string, pinned: boolean): SessionRecord | null {
  const store = read()
  const existing = store.map[id]
  if (!existing) return null
  const next: SessionRecord = { ...existing, pinned }
  store.map[id] = next
  write(store)
  return next
}

export function clearAllSessions(): void {
  write(emptyStore)
}

/**
 * Refine the auto-generated title once we have the assistant's
 * response. Acts like Claude Desktop's "title gets better once the
 * first answer lands" behaviour — uses signal from the structured
 * answer + query intent to produce a tighter noun-phrase title
 * than the question-only heuristic could.
 *
 * Skips sessions where `title_locked` is true (manual rename) so
 * the partner's choice is never silently overwritten.
 *
 * `updated_at` is deliberately NOT bumped — refining the title is
 * not new activity in the chronological sense.
 */
export function refineTitle(
  id: string,
  question: string,
  response?: AskResponse,
): SessionRecord | null {
  const store = read()
  const existing = store.map[id]
  if (!existing) return null
  if (existing.title_locked) return existing
  const refined = deriveTitle(question, response)
  if (!refined || refined === existing.title) return existing
  const next: SessionRecord = { ...existing, title: refined }
  store.map[id] = next
  write(store)
  return next
}

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Lower-cased leading phrases to strip from question titles. Patterns
 * are tried in order; the first that matches consumes its capture
 * and the loop restarts so e.g. "Please tell me about..." -> strips
 * "please" then strips "tell me about" on the next pass.
 *
 * Each entry has two parts: politeness/framing wrappers can chain
 * (multiple passes), while interrogative + yes/no openers only fire
 * once (further chaining tends to eat the noun phrase).
 */
const STRIP_PREFIX_CHAINABLE: RegExp[] = [
  // Politeness + framing phrases — repeat until none match.
  /^(please\s+|kindly\s+)/i,
  /^(i\s+(?:would\s+like\s+to|want\s+to|need\s+to)\s+know\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  /^(i\s+(?:would\s+like|want|need)\s+(?:to\s+)?(?:understand|learn|find\s+out)\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  /^(i\s+(?:would\s+like|want|need)\s+(?:to\s+)?(?:see|review)\s+(?:about\s+)?)/i,
  /^(tell\s+me\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  /^(help\s+me\s+(?:understand|learn|figure\s+out)\s+(?:about\s+)?)/i,
  /^(could\s+you\s+(?:please\s+|kindly\s+)?(?:explain|tell\s+me|summarize|summarise|describe|outline)\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  /^(can\s+you\s+(?:please\s+|kindly\s+)?(?:explain|tell\s+me|summarize|summarise|describe|outline)\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  /^(would\s+you\s+(?:please\s+|kindly\s+)?(?:explain|tell\s+me|summarize|summarise|describe|outline)\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  /^(do\s+you\s+know\s+(?:about\s+|what\s+|how\s+|whether\s+)?)/i,
  // Leading "In Ghana, " / "Under Ghana law, " — drop the geo tag.
  /^(?:in|under)\s+ghana(?:n)?(?:\s+law)?\s*,\s*/i,
]
const STRIP_PREFIX_ONCE: RegExp[] = [
  // Imperative summarisation verbs
  /^(summari[sz]e\s+(?:for\s+me\s+)?)/i,
  /^(explain\s+(?:to\s+me\s+)?(?:what\s+|how\s+|whether\s+)?)/i,
  /^(describe\s+)/i,
  /^(outline\s+)/i,
  /^(find\s+(?:me\s+)?(?:some\s+)?)/i,
  /^(give\s+me\s+(?:a\s+)?(?:summary\s+of\s+|overview\s+of\s+|brief\s+on\s+)?)/i,
  // Direct interrogatives — try the most specific "How do I" first
  // so we eat the pronoun, otherwise "I file a notice" leaks out.
  /^(how\s+do\s+i\s+)/i,
  /^(how\s+can\s+i\s+)/i,
  /^(how\s+should\s+i\s+)/i,
  /^(what(?:'s|\s+is|\s+are|\s+was|\s+were)\s+(?:the\s+|a\s+|an\s+)?)/i,
  /^(how\s+(?:does|do|can|should|must|would|to)\s+(?:a\s+|an\s+|the\s+|one\s+)?)/i,
  /^(when\s+(?:does|do|can|should|must|is|are|was|were)\s+(?:a\s+|an\s+|the\s+)?)/i,
  /^(where\s+(?:does|do|can|should|must|is|are|was|were)\s+(?:a\s+|an\s+|the\s+)?)/i,
  /^(why\s+(?:does|do|is|are|was|were|should|must)\s+(?:a\s+|an\s+|the\s+)?)/i,
  /^(who\s+(?:is|are|was|were|can|should|must)\s+(?:a\s+|an\s+|the\s+)?)/i,
  // Yes/no openers — drop the auxiliary, what remains usually reads as a noun phrase
  /^(is\s+(?:there\s+|a\s+|an\s+|the\s+)?)/i,
  /^(are\s+(?:there\s+|a\s+|an\s+|the\s+)?)/i,
  /^(does\s+(?:a\s+|an\s+|the\s+)?)/i,
  /^(do\s+(?:a\s+|an\s+|the\s+)?)/i,
  /^(can\s+(?:i\s+|a\s+|an\s+|the\s+)?)/i,
  /^(should\s+(?:i\s+|a\s+|an\s+|the\s+)?)/i,
  /^(must\s+(?:a\s+|an\s+|the\s+)?)/i,
  /^(will\s+(?:a\s+|an\s+|the\s+)?)/i,
]

/** Trailing context phrases worth removing — they're implicit since
 *  the whole app is Ghana-law-flavoured. */
const STRIP_SUFFIX_PATTERNS: RegExp[] = [
  /\s+in\s+ghana(?:\s+law)?$/i,
  /\s+under\s+ghana(?:n)?(?:\s+law)?$/i,
  /\s+in\s+ghana(?:n)?(?:\s+practice)?$/i,
  /\s+(?:please|kindly)$/i,
]

const MAX_TITLE = 50

/**
 * Derive a Claude-Desktop-style title from the user's question (and
 * optionally the assistant's response). Three layers:
 *
 *   1. Clean the question — strip question words, politeness fillers,
 *      "in Ghana" tails, trailing punctuation.
 *   2. Title-case the first letter, cap at MAX_TITLE chars.
 *   3. If the cleaned form ended up empty (e.g. the question was
 *      just "Hello?"), fall back to the original truncated text.
 *
 * `response` is currently a placeholder for future enrichment —
 * the AskResponse already carries `query_intent` and
 * `structured_answer.direct_answer`, which could feed a smarter
 * v2 that prefers the answer's noun phrase when the question is
 * thin. v1 just uses the question text since that's enough for
 * the vast majority of legal Q&A flows.
 */
export function deriveTitle(question: string, response?: AskResponse): string {
  // Silence the unused param without losing the future hook.
  void response

  let text = question.trim().replace(/\s+/g, ' ')
  if (!text) return 'New chat'

  // Strip trailing punctuation first so suffix patterns match
  // against "...in Ghana law" instead of "...in Ghana law?".
  text = text.replace(/[?!.;:,]+$/g, '').trim()

  // Strip leading politeness / framing wrappers — these chain
  // ("Please tell me about..." -> strip "please" -> strip "tell me
  // about"), restarting the loop after each successful strip so a
  // newly-exposed prefix can also match.
  let changedPrefix = true
  while (changedPrefix) {
    changedPrefix = false
    for (const re of STRIP_PREFIX_CHAINABLE) {
      const m = text.match(re)
      if (m) {
        text = text.slice(m[0].length).trim()
        changedPrefix = true
        break
      }
    }
  }
  // Then a single pass of interrogative / yes-no openers — these
  // are NOT chained because stacking would eat the noun phrase
  // ("How do does the..." kind of nonsense never happens in real
  // questions but two-pass eating of "what is" would).
  for (const re of STRIP_PREFIX_ONCE) {
    const m = text.match(re)
    if (m) {
      text = text.slice(m[0].length).trim()
      break
    }
  }

  // Strip suffix tails — these CAN chain ("...in Ghana law please")
  // so we loop until nothing matches.
  let changed = true
  while (changed) {
    changed = false
    for (const re of STRIP_SUFFIX_PATTERNS) {
      const next = text.replace(re, '').trim()
      if (next !== text) {
        text = next
        changed = true
      }
    }
  }

  // Tidy: collapse whitespace again, drop any leading commas/dashes
  // that got exposed by the prefix strip ("..., the procedure...")
  // and any trailing punctuation that the suffix strip left behind
  // ("...tort and a crime," after stripping " please").
  text = text
    .replace(/^[,;:\-–—\s]+/, '')
    .replace(/[,;:\-–—\s]+$/, '')
    .trim()

  if (!text) {
    // Stripping consumed everything — fall back to the truncated
    // original so we never end up with a blank sidebar row.
    const original = question.trim().replace(/\s+/g, ' ')
    return original.length <= MAX_TITLE
      ? original
      : original.slice(0, MAX_TITLE - 1).trimEnd() + '…'
  }

  // Title-case the first character — leaves acronyms ("CI 47",
  // "GBA") alone because we only touch index 0.
  text = text[0].toUpperCase() + text.slice(1)

  // Cap length on a word boundary when possible so the title
  // doesn't end mid-word.
  if (text.length > MAX_TITLE) {
    const slice = text.slice(0, MAX_TITLE - 1)
    const lastSpace = slice.lastIndexOf(' ')
    text =
      (lastSpace > MAX_TITLE * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + '…'
  }

  return text
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for ancient browsers — not cryptographically strong, fine for
  // a UI session id.
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}
