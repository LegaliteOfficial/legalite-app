'use client'

export function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{
        background: active ? 'rgba(34,160,94,0.12)' : 'rgba(13,27,42,0.06)',
        color: active ? '#1B8A4C' : '#6B7280',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: active ? '#1B8A4C' : '#9CA3AF' }}
      />
      {status}
    </span>
  )
}
