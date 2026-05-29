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
  at `.husky/pre-commit` enforces it mechanically — see §1.1 for
  the operator procedures (bypass, disable, modify, remove).
- Always reference `README.md`, `docs/TENANCY.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`, and `docs/AI.md` before making changes.
- No emojis in code, comments, or commit messages.
- Use professional naming conventions, strict TypeScript types, and consistent formatting.
- All visual elements must use components from **shadcn/ui** — no custom raw CSS unless absolutely unavoidable.
- If existing documentation is outdated or conflicts with the current state, flag it before proceeding.

---

## 1.1 Competitor-mention guard — operator procedures

The pre-commit hook at `.husky/pre-commit` enforces the §1 rule by
scanning staged additions and renamed paths for the banned word
and rejecting any commit that contains it. The hook excludes
`AGENTS.md`, `docs/RULES.md`, the hook file itself, lockfiles,
`node_modules`, `.next`, `dist`, and `build`. Anyone running
`pnpm install` after a pull picks up the hook automatically via
the `prepare: husky` script in `package.json`.

The procedures below cover the four ways the guard might need to
change over time. Each procedure preserves an audit trail.

### A. One-off bypass for a single commit

Use this only when the commit is provably exempt — e.g. you're
landing a security patch in an unrelated file and CI is wedged.
Never use it as a routine workaround.

```bash
# Document the reason in the commit message itself, then:
git commit --no-verify -m "fix: security patch X (hook bypassed: reason)"
```

The bypass is recorded in plain text in the commit message so a
future reviewer can audit it. Two-or-more `--no-verify` commits in
one week should trigger a discussion in the team channel about
why the rule keeps getting in the way.

### B. Temporary local disable (developer can't run the hook)

If a teammate's machine can't execute the shell script (rare —
typically only Windows users without WSL or Git Bash), unblock
them locally without touching the repo:

```bash
# Local-only — not shared.
git config --local core.hooksPath /dev/null
```

To re-enable:

```bash
git config --local --unset core.hooksPath
```

The developer is then on the honour system to grep manually
before each commit. Push them to install WSL / Git for Windows so
the hook can run; the manual workaround is a stop-gap.

### C. Modifying the banned-word list

If we ever need to add a second competitor or remove one:

1. Edit the `BANNED_PATTERN` regex at the top of
   `.husky/pre-commit`. It's a single line — extend the pattern
   with alternation, e.g. `BANNED_PATTERN='\b(Clio|MyCase)\b'`.
2. If you're **removing** a word: also do a full-codebase scrub
   pass so the word goes away from current source before the
   guard stops catching it. The cleanest sequence is:
   - Update the regex
   - Run `grep -rIn -E "<old pattern>" --include="*.ts" --include="*.tsx" --include="*.md" .`
   - Rewrite any hits in your own words
   - Commit both changes together
3. If you're **adding** a word: also do an audit pass to find any
   existing hits the older guard let through (e.g. legacy code
   that pre-dated the rule). Same grep, same scrub procedure.
4. Update §1 of this file and the matching key constraint in
   `AGENTS.md` so the policy and the regex stay in sync.
5. Test before pushing — see §1.1.E.

### D. Permanently removing the guard

Removing the guard is a leadership-only decision because the rule
exists for legal exposure reasons, not engineering preference. The
operator who removes it owns that decision in writing.

1. Open an issue / Slack thread and get explicit sign-off from
   the firm owner (or the person handling IP / legal). Quote
   their approval in the commit message body for the audit trail.
2. Remove the guard block from `.husky/pre-commit` — keep the
   file (and any other checks it runs) intact. Don't delete
   `.husky/pre-commit` outright; future guards will live there.
3. Delete §1 (the banned-word rule) and §1.1 (this section) from
   this file. Delete the matching key constraint from `AGENTS.md`.
4. Run `grep -rIn` one final time to confirm the codebase doesn't
   silently pick up new references because the guard is gone.
5. Commit with a `chore(rules): remove competitor-mention guard
   (signed off by …)` message and push.

### E. Testing changes to the hook

Before pushing any hook change, prove both halves work:

```bash
# Should be REJECTED (the banned word appears in an addition)
echo "// matches Clio's design" > /tmp/__test.ts && \
  cp /tmp/__test.ts ./__test.ts && \
  git add ./__test.ts && \
  .husky/pre-commit
# Expect: exit 1, red "Commit blocked" message
rm ./__test.ts /tmp/__test.ts && git reset HEAD ./__test.ts 2>/dev/null

# Should PASS (clean content)
echo "// industry-standard layout" > ./__test.ts && \
  git add ./__test.ts && \
  .husky/pre-commit
# Expect: exit 0, silent
rm ./__test.ts && git reset HEAD ./__test.ts 2>/dev/null
```

If both behaviours match, the hook is ready to commit.

### F. Recommended belt-and-braces

The hook is a *local* guardrail — it runs only when a developer
commits on their machine. A determined or careless person can
bypass it with `--no-verify`. For full defence-in-depth:

- Mirror the same `\bClio\b` grep in CI (GitHub Actions / Vercel
  preview build) and fail the pipeline on a match. That catches
  any commit that arrived via `--no-verify` or via a developer
  who disabled the local hook.
- Enable GitHub branch protection on `main` requiring CI to pass
  before merge so the CI guard can't be skipped.

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
