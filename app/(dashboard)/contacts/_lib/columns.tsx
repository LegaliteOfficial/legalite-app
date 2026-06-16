/**
 * Column registry — the single source of truth for what the contacts
 * table shows, how it sorts, and how it exports to CSV. Adding a new
 * column is a one-entry append here plus an opt-in via the Columns
 * picker if it shouldn't be on by default.
 */

import { Buildings, UserCircle } from '@phosphor-icons/react'
import { TYPE_BADGE_COMPANIES, TYPE_BADGE_PEOPLE } from '../_constants'
import type { ColumnDef } from '../_types'

const dash = <span style={{ color: 'var(--text-subtle)' }}>—</span>

export const COLUMNS: ColumnDef[] = [
  {
    id: 'name',
    label: 'Name',
    defaultVisible: true,
    minWidth: 240,
    sortable: true,
    sortValue: (row) => row.full_name,
    render: (row) => {
      // Same palette as the type-filter pills so a company row's
      // avatar matches the "Companies" pill colour, and a person row
      // matches the "People" pill.
      const isCompany = row.contact_category === 'company'
      const avatarColor = isCompany
        ? TYPE_BADGE_COMPANIES
        : TYPE_BADGE_PEOPLE
      return (
        <span className="inline-flex items-center gap-2 min-w-0">
          <span
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full text-[10.5px] font-semibold"
            style={{
              background: `${avatarColor}26`,
              color: avatarColor,
            }}
            aria-hidden
          >
            {isCompany ? (
              <Buildings size={13} strokeWidth={2} />
            ) : (
              <UserCircle size={13} strokeWidth={2} />
            )}
          </span>
          <span
            className="text-[13px] font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {row.full_name}
          </span>
          {row.role_label && (
            <span
              className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold shrink-0"
              style={{
                background: 'rgba(34,197,94,0.12)',
                color: '#16A34A',
              }}
            >
              {row.role_label}
            </span>
          )}
        </span>
      )
    },
    csv: (row) => row.full_name,
  },
  {
    id: 'tags',
    label: 'Tags',
    defaultVisible: true,
    minWidth: 160,
    sortable: false,
    render: (row) =>
      row.tags.length === 0 ? (
        dash
      ) : (
        <span className="flex flex-wrap items-center gap-1">
          {row.tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium"
              style={{ background: `${t.color}1F`, color: t.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: t.color }}
                aria-hidden
              />
              {t.name}
            </span>
          ))}
        </span>
      ),
    csv: (row) => row.tags.map((t) => t.name).join('; '),
  },
  {
    id: 'email',
    label: 'Email',
    defaultVisible: true,
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.email ?? '',
    render: (row) =>
      row.email ? (
        <a
          href={`mailto:${row.email}`}
          className="text-[13px] underline decoration-transparent hover:decoration-current"
          style={{ color: 'var(--gold-dark)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {row.email}
        </a>
      ) : (
        dash
      ),
    csv: (row) => row.email ?? '',
  },
  {
    id: 'phone',
    label: 'Phone',
    defaultVisible: true,
    minWidth: 150,
    sortable: true,
    sortValue: (row) => row.phone ?? '',
    render: (row) =>
      row.phone ? (
        <a
          href={`tel:${row.phone.replace(/\s+/g, '')}`}
          className="text-[13px] tabular-nums underline decoration-transparent hover:decoration-current"
          style={{ color: 'var(--gold-dark)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {row.phone}
        </a>
      ) : (
        dash
      ),
    csv: (row) => row.phone ?? '',
  },
  {
    id: 'address',
    label: 'Address',
    defaultVisible: true,
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.address ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.address || dash}
      </span>
    ),
    csv: (row) => row.address ?? '',
  },
  {
    id: 'date_of_birth',
    label: 'Date of Birth',
    defaultVisible: true,
    minWidth: 140,
    sortable: true,
    // Sort by ISO timestamp so dates round-trip across year boundaries
    // correctly (alphabetical sort on the formatted string would
    // misorder "02 Jan 2026" vs "30 Dec 2025", for instance).
    sortValue: (row) =>
      row.date_of_birth ? new Date(row.date_of_birth).getTime() : null,
    render: (row) =>
      row.date_of_birth ? (
        <span
          className="text-[12.5px] tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {new Date(row.date_of_birth).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ) : (
        dash
      ),
    csv: (row) => row.date_of_birth ?? '',
  },
  {
    id: 'client_code',
    label: 'Client ID',
    defaultVisible: false,
    minWidth: 120,
    sortable: true,
    sortValue: (row) => row.client_code ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.client_code ?? dash}
      </span>
    ),
    csv: (row) => row.client_code ?? '',
  },
  {
    id: 'ghana_card',
    label: 'Ghana card',
    defaultVisible: false,
    minWidth: 160,
    sortable: true,
    sortValue: (row) => row.ghana_card ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.ghana_card ?? dash}
      </span>
    ),
    csv: (row) => row.ghana_card ?? '',
  },
  {
    id: 'status',
    label: 'Status',
    defaultVisible: false,
    minWidth: 110,
    sortable: true,
    sortValue: (row) => row.status,
    render: (row) => (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium"
        style={{
          background:
            row.status === 'Active'
              ? 'rgba(34,197,94,0.12)'
              : 'var(--surface-sunken)',
          color: row.status === 'Active' ? '#16A34A' : 'var(--text-muted)',
        }}
      >
        {row.status}
      </span>
    ),
    csv: (row) => row.status,
  },
]
