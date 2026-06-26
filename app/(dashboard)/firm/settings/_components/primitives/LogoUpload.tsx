'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { Buildings, UploadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

const MAX_BYTES = 2 * 1024 * 1024

/**
 * Logo picker — reads the file as a base64 data URL (same approach as
 * Account Info) so it can be previewed and persisted without a file
 * storage backend. Caps at 2 MB.
 */
export function LogoUpload({
  value,
  onChange,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePick = (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.error('Logo is larger than 2 MB. Pick a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null
      if (!url) {
        toast.error("Couldn't read that file. Try a different format.")
        return
      }
      onChange(url)
    }
    reader.onerror = () =>
      toast.error("Couldn't read that file. Try a different format.")
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-4">
      <span
        className="relative h-16 w-16 shrink-0 rounded-xl border flex items-center justify-center overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }}
      >
        {value ? (
          <Image src={value} alt="Firm logo" fill className="object-contain p-1.5" />
        ) : (
          <Buildings size={26} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
        )}
      </span>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              handlePick(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}
          >
            <UploadSimple size={14} strokeWidth={2} />
            {value ? 'Replace logo' : 'Upload logo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          PNG, JPG, or SVG. Up to 2 MB. Shown on the sidebar and letterhead.
        </p>
      </div>
    </div>
  )
}
