/**
 * Dev-only sample deadlines used by `useDeadlines()` (client) and
 * the `/api/calendar/feeds/[scope]` route (server) when
 * `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`. Living here keeps the two
 * surfaces in sync — if a sample event title changes, both the
 * weekly grid and the subscribed iCal feed update together.
 *
 * IMPORTANT: this file MUST stay free of React / client-only
 * imports so it's safe to import from a server route handler.
 */

export interface DevDeadline {
  id: string
  user_id: string
  case_id: string | null
  title: string
  description: string | null
  due_date: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Pending' | 'Done' | 'Missed'
  reminder_days: number | null
  case_title: string | null
  created_at: string
  updated_at: string
}

export const DEV_SAMPLE_DEADLINES: DevDeadline[] = [
  {
    id: 'dev-deadline-1',
    user_id: 'dev',
    case_id: 'dev-1',
    title: 'Mensah holdings — case management conference',
    description: null,
    due_date: '2026-06-04T09:00:00Z',
    priority: 'High',
    status: 'Pending',
    reminder_days: 2,
    case_title: 'Mensah v. Ghana Revenue Authority',
    created_at: '2026-05-20T09:00:00Z',
    updated_at: '2026-05-20T09:00:00Z',
  },
  {
    id: 'dev-deadline-2',
    user_id: 'dev',
    case_id: 'dev-1',
    title: 'File discovery responses to GRA',
    description: null,
    due_date: '2026-06-12T16:00:00Z',
    priority: 'Medium',
    status: 'Pending',
    reminder_days: 5,
    case_title: 'Mensah v. Ghana Revenue Authority',
    created_at: '2026-05-20T09:00:00Z',
    updated_at: '2026-05-20T09:00:00Z',
  },
  {
    id: 'dev-deadline-3',
    user_id: 'dev',
    case_id: 'dev-2',
    title: 'Estate of Owusu — probate hearing',
    description: null,
    due_date: '2026-05-29T10:30:00Z',
    priority: 'High',
    status: 'Pending',
    reminder_days: 1,
    case_title: 'Estate of Owusu — Probate',
    created_at: '2026-05-15T09:00:00Z',
    updated_at: '2026-05-15T09:00:00Z',
  },
  {
    id: 'dev-deadline-4',
    user_id: 'dev',
    case_id: 'dev-3',
    title: 'AccraTech v. Volta — settlement negotiation',
    description: null,
    due_date: '2026-07-15T14:00:00Z',
    priority: 'Medium',
    status: 'Pending',
    reminder_days: 3,
    case_title: 'AccraTech Ltd v. Volta Cables',
    created_at: '2026-05-18T09:00:00Z',
    updated_at: '2026-05-18T09:00:00Z',
  },
]
