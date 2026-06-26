/**
 * TypeScript mirrors of the LegaLite AI FastAPI schemas.
 *
 * Source of truth: legalite-ai/app/schemas/qa.py — keep these in sync when
 * the backend response shape changes.
 */

export type Confidence = 'high' | 'medium' | 'low'

export type SourceScope = 'global' | 'tenant_private'

export interface CitationSpan {
  start_char: number | null
  end_char: number | null
}

export interface Citation {
  // v1 legacy fields
  law: string
  article: string
  section: string
  page: string
  // v2 fields
  law_name: string
  law_type: string
  act_number: string
  chapter: string
  part: string
  clause: string
  subsection: string
  page_number: number | null
  relevance: number
  // v3 provenance
  source_scope: SourceScope
  document_origin: string | null
  citation_span: CitationSpan | null
  // Phase B: source-document linkage. The frontend uses ``document_id``
  // to fetch the full source via getDocument(); ``chunk_id`` lets the
  // preview drawer scroll-to and highlight the exact cited passage.
  // Both null for legacy passages whose vector payload predates this
  // milestone.
  document_id: string | null
  chunk_id: string | null
}

export interface SourceUsed {
  law_name: string
  law_type: string
  section: string
  article: string
  page: string
  excerpt: string
  score: number
  source_scope: SourceScope
  document_origin: string | null
  // Phase B — same shape as Citation.document_id / chunk_id.
  document_id: string | null
  chunk_id: string | null
}

export interface StructuredCitation {
  citation_id: number
  summary: string
  law_name: string
  section: string
  article: string
  case_title: string
  court: string
  // Phase B — backend enriches these from the underlying passage so
  // the source preview drawer can open directly from a structured row.
  // Nullable for legacy passages whose payload predates this milestone.
  document_id: string | null
  chunk_id: string | null
  page_number: number | null
}

export interface StructuredAnswer {
  direct_answer: string
  applicable_law: StructuredCitation[]
  relevant_public_cases: StructuredCitation[]
  firm_similar_cases: StructuredCitation[]
  legal_reasoning: string
  confidence_assessment: string
  citations: number[]
}

export interface AskRequest {
  question: string
  session_id?: string | null
}

export interface AskResponse {
  // v1
  answer: string
  citations: Citation[]
  confidence: Confidence
  disclaimer: string
  // v2
  sources_used: SourceUsed[]
  reasoning_summary: string
  session_id: string | null
  // v3
  structured_answer: StructuredAnswer | null
  query_intent: string | null
  query_intent_confidence: number | null
  // Phase B (self-learning loop): assistant turn id used as the path
  // segment for POST /ask/{message_id}/feedback. Null when the backend
  // didn't persist a chat_messages row (e.g. early refusal paths).
  message_id: string | null
}

// ───────────────────────── Feedback ─────────────────────────

export type FeedbackThumbs = 'up' | 'down'

export interface FeedbackCreate {
  thumbs: FeedbackThumbs
  /** Optional free-text note. Max 2000 chars on the server. */
  comment?: string | null
}

export interface FeedbackResponse {
  id: string
  message_id: string
  session_id: string
  thumbs: FeedbackThumbs
  comment: string | null
  answer_confidence: string | null
  query_intent: string | null
  refused: boolean
  created_at: string
  updated_at: string
}

// ───────────────────────── Document source view ─────────────────────────

/**
 * One indexed chunk of a source document — what GET /documents/{id}
 * returns inside ``chunks[]``. The frontend uses ``chunk_id`` to scroll
 * to a specific citation and ``start_char`` / ``end_char`` to draw the
 * highlight band.
 */
export interface DocumentChunkView {
  chunk_id: string
  content: string
  page_start: number | null
  page_end: number | null
  start_char: number | null
  end_char: number | null
  chapter: string | null
  part: string | null
  article: string | null
  section: string | null
  clause: string | null
  subsection: string | null
}

/**
 * Full document payload returned by GET /documents/{id}. Used by the
 * source-preview drawer. ``pdf_url`` is null when Supabase Storage was
 * not configured at ingest time, when the upload failed, or when
 * signing failed — in any of those cases the drawer renders text-only
 * and hides the "Open original PDF" button.
 */
export interface DocumentView {
  id: string
  title: string
  doc_type: string
  law_type: string | null
  visibility_scope: string
  document_origin: string | null
  page_count: number
  status: string
  full_text: string
  chunks: DocumentChunkView[]
  pdf_url: string | null
  pdf_url_expires_in_seconds: number | null
  created_at: string
  updated_at: string
}
