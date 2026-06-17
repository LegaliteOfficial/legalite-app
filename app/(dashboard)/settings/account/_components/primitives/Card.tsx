'use client'

export function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'white', borderColor: 'var(--border)' }}
    >
      <h2
        className="font-heading text-lg font-bold mb-1"
        style={{ color: '#0D1B2A' }}
      >
        {title}
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        {subtitle}
      </p>
      {children}
    </div>
  )
}
