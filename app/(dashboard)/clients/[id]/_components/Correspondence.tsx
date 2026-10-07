'use client'

/**
 * Correspondence with the client: a composer to start a conversation by
 * email or WhatsApp, and the history of messages sent from LegaLite.
 *
 * - Email is delivered by the backend; replies go to the sender's inbox.
 * - WhatsApp opens a chat with the message pre-filled on the lawyer's
 *   device (click-to-chat); the send happens in WhatsApp.
 *
 * The composer suspends on the client record (for the address / number),
 * the history on the messages query — each in its own boundary.
 */

import { useEffect, useRef, useState } from 'react'
import {
  ChatCircleText,
  DeviceMobile,
  Envelope,
  PaperPlaneTilt,
  WhatsappLogo,
  type Icon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/shared/Spinner'
import { useClientProfileStore } from '@/stores/client-profile.store'
import {
  useClientMessages,
  useClientRecord,
  useSendClientMessage,
  type ClientMessage,
} from '../_hooks/use-client-profile'
import { SectionSkeleton } from './skeletons'

const WHATSAPP_GREEN = '#1FA855'

const CHANNEL_META: Record<string, { label: string; Icon: Icon; color: string; tint: string }> = {
  email: { label: 'Email', Icon: Envelope, color: 'var(--navy-light)', tint: 'rgba(36,59,85,0.08)' },
  whatsapp: { label: 'WhatsApp', Icon: WhatsappLogo, color: WHATSAPP_GREEN, tint: 'rgba(31,168,85,0.10)' },
  sms: { label: 'SMS', Icon: DeviceMobile, color: '#0F766E', tint: 'rgba(15,118,110,0.10)' },
  in_app: { label: 'In-app', Icon: ChatCircleText, color: 'var(--gold-dark)', tint: 'var(--gold-muted)' },
}

// ── Composer ─────────────────────────────────────────────────────────────

export function MessageComposer({ clientId }: { clientId: string }) {
  const { client, ready } = useClientRecord(clientId)
  const channel = useClientProfileStore((s) => s.channel)
  const setChannel = useClientProfileStore((s) => s.setChannel)
  const focusRequest = useClientProfileStore((s) => s.focusRequest)
  const { send, isPending } = useSendClientMessage()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // The header's Email / WhatsApp buttons ask the composer to take focus.
  useEffect(() => {
    if (focusRequest > 0) bodyRef.current?.focus({ preventScroll: true })
  }, [focusRequest])

  if (!ready) return <SectionSkeleton rows={1} label="Loading composer" />
  if (!client) return null

  const canEmail = Boolean(client.email)
  const canWhatsApp = Boolean(client.phone)
  const isEmail = channel === 'email'
  const available = isEmail ? canEmail : canWhatsApp
  const recipient = isEmail ? client.email : client.phone
  const firstName = client.full_name.split(/\s+/)[0]
  // Companies are addressed formally; individuals by first name.
  const salutation = client.contact_type === 'company' ? null : firstName

  const handleSend = async () => {
    if (isEmail && !subject.trim()) { toast.error('Add a subject for the email.'); return }
    if (!body.trim()) { toast.error('Write a message first.'); return }

    // Open the WhatsApp tab inside the click so popup blockers allow it,
    // then point it at the chat link once the server returns it.
    const waWindow = isEmail ? null : window.open('', '_blank')
    try {
      const { whatsappUrl } = await send({
        client_id: client.id,
        channel,
        subject: subject.trim() || undefined,
        body,
      })
      if (whatsappUrl) {
        if (waWindow) waWindow.location.href = whatsappUrl
        else window.location.href = whatsappUrl
        toast.success(`WhatsApp opened for ${client.full_name}. Send the message there to deliver it.`)
      } else {
        toast.success(`Email sent to ${client.email}.`)
      }
      setSubject('')
      setBody('')
    } catch (err) {
      waWindow?.close()
      toast.error(err instanceof Error && err.message ? err.message : 'Unable to send the message.')
    }
  }

  return (
    <div
      className="rounded-2xl border"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
        <div
          role="radiogroup"
          aria-label="Channel"
          className="inline-flex items-center rounded-lg p-1"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <ChannelOption
            active={isEmail}
            disabled={!canEmail}
            onSelect={() => setChannel('email')}
            Icon={Envelope}
            label="Email"
            color="var(--navy)"
            title={canEmail ? undefined : 'No email address on file'}
          />
          <ChannelOption
            active={!isEmail}
            disabled={!canWhatsApp}
            onSelect={() => setChannel('whatsapp')}
            Icon={WhatsappLogo}
            label="WhatsApp"
            color={WHATSAPP_GREEN}
            title={canWhatsApp ? undefined : 'No phone number on file'}
          />
        </div>
        <p className="min-w-0 flex-1 truncate text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          {available ? (
            <>To <span style={{ color: 'var(--text-primary)' }}>{client.full_name}</span> · {recipient}</>
          ) : isEmail ? (
            'Add an email address to this client to write by email.'
          ) : (
            'Add a phone number to this client to message on WhatsApp.'
          )}
        </p>
      </div>

      <div className="space-y-2.5 px-5 py-4">
        {isEmail && (
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={200}
            disabled={!available || isPending}
            className="h-10"
            aria-label="Subject"
          />
        )}
        <Textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            isEmail
              ? `Dear ${salutation ?? 'Sir or Madam'},\n\n`
              : `Hello${salutation ? ` ${salutation}` : ''}, `
          }
          rows={6}
          maxLength={5000}
          className="min-h-[140px]"
          disabled={!available || isPending}
          aria-label="Message"
        />
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderTop: '1px solid var(--border-soft)' }}
      >
        <p className="min-w-0 flex-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          {isEmail
            ? 'Sent from LegaLite on behalf of your firm. Replies come to your inbox.'
            : 'Opens WhatsApp with this message ready to send. A copy is kept on the client record.'}
        </p>
        <Button
          onClick={handleSend}
          disabled={!available || isPending}
          className="h-9 rounded-lg"
          style={isEmail ? undefined : { background: WHATSAPP_GREEN, color: '#fff' }}
        >
          {isPending ? (
            <><Spinner size={14} /> {isEmail ? 'Sending' : 'Opening'}</>
          ) : isEmail ? (
            <><PaperPlaneTilt size={14} weight="fill" /> Send email</>
          ) : (
            <><WhatsappLogo size={15} weight="fill" /> Open in WhatsApp</>
          )}
        </Button>
      </div>
    </div>
  )
}

function ChannelOption({
  active, disabled, onSelect, Icon, label, color, title,
}: {
  active: boolean
  disabled: boolean
  onSelect: () => void
  Icon: Icon
  label: string
  color: string
  title?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      title={title}
      onClick={onSelect}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: active ? 'var(--surface-card)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        boxShadow: active ? 'var(--shadow-xs)' : 'none',
      }}
    >
      <Icon size={14} weight={active ? 'fill' : 'regular'} style={{ color: active ? color : undefined }} />
      {label}
    </button>
  )
}

// ── History ──────────────────────────────────────────────────────────────

export function MessageHistory({ clientId }: { clientId: string }) {
  const { messages, ready } = useClientMessages(clientId)

  if (!ready) return <SectionSkeleton rows={3} label="Loading correspondence" />

  if (messages.length === 0) {
    return (
      <p
        className="rounded-2xl border border-dashed px-5 py-8 text-center text-[12.5px]"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
      >
        No correspondence yet. Messages you send from here are kept on this client&rsquo;s record.
      </p>
    )
  }

  // Group by calendar day, newest first (the query already sorts).
  const groups: { day: string; items: ClientMessage[] }[] = []
  for (const m of messages) {
    const day = new Date(m.created_at).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const last = groups[groups.length - 1]
    if (last?.day === day) last.items.push(m)
    else groups.push({ day, items: [m] })
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.day}>
          <p className="mb-2 px-1 text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            {g.day}
          </p>
          <ul
            className="overflow-hidden rounded-xl border"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
          >
            {g.items.map((m, i) => (
              <MessageRow key={m.id} message={m} first={i === 0} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function MessageRow({ message, first }: { message: ClientMessage; first: boolean }) {
  const meta = CHANNEL_META[message.channel] ?? CHANNEL_META.in_app
  const failed = message.status === 'failed'
  const inbound = message.direction === 'inbound'
  const time = new Date(message.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const verb = inbound
    ? 'Received'
    : message.channel === 'whatsapp'
      ? 'Opened in WhatsApp'
      : message.status === 'draft'
        ? 'Draft'
        : 'Sent'

  return (
    <li className="flex gap-3.5 px-4 py-3.5" style={{ borderTop: first ? 'none' : '1px solid var(--border-soft)' }}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: meta.tint }}
      >
        <meta.Icon size={15} weight="fill" style={{ color: meta.color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 flex-1 truncate text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {message.subject}
          </p>
          <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {time}
          </span>
        </div>
        <p
          className="mt-1 line-clamp-3 whitespace-pre-line text-[12.5px] leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {message.body}
        </p>
        <p className="mt-1.5 text-[11.5px] font-medium" style={{ color: failed ? '#C0392B' : 'var(--text-muted)' }}>
          {failed ? `${meta.label} could not be delivered` : `${verb} · ${meta.label}`}
        </p>
      </div>
    </li>
  )
}
