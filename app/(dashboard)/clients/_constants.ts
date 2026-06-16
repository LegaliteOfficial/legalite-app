/**
 * Clients list — static configuration.
 */

/**
 * Tabs across the top of the table. "All" shows everyone; the status
 * tabs filter by the client's primary-case status.
 */
export const TABS = ['All', 'Open', 'Pending', 'Closed'] as const

/** Client status options surfaced in the Status filter chip. */
export const CLIENT_STATUSES = ['Active', 'Inactive'] as const

/**
 * Created-on filter presets. Each option's `days` is the number of
 * days back from today; `null` means "all time". Windows match common
 * law-firm reporting cadences (weekly / monthly / quarterly / annual).
 */
export const CREATED_ON_OPTIONS = [
  { key: 'all', label: 'All time', days: null as number | null },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '1y', label: 'Last year', days: 365 },
] as const

/**
 * Columns the user can show / hide via the Edit columns dropdown. The
 * Client column and the row-menu column are always visible — the first
 * identifies the row, the second is the actions handle — so they're
 * not listed here.
 */
export const TOGGLEABLE_COLUMNS = [
  { key: 'phone', label: 'Phone number' },
  { key: 'email', label: 'Email address' },
  { key: 'status', label: 'Status' },
  { key: 'assigned', label: 'Assigned to' },
] as const

/**
 * Max overlapping avatars before the "+N" overflow chip kicks in.
 * 4 reads as a group without becoming a wall.
 */
export const MAX_VISIBLE_AVATARS = 4
