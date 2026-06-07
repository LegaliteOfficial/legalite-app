'use client'

import { useMemo } from 'react'
import { FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Case, Document } from '@/types'
import { DraftCard } from './DraftCard'

/**
 * Drafts tab — header (title + search), then a 1/2/3-column grid of
 * DraftCards. Empty state offers a "Browse templates" CTA when the
 * list is genuinely empty (vs. just filtered out).
 */
export function DraftsTab({
  documents,
  documentCases,
  search,
  onSearchChange,
  onOpen,
  onDelete,
  onBrowseTemplates,
}: {
  documents: Document[] | undefined
  documentCases: Case[] | undefined
  search: string
  onSearchChange: (v: string) => void
  onOpen: (doc: Document) => void
  onDelete: (id: string, title: string | null | undefined) => void
  onBrowseTemplates: () => void
}) {
  const filteredDrafts = useMemo(() => {
    return (documents ?? []).filter((d) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        (d.title ?? '').toLowerCase().includes(q) ||
        (d.template_type ?? '').toLowerCase().includes(q) ||
        (d.court ?? '').toLowerCase().includes(q) ||
        (d.suit_number ?? '').toLowerCase().includes(q)
      )
    })
  }, [documents, search])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-heading text-xl font-bold"
            style={{ color: 'var(--navy)' }}
          >
            My Drafts
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            {documents?.length ?? 0} saved document
            {(documents?.length ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="relative w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search drafts..."
            className="pl-9 h-10"
          />
        </div>
      </div>

      {filteredDrafts.length === 0 ? (
        <EmptyDrafts search={search} onBrowseTemplates={onBrowseTemplates} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDrafts.map((doc) => (
            <DraftCard
              key={doc.id}
              doc={doc}
              linkedCase={documentCases?.find((c) => c.id === doc.case_id)}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyDrafts({
  search,
  onBrowseTemplates,
}: {
  search: string
  onBrowseTemplates: () => void
}) {
  return (
    <div
      className="rounded-xl border p-12 text-center"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      <FileText size={40} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
        {search ? `No drafts match "${search}".` : 'No drafts yet.'}
      </p>
      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
        {search
          ? 'Try a different search term.'
          : 'Pick a template, fill it in, and click "Save to Library" to keep a draft here.'}
      </p>
      {!search && (
        <Button
          onClick={onBrowseTemplates}
          className="mt-4 text-white"
          style={{ background: 'var(--gold)' }}
        >
          Browse Templates
        </Button>
      )}
    </div>
  )
}
