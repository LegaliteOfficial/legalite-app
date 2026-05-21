# LegaLite – Tenancy & Access Model

> **Read this before touching auth, dashboard, or any domain table (clients, cases, documents, billing).**
> Every record in LegaLite — except the global legal corpus — belongs to a **firm**, not to an individual user.

---

## 1. The Core Idea

LegaLite is a **multi-tenant practice OS** where the tenant is a **law firm**, not an individual lawyer.

A firm signs up once. The signer becomes the **firm owner**. From the dashboard, the owner onboards the rest of the firm by issuing invitations. Every other lawyer, associate, paralegal, and admin enters the system through an accepted invitation — they cannot create a firm by signing up the same way the owner did.

The application has two purposes, and the architecture must serve both:

1. **Operational OS** — replace the firm's day-to-day workflow (clients, cases, drafts, billing, deadlines).
2. **Executive command center** — give the head of the firm a single pane of glass to see *everything* happening across the firm in real time.

These two purposes map to two distinct app surfaces, described in §4.

---

## 2. Entities

```
┌──────────────┐         ┌──────────────────┐         ┌───────────────────┐
│   profiles   │◄────────┤   firm_members   ├────────►│       firms       │
│ (one human)  │         │  (membership +   │         │  (one tenant)     │
│              │         │   roles)         │         │                   │
└──────────────┘         └──────────────────┘         └──────────┬────────┘
                                                                │
                                                                │ owns
                                                                ▼
                         ┌────────────────────────────────────────────────┐
                         │  Firm-scoped data                              │
                         │  clients · cases · tasks · documents · invoices│
                         │  Every row carries firm_id; RLS enforces it.   │
                         └────────────────────────────────────────────────┘

┌──────────────────────┐
│  firm_invitations    │  Issued by owner/admin → consumed at signup
│  (pending onboarding)│
└──────────────────────┘
```

| Entity | Purpose |
|---|---|
| `firms` | The tenant. Holds firm name, slug, address, subscription plan, owner pointer. |
| `profiles` | One row per human. Identity-level data only (name, GBA number, phone, avatar). **No `firm` text column** — firm membership lives on `firm_members`. |
| `firm_members` | Join table: which humans belong to which firm, in what capacity. Carries **two role dimensions** (see §3). |
| `firm_invitations` | Pending onboarding records. Single-use, expiring, email-addressed. |
| Firm-scoped data | `clients`, `cases`, `tasks`, `documents`, `invoices`, etc. Every row has `firm_id`. |
| Global legal corpus | `legal_documents`, `case_precedents` — not firm-scoped; shared across all tenants. |

A human *can* belong to more than one firm (e.g., a consulting senior partner). The active firm is selected per session.

---

## 3. Two Role Dimensions

Roles in LegaLite are **two-dimensional**. Conflating them is the most common mistake to avoid.

### 3a. Firm role — *platform power*

Stored as `firm_members.firm_role`. Decides what someone can do inside the LegaLite app.

| Firm role | Power |
|---|---|
| `owner` | The original signer. Exactly one per firm. Full power: billing, plan changes, transferring ownership, deleting the firm, all admin powers. |
| `admin` | Delegated power. Can invite, remove, and reassign members; can see all firm data; cannot touch billing or delete the firm. |
| `member` | Everyone else. Sees their assigned matters and firm-wide reference data, not the admin console. |

### 3b. Professional title — *job function inside the firm*

Stored as `firm_members.professional_title`. Decides labels, defaults, and display — **not** access.

`senior_partner` · `partner` · `lawyer` · `associate` · `paralegal` · `support_staff`

A `senior_partner` who is **not** the owner is still a `member` in firm-role terms. A `paralegal` could be promoted to `admin` for the platform without changing their professional title.

**Why the split:** the firm's hierarchy on paper is not the same as platform permissions. The senior partner does not necessarily want to be the one managing seat counts and Stripe — that's an `admin` job.

---

## 4. The Two App Surfaces

The same web app exposes two surfaces. Which one a user sees on login is determined by their **firm role**, with the option to switch (for owner/admin).

### 4a. Firm Admin Console — *the command center*

- **Audience:** `owner`, `admin`.
- **Route prefix:** `/dashboard` (current build), plus `/team`, `/firm/billing`, `/firm/settings`, `/firm/audit`.
- **Purpose:** cross-firm visibility. Aggregate KPIs across every member, every case, every invoice. Issue and revoke invitations. Manage plan, seats, branding, audit log.
- **Visibility scope:** the entire firm. No row-level filtering by `assigned_to` — admin sees everything.

> The current `/dashboard` route is the Firm Admin Console. This is the dashboard the user described: "monitors the overall platform activities and actions… from this dashboard that invites will be sent to the other people in the firm."

### 4b. Member Workspace — *the daily driver*

- **Audience:** every member (including owner/admin when they want to do their own legal work).
- **Route prefix:** `/clients`, `/cases`, `/tasks`, `/documents`, `/deadlines`, `/billing` (personal view), `/ai`.
- **Purpose:** day-to-day legal practice. The user sees only the matters they are assigned to and the firm-wide reference data (templates, corpus, contacts).
- **Visibility scope:** filtered by assignment. Owner/admin can opt into "view as member" or stay in full-firm view.

Owner/admin toggle between surfaces via the topbar (planned). New members land directly in the Member Workspace and never see the admin console.

---

## 5. Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Owner path                                                         │
│                                                                     │
│  Sign up form  ──►  Create profile  ──►  Create firm  ──►  Become   │
│  (email, name,      (auth.users +        (firms row +      owner    │
│   firm name)        profiles row)        firm_members)              │
│                                                                     │
│                                              │                      │
│                                              ▼                      │
│                                    Lands in Firm Admin Console      │
│                                    Empty state: "Invite your team"  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Member path                                                        │
│                                                                     │
│  Admin opens /team  ──►  "Invite member"                            │
│       │                  (email, firm_role, professional_title)     │
│       │                                                             │
│       ▼                                                             │
│  firm_invitations row created                                       │
│  Email sent with signed token link                                  │
│                                                                     │
│  Invitee clicks link  ──►  /accept-invite?token=…                   │
│       │                                                             │
│       ▼                                                             │
│  Form prefilled with email + roles (read-only on invite metadata)   │
│  Invitee sets name + password                                       │
│       │                                                             │
│       ▼                                                             │
│  auth.users + profiles + firm_members rows created in one txn       │
│  Invitation marked accepted; token consumed                         │
│       │                                                             │
│       ▼                                                             │
│  Lands in Member Workspace                                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Signup form should not ask for "firm name" in the long term.** The current public signup creates a firm; once invitations are live, the public signup is only for owners creating new firms. Invited users go through `/accept-invite?token=…`, not `/signup`.

---

## 6. Data Scoping Rules

Every firm-scoped table carries a `firm_id` column with a foreign key to `firms`. This is non-negotiable.

### Row-Level Security (Supabase)

```sql
-- Template policy applied to every firm-scoped table
CREATE POLICY "firm_scope_read" ON <table> FOR SELECT TO authenticated
  USING (firm_id IN (
    SELECT firm_id FROM firm_members
    WHERE profile_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "firm_scope_write" ON <table> FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (
    SELECT firm_id FROM firm_members
    WHERE profile_id = auth.uid() AND status = 'active'
  ));
```

Update and delete policies layer firm-role checks on top (e.g., only `owner`/`admin` can delete a client).

### Application-layer (NestJS)

- Every authenticated request resolves an **active firm** from the session (default = the user's only firm; user picks if more than one).
- Every domain service method receives `firmId` explicitly. No implicit "current firm" globals.
- A `FirmGuard` rejects requests where the JWT subject is not an active member of the requested `firmId`.
- A `FirmRoleGuard` enforces `owner`/`admin` on admin-console endpoints.

### Global tables (NOT firm-scoped)

- `legal_documents` (Ghana statutes)
- `case_precedents` (decided cases)
- `court_templates`

These are read-only reference data shared across all firms. No `firm_id` column; no RLS by tenant.

---

## 7. Invitations — First-Class Object

`firm_invitations` is a domain entity with a full lifecycle, not a transient email artifact.

| Field | Purpose |
|---|---|
| `id` | UUID |
| `firm_id` | The firm being joined |
| `email` | Invitee's address (lowercased, unique per firm while pending) |
| `firm_role` | What they'll become (`admin` or `member`) — owners are not invited |
| `professional_title` | Default title to set on `firm_members` |
| `token_hash` | bcrypt/argon2 hash of the single-use token; the raw token is only ever in the email URL |
| `invited_by` | `profiles.id` of issuer |
| `expires_at` | Default 7 days; configurable per firm policy later |
| `accepted_at` | Null while pending |
| `accepted_by` | `profiles.id` once consumed |
| `revoked_at` | Set if rescinded before acceptance |
| `created_at` | |

**Operations the admin console must support:**

- Issue a new invitation (with role + title selection).
- See a list of pending invitations (with expiry countdown).
- Resend (issue a fresh token, invalidate the old one).
- Revoke a pending invitation.
- See accepted/expired invitations in an audit view.

**Token handling:**

- Token is generated server-side as a 32-byte random string, base64url-encoded.
- Only the **hash** is stored. The raw token is in the email link once and never again.
- Verification: hash the incoming token, look up by `firm_id` (from the URL) + hash, check `expires_at` and not-yet-accepted.

---

## 8. What This Means for Each Module

### Auth

- `/auth/register` (existing) → renamed semantically to "register firm owner": creates `auth.users` + `profiles` + `firms` + `firm_members` (with `firm_role = owner`) in one transaction.
- `/auth/accept-invite` (new) → consumes a token, creates `auth.users` + `profiles` + `firm_members`. Does NOT create a firm.
- `/auth/me` returns the user's profile **and** their active `firm_members` row (firm_id, firm_role, professional_title).

### Dashboard (Firm Admin Console)

- Default landing for `owner`/`admin`.
- Pulls aggregates across the firm (not just the calling user): total open cases, total billables, overdue tasks, deadline heatmap, member activity feed.
- All queries pass `firmId` from the session.

### Team page (new, under admin console)

- Lists `firm_members` for the firm.
- Pending invitations panel.
- Actions: invite, resend, revoke, change role, deactivate.

### Clients / Cases / Tasks / Documents / Billing

- All become firm-scoped at the column level (`firm_id`).
- The list views show firm-wide data for `owner`/`admin`, assignment-filtered for `member`.
- The "create" endpoints stamp `firm_id` from the session, not from the request body.

### AI

- RAG retrieval continues to include the global corpus.
- Firm-uploaded documents (firm knowledge base) become `firm_id`-scoped, not `user_id`-scoped. Any member of the firm can query the firm's KB; cross-firm leakage is prevented at the RLS level.

---

## 9. Open Questions (Not Yet Decided)

The following are explicitly **deferred** — record the decision here when made.

- **Multi-firm membership UX.** A profile can belong to more than one firm at the schema level. What does the firm picker look like? Default firm on login?
- **Assignment granularity for members.** Today's simplest rule: a member sees a case if they're listed in `case_members`. Later we may want per-document ACLs.
- **Ownership transfer.** Can an `owner` hand the firm to another member? (Likely yes — needs flow + audit.)
- **Firm deletion / archival.** Hard delete vs. soft archive with retention period.
- **Branding per firm.** White-label headers/logos for the Firm Admin Console.
- **Cross-firm billing.** Firms billed individually under one Stripe customer per firm.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **Firm** | The tenant. The unit of billing, data isolation, and admin control. |
| **Owner** | The firm role of the original signer. One per firm. |
| **Admin** | A firm role with delegated platform power, short of billing/deletion. |
| **Member** | The default firm role. Day-to-day practitioner. |
| **Firm Admin Console** | The `/dashboard` surface for owner/admin — cross-firm visibility and control. |
| **Member Workspace** | The per-practitioner surface for daily legal work. |
| **Invitation** | A pending onboarding record, tokenized, expiring, single-use. |
| **Global corpus** | Shared reference data (statutes, precedents) — not firm-scoped. |
