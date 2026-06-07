import { Bell } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { ColumnDef } from '../_types'
import { formatDate } from './filters'

/**
 * Column registry for the cases table. Lives outside the component so
 * its identity is stable across renders; `defaultVisible` mirrors the
 * standard reference layout. The user can toggle anything via the
 * Columns ▾ dropdown.
 */
export const COLUMNS: ColumnDef[] = [
  {
    id: 'client',
    label: 'Client(s)',
    defaultVisible: true,
    minWidth: 180,
    sortable: true,
    sortValue: (row) => row.client_name ?? '',
    render: (row) => (
      <span
        className="text-[13px] font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {row.client_name || Dash}
      </span>
    ),
    csv: (row) => row.client_name ?? '',
  },
  {
    id: 'title',
    label: 'Case title',
    defaultVisible: true,
    minWidth: 240,
    sortable: true,
    sortValue: (row) => row.title,
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
        {row.title}
      </span>
    ),
    csv: (row) => row.title,
  },
  {
    id: 'case_code',
    label: 'Case ID',
    defaultVisible: false,
    minWidth: 120,
    sortable: true,
    sortValue: (row) => row.case_code ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.case_code ?? Dash}
      </span>
    ),
    csv: (row) => row.case_code ?? '',
  },
  {
    id: 'responsible',
    label: 'Responsible lawyer',
    defaultVisible: true,
    minWidth: 180,
    sortable: true,
    sortValue: (row) => row.assigned_lawyer ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.assigned_lawyer || Dash}
      </span>
    ),
    csv: (row) => row.assigned_lawyer ?? '',
  },
  {
    id: 'originating',
    label: 'Originating lawyer',
    defaultVisible: true,
    minWidth: 180,
    sortable: true,
    sortValue: (row) => row.originating_lawyer ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.originating_lawyer || Dash}
      </span>
    ),
    csv: (row) => row.originating_lawyer ?? '',
  },
  {
    id: 'practice_area',
    label: 'Practice area',
    defaultVisible: true,
    minWidth: 140,
    sortable: true,
    sortValue: (row) => row.case_type ?? '',
    render: (row) =>
      row.case_type ? (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium"
          style={{
            background: 'var(--surface-sunken)',
            color: 'var(--text-secondary)',
          }}
        >
          {row.case_type}
        </span>
      ) : (
        Dash
      ),
    csv: (row) => row.case_type ?? '',
  },
  {
    id: 'case_stage',
    label: 'Case stage',
    defaultVisible: true,
    minWidth: 140,
    sortable: true,
    sortValue: (row) => row.case_stage ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.case_stage || Dash}
      </span>
    ),
    csv: (row) => row.case_stage ?? '',
  },
  {
    id: 'open_date',
    label: 'Open date',
    defaultVisible: true,
    minWidth: 130,
    sortable: true,
    // Sort by ISO timestamp; the user-facing "12 Feb 2026" string sorts wrong across years.
    sortValue: (row) => (row.date_opened ? new Date(row.date_opened).getTime() : null),
    render: (row) => (
      <span
        className="text-[12.5px] tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(row.date_opened) || Dash}
      </span>
    ),
    csv: (row) => formatDate(row.date_opened),
  },
  {
    id: 'close_date',
    label: 'Close date',
    defaultVisible: true,
    minWidth: 130,
    sortable: true,
    sortValue: (row) => (row.closed_at ? new Date(row.closed_at).getTime() : null),
    render: (row) => (
      <span
        className="text-[12.5px] tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(row.closed_at) || Dash}
      </span>
    ),
    csv: (row) => formatDate(row.closed_at),
  },
  {
    id: 'pending_date',
    label: 'Pending date',
    defaultVisible: true,
    minWidth: 130,
    sortable: true,
    sortValue: (row) => (row.pending_at ? new Date(row.pending_at).getTime() : null),
    render: (row) => (
      <span
        className="text-[12.5px] tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatDate(row.pending_at) || Dash}
      </span>
    ),
    csv: (row) => formatDate(row.pending_at),
  },
  {
    id: 'notifications',
    label: 'Case notifications',
    defaultVisible: true,
    minWidth: 110,
    align: 'right',
    // Derived/computed count — sorting it invites confusion. Skip the affordance.
    sortable: false,
    render: (row) => {
      const count = row.notification_count ?? 0
      if (count === 0) {
        return (
          <span className="inline-flex items-center justify-end" style={{ color: 'var(--text-subtle)' }}>
            <Bell size={13} strokeWidth={1.75} />
          </span>
        )
      }
      return (
        <span
          className="inline-flex items-center gap-1.5 justify-end font-medium"
          style={{ color: 'var(--gold-dark)' }}
        >
          <Bell size={13} strokeWidth={1.75} />
          <span className="text-[12px] tabular-nums">{count}</span>
        </span>
      )
    },
    csv: (row) => String(row.notification_count ?? 0),
  },
  {
    id: 'court',
    label: 'Court',
    defaultVisible: false,
    minWidth: 200,
    sortable: true,
    sortValue: (row) => row.court ?? '',
    render: (row) => (
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {row.court || Dash}
      </span>
    ),
    csv: (row) => row.court ?? '',
  },
  {
    id: 'suit_number',
    label: 'Suit no.',
    defaultVisible: false,
    minWidth: 140,
    sortable: true,
    sortValue: (row) => row.suit_number ?? '',
    render: (row) => (
      <span
        className="font-mono text-[12px] tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {row.suit_number || Dash}
      </span>
    ),
    csv: (row) => row.suit_number ?? '',
  },
  {
    id: 'next_date',
    label: 'Next court date',
    defaultVisible: false,
    minWidth: 150,
    sortable: true,
    sortValue: (row) => (row.next_court_date ? new Date(row.next_court_date).getTime() : null),
    render: (row) => {
      if (!row.next_court_date) return Dash
      const d = new Date(row.next_court_date)
      const isUpcoming =
        d.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
        d.getTime() > Date.now()
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[12.5px] tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isUpcoming && (
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#C0392B' }}
            />
          )}
          {formatDate(row.next_court_date)}
        </span>
      )
    },
    csv: (row) => formatDate(row.next_court_date),
  },
  {
    id: 'status',
    label: 'Status',
    defaultVisible: true,
    minWidth: 110,
    sortable: true,
    sortValue: (row) => row.status ?? 'Open',
    render: (row) => <StatusBadge status={row.status ?? 'Open'} />,
    csv: (row) => row.status ?? 'Open',
  },
]

const Dash = (
  <span style={{ color: 'var(--text-subtle)' }}>—</span>
)
