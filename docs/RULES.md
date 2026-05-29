# LegaLite – AI Operational & Developer Rules

> **AI must read and apply these rules before performing any task in this codebase.**
> Reference docs: `docs/TENANCY.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`, `docs/AI.md`, `schema.sql`, `README.md`

---

## 1. General Rules

- **NEVER REFERENCE CLIO.** Clio is a direct competitor.
  Mentioning their product anywhere in this codebase — source,
  comments, docs, commit messages, PR descriptions, file names,
  identifiers, branch names, migrations, internal Slack snippets
  pasted into the repo, anywhere — creates real legal exposure
  (copying allegations, trade-dress claims). When a reference
  screenshot is supplied, describe the visual goal in your own
  words: "standard practice-management layout", "industry
  pattern", "follows the standard convention". Never attribute
  the design to a third party. **This rule supersedes everything
  else in this file and is non-negotiable.** A pre-commit hook
  should grep for the word and reject commits that contain it.
- Always reference `README.md`, `docs/TENANCY.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`, and `docs/AI.md` before making changes.
- No emojis in code, comments, or commit messages.
- Use professional naming conventions, strict TypeScript types, and consistent formatting.
- All visual elements must use components from **shadcn/ui** — no custom raw CSS unless absolutely unavoidable.
- If existing documentation is outdated or conflicts with the current state, flag it before proceeding.

---

## 1a. Tenancy Rules (read TENANCY.md first)

LegaLite is multi-tenant by **firm**. These rules are non-negotiable for any new code:

1. **The tenant is the firm, not the user.** Every business entity (clients, cases, tasks, documents, invoices, firm KB uploads) must carry a `firm_id` column and be filtered by it.
2. **Two role dimensions exist and must never be conflated.** `firm_role` (`owner`/`admin`/`member`) controls platform power; `professional_title` (`senior_partner`/`lawyer`/`associate`/`paralegal`/…) is for labels and defaults only. Never authorize off the professional title.
3. **The dashboard at `/dashboard` is the Firm Admin Console** — for `owner` and `admin` only. The Member Workspace (`/clients`, `/cases`, etc.) is for everyone. Do not mix the two on the same route.
4. **Onboarding has two distinct paths:** owner registration (creates a firm) and invitation acceptance (joins a firm). The public signup form is for owners only — invited users come through `/accept-invite?token=…`.
5. **Invitations are first-class.** Tokens are random 32-byte values, stored only as hashes, single-use, with expiry. Surface issue / list / resend / revoke on the admin console.
6. **All firm-scoped routes nest under `/firms/:firmId/...`.** A `FirmGuard` verifies the JWT's `active_firm_id` matches; a `FirmRoleGuard` gates admin-console endpoints. RLS enforces the same scope at the database level — defence in depth.
7. **Owner is unique per firm.** Enforce with a partial unique index on `firm_members`. Ownership can be transferred but never duplicated.
8. **AI firm KB is firm-scoped, not user-scoped.** Any active member of the firm can query the firm's uploaded corpus. The global Ghana legal corpus stays unscoped.

---

## 2. Frontend Rules

**Stack:** Next.js · Tailwind CSS · shadcn/ui · Zustand · TanStack Query · React Hook Form + Zod · TanStack Table · Tiptap

1. Follow **component-based architecture** — one concern per component, reusable and focused.
2. Maintain **responsive design** for desktop and tablet (mobile is secondary).
3. Every async action must have a **loading state** (spinner or skeleton) and a **result notification** (toast).
4. Form validation must be **inline, real-time, and accessible** via React Hook Form + Zod.
5. No raw CSS outside Tailwind utilities unless absolutely necessary and documented.
6. All icons, modals, dialogs, toasts, spinners, and notifications must come from **shadcn/ui**.
7. **State management separation is strict:**
   - Zustand → UI state, auth session, modal visibility
   - TanStack Query → all server/remote data (API calls, caching, invalidation)
8. No direct AI calls from frontend — all AI interactions go through the NestJS backend.

---

## 3. Backend Rules

**Stack:** Node.js · NestJS · PostgreSQL · Supabase (hybrid) · JWT + bcrypt

1. Always validate inputs server-side, regardless of frontend validation.
2. Follow **modular architecture**: one NestJS module per domain (`auth`, `users`, `clients`, `cases`, `documents`, `billing`, `ai`).
3. **Authentication:**
   - Passwords hashed with `bcrypt`
   - JWT + refresh tokens for sessions
   - RBAC guards on all protected routes
4. Never bypass access controls or role-based permissions — ever.
5. API responses must follow the standard envelope: `{ success, data, meta? }`.
6. Every module must implement centralized error handling and structured logging.
7. Core business logic and AI orchestration must live in NestJS — not in Supabase Edge Functions.

---

## 4. Supabase Rules

Supabase is used as the **managed platform layer**, not as the core business logic layer.

Approved uses:
- Managed PostgreSQL hosting and automated backups
- File storage (PDF, DOCX) with signed URLs and role-based access policies
- Realtime subscriptions for live notifications
- pgvector semantic search via stored procedures

Not approved:
- Running core business logic in Edge Functions (use NestJS instead)
- Exposing the service role key to the frontend under any circumstance

---

## 5. AI Integration Rules

1. All AI interactions must be routed through the **NestJS AI module** — never called directly from the frontend.
2. Before generating any output, the AI must query the **RAG pipeline** (pgvector context retrieval).
3. All AI-generated data must be validated and sanitized before database insertion.
4. Every AI decision/action must be logged for auditing.
5. AI must never suggest or generate code that bypasses authentication or RLS policies.
6. Document generation uses `temperature=0` for determinism.
7. Every AI response must include inline source citations: `[Source: CI 47 Order 2]`.

---

## 6. Database Rules

- PostgreSQL (via Supabase) is the **single source of truth** for all structured data.
- Enforce strict relational integrity: `Users → Clients → Cases → Documents → Billing`.
- All AI-generated content must be validated before insertion.
- Supabase Storage is for file assets only — never store structured data there.
- Redis (when added) must never cache sensitive legal or personal data unencrypted.
- Row-Level Security (RLS) must be enabled and policy-enforced on all user-owned tables.

---

## 7. Professional Feedback & UI Rules (Enforced on Every Interaction)

| Scenario | Required Component |
|---|---|
| Async API call | Loading spinner or skeleton (shadcn) |
| Success | Toast notification — professional, concise |
| Error | Toast or inline error — actionable, no emoji, no casual tone |
| Form validation | Inline error below field — real-time |
| Confirmation action | shadcn AlertDialog |

- No casual language in user-facing strings (e.g. no "Oops!", "Uh oh", "🎉").
- All error messages must be **descriptive, professional, and non-leaking** (no stack traces to users).

---

## 8. Security Rules

- JWT authentication + refresh token rotation
- RBAC enforced at NestJS guard level AND Supabase RLS level
- All inputs validated with Zod (frontend) and class-validator (backend)
- Secure file access via signed URLs only — never public bucket URLs for user files
- HTTPS only — no plaintext transmission
- Centralized logging for audit, debugging, and compliance
- Service role key never exposed to frontend or committed to version control

---

## 9. Developer Workflow Rules

- Run `pnpm dev` from the `legalite-app` repo for the frontend dev server (port 3000).
- Run `pnpm start:dev` from the `legalite-backend` repo for the backend dev server (port 3001).
- All changes to core modules (auth, AI, billing) require developer review before deployment.
- CI/CD must run: TypeScript type-check → ESLint → unit tests → before any deployment.
- Deployment targets:
  - Frontend → Vercel
  - Backend → Railway / DigitalOcean / AWS
  - Database → Supabase (managed)

---

## 10. Governance

- AI must **never** bypass documented rules or modify core architecture without flagging first.
- AI must **always** reference these rules before writing code.
- Any feature suggestion must include: validation, error handling, loading state, and user feedback.
- The design language is **gold (#C9972B) + navy (#0D1B2A) + cream (#F8F4EE)** — always.
- Fonts: **Playfair Display** (headings) + **DM Sans** (body) — always.
