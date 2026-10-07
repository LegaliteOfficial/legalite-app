'use client'

/**
 * Side cards for the client profile: contact particulars, the assigned
 * team, and file notes. Contact and notes suspend on the client record;
 * the team card reads the firm's client assignments.
 */

import type { ReactNode } from 'react'
import {
  Buildings,
  Cake,
  Envelope,
  Globe,
  IdentificationCard,
  MapPin,
  NotePencil,
  Phone,
  CalendarCheck,
} from '@phosphor-icons/react'
import { ROLE_LABEL, useClientAssignees } from '@/hooks/use-client-assignees'
import { useHydrated } from '@/hooks/use-hydrated'
import { initialsOf } from '../../_lib/initials'
import { useClientRecord } from '../_hooks/use-client-profile'
import { SideCardSkeleton } from './skeletons'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-5"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)' }}
    >
      <h2 className="mb-3.5 font-heading text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Particular({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="break-words text-[13px]" style={{ color: 'var(--text-primary)' }}>{children}</div>
      </div>
    </div>
  )
}

const linkClass = 'underline-offset-2 hover:underline'

export function ContactCard({ clientId }: { clientId: string }) {
  const { client, ready } = useClientRecord(clientId)
  if (!ready) return <SideCardSkeleton rows={5} />
  if (!client) return null

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const websiteHref = client.website
    ? /^https?:\/\//i.test(client.website) ? client.website : `https://${client.website}`
    : null

  return (
    <Card title="Contact particulars">
      <div className="space-y-3.5">
        <Particular icon={<Envelope size={15} />} label="Email">
          {client.email ? (
            <a href={`mailto:${client.email}`} className={linkClass}>{client.email}</a>
          ) : (
            <Missing />
          )}
        </Particular>
        <Particular icon={<Phone size={15} />} label="Phone">
          {client.phone ? (
            <a href={`tel:${client.phone.replace(/\s+/g, '')}`} className={`${linkClass} tabular-nums`}>{client.phone}</a>
          ) : (
            <Missing />
          )}
        </Particular>
        <Particular icon={<MapPin size={15} />} label="Address">
          {client.address ? <span className="whitespace-pre-line">{client.address}</span> : <Missing />}
        </Particular>
        {client.contact_type === 'person' && (
          <>
            <Particular icon={<IdentificationCard size={15} />} label="Ghana Card">
              {client.ghana_card ? <span className="tabular-nums">{client.ghana_card}</span> : <Missing />}
            </Particular>
            {client.date_of_birth && (
              <Particular icon={<Cake size={15} />} label="Date of birth">
                {fmtDate(client.date_of_birth)}
              </Particular>
            )}
          </>
        )}
        {(client.organization || client.job_title) && (
          <Particular icon={<Buildings size={15} />} label={client.contact_type === 'company' ? 'Organisation' : 'Employment'}>
            {[client.job_title, client.organization].filter(Boolean).join(', ')}
          </Particular>
        )}
        {websiteHref && (
          <Particular icon={<Globe size={15} />} label="Website">
            <a href={websiteHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {client.website}
            </a>
          </Particular>
        )}
        <Particular icon={<CalendarCheck size={15} />} label="Client since">
          {fmtDate(client.created_at)}
        </Particular>
      </div>
    </Card>
  )
}

function Missing() {
  return <span style={{ color: 'var(--text-subtle)' }}>Not recorded</span>
}

export function AssignedTeam({ clientId }: { clientId: string }) {
  const hydrated = useHydrated()
  const assignees = useClientAssignees().get(clientId) ?? []
  if (!hydrated) return <SideCardSkeleton rows={2} />

  return (
    <Card title="Assigned team">
      {assignees.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: 'var(--text-muted)' }}>
          No one is assigned to this client yet. Assign members from the clients list.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {assignees.map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--accent-today-tint-strong)', color: 'var(--gold-dark)' }}
              >
                {initialsOf(a.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
                <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>{ROLE_LABEL[a.role]}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function NotesCard({ clientId }: { clientId: string }) {
  const { client, ready } = useClientRecord(clientId)
  if (!ready) return <SideCardSkeleton rows={2} />
  if (!client?.notes) return null

  return (
    <Card title="File notes">
      <div className="flex gap-3">
        <NotePencil size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
        <p className="whitespace-pre-line text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {client.notes}
        </p>
      </div>
    </Card>
  )
}
