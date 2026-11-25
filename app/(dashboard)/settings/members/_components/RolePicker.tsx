'use client'

import Link from 'next/link'
import { Spinner } from '@/components/shared/Spinner'
import { useCan } from '@/lib/access'
import type { FirmRole } from '@/hooks/use-firm-roles'

/**
 * Checklist of the firm's roles. The Owner role is never offered: ownership
 * moves only through "Transfer ownership". A member's permissions are the
 * union of the roles ticked here.
 */
export function RolePicker({
  roles,
  loading,
  value,
  onChange,
  showCreateLink = true,
}: {
  roles: FirmRole[]
  loading: boolean
  value: string[]
  onChange: (ids: string[]) => void
  showCreateLink?: boolean
}) {
  const canCreateRole = useCan('manage-roles')
  const assignable = roles.filter((r) => !(r.is_system && r.slug === 'owner'))
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-[12px] font-semibold" style={{ color: 'var(--navy)' }}>
          Roles
        </span>
        {showCreateLink && canCreateRole && (
          <Link
            href="/settings/roles/new"
            className="text-[11px] font-semibold hover:underline"
            style={{ color: 'var(--gold-dark)' }}
          >
            + Create role
          </Link>
        )}
      </div>
      <div className="max-h-56 divide-y overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-4 text-[13px]" style={{ color: '#6B7280' }}>
            <Spinner size={14} /> Loading roles...
          </div>
        ) : assignable.length === 0 ? (
          <div className="px-3 py-4 text-[13px]" style={{ color: '#6B7280' }}>
            No roles available yet.
          </div>
        ) : (
          assignable.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-black/[0.02]"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                type="checkbox"
                checked={value.includes(r.id)}
                onChange={() => toggle(r.id)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-yellow-600"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--navy)' }}>
                    {r.name}
                  </span>
                  {r.is_system && (
                    <span
                      className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(13,27,42,0.06)', color: '#6B7280' }}
                    >
                      System
                    </span>
                  )}
                </span>
                {r.description && r.description !== '—' && (
                  <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: '#6B7280' }}>
                    {r.description}
                  </span>
                )}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

/** True when the chosen roles grant full access (an administrator). */
export function grantsFullAccess(roles: FirmRole[], ids: string[]): boolean {
  return roles.some((r) => ids.includes(r.id) && r.permissions.includes('*'))
}
