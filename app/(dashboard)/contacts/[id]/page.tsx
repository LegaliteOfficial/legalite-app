'use client'

/**
 * Contact detail page — composition root.
 *
 * Page chrome (header, tags bar, tab strip) lives in `_components`;
 * each tab is its own self-contained module under `_components/<tab>/`.
 * Static config in `_constants`. Adding a tab is one entry in `TABS`
 * plus a branch in the switch below.
 *
 * Data sources:
 *   - `useClient(id)` for the contact record
 *   - Each tab consumes its own hooks (documents / invoices / etc.)
 */

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { useClient } from '@/hooks/use-clients'

import { TABS, type Tab } from './_constants'
import { ContactPageHeader } from './_components/ContactPageHeader'
import { ContactTagsBar } from './_components/ContactTagsBar'
import { TabButton } from './_components/TabButton'
import { BillsTab } from './_components/bills/BillsTab'
import { CommunicationsTab } from './_components/communications/CommunicationsTab'
import { DashboardTab } from './_components/dashboard/DashboardTab'
import { DocumentsTab } from './_components/documents/DocumentsTab'
import { NotesTab } from './_components/notes/NotesTab'
import { TransactionsTab } from './_components/transactions/TransactionsTab'

export default function ContactDetailPage({
  params,
}: {
  // Next 16's App Router exposes route params as a Promise. `use()`
  // unwraps it so this client component reads `id` as a plain string.
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: contact, isLoading, error } = useClient(id)
  const [tab, setTab] = useState<Tab>('Dashboard')

  if (isLoading) return <PageSkeleton />
  if (error || !contact) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-12">
          <div
            className="mx-auto max-w-md rounded-2xl border px-8 py-10 text-center"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-soft)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p
              className="text-[14px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {error ? 'Unable to load contact' : 'Contact not found'}
            </p>
            <p
              className="mt-1.5 text-[12.5px]"
              style={{ color: 'var(--text-muted)' }}
            >
              The contact may have been deleted or you may not have access.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/contacts')}
              className="mt-5"
            >
              Back to contacts
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ContactPageHeader contact={contact} />
      <ContactTagsBar contact={contact} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1180px] px-6 py-6">
          <div
            className="flex items-end gap-1 border-b mb-6"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {TABS.map((t) => (
              <TabButton
                key={t}
                active={tab === t}
                onClick={() => {
                  // Every tab is wired today. The branch is kept so a
                  // future "stub" tab can short-circuit to a toast
                  // without a code reshuffle.
                  setTab(t)
                  void toast // suppress unused-import lint when no toasts fire
                }}
              >
                {t}
              </TabButton>
            ))}
          </div>

          {tab === 'Dashboard' && <DashboardTab contact={contact} />}
          {tab === 'Documents' && <DocumentsTab contactId={contact.id} />}
          {tab === 'Bills' && <BillsTab contactId={contact.id} />}
          {tab === 'Transactions' && <TransactionsTab contactId={contact.id} />}
          {tab === 'Communications' && (
            <CommunicationsTab contactId={contact.id} />
          )}
          {tab === 'Notes' && <NotesTab contact={contact} />}
        </div>
      </div>
    </div>
  )
}
