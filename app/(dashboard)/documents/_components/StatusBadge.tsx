'use client'

import { STATUS_META, normaliseStatus } from '@/lib/documents/status'

export function StatusBadge({ status, className = '' }: { status: string | null | undefined; className?: string }) {
  const meta = STATUS_META[normaliseStatus(status)]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ background: meta.bg, color: meta.fg }}
      title={meta.hint}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  )
}

/** "just now", "5 min ago", "Yesterday", "12 Nov". */
export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(t).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(new Date(t).getFullYear() !== new Date(now).getFullYear() ? { year: 'numeric' } : {}),
  })
}
