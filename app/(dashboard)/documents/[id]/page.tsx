'use client'

/**
 * /documents/[id] — one document in the drafting studio. Uploaded files
 * are not editable here; they open the file instead.
 */

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowSquareOut, FileX } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDocument } from '@/hooks/use-documents'
import { Studio } from '../_components/studio/Studio'

export default function DocumentStudioPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 passes params as a Promise; unwrap it with use().
  const { id } = use(params)
  const { data: doc, isLoading, error } = useDocument(id)

  if (isLoading && !doc) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-6" aria-busy aria-label="Loading document">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mx-auto h-[70vh] w-[210mm] max-w-full" />
      </div>
    )
  }

  if (error || !doc || doc.deleted_at) {
    return (
      <Message
        title={doc?.deleted_at ? 'This document is in the bin' : 'Document not found'}
        body={
          doc?.deleted_at
            ? 'Restore it from the bin on its case or client to keep editing.'
            : 'It may have been deleted, or you may not have access to it.'
        }
      />
    )
  }

  if (doc.file_url) {
    return (
      <Message
        title={doc.title}
        body="This is an uploaded file, so it opens in its own viewer rather than the drafting studio."
        action={
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
            style={{ color: 'var(--gold-dark)' }}
          >
            Open file <ArrowSquareOut size={13} />
          </a>
        }
      />
    )
  }

  return <Studio key={doc.id} doc={doc} />
}

function Message({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <FileX size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
        <p className="font-heading text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>{body}</p>
        {action}
        <div>
          <Link href="/documents" className="mt-5 inline-flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={13} /> Back to documents
          </Link>
        </div>
      </div>
    </div>
  )
}
