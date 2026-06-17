'use client'

export function FieldLabel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      className={`block text-xs font-semibold mb-1.5 ${className}`}
      style={{ color: '#374151' }}
    >
      {children}
    </label>
  )
}
