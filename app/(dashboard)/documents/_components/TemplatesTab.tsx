'use client'

import { FileText, MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { DOCUMENT_TEMPLATES, type DocumentTemplate } from '@/lib/templates'
import { CategoryFilterRow } from './CategoryFilterRow'
import { TemplateCard } from './TemplateCard'

/**
 * Templates tab — gallery view. Header (title + search), category
 * filter row, then a horizontally-scrolling carousel of template
 * preview cards. Empty state when no templates match the search.
 */
export function TemplatesTab({
  search,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  filteredTemplates,
  onSelectTemplate,
  onQuickSetup,
}: {
  search: string
  onSearchChange: (v: string) => void
  selectedCategory: string
  onSelectCategory: (id: string) => void
  filteredTemplates: DocumentTemplate[]
  onSelectTemplate: (id: string) => void
  onQuickSetup: (id: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-heading text-xl font-bold"
            style={{ color: 'var(--navy)' }}
          >
            Create with Templates
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            {DOCUMENT_TEMPLATES.length} legal document templates
          </p>
        </div>
        <div className="relative w-72">
          <MagnifyingGlass
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 h-10"
          />
        </div>
      </div>

      <CategoryFilterRow
        selectedCategory={selectedCategory}
        onSelect={onSelectCategory}
      />

      {filteredTemplates.length === 0 ? (
        <EmptyTemplates />
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredTemplates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onSelect={onSelectTemplate}
              onQuickSetup={onQuickSetup}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyTemplates() {
  return (
    <div
      className="rounded-xl border p-12 text-center"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      <FileText size={40} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
        No templates match your search.
      </p>
    </div>
  )
}
