'use client'

export function TableFooter({
  count,
  noun,
}: {
  count: number
  noun: string
}) {
  return (
    <div
      className="flex items-center px-5 py-4 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <span className="text-sm" style={{ color: '#6B7280' }}>
        {count} {noun}
        {count === 1 ? '' : 's'}
      </span>
    </div>
  )
}
