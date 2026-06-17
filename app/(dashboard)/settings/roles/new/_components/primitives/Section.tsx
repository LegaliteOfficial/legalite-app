'use client'

/**
 * Card-wrapped section with anchor id, title, optional description, and
 * a children slot for fields. `scroll-mt-32` keeps section headers
 * clear of the sticky top bar when the anchor scrolls into view.
 */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border p-6 scroll-mt-32"
      style={{
        background: 'var(--cream-white)',
        borderColor: 'var(--border)',
        boxShadow: '0 4px 24px rgba(13,27,42,0.05)',
      }}
    >
      <h2
        className="font-heading text-lg font-bold mb-1"
        style={{ color: 'var(--navy)' }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="text-sm mb-5 leading-relaxed"
          style={{ color: '#6B7280' }}
        >
          {description}
        </p>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  )
}
