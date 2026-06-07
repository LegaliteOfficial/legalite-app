'use client'

import { useCallback, useState, useRef } from 'react'
import { UploadSimple, FileText, X } from '@phosphor-icons/react'
import { Spinner } from './Spinner'

interface FileUploadZoneProps {
  accept: string
  maxSizeMB?: number
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
  category: 'book' | 'article' | 'document'
}

const CATEGORY_CONFIG = {
  book: {
    label: 'Drop your law books here',
    sublabel: 'PDF, EPUB, DOCX up to 50MB',
    accent: '#2563EB',
    bg: 'rgba(37,99,235,0.04)',
  },
  article: {
    label: 'Drop your articles here',
    sublabel: 'PDF, DOCX, TXT up to 20MB',
    accent: '#8B5CF6',
    bg: 'rgba(139,92,246,0.04)',
  },
  document: {
    label: 'Drop your documents here',
    sublabel: 'PDF, JPG, PNG, DOCX up to 50MB',
    accent: '#C9972B',
    bg: 'rgba(201,151,43,0.04)',
  },
}

export function FileUploadZone({
  accept,
  maxSizeMB = 50,
  onUpload,
  isUploading = false,
  category,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const config = CATEGORY_CONFIG[category]

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
        return
      }
      await onUpload(file)
    },
    [maxSizeMB, onUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      if (inputRef.current) inputRef.current.value = ''
    },
    [handleFile],
  )

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      className="relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all"
      style={{
        borderColor: isDragging ? config.accent : 'var(--border)',
        background: isDragging ? config.bg : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <Spinner size={24} />
          <p className="text-sm font-medium" style={{ color: config.accent }}>
            Uploading...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: `${config.accent}10` }}
          >
            <UploadSimple size={18} style={{ color: config.accent }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
            {config.label}
          </p>
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
            {config.sublabel} — or click to browse
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-red-500">
          <X size={12} />
          {error}
        </div>
      )}
    </div>
  )
}
