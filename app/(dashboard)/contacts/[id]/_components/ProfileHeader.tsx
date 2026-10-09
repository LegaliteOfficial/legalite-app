'use client'

/**
 * Client profile header: identity, status, tags and the primary actions
 * (write by email or WhatsApp, open a new matter, edit). Suspends on the
 * client record only.
 */

import { useRouter } from 'next/navigation'
import { Envelope, Plus, PencilSimple, WhatsappLogo } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useUIStore } from '@/stores/ui.store'
import { useClientProfileStore } from '@/stores/client-profile.store'
import { initialsOf } from '@/app/(dashboard)/clients/_lib/initials'
import { useClientRecord } from '../_hooks/use-client-profile'
import { NotFoundPanel } from './NotFoundPanel'
import { ProfileHeaderSkeleton } from './skeletons'

export function ProfileHeader({ clientId }: { clientId: string }) {
  const { client, ready } = useClientRecord(clientId)
  const compose = useClientProfileStore((s) => s.compose)
  const openModal = useUIStore((s) => s.openModal)
  const router = useRouter()

  if (!ready) return <ProfileHeaderSkeleton />
  if (!client) return <NotFoundPanel />

  const isCompany = client.contact_type === 'company'
  const subtitle = [
    isCompany ? null : client.job_title,
    isCompany ? null : client.organization,
    client.client_code ? `Client no. ${client.client_code}` : null,
  ].filter(Boolean)

  const scrollToComposer = () =>
    document.getElementById('correspondence')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section
      className="rounded-2xl border px-7 py-6"
      style={{
        background: 'var(--cream-white)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-wrap items-center gap-5">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-heading text-[22px] font-semibold"
          style={{ background: 'var(--navy)', color: 'var(--gold-light)' }}
        >
          {initialsOf(client.full_name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium" style={{ color: 'var(--gold-dark)' }}>
              {`${isCompany ? 'Company' : 'Person'}${client.roles?.includes('Client') ? ' · Client' : ''}`}
            </span>
            <StatusBadge status={client.status} />
          </div>
          <h1
            className="mt-1 truncate font-heading text-[26px] font-semibold leading-tight tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {client.full_name}
          </h1>
          {subtitle.length > 0 && (
            <p className="mt-1 truncate text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {subtitle.join(' · ')}
            </p>
          )}
          {client.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {client.tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-lg"
            disabled={!client.email}
            title={client.email ? `Email ${client.email}` : 'No email address on file'}
            onClick={() => { compose('email'); scrollToComposer() }}
          >
            <Envelope size={15} />
            Email
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-lg"
            disabled={!client.phone}
            title={client.phone ? `WhatsApp ${client.phone}` : 'No phone number on file'}
            onClick={() => { compose('whatsapp'); scrollToComposer() }}
          >
            <WhatsappLogo size={15} weight="fill" style={{ color: '#1FA855' }} />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => openModal({ type: 'editClient', id: client.id })}
          >
            <PencilSimple size={15} />
            Edit
          </Button>
          <Button className="h-9 rounded-lg" onClick={() => router.push(`/cases/new?client=${client.id}`)}>
            <Plus size={15} weight="bold" />
            New matter
          </Button>
        </div>
      </div>
    </section>
  )
}
