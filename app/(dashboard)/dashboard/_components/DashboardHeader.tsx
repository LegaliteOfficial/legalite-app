'use client'

/**
 * Page header — the heading + today's date underneath. Date pinned to
 * `en-GB` so the format is stable across locales (the previous unpinned
 * call triggered hydration mismatches between en-US server and en-GB
 * browser).
 */
export function DashboardHeader() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <h1
          className="font-heading text-[28px] font-semibold leading-tight tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {today}
        </p>
      </div>
    </div>
  )
}
