'use client'

/**
 * Firm-wide client communications, as a tab on Contacts.
 *
 * This replaces the standalone Client comms page. Per-contact history
 * lives on the contact's own Communications tab; this answers the other
 * question — what has gone out across the firm, and what came back — and
 * every row links through to the contact it belongs to, so the two views
 * lead into each other instead of competing.
 *
 * Reads the same `messages` query as the contact tab, unscoped, so the
 * firm view and the contact view can never disagree.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client/react'
import {
  ChatCircle,
  Envelope,
  MagnifyingGlass,
  PaperPlaneTilt,
  Phone,
  Plus,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessagesQueryDoc } from '@/lib/graphql/comms'
import { useClients } from '@/hooks/use-clients'
import {
  NewMessageDialog,
  type MessageRecipient,
} from '@/components/shared/NewMessageDialog'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

const CHANNEL_FILTERS = ['All', 'Email', 'SMS', 'WhatsApp', 'In-app'] as const
type ChannelFilter = (typeof CHANNEL_FILTERS)[number]

const FILTER_TO_CHANNEL: Record<ChannelFilter, string | null> = {
  All: null,
  Email: 'email',
  SMS: 'sms',
  WhatsApp: 'whatsapp',
  'In-app': 'in_app',
}

const CHANNEL_META: Record<string, { label: string; tint: string; Icon: typeof Envelope }> = {
  email: { label: 'Email', tint: '#2563EB', Icon: Envelope },
  sms: { label: 'SMS', tint: '#7C3AED', Icon: Phone },
  whatsapp: { label: 'WhatsApp', tint: '#25D366', Icon: ChatCircle },
  in_app: { label: 'In-app', tint: '#C9972B', Icon: PaperPlaneTilt },
  call: { label: 'Call', tint: '#2E7D4F', Icon: Phone },
}

interface Row {
  id: string
  clientId: string | null
  clientName: string | null
  channel: string
  direction: string
  status: string | null
  subject: string | null
  body: string | null
  createdAt: string
}

const DEV_SAMPLE: Row[] = [
  {
    id: 'fw-1',
    clientId: 'dev-client-1',
    clientName: 'Mensah Holdings Ltd',
    channel: 'email',
    direction: 'outbound',
    status: 'sent',
    subject: 'Engagement letter for your review',
    body: 'Please find the engagement letter attached for signature.',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'fw-2',
    clientId: 'dev-client-2',
    clientName: 'Akua Boateng',
    channel: 'whatsapp',
    direction: 'outbound',
    status: 'opened',
    subject: null,
    body: 'Confirming our meeting on Thursday at 10am.',
    createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  },
  {
    id: 'fw-3',
    clientId: 'dev-client-3',
    clientName: 'AccraTech Ltd',
    channel: 'sms',
    direction: 'outbound',
    status: 'delivered',
    subject: null,
    body: 'Reminder: hearing on 14 Oct at 9am, High Court Accra.',
    createdAt: new Date(Date.now() - 20 * 3_600_000).toISOString(),
  },
  {
    id: 'fw-4',
    clientId: 'dev-client-1',
    clientName: 'Mensah Holdings Ltd',
    channel: 'in_app',
    direction: 'inbound',
    status: 'read',
    subject: 'Question about the lease',
    body: 'Could you confirm the renewal terms before Friday?',
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  },
]

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ClientCommsPanel() {
  const [filter, setFilter] = useState<ChannelFilter>('All')
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)

  const { data: clientsData } = useClients()
  const { data, loading } = useQuery(MessagesQueryDoc, {
    variables: { clientId: null, channel: FILTER_TO_CHANNEL[filter] },
    skip: DEV_BYPASS,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  })

  const recipients: MessageRecipient[] = useMemo(
    () =>
      (clientsData ?? []).map((c) => ({
        id: c.id,
        name: c.full_name,
        email: c.email,
        phone: c.phone,
      })),
    [clientsData],
  )

  const rows: Row[] = useMemo(() => {
    const source: Row[] = DEV_BYPASS
      ? DEV_SAMPLE
      : (data?.messages ?? []).map((m) => ({
          id: m.id,
          clientId: m.client_id ?? null,
          clientName: m.client_name ?? null,
          channel: m.channel ?? 'in_app',
          direction: m.direction ?? 'outbound',
          status: m.status ?? null,
          subject: m.subject ?? null,
          body: m.body ?? null,
          createdAt: m.created_at,
        }))

    const wanted = FILTER_TO_CHANNEL[filter]
    const needle = search.trim().toLowerCase()

    return source
      .filter((r) => {
        // Dev data is filtered here; the live query filters server side.
        if (DEV_BYPASS && wanted && r.channel !== wanted) return false
        if (!needle) return true
        return `${r.subject ?? ''} ${r.body ?? ''} ${r.clientName ?? ''}`
          .toLowerCase()
          .includes(needle)
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [data, filter, search])

  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1 scrollbar-none">
          {CHANNEL_FILTERS.map((f) => {
            const active = filter === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors"
                style={{
                  background: active ? 'var(--surface-sunken)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {f}
              </button>
            )
          })}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <MagnifyingGlass
              size={13}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-subtle)' }}
            />
            <Input
              placeholder="Search messages"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13px]"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-card)',
              }}
            />
          </div>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Plus size={13} strokeWidth={2} />
            New message
          </Button>
        </div>
      </div>

      {/* List */}
      <div
        className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-soft)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {loading && rows.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md"
                style={{ background: 'var(--surface-sunken)' }}
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p
              className="text-[13.5px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              No messages yet
            </p>
            <p
              className="mx-auto mt-1.5 max-w-sm text-[12.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              Email, SMS, WhatsApp and in-app messages to your clients appear
              here, and on each client&rsquo;s own Communications tab.
            </p>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {rows.map((r) => {
              const meta = CHANNEL_META[r.channel] ?? {
                label: r.channel,
                tint: 'var(--text-muted)',
                Icon: PaperPlaneTilt,
              }
              const rowClass =
                'flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--surface-overlay)]'
              const rowStyle = { borderColor: 'var(--border-soft)' }
              const inner = (
                <>
                    <span
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${meta.tint}1A`, color: meta.tint }}
                      aria-hidden
                    >
                      <meta.Icon size={13} strokeWidth={1.75} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span
                          className="text-[13.5px] font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {r.clientName ?? 'Unknown client'}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
                          style={{ background: `${meta.tint}1A`, color: meta.tint }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: 'var(--text-subtle)' }}
                        >
                          {r.direction === 'inbound' ? 'Received' : 'Sent'}
                        </span>
                      </div>
                      {r.subject && (
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {r.subject}
                        </div>
                      )}
                      {r.body && (
                        <div
                          className="mt-0.5 truncate text-[12px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {r.body}
                        </div>
                      )}
                    </div>

                    <span
                      className="shrink-0 whitespace-nowrap text-[11.5px] tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatWhen(r.createdAt)}
                    </span>
                </>
              )
              return (
                <li key={r.id}>
                  {r.clientId ? (
                    <Link
                      href={`/contacts/${r.clientId}?tab=communications`}
                      className={rowClass}
                      style={rowStyle}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className={rowClass} style={rowStyle}>
                      {inner}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <NewMessageDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        recipients={recipients}
      />
    </div>
  )
}
