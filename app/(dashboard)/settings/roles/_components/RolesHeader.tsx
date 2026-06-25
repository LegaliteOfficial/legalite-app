'use client'

import Link from 'next/link'
import { CaretRight, Plus } from '@phosphor-icons/react'

/**
 * Breadcrumb + page intro + primary "New role" CTA.
 */
export function RolesHeader() {
  return (
    <>
      <div
        className="flex items-center gap-2 text-sm mb-5"
        style={{ color: 'var(--navy)' }}
      >
        <Link
          href="/settings"
          className="hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          Settings
        </Link>
        <CaretRight
          size={14}
          strokeWidth={2.25}
          style={{ color: 'var(--text-muted)' }}
        />
        <span className="font-bold">Roles and Permissions</span>
      </div>

      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div className="max-w-2xl">
          <div
            className="text-[10px] font-bold tracking-[3px] uppercase mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Permissions
          </div>
          <h1
            className="font-heading text-3xl font-extrabold mb-3 leading-tight"
            style={{ color: 'var(--navy)' }}
          >
            Roles
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            A user can be assigned multiple roles. When roles overlap, the
            highest level of access between them is applied.
          </p>
        </div>
        <Link
          href="/settings/roles/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ background: 'var(--gold)' }}
        >
          <Plus size={14} strokeWidth={2.5} /> New Role
        </Link>
      </div>
    </>
  )
}
