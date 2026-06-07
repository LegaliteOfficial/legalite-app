'use client'

import { BookOpen, FileText, Newspaper, Star, DownloadSimple, Trash, DotsThreeVertical } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { LibraryItem } from '@/hooks/use-library'

interface LibraryCardProps {
  item: LibraryItem
  onDownload: (id: string) => void
  onDelete: (id: string) => void
  onFavorite: (id: string) => void
  isDownloading?: boolean
}

const CATEGORY_ICONS = {
  book: BookOpen,
  article: Newspaper,
  document: FileText,
}

const CATEGORY_COLORS = {
  book: { bg: 'rgba(37,99,235,0.06)', accent: '#2563EB' },
  article: { bg: 'rgba(139,92,246,0.06)', accent: '#8B5CF6' },
  document: { bg: 'rgba(201,151,43,0.06)', accent: '#C9972B' },
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(fileName: string | null): string {
  if (!fileName) return ''
  return fileName.split('.').pop()?.toUpperCase() ?? ''
}

export function LibraryCard({
  item,
  onDownload,
  onDelete,
  onFavorite,
  isDownloading,
}: LibraryCardProps) {
  const Icon = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] ?? FileText
  const colors = CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ?? CATEGORY_COLORS.document
  const ext = getFileExtension(item.file_name)

  return (
    <div
      className="group rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      {/* Top row: icon + actions */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg }}
        >
          <Icon size={20} style={{ color: colors.accent }} />
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onFavorite(item.id) }}
          >
            <Star
              size={14}
              fill={item.is_favorite ? '#C9972B' : 'none'}
              style={{ color: item.is_favorite ? '#C9972B' : '#9CA3AF' }}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={isDownloading}
            onClick={(e) => { e.stopPropagation(); onDownload(item.id) }}
          >
            <DownloadSimple size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          >
            <Trash size={14} className="text-red-400" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3
        className="font-heading text-sm font-bold leading-tight mb-1 line-clamp-2"
        style={{ color: 'var(--navy)' }}
      >
        {item.title}
      </h3>

      {/* Author */}
      {item.author && (
        <p className="text-[11px] mb-2 truncate" style={{ color: '#6B7280' }}>
          {item.author}
        </p>
      )}

      {/* Description */}
      {item.description && (
        <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: '#9CA3AF' }}>
          {item.description}
        </p>
      )}

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${colors.accent}10`, color: colors.accent }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: file info */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          {ext && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${colors.accent}12`, color: colors.accent }}
            >
              {ext}
            </span>
          )}
          <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
            {formatFileSize(item.file_size)}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
          {new Date(item.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Favorite indicator */}
      {item.is_favorite && (
        <div className="absolute top-3 right-3 opacity-100 group-hover:opacity-0 transition-opacity">
          <Star size={12} fill="#C9972B" style={{ color: '#C9972B' }} />
        </div>
      )}
    </div>
  )
}
