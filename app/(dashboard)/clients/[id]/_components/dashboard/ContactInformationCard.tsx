'use client'

import { Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useClient } from '@/hooks/use-clients'
import { CollapsibleCard } from '../CollapsibleCard'
import { Row } from './Row'

/**
 * Detail card with the contact's structured info. Composes a
 * single-line address from the legacy `address` string column; the
 * contact-detail migration will swap this for structured address
 * sub-fields.
 */
export function ContactInformationCard({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard.`)
  }
  return (
    <CollapsibleCard
      label="Contact information"
      rightSlot={
        <button
          type="button"
          onClick={() =>
            copy(
              [
                contact.full_name,
                contact.email,
                contact.phone,
                contact.address,
              ]
                .filter(Boolean)
                .join('\n'),
              'Contact info',
            )
          }
          className="inline-flex items-center justify-center h-7 w-7 rounded-md cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-sunken)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          aria-label="Copy contact information"
        >
          <Copy size={13} strokeWidth={1.75} />
        </button>
      }
    >
      <dl className="space-y-3 text-[13px]">
        <Row label="Client ID" value={contact.client_code ?? null} />
        <Row label="Phone" value={contact.phone ?? null} suffix="Work" />
        <Row
          label="Email"
          value={contact.email ?? null}
          suffix="Work"
          href={contact.email ? `mailto:${contact.email}` : undefined}
        />
        <Row label="Ghana card" value={contact.ghana_card ?? null} />
        <Row
          label="Address"
          value={contact.address ?? null}
          suffix="Work"
          multiline
        />
        <Row
          label="Date of birth"
          value={
            contact.date_of_birth
              ? new Date(contact.date_of_birth).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : null
          }
        />
      </dl>
    </CollapsibleCard>
  )
}
