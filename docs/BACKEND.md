# LegaLite – Backend Architecture

> **Read [docs/TENANCY.md](TENANCY.md) before this file.** Every domain entity below is firm-scoped, every guard is firm-aware, and the auth flows split into "owner registration" vs "invitation acceptance". The tenancy doc is the source of truth for that model; this file describes how the backend implements it.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS |
| Language | TypeScript |
| Database | PostgreSQL (via Supabase) |
| ORM | Supabase JS Client / Prisma (optional) |
| Auth | JWT + bcrypt |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Vector Search | pgvector (Supabase) |

---

## Directory Structure

```
legalite-backend/                # Backend repo (separate from this one)
├── src/
│   ├── main.ts                 # App entry point
│   ├── app.module.ts           # Root module
│   ├── config/
│   │   ├── config.module.ts
│   │   └── env.validation.ts   # Zod env schema
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   └── filters/
│   │       └── exception.filter.ts
│   ├── database/
│   │   └── supabase.service.ts # Supabase client singleton
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts       # /auth/register-firm, /auth/accept-invite, /auth/login, /auth/me
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── dto/
│       │       ├── login.dto.ts
│       │       ├── register-firm.dto.ts       # owner + firm creation
│       │       └── accept-invite.dto.ts       # token consumption
│       ├── firms/                       # NEW — tenant management
│       │   ├── firms.module.ts
│       │   ├── firms.controller.ts      # /firms/me, /firms/:id (admin)
│       │   ├── firms.service.ts
│       │   └── dto/
│       ├── members/                     # NEW — firm_members CRUD (admin console)
│       │   ├── members.module.ts
│       │   ├── members.controller.ts    # /firms/:firmId/members
│       │   ├── members.service.ts
│       │   └── dto/
│       ├── invitations/                 # NEW — first-class invitation lifecycle
│       │   ├── invitations.module.ts
│       │   ├── invitations.controller.ts  # issue, list, resend, revoke
│       │   ├── invitations.service.ts
│       │   ├── token.service.ts         # generate + hash + verify
│       │   └── dto/
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.service.ts
│       │   └── dto/
│       ├── clients/
│       │   ├── clients.module.ts
│       │   ├── clients.controller.ts
│       │   ├── clients.service.ts
│       │   └── dto/
│       ├── cases/
│       │   ├── cases.module.ts
│       │   ├── cases.controller.ts
│       │   ├── cases.service.ts
│       │   └── dto/
│       ├── documents/
│       │   ├── documents.module.ts
│       │   ├── documents.controller.ts
│       │   ├── documents.service.ts
│       │   └── dto/
│       ├── billing/
│       │   ├── billing.module.ts
│       │   ├── billing.controller.ts
│       │   ├── billing.service.ts
│       │   └── dto/
│       └── ai/
│           ├── ai.module.ts
│           ├── ai.controller.ts
│           └── ai.service.ts
```

---

## Authentication Strategy (Hybrid)

### Two entry paths

1. **Firm owner registration** — `POST /auth/register-firm`. The signer provides email, password, name, and firm name. The service runs one transaction that creates `auth.users` + `profiles` + `firms` + `firm_members` (with `firm_role = 'owner'`). Returns a JWT.
2. **Invitation acceptance** — `POST /auth/accept-invite`. The body carries the raw token (from the email URL) + name + password. The service verifies the token against `firm_invitations.token_hash`, then runs one transaction that creates `auth.users` + `profiles` + `firm_members` (using `firm_role` and `professional_title` from the invitation) and marks the invitation accepted. Returns a JWT. **This path never creates a firm.**

`POST /auth/login` and `GET /auth/me` are unchanged in shape, but `/auth/me` now returns the user's profile **and** their active membership (`firm_id`, `firm_role`, `professional_title`).

### JWT contents

The JWT carries `sub` (profile id), `email`, and **`active_firm_id`** (the firm the session is currently scoped to). For multi-firm users, a `POST /auth/switch-firm/:firmId` endpoint reissues a JWT with a new `active_firm_id`.

### Bcrypt + httpOnly cookies, as before

Password hashing with bcrypt; JWT stored in an httpOnly cookie by the web app; all protected routes require `JwtAuthGuard`; Supabase Auth used optionally for OAuth (Google).

### Two-dimensional RBAC

Role checks split along the two dimensions defined in [docs/TENANCY.md](TENANCY.md):

```ts
// FirmGuard — ensures the JWT's active_firm_id matches the route param,
// and that the user is an active firm_members row for that firm.
@UseGuards(JwtAuthGuard, FirmGuard)
@Get(':firmId/clients')
listClients() { ... }

// FirmRoleGuard — gates admin-console endpoints by firm_role.
@FirmRoles('owner', 'admin')
@UseGuards(JwtAuthGuard, FirmGuard, FirmRoleGuard)
@Post(':firmId/invitations')
inviteMember() { ... }

// Professional titles are NOT used for authorization — only for labels/defaults.
```

---

## API Design

All endpoints follow REST conventions and return a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 42, "page": 1 }
}
```

### Core Endpoints

Firm-scoped routes are nested under `/firms/:firmId/...`. The `FirmGuard` enforces that `:firmId` matches the JWT's `active_firm_id` and that the caller is an active member.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register-firm` | Create owner + firm in one transaction; returns JWT |
| POST | `/auth/accept-invite` | Consume invitation token; create profile + membership; returns JWT |
| POST | `/auth/login` | Login, receive JWT |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Profile + active membership (firm_id, firm_role, professional_title) |
| POST | `/auth/switch-firm/:firmId` | Reissue JWT scoped to a different firm the user belongs to |
| GET | `/firms/me` | Active firm metadata for the session |
| PATCH | `/firms/:firmId` | Update firm (owner/admin only) |
| GET | `/firms/:firmId/members` | List firm members |
| PATCH | `/firms/:firmId/members/:memberId` | Change role/title or deactivate (owner/admin) |
| POST | `/firms/:firmId/invitations` | Issue invitation (owner/admin) |
| GET | `/firms/:firmId/invitations` | List pending + historical invitations |
| POST | `/firms/:firmId/invitations/:id/resend` | Reissue token, invalidate previous |
| DELETE | `/firms/:firmId/invitations/:id` | Revoke pending invitation |
| GET | `/firms/:firmId/clients` | List firm's clients (admin: all; member: assigned) |
| POST | `/firms/:firmId/clients` | Create client (stamps firm_id from session) |
| GET | `/firms/:firmId/clients/:id` | Get client |
| PATCH | `/firms/:firmId/clients/:id` | Update client |
| DELETE | `/firms/:firmId/clients/:id` | Delete client (owner/admin) |
| GET | `/firms/:firmId/cases` | List cases |
| POST | `/firms/:firmId/cases` | Create case |
| GET | `/firms/:firmId/documents` | List documents |
| POST | `/firms/:firmId/documents/generate` | AI-generate document |
| GET | `/firms/:firmId/billing/invoices` | List invoices |
| POST | `/ai/search-kb` | Statute RAG search (global corpus, not firm-scoped) |
| POST | `/ai/search-precedents` | Case law RAG search (global corpus, not firm-scoped) |
| POST | `/firms/:firmId/ai/chat` | AI chat with firm-scoped KB merged into context |

---

## Database (PostgreSQL via Supabase)

> The current `schema_profiles.sql` reflects the legacy single-user model (`profiles.firm` as a text column, no firms/members/invitations). It will be migrated to match the schema below as part of the multi-tenant cutover. See [docs/TENANCY.md](TENANCY.md) §2 for the entity model and §6 for the RLS template applied to every firm-scoped table.

### Tenant tables

```sql
-- One row per tenant (law firm)
CREATE TABLE firms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  country         TEXT NOT NULL DEFAULT 'GH',
  address         TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'trial',
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One human, identity-level data only. NO firm column.
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  gba_number    TEXT,                  -- Ghana Bar Association number
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membership join: which humans belong to which firm, in what capacity.
CREATE TABLE firm_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id             UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  firm_role           TEXT NOT NULL CHECK (firm_role IN ('owner','admin','member')),
  professional_title  TEXT NOT NULL DEFAULT 'lawyer'
                      CHECK (professional_title IN
                             ('senior_partner','partner','lawyer','associate','paralegal','support_staff')),
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','suspended','removed')),
  invited_by          UUID REFERENCES profiles(id),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (firm_id, profile_id)
);

CREATE INDEX idx_firm_members_profile ON firm_members (profile_id) WHERE status = 'active';
CREATE INDEX idx_firm_members_firm    ON firm_members (firm_id)    WHERE status = 'active';

-- Exactly one owner per firm — enforced by partial unique index.
CREATE UNIQUE INDEX uniq_firm_owner
  ON firm_members (firm_id) WHERE firm_role = 'owner';

-- Pending invitations. Single-use, expiring.
CREATE TABLE firm_invitations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id             UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,           -- lowercased before insert
  firm_role           TEXT NOT NULL CHECK (firm_role IN ('admin','member')),  -- owners not invited
  professional_title  TEXT NOT NULL DEFAULT 'lawyer',
  token_hash          TEXT NOT NULL,           -- bcrypt/argon2 hash; raw token only in the email
  invited_by          UUID NOT NULL REFERENCES profiles(id),
  expires_at          TIMESTAMPTZ NOT NULL,
  accepted_at         TIMESTAMPTZ,
  accepted_by         UUID REFERENCES profiles(id),
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One pending invite per email per firm
CREATE UNIQUE INDEX uniq_pending_invite
  ON firm_invitations (firm_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
```

### Firm-scoped business tables

Every business table carries `firm_id`. The `user_id` column from the legacy schema is replaced (or supplemented) by ownership/assignment columns that reference `profiles`.

```sql
-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  ghana_card TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_clients_firm ON clients (firm_id);

-- Cases (firm-owned; assignment via case_assignments)
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  lead_lawyer_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  court TEXT,
  suit_no TEXT,
  status TEXT DEFAULT 'Active',
  next_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cases_firm ON cases (firm_id);

-- Per-case member assignment (drives Member Workspace visibility)
CREATE TABLE case_assignments (
  case_id    UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'collaborator',  -- 'lead' | 'collaborator' | 'observer'
  PRIMARY KEY (case_id, profile_id)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id),
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  template_type TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_documents_firm ON documents (firm_id);

-- Billing
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  issued_by UUID REFERENCES profiles(id),
  amount_ghs NUMERIC,
  status TEXT DEFAULT 'Draft',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invoices_firm ON invoices (firm_id);
```

### RLS pattern (applied to every firm-scoped table)

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: firm scope read" ON clients FOR SELECT TO authenticated
  USING (firm_id IN (
    SELECT firm_id FROM firm_members
    WHERE profile_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "clients: firm scope write" ON clients FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (
    SELECT firm_id FROM firm_members
    WHERE profile_id = auth.uid() AND status = 'active'
  ));

-- Update/delete add firm_role checks (only owner/admin can delete)
CREATE POLICY "clients: admin delete" ON clients FOR DELETE TO authenticated
  USING (firm_id IN (
    SELECT firm_id FROM firm_members
    WHERE profile_id = auth.uid()
      AND status = 'active'
      AND firm_role IN ('owner','admin')
  ));
```

Application-layer enforcement (`FirmGuard`, `FirmRoleGuard`) layers on top of RLS as defence-in-depth. RLS is the floor; guards are the ceiling.

---

## Supabase Integration

### SupabaseService

```ts
// database/supabase.service.ts
@Injectable()
export class SupabaseService {
  private client: SupabaseClient

  constructor(private config: ConfigService) {
    this.client = createClient(
      config.get('SUPABASE_URL'),
      config.get('SUPABASE_SERVICE_KEY'),  // Service key — backend only
    )
  }

  get db() { return this.client }
}
```

---

## TigerStyle Principles Applied

- **Assert at boundaries** — DTOs validated with class-validator + Zod
- **Crash early** — env validation at startup (fail fast if misconfigured)
- **Explicit error handling** — global exception filter, typed error responses
- **No magic** — every module explicitly imported, no auto-discovery surprises
- **Least privilege** — RLS policies at DB level + RBAC at API level
