'use client'

/**
 * Call / WhatsApp / Email buttons for a contact.
 *
 * Every action routes through `openChannel` so the WhatsApp deep link can
 * become the Business API later without touching this component. A channel
 * the contact cannot support is rendered disabled with the reason in its
 * tooltip, rather than hidden — "why is there no WhatsApp button" is a
 * worse question than seeing it greyed out because no number is on file.
 *
 * Opening a channel is reported through `onOpened` so the caller can write
 * an activity record. We log that a conversation was opened, not what was
 * said: a deep link hands the user to WhatsApp and we never see the reply.
 * Claiming otherwise in the log would misrepresent the file.
 */

import { Phone, WhatsappLogo, Envelope } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  canUseChannel,
  openChannel,
  formatPhoneForDisplay,
  type ChannelKind,
  type ChannelResult,
} from '@/lib/contact-channels'

export interface ContactChannelTarget {
  full_name?: string | null
  phone?: string | null
  email?: string | null
}

const CHANNELS: {
  kind: ChannelKind
  label: string
  Icon: typeof Phone
  tint: string
}[] = [
  { kind: 'call', label: 'Call', Icon: Phone, tint: '#2E7D4F' },
  { kind: 'whatsapp', label: 'WhatsApp', Icon: WhatsappLogo, tint: '#25D366' },
  { kind: 'email', label: 'Email', Icon: Envelope, tint: '#2563EB' },
]

export function ContactChannelActions({
  contact,
  onOpened,
  size = 'md',
}: {
  contact: ContactChannelTarget
  onOpened?: (result: ChannelResult) => void
  /** `sm` drops the labels, for dense rows. */
  size?: 'sm' | 'md'
}) {
  const handle = (kind: ChannelKind) => {
    const result = openChannel(kind, contact, {
      subject:
        kind === 'email' && contact.full_name
          ? `Regarding your matter — ${contact.full_name}`
          : undefined,
    })
    if (!result.ok) {
      toast.error(result.reason ?? 'That contact method is not available.')
      return
    }
    onOpened?.(result)
  }

  return (
    <div className="flex items-center gap-1.5">
      {CHANNELS.map(({ kind, label, Icon, tint }) => {
        const available = canUseChannel(kind, contact)
        const detail =
          kind === 'email'
            ? contact.email?.trim()
            : formatPhoneForDisplay(contact.phone)

        return (
          <button
            key={kind}
            type="button"
            disabled={!available}
            onClick={() => handle(kind)}
            title={
              available
                ? `${label} ${detail ?? ''}`.trim()
                : kind === 'email'
                  ? 'No email address on this contact'
                  : 'No usable phone number on this contact'
            }
            aria-label={`${label} ${contact.full_name ?? 'contact'}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border text-[12.5px] font-medium transition-colors ${
              size === 'sm' ? 'h-8 w-8 justify-center' : 'h-9 px-3'
            } ${available ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
              color: available ? tint : 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              if (available) e.currentTarget.style.background = `${tint}12`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-card)'
            }}
          >
            <Icon size={14} weight={kind === 'whatsapp' ? 'fill' : 'regular'} />
            {size === 'md' && <span>{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
