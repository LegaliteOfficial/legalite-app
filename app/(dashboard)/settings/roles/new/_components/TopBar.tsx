'use client'

import Link from 'next/link'
import { CaretRight } from '@phosphor-icons/react'

/**
 * Sticky page header — breadcrumb + page title on the left, Cancel +
 * Create on the right. Stays above content while the user scrolls so
 * Save is one click away regardless of position.
 */
export function TopBar({
  isCreating,
  onCreate,
  editing = false,
}: {
  isCreating: boolean
  onCreate: () => void
  /** Editing an existing role rather than creating one. */
  editing?: boolean
}) {
  const title = editing ? 'Edit custom role' : 'Create custom role'
  return (
    <div
      className="sticky top-0 z-20 backdrop-blur"
      style={{
        background: 'rgba(248, 244, 238, 0.85)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div
            className="flex items-center gap-2 text-sm mb-1"
            style={{ color: 'var(--navy)' }}
          >
            <Link
              href="/settings"
              className="hover:opacity-70 transition-opacity"
              style={{ color: '#6B7280' }}
            >
              Settings
            </Link>
            <CaretRight
              size={14}
              strokeWidth={2.25}
              style={{ color: '#9CA3AF' }}
            />
            <Link
              href="/settings/roles"
              className="hover:opacity-70 transition-opacity"
              style={{ color: '#6B7280' }}
            >
              Roles
            </Link>
            <CaretRight
              size={14}
              strokeWidth={2.25}
              style={{ color: '#9CA3AF' }}
            />
            <span className="font-bold">{title}</span>
          </div>
          <h1
            className="font-heading text-2xl font-extrabold leading-tight"
            style={{ color: 'var(--navy)' }}
          >
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings/roles"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold border transition-colors hover:bg-black/5"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--navy)',
              background: 'white',
            }}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background:
                'linear-gradient(135deg, #C9972B 0%, #B8860B 100%)',
            }}
          >
            {isCreating ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save changes' : 'Create custom role'}
          </button>
        </div>
      </div>
    </div>
  )
}
