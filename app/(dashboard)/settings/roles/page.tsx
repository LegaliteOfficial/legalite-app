'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, Search, SlidersHorizontal, MoreVertical, Plus, FolderLock,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

type RoleKind = 'standard' | 'custom'
type RoleStatus = 'active' | 'archived'

type Role = {
  id: string
  name: string
  description: string
  kind: RoleKind
  status: RoleStatus
}

type TabId = 'all' | 'custom' | 'standard' | 'archived'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all',      label: 'All active roles' },
  { id: 'custom',   label: 'Custom roles' },
  { id: 'standard', label: 'Standard roles' },
  { id: 'archived', label: 'Archived roles' },
]

// ── Mock roles ─────────────────────────────────────────────────────────────
// In production these come from /firms/:firmId/roles.

const ROLES: Role[] = [
  {
    id: 'accounts',
    name: 'Accounts',
    description: 'Add trust and operating account information, and record incoming and outgoing transactions.',
    kind: 'standard',
    status: 'active',
  },
  {
    id: 'administrator',
    name: 'Administrator',
    description: 'Full access to LegaLite — manages clients, matters, activities, user permissions, and account exports.',
    kind: 'standard',
    status: 'active',
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Manage bills and receive bill payments. Payment notifications for cards and mobile money are also sent to this user.',
    kind: 'standard',
    status: 'active',
  },
  {
    id: 'general-access',
    name: 'General Access',
    description: 'Access to matters and contacts, but cannot delete or export across those items.',
    kind: 'standard',
    status: 'active',
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'See the Reports tab and generate firm-wide reports.',
    kind: 'standard',
    status: 'active',
  },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const filteredRoles = useMemo(() => {
    let scope: Role[]
    switch (activeTab) {
      case 'all':      scope = ROLES.filter((r) => r.status === 'active'); break
      case 'custom':   scope = ROLES.filter((r) => r.kind === 'custom' && r.status === 'active'); break
      case 'standard': scope = ROLES.filter((r) => r.kind === 'standard' && r.status === 'active'); break
      case 'archived': scope = ROLES.filter((r) => r.status === 'archived'); break
    }
    const q = query.trim().toLowerCase()
    if (!q) return scope
    return scope.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
  }, [activeTab, query])

  const total = filteredRoles.length
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min(total, (page + 1) * pageSize)
  const pageRoles = filteredRoles.slice(page * pageSize, (page + 1) * pageSize)

  const canPrev = page > 0
  const canNext = end < total

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--surface-card)' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: 'var(--navy)' }}>
        <Link href="/settings" className="hover:opacity-70 transition-opacity" style={{ color: '#6B7280' }}>Settings</Link>
        <ChevronRight size={14} strokeWidth={2.25} style={{ color: '#9CA3AF' }} />
        <span className="font-bold">Roles and Permissions</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold tracking-[3px] uppercase mb-2" style={{ color: '#9CA3AF' }}>
            Permissions
          </div>
          <h1 className="font-heading text-3xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--navy)' }}>
            Roles
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            A user can be assigned multiple roles. When roles overlap, the highest level of access between them is applied.
          </p>
        </div>
        <Link
          href="/settings/roles/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)' }}
        >
          <Plus size={14} strokeWidth={2.5} /> New Role
        </Link>
      </div>

      {/* Roles card */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--cream-white)', borderColor: 'var(--border)', boxShadow: '0 4px 24px rgba(13,27,42,0.05)' }}
      >
        {/* Tabs + search bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((t) => {
              const active = t.id === activeTab
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setActiveTab(t.id); setPage(0) }}
                  className="rounded-md px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--navy)' : 'transparent',
                    color: active ? 'white' : '#6B7280',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0) }}
                placeholder="Search by keyword"
                className="h-9 w-64 rounded-md border bg-white pl-9 pr-3 text-sm transition-colors focus:outline-none focus:border-yellow-600"
                style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
              />
            </div>
            <button
              type="button"
              onClick={() => toast.message('Filter panel coming soon.')}
              aria-label="Open filters"
              className="h-9 w-9 rounded-md border flex items-center justify-center transition-colors hover:bg-black/[0.02]"
              style={{ borderColor: 'var(--border)', background: 'white' }}
            >
              <SlidersHorizontal size={14} strokeWidth={2} style={{ color: 'var(--navy)' }} />
            </button>
          </div>
        </div>

        {/* Table or empty state */}
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-[1fr_64px] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider" style={{ borderColor: 'var(--border)', color: '#6B7280' }}>
              <span>Role Name</span>
              <span className="text-right">Action</span>
            </div>
            <ul>
              {pageRoles.map((role, i) => (
                <li
                  key={role.id}
                  className="grid grid-cols-[1fr_64px] gap-4 px-5 py-4 items-center"
                  style={{ borderBottom: i === pageRoles.length - 1 ? 'none' : '1px solid var(--border)' }}
                >
                  <div>
                    <Link
                      href={`/settings/roles/${role.id}`}
                      className="text-sm font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--gold)' }}
                    >
                      {role.name}
                    </Link>
                    <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6B7280' }}>{role.description}</p>
                  </div>
                  <div className="flex justify-end">
                    <RowMenu role={role} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Footer / pagination */}
        <div className="flex items-center gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
            className="h-8 w-8 rounded-md border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--border)', background: 'white' }}
          >
            <ChevronLeft size={14} strokeWidth={2} style={{ color: 'var(--navy)' }} />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
            className="h-8 w-8 rounded-md border flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--border)', background: 'white' }}
          >
            <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--navy)' }} />
          </button>
          <span className="text-sm" style={{ color: '#6B7280' }}>
            {total === 0 ? 'No results found' : `${start}–${end} of ${total}`}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Row menu (3-dot) ───────────────────────────────────────────────────────

function RowMenu({ role }: { role: Role }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={`Actions for ${role.name}`}
        className="h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        style={{ color: 'var(--navy)' }}
      >
        <MoreVertical size={16} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-9 z-10 w-44 rounded-md border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          <MenuItem onClick={() => toast.message(`Edit "${role.name}" — coming next.`)}>Edit</MenuItem>
          <MenuItem onClick={() => toast.message(`Duplicate "${role.name}" — coming next.`)}>Duplicate</MenuItem>
          <MenuItem
            onClick={() => toast.message(`Archive "${role.name}" — coming next.`)}
            tone={role.kind === 'standard' ? 'disabled' : 'default'}
          >
            Archive
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children, onClick, tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'default' | 'disabled'
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); if (tone !== 'disabled') onClick() }}
      disabled={tone === 'disabled'}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-black/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ color: 'var(--navy)' }}
    >
      {children}
    </button>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-16 px-5 text-center">
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(13,27,42,0.06)' }}
      >
        <FolderLock size={28} strokeWidth={1.5} style={{ color: 'var(--navy)' }} />
      </div>
      <h3 className="font-heading text-lg font-bold mb-1" style={{ color: 'var(--navy)' }}>No Roles Found</h3>
      <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
        Keep roles organised to manage user access across the firm.
      </p>
      <Link
        href="/settings/roles/new"
        className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--navy)' }}
      >
        <Plus size={14} strokeWidth={2.5} /> Create role
      </Link>
    </div>
  )
}
