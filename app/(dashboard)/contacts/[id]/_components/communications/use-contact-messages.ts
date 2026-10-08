'use client'

/**
 * Messages for one contact, shaped for the Communications log table.
 *
 * The same `messages` query backs the firm-wide Messages view; passing a
 * clientId scopes it to this contact, so the two surfaces cannot drift
 * apart. Type, date and keyword filtering is applied here rather than
 * server side: the query takes only clientId and channel, and a contact's
 * message history is small enough that filtering in the client is both
 * simpler and instant.
 *
 * Under DEV_BYPASS there is no backend, so a small sample set stands in.
 * Without it the tab looks broken in local development even though it is
 * wired correctly.
 */

import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { MessagesQueryDoc } from '@/lib/graphql/comms'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type CommChannel = 'email' | 'sms' | 'whatsapp' | 'in_app' | 'call'

export interface CommLogRow {
  id: string
  channel: CommChannel
  direction: 'inbound' | 'outbound'
  status: string | null
  subject: string | null
  body: string | null
  /** ISO timestamp the message was created. */
  createdAt: string
  clientName: string | null
}

/** Toolbar pill to the channels it covers. */
const TYPE_TO_CHANNELS: Record<string, CommChannel[] | null> = {
  All: null,
  Phone: ['sms', 'call'],
  Email: ['email'],
  WhatsApp: ['whatsapp'],
}

function startOfDay(d: Date): number {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c.getTime()
}

/** Resolves a preset to an inclusive lower bound, or null for "all dates". */
function presetFloor(preset: string, now = new Date()): number | null {
  const sod = startOfDay(now)
  switch (preset) {
    case 'Today':
      return sod
    case 'This week': {
      // Week starts Monday, which is how Ghanaian court diaries run.
      const day = (now.getDay() + 6) % 7
      return sod - day * 86_400_000
    }
    case 'This month':
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    case 'This year':
      return new Date(now.getFullYear(), 0, 1).getTime()
    default:
      return null
  }
}

const DEV_SAMPLE: CommLogRow[] = [
  {
    id: 'dev-msg-1',
    channel: 'email',
    direction: 'outbound',
    status: 'sent',
    subject: 'Engagement letter for your review',
    body: 'Please find the engagement letter attached for signature.',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    clientName: null,
  },
  {
    id: 'dev-msg-2',
    channel: 'whatsapp',
    direction: 'outbound',
    status: 'opened',
    subject: null,
    body: 'Chat opened from LegaLite.',
    createdAt: new Date(Date.now() - 36 * 3_600_000).toISOString(),
    clientName: null,
  },
  {
    id: 'dev-msg-3',
    channel: 'email',
    direction: 'inbound',
    status: 'received',
    subject: 'Re: Engagement letter for your review',
    body: 'Signed copy attached. Happy to proceed.',
    createdAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
    clientName: null,
  },
]

interface Params {
  contactId: string
  typeFilter: string
  search: string
  dateFrom: string
  dateTo: string
  datePreset: string
}

export function useContactMessages({
  contactId,
  typeFilter,
  search,
  dateFrom,
  dateTo,
  datePreset,
}: Params): { rows: CommLogRow[]; loading: boolean } {
  const { data, loading } = useQuery(MessagesQueryDoc, {
    variables: { clientId: contactId, channel: null },
    skip: DEV_BYPASS,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  })

  const source: CommLogRow[] = useMemo(() => {
    if (DEV_BYPASS) return DEV_SAMPLE
    return (data?.messages ?? []).map((m) => ({
      id: m.id,
      channel: (m.channel ?? 'in_app') as CommChannel,
      direction: (m.direction ?? 'outbound') as 'inbound' | 'outbound',
      status: m.status ?? null,
      subject: m.subject ?? null,
      body: m.body ?? null,
      createdAt: m.created_at,
      clientName: m.client_name ?? null,
    }))
  }, [data])

  const rows = useMemo(() => {
    const channels = TYPE_TO_CHANNELS[typeFilter] ?? null
    const needle = search.trim().toLowerCase()

    // An explicit range wins over a preset; the preset is the quick path.
    const from = dateFrom ? startOfDay(new Date(dateFrom)) : presetFloor(datePreset)
    // `dateTo` is inclusive, so compare against the end of that day.
    const to = dateTo ? startOfDay(new Date(dateTo)) + 86_399_999 : null

    return source
      .filter((r) => {
        if (channels && !channels.includes(r.channel)) return false

        const ts = new Date(r.createdAt).getTime()
        if (Number.isFinite(ts)) {
          if (from !== null && ts < from) return false
          if (to !== null && ts > to) return false
        }

        if (needle) {
          const hay = `${r.subject ?? ''} ${r.body ?? ''} ${r.clientName ?? ''}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [source, typeFilter, search, dateFrom, dateTo, datePreset])

  return { rows, loading: DEV_BYPASS ? false : loading }
}
