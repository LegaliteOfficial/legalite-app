/**
 * Client profile
 * --------------
 * One client's record: identity and status, contact particulars, the
 * assigned team, every matter where they are the primary client, and the
 * correspondence sent to them. Firm members can start a conversation by
 * email (sent by LegaLite, replies to the sender) or WhatsApp
 * (click-to-chat on the sender's device); both are logged here.
 *
 * This page is only the shell. Each section fetches its own data inside
 * its own error boundary and <Suspense> boundary, so the header, matters
 * and correspondence load, refetch and fail independently.
 */

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { ClientForm } from '@/components/shared/ClientForm'
import { ProfileHeader } from './_components/ProfileHeader'
import { ClientMatters } from './_components/ClientMatters'
import { MessageComposer, MessageHistory } from './_components/Correspondence'
import { AssignedTeam, ContactCard, NotesCard } from './_components/SideCards'
import { ProfileErrorBoundary } from './_components/ProfileErrorBoundary'
import { ProfileHeaderSkeleton, SectionSkeleton, SideCardSkeleton } from './_components/skeletons'

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 py-5">
        <Link
          href="/clients"
          className="mb-4 hidden items-center gap-1.5 text-[12.5px] font-medium hover:underline underline-offset-2 lg:inline-flex"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={13} weight="bold" />
          Clients
        </Link>

        <ProfileErrorBoundary label="this client">
          <Suspense fallback={<ProfileHeaderSkeleton />}>
            <ProfileHeader clientId={id} />
          </Suspense>
        </ProfileErrorBoundary>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            <ProfileErrorBoundary label="this client's matters">
              <Suspense fallback={<SectionSkeleton rows={3} label="Loading matters" />}>
                <ClientMatters clientId={id} />
              </Suspense>
            </ProfileErrorBoundary>

            <section id="correspondence" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="font-heading text-[16px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Correspondence
                </h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  Write to the client by email or WhatsApp. Messages you send are kept here.
                </p>
              </div>
              <ProfileErrorBoundary label="the message composer">
                <Suspense fallback={<SectionSkeleton rows={1} label="Loading composer" />}>
                  <MessageComposer clientId={id} />
                </Suspense>
              </ProfileErrorBoundary>
              <ProfileErrorBoundary label="the correspondence history">
                <Suspense fallback={<SectionSkeleton rows={3} label="Loading correspondence" />}>
                  <MessageHistory clientId={id} />
                </Suspense>
              </ProfileErrorBoundary>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <ProfileErrorBoundary label="contact particulars">
              <Suspense fallback={<SideCardSkeleton rows={5} />}>
                <ContactCard clientId={id} />
              </Suspense>
            </ProfileErrorBoundary>
            <ProfileErrorBoundary label="the assigned team">
              <Suspense fallback={<SideCardSkeleton rows={2} />}>
                <AssignedTeam clientId={id} />
              </Suspense>
            </ProfileErrorBoundary>
            <ProfileErrorBoundary label="file notes">
              <Suspense fallback={<SideCardSkeleton rows={2} />}>
                <NotesCard clientId={id} />
              </Suspense>
            </ProfileErrorBoundary>
          </aside>
        </div>

        {/* Edit dialog — opened from the header via the shared UI store. */}
        <ClientForm />
      </div>
    </div>
  )
}
