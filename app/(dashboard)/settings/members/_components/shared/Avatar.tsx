'use client'

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
      style={{
        background: 'rgba(201,151,43,0.16)',
        color: 'var(--gold-dark)',
      }}
    >
      {initials || '?'}
    </div>
  )
}
