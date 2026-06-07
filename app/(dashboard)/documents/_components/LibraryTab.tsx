'use client'

import { BookOpen, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FileUploadZone } from '@/components/shared/FileUploadZone'
import { LibraryCard } from '@/components/shared/LibraryCard'
import type { LibraryItem } from '@/hooks/use-library'
import { LIBRARY_ACCEPT, LIBRARY_CATEGORIES, LIBRARY_MAX_MB } from '../_constants'
import type { LibraryCategory } from '../_types'

const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  book: 'Books',
  article: 'Articles',
  document: 'Documents',
}

const CATEGORY_NOUNS: Record<LibraryCategory, string> = {
  book: 'books',
  article: 'articles',
  document: 'documents',
}

/**
 * Library tab — header (title + search), category pills, then an
 * upload zone above a 1/2/3/4-column grid of library items. Shows
 * skeleton tiles while the initial fetch is in-flight.
 */
export function LibraryTab({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  filteredLibrary,
  isLoading,
  isUploading,
  isDownloading,
  onUpload,
  onDownload,
  onDelete,
  onFavorite,
}: {
  search: string
  onSearchChange: (v: string) => void
  category: LibraryCategory
  onCategoryChange: (cat: LibraryCategory) => void
  filteredLibrary: LibraryItem[]
  isLoading: boolean
  isUploading: boolean
  isDownloading: boolean
  onUpload: (file: File) => Promise<void>
  onDownload: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onFavorite: (id: string) => Promise<void>
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="font-heading text-xl font-bold"
            style={{ color: 'var(--navy)' }}
          >
            Legal Library
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            Your personal collection of legal resources
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
            placeholder="Search library..."
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Category pills. */}
      <div className="flex items-center gap-1 mb-6">
        {LIBRARY_CATEGORIES.map((cat) => {
          const isActive = category === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors"
              style={{
                background: isActive ? 'var(--surface-sunken)' : 'transparent',
                color: isActive
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      <div className="mb-6">
        <FileUploadZone
          category={category}
          accept={LIBRARY_ACCEPT[category]}
          maxSizeMB={LIBRARY_MAX_MB[category]}
          onUpload={onUpload}
          isUploading={isUploading}
        />
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : filteredLibrary.length === 0 ? (
        <EmptyLibrary category={category} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLibrary.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onDownload={onDownload}
              onDelete={onDelete}
              onFavorite={onFavorite}
              isDownloading={isDownloading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-4 animate-pulse"
          style={{ background: 'white', borderColor: 'var(--border)' }}
        >
          <div className="h-11 w-11 rounded-lg bg-gray-100 mb-3" />
          <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
          <div className="h-3 w-1/2 bg-gray-50 rounded mb-3" />
          <div className="h-px bg-gray-100 mb-2" />
          <div className="h-3 w-1/3 bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  )
}

function EmptyLibrary({ category }: { category: LibraryCategory }) {
  return (
    <div
      className="rounded-xl border p-12 text-center"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
      <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>
        No {CATEGORY_NOUNS[category]} yet
      </p>
      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
        Upload your first {category} using the drop zone above.
      </p>
    </div>
  )
}
