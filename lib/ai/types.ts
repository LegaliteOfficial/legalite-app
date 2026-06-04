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
}

export interface StructuredCitation {
  citation_id: number
  summary: string
  law_name: string
  section: string
  article: string
  case_title: string
  court: string
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
}
