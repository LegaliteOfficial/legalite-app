'use client'

import Link from 'next/link'
import type { Role } from '../_types'
import { RowMenu } from './RowMenu'

/**
 * Header row + per-role rows. Linked role name navigates to a
 * role-detail screen (stubbed) and badges system roles so the user
 * knows they can't be archived.
 */
export function RolesTable({ rows }: { rows: Role[] }) {
  return (
    <>
      <div
        className="grid grid-cols-[1fr_120px_64px] gap-4 px-5 py-3 border-b text-[11px] font-bold uppercase tracking-wider"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <span>Role Name</span>
        <span>Members</span>
        <span className="text-right">Action</span>
      </div>
      <ul>
        {rows.map((role, i) => (
          <li
            key={role.id}
            className="grid grid-cols-[1fr_120px_64px] gap-4 px-5 py-4 items-center"
            style={{
              borderBottom:
                i === rows.length - 1 ? 'none' : '1px solid var(--border)',
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/settings/roles/${role.id}`}
                  className="text-sm font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--gold)' }}
                >
                  {role.name}
                </Link>
                {role.isSystem && (
                  <span
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                    style={{
                      background: 'rgba(13,27,42,0.06)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    System
                  </span>
                )}
              </div>
              <p
                className="text-[13px] mt-1 leading-snug"
                style={{ color: 'var(--text-secondary)' }}
              >
                {role.description}
              </p>
            </div>
            <span
              className="text-sm tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              {role.memberCount}{' '}
              {role.memberCount === 1 ? 'member' : 'members'}
            </span>
            <div className="flex justify-end">
              <RowMenu role={role} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
