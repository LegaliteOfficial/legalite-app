'use client'

import { Info } from '@phosphor-icons/react'
import { ALWAYS_ON } from '../_constants'
import type { GrantedCount, SectionDef } from '../_types'
import { PermissionRow } from './primitives/PermissionRow'

/**
 * Card for one permission section. Groups its rows by `PermissionGroup`
 * (each gets a small heading + icon), shows granted/total counts in
 * the top-right, and optionally a blue "Note" callout at the bottom.
 */
export function PermissionSectionCard({
  section,
  permissions,
  counts,
  onTogglePermission,
}: {
  section: SectionDef
  permissions: Record<string, boolean>
  counts: GrantedCount
  onTogglePermission: (id: string) => void
}) {
  return (
    <section
      id={section.id}
      className="rounded-2xl border p-6 scroll-mt-32"
      style={{
        background: 'var(--cream-white)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2
            className="font-heading text-lg font-bold"
            style={{ color: 'var(--navy)' }}
          >
            {section.label}
          </h2>
          {section.newCount ? (
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(201,151,43,0.15)',
                color: 'var(--gold)',
              }}
            >
              New ({section.newCount})
            </span>
          ) : null}
        </div>
        <span
          className="text-xs font-semibold tabular-nums shrink-0 mt-1.5"
          style={{ color: '#6B7280' }}
        >
          {counts.granted}/{counts.total} granted
        </span>
      </div>
      <p
        className="text-sm mb-5 leading-relaxed"
        style={{ color: '#6B7280' }}
      >
        {section.description}
      </p>

      <div className="space-y-6">
        {section.groups.map((group) => (
          <div key={group.id}>
            <div
              className="flex items-center gap-2 mb-3 pb-2 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <group.Icon
                size={15}
                strokeWidth={2}
                style={{ color: 'var(--navy)' }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: 'var(--navy)' }}
              >
                {group.label}
              </span>
            </div>
            <ul className="space-y-1">
              {group.permissions.map((p) => (
                <li key={p.id}>
                  <PermissionRow
                    id={p.id}
                    label={p.label}
                    enabled={!!permissions[p.id]}
                    locked={ALWAYS_ON.has(p.id)}
                    onToggle={() => onTogglePermission(p.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {section.note && (
        <div
          className="mt-6 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
          style={{
            background: 'rgba(59,130,246,0.06)',
            color: '#1E3A8A',
          }}
        >
          <Info
            size={13}
            strokeWidth={2}
            className="mt-0.5 shrink-0"
            style={{ color: '#3B82F6' }}
          />
          <p>
            <span className="font-bold">Note: </span>
            {section.note}
          </p>
        </div>
      )}
    </section>
  )
}
