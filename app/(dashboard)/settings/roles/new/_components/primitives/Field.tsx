'use client'

export function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--navy)' }}
        >
          {label}
        </span>
        {required && (
          <span
            className="text-xs font-bold"
            style={{ color: '#DC2626' }}
          >
            *
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
