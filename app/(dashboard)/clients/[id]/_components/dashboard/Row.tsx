'use client'

/**
 * Two-column label/value row. Falls back to an em-dash when the value
 * is missing so the column alignment stays clean.
 */
export function Row({
  label,
  value,
  suffix,
  href,
  multiline,
}: {
  label: string
  value: string | null
  suffix?: string
  href?: string
  multiline?: boolean
}) {
  const dash = <span style={{ color: 'var(--text-subtle)' }}>—</span>
  const body = value ? (
    href ? (
      <a
        href={href}
        className="underline decoration-transparent hover:decoration-current"
        style={{ color: 'var(--gold-dark)' }}
      >
        {value}
      </a>
    ) : (
      <span
        style={{
          color: 'var(--text-primary)',
          whiteSpace: multiline ? 'pre-line' : undefined,
        }}
      >
        {value}
      </span>
    )
  ) : (
    dash
  )
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <dt
        className="text-[12.5px] font-medium leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </dt>
      <dd className="text-[13px] leading-relaxed">
        {body}
        {suffix && value && (
          <span
            className="ml-1.5 text-[12px]"
            style={{ color: 'var(--text-subtle)' }}
          >
            ({suffix})
          </span>
        )}
      </dd>
    </div>
  )
}
