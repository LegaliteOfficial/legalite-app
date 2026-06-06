'use client'

/**
 * Labelled wrapper used for every field inside the filter drawer.
 */
export function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-[12.5px] font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
