# LegaLite – AI Architecture

## Overview

LegaLite's AI is built on **Retrieval-Augmented Generation (RAG)**. The base model (Claude / GPT) is never fine-tuned. At query time, relevant legal context is retrieved from PostgreSQL (pgvector) and injected into the model's context window.

---

## AI Stack

| Component | Technology |
|---|---|
| LLM | Claude (claude-sonnet) / OpenAI |
| Embedding Model | OpenAI text-embedding-3-small |
| Vector Store | PostgreSQL + pgvector (Supabase) |
| Orchestration | NestJS AI Module |
| Edge Functions | Supabase Edge Functions (Deno) |

---

## Use Cases

| Feature | AI Capability |
|---|---|
| AI Assistant chat | RAG over Ghana statutes + case law |
| Document generation | Template filling + legal drafting |
| Case analysis | Precedent matching + strategy advice |
| Deadline advice | CI 47 rule interpretation |
| Summary generation | Client / case summaries |

---

## RAG Pipeline

```
User Query
    │
    ▼
1. Embed query (OpenAI text-embedding-3-small → 1536-dim vector)
    │
    ▼
2. Vector search in pgvector
   ├── legal_documents (Ghana statutes)
   └── case_precedents (decided cases)
    │
    ▼
3. Retrieve top-N chunks (cosine similarity)
    │
    ▼
4. Build context window:
   ├── BACKEND STANDARD DATA (statutes + precedents)
   └── USER-ISOLATED DATA (firm uploads — never shared)
    │
    ▼
5. Call Claude / GPT with enriched prompt
    │
    ▼
6. Stream response back to frontend
   └── Include citations: [Source: CI 47 Order 2]
```

---

## NestJS AI Module

```
modules/ai/
├── ai.module.ts
├── ai.controller.ts       # POST /ai/chat, /ai/search-kb, /ai/generate-doc
├── ai.service.ts          # Orchestration logic
├── embedding.service.ts   # Wraps OpenAI embeddings API
├── rag.service.ts         # pgvector search + context building
└── prompt-builder.ts      # Context assembly utilities
```

### Key Methods

```ts
// ai.service.ts
class AiService {
  // General legal chat with RAG context
  async chat(query: string, userId: string, history: Message[]): Promise<Response>

  // Semantic search over Ghana statutes
  async searchKb(query: string, category?: string, matchCount = 8): Promise<Chunk[]>

  // Semantic search over decided cases
  async searchPrecedents(facts: string, matterType?: string): Promise<Precedent[]>

  // AI-powered document generation
  async generateDocument(templateName: string, context: Record<string, string>): Promise<string>
}
```

---

## Database Tables (pgvector)

```sql
-- Ghana Statutes & Standard Data
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_name TEXT NOT NULL,
  category TEXT,             -- 'CI 47', 'Act 651', etc.
  content TEXT,
  embedding VECTOR(1536),    -- pgvector
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decided Ghana Case Precedents
CREATE TABLE case_precedents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_name TEXT NOT NULL,
  citation TEXT,
  court TEXT,
  year INT,
  matter_type TEXT,
  facts_summary TEXT,
  holding TEXT,
  legal_principles TEXT[],
  statutes_cited TEXT[],
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create IVFFlat indexes for fast similarity search
CREATE INDEX ON legal_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON case_precedents USING ivfflat (embedding vector_cosine_ops);
```

---

## Data Privacy Architecture

```
┌─────────────────────────────────────────────────────┐
│                 AI CONTEXT WINDOW                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  BACKEND STANDARD DATA (Global — all users) │   │
│  │  • Ghana statutes (CI 47, Act 651, etc.)    │   │
│  │  • Decided Ghana case precedents            │   │
│  │  │ Source: Supabase pgvector               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  USER-ISOLATED DATA (Private — this user)   │   │
│  │  • Uploaded firm PDFs / DOCX / TXT          │   │
│  │  • Stored in Supabase Storage               │   │
│  │  │ Scoped to: user_id (RLS enforced)        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              Claude / GPT Response
              (with inline citations)
```

**Privacy guarantee:** User-uploaded documents are scoped strictly by `user_id` via PostgreSQL Row-Level Security. No cross-user data leakage is possible at the database level.

---

## Supabase Edge Functions (existing, to be migrated)

| Function | Path | Purpose |
|---|---|---|
| `search-kb` | `/functions/v1/search-kb` | Statute semantic search |
| `get-template` | `/functions/v1/get-template` | Fetch court templates |
| `search-precedents` | `/functions/v1/search-precedents` | Case law search |

These will be **proxied through NestJS** in the new architecture so the frontend never calls Supabase Edge Functions directly.

---

## Prompt Construction

```ts
// prompt-builder.ts
export function buildSystemPrompt(
  statuteChunks: Chunk[],
  precedents: Precedent[],
  firmDocs: FirmDoc[],
): string {
  return [
    LEGALITE_BASE_PROMPT,            // Ghana law expert persona
    buildBackendContext(statuteChunks),
    buildPrecedentsContext(precedents),
    buildUserKBContext(firmDocs),     // User-isolated only
  ].join('\n\n')
}
```

---

## TigerStyle Principles Applied

- **Deterministic where possible** — temperature=0 for document generation
- **Cite sources explicitly** — every AI response must include `[Source: ...]`
- **Fail gracefully** — AI errors return structured fallback, never crash the UI
- **Privacy by design** — user data never mixed into global vector store
