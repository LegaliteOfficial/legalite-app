'use client'

import { useMemo } from 'react'
import { Buildings } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useClient } from '@/hooks/use-clients'
import { useUIStore } from '@/stores/ui.store'
import { TYPE_BADGE_COMPANIES, TYPE_BADGE_PEOPLE } from '../_constants'
import { HeaderBtn } from './HeaderBtn'

/**
 * Sticky page header: avatar + name on the left, Bill / Funds request
 * / Edit-contact on the right. Edit is the primary gold pill.
 */
export function ContactPageHeader({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const { openModal } = useUIStore()
  const isCompany = contact.contact_type === 'company'
  const tint = isCompany ? TYPE_BADGE_COMPANIES : TYPE_BADGE_PEOPLE

  const initials = useMemo(() => {
    if (!contact.full_name) return '?'
    return (
      contact.full_name
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    )
  }, [contact.full_name])

  return (
    <header
      className="flex items-center justify-between gap-6 px-6 py-3.5 border-b shrink-0"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="inline-flex items-center justify-center h-9 w-9 rounded-full text-[12px] font-semibold shrink-0"
          style={{ background: `${tint}26`, color: tint }}
          aria-hidden
        >
          {isCompany ? <Buildings size={16} strokeWidth={2} /> : initials}
        </span>
        <h1
          className="text-[20px] font-semibold leading-tight tracking-tight truncate"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-heading, "Playfair Display", serif)',
          }}
        >
          {contact.full_name || 'Untitled contact'}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <HeaderBtn
          onClick={() =>
            toast.info(
              `Bill for ${contact.full_name} — opens once the billing screen ships.`,
            )
          }
        >
          Bill
        </HeaderBtn>
        <HeaderBtn
          onClick={() =>
            toast.info('Client funds requests ship with the trust module.')
          }
        >
          New client funds request
        </HeaderBtn>
        <button
          type="button"
          onClick={() => openModal({ type: 'editClient', id: contact.id })}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[13px] font-semibold cursor-pointer transition-all whitespace-nowrap"
          style={{
            background: 'var(--gold)',
            color: 'var(--navy)',
            boxShadow:
              '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(201,151,43,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--gold-dark, #B0831F)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--gold)'
          }}
        >
          Edit contact
        </button>
      </div>
    </header>
  )
}
