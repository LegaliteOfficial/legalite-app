'use client'

import { FileText, Pencil, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { Document, Case } from '@/types'

/**
 * One draft tile inside the drafts grid. Click anywhere → open in
 * editor; pencil button → also open in editor; trash → confirm-and-
 * delete. Linked case + suit number + court surface under the title
 * when present.
 */
export function DraftCard({
  doc,
  linkedCase,
  onOpen,
  onDelete,
}: {
  doc: Document
  linkedCase?: Case
  onOpen: (doc: Document) => void
  onDelete: (id: string, title: string | null | undefined) => void
}) {
  const created = doc.created_at ? new Date(doc.created_at) : null

  return (
    <div
      className="group rounded-xl border p-5 transition-all hover:shadow-md"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(201,151,43,0.08)' }}
        >
          <FileText size={16} style={{ color: 'var(--gold)' }} />
        </div>
        {doc.template_type && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(13,27,42,0.06)',
              color: 'var(--navy)',
            }}
          >
            {doc.template_type}
          </span>
        )}
      </div>

      <h3
        className="font-heading text-sm font-bold mb-2 line-clamp-2"
        style={{ color: 'var(--navy)' }}
      >
        {doc.title || 'Untitled draft'}
      </h3>

      <div className="space-y-1 mb-3">
        {linkedCase && (
          <p className="text-[11px] truncate" style={{ color: '#6B7280' }}>
            <span className="font-medium">Case:</span> {linkedCase.title}
          </p>
        )}
        {doc.suit_number && (
          <p className="text-[11px] font-mono truncate" style={{ color: '#6B7280' }}>
            {doc.suit_number}
          </p>
        )}
        {doc.court && (
          <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>
            {doc.court}
          </p>
        )}
      </div>

      <div
        className="flex items-center justify-between border-t pt-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
          {created
            ? created.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '-'}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Open in editor"
            onClick={() => onOpen(doc)}
          >
            <Pencil size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Delete draft"
            onClick={() => onDelete(doc.id, doc.title)}
          >
            <Trash size={13} className="text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  )
}
