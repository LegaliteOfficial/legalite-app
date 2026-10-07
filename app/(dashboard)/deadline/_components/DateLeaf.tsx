/**
 * Desk-diary date leaf: a coloured month band over the day number and
 * weekday. Used for the lead docket entry and every timeline row so dates
 * read the same way everywhere on the page.
 */

interface DateLeafProps {
  ts: number
  /** Band colour — carries the urgency of the item. */
  tone: string
  size?: 'md' | 'lg'
}

export function DateLeaf({ ts, tone, size = 'md' }: DateLeafProps) {
  const d = new Date(ts)
  const lg = size === 'lg'
  return (
    <div
      className={`flex shrink-0 flex-col self-start overflow-hidden rounded-lg border text-center ${lg ? 'w-[68px]' : 'w-[52px]'}`}
      style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
      aria-hidden
    >
      <span
        className={`font-semibold uppercase tracking-wider text-white ${lg ? 'py-1 text-[10.5px]' : 'py-0.5 text-[9.5px]'}`}
        style={{ background: tone }}
      >
        {d.toLocaleDateString('en-GB', { month: 'short' })}
      </span>
      <span
        className={`font-heading font-semibold leading-none tabular-nums ${lg ? 'pt-2 text-[28px]' : 'pt-1.5 text-[19px]'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {d.getDate()}
      </span>
      <span
        className={`font-medium ${lg ? 'pb-2 pt-1 text-[11px]' : 'pb-1.5 pt-0.5 text-[10px]'}`}
        style={{ color: 'var(--text-muted)' }}
      >
        {d.toLocaleDateString('en-GB', { weekday: 'short' })}
      </span>
    </div>
  )
}
