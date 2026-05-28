# LegaLite – Frontend Architecture

> **Read [docs/TENANCY.md](TENANCY.md) before this file.** The web app exposes two surfaces (Firm Admin Console vs Member Workspace) on top of a shared shell. The surface a user sees is determined by their firm role on the active membership. This file describes the routing, state, and component conventions that make that work.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Global State | Zustand |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Rich Text Editor | Tiptap |

---

## Directory Structure

```
legalite-app/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx           # Owner-only signup: creates firm + owner
│   │   └── accept-invite/page.tsx    # Token-driven onboarding for invitees
│   ├── (dashboard)/            # Shared shell — sidebar/topbar
│   │   ├── layout.tsx          # Reads active membership; renders surface-aware nav
│   │   │
│   │   │   ── Firm Admin Console (owner/admin only — gated in layout) ──
│   │   ├── dashboard/page.tsx        # Firm command center: cross-firm KPIs + activity
│   │   ├── team/
│   │   │   ├── page.tsx              # Member list + pending invitations
│   │   │   └── invite/page.tsx       # Invite modal (also lives inline on /team)
│   │   ├── firm/
│   │   │   ├── billing/page.tsx      # Plan, seats, Stripe portal
│   │   │   ├── settings/page.tsx     # Firm name, branding, defaults
│   │   │   └── audit/page.tsx        # Invitation + membership history
│   │   │
│   │   │   ── Member Workspace (all members) ──
│   │   ├── clients/page.tsx
│   │   ├── cases/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── deadline/page.tsx
│   │   ├── ai/page.tsx
│   │   ├── comms/page.tsx
│   │   ├── billing/page.tsx          # Personal billing view (admins see firm-wide)
│   │   └── settings/page.tsx         # Personal preferences (vs. /firm/settings)
│   ├── layout.tsx              # Root layout (providers)
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/                 # Sidebar, Topbar, Shell
│   ├── clients/                # Client-specific components
│   ├── cases/                  # Case-specific components
│   ├── tasks/                  # Kanban board components
│   ├── documents/              # Tiptap editor components
│   ├── billing/                # Invoice components
│   └── ai/                     # AI chat components
├── lib/
│   ├── api.ts                  # Axios/fetch API client
│   ├── queryClient.ts          # TanStack Query config
│   └── utils.ts                # cn(), date helpers, etc.
├── stores/
│   ├── auth.store.ts           # Zustand auth store
│   └── ui.store.ts             # Zustand UI store (modals, sidebar)
├── hooks/
│   ├── useClients.ts           # TanStack Query hooks
│   ├── useCases.ts
│   ├── useTasks.ts
│   └── useBilling.ts
├── types/
│   └── index.ts                # Shared TypeScript types
└── schemas/
    ├── client.schema.ts        # Zod schemas
    ├── case.schema.ts
    └── auth.schema.ts
```

---

## State Management

### Zustand (Global / Client State)
Used for state that lives outside React's component tree or persists across routes:

```ts
// stores/auth.store.ts
interface ActiveMembership {
  firmId: string
  firmName: string
  firmRole: 'owner' | 'admin' | 'member'
  professionalTitle: 'senior_partner' | 'partner' | 'lawyer' | 'associate' | 'paralegal' | 'support_staff'
}

interface AuthStore {
  user: User | null
  token: string | null
  membership: ActiveMembership | null     // Active firm + role for this session
  memberships: ActiveMembership[]          // All firms the user belongs to (for firm switcher)
  setSession: (user: User, token: string, memberships: ActiveMembership[], active: ActiveMembership) => void
  switchFirm: (firmId: string) => Promise<void>   // Calls /auth/switch-firm/:firmId
  logout: () => void
}
```

The `(dashboard)/layout.tsx` reads `membership.firmRole` and conditionally renders the Firm Admin Console nav links (`/dashboard`, `/team`, `/firm/*`). A `member` role hides those links and lands on `/cases` by default. An admin can flip into "view as member" via a topbar toggle stored in the UI store.

### TanStack Query (Server State)
Used for all API data — handles fetching, caching, background sync:

```ts
// hooks/useClients.ts
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then(r => r.data),
  })
}
```

---

## Forms & Validation

All forms use **React Hook Form** with **Zod** schema validation:

```ts
// schemas/client.schema.ts
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
  ghanaCard: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>
```

### Progressive disclosure (collapsible sections)

**Optional / advanced sections on a form must default to CLOSED.** A user
landing on a new-record screen should see only the fields they're
required to fill in plus the obviously-needed channels (name, email,
phone, address). Anything that's optional, advanced, role-specific, or
rarely used (Employees, Billing preferences, Custom fields, Permissions
overrides, Custom rates, etc.) sits inside a `<CollapsibleSection>`
that initialises with `open={false}`. The user expands it when they
need it. Never set `useState(true)` on an optional section just to
make it discoverable — discoverability comes from the section header
being visible, not the body.

Only the always-required section (e.g. Contact information on
/contacts/new, Case details on /cases/new) is rendered uncollapsed,
because the user can't progress without filling it in.

This rule applies to every form going forward — don't wait to be
asked to collapse a section.

### Action-row duplication

The sticky top header on a full-screen create/edit route carries the
authoritative action buttons (Save / Save and create X / Cancel).
**Do not** duplicate that row at the bottom of the form. A scrolled
form should end with the last section plus a small bottom spacer —
users scroll back to the sticky header (or use keyboard submit) to
save. Duplicate action rows double the maintenance surface (loading
state, disabled state, copy) and create ambiguity about which button
is the "real" one.

---

## Tables

All data-heavy pages (Clients, Cases, Billing) use **TanStack Table**:

```ts
const columns: ColumnDef<Client>[] = [
  { accessorKey: 'name', header: 'Full Name' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'status', header: 'Status' },
]
```

---

## Document Editor

The Documents page uses **Tiptap** for rich legal document editing:

```ts
const editor = useEditor({
  extensions: [StarterKit, Placeholder.configure({ placeholder: 'Start drafting…' })],
  content: template,
})
```

---

## Design System (Gold + Navy)

```css
/* Mirrors existing LegaLite color scheme via Tailwind config */
--gold: #C9972B
--navy: #0D1B2A
--cream: #F8F4EE
```

Fonts: **Playfair Display** (headings) + **DM Sans** (body)

---

## TigerStyle Principles Applied

- **Correctness over speed** — Zod validation at every boundary
- **Explicit over implicit** — typed API responses, typed stores
- **Simple and composable** — small focused components, shared hooks
- **Fail loudly** — error boundaries on every major page section
