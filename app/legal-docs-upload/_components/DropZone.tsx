'use client'

import { useCallback, useRef, useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  disabled?: boolean
  onFiles: (files: File[]) => void
}

export function DropZone({ disabled, onFiles }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
      if (files.length > 0) onFiles(files)
    },
    [onFiles],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setIsDragging(false)
      if (disabled) return
      acceptFiles(e.dataTransfer.files)
    },
    [acceptFiles, disabled],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) acceptFiles(e.target.files)
      if (inputRef.current) inputRef.current.value = ''
    },
    [acceptFiles],
  )

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounterRef.current += 1
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        dragCounterRef.current -= 1
        if (dragCounterRef.current <= 0) setIsDragging(false)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-all duration-200',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
      style={{
        borderColor: isDragging ? 'var(--gold)' : 'var(--border-default)',
        background: isDragging ? 'var(--gold-muted)' : 'var(--surface-card)',
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200',
          isDragging && 'scale-110',
        )}
        style={{ background: 'var(--gold-muted)' }}
      >
        <UploadSimple size={28} weight="bold" style={{ color: 'var(--gold)' }} />
      </div>

      <div>
        <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {isDragging ? 'Drop to upload' : 'Drag and drop legal PDFs here'}
        </p>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          or click to browse — upload as many as you like, up to 50MB each
        </p>
      </div>
    </div>
  )
}
