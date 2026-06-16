'use client'

/**
 * Card-shaped form section. Renders a header (title + optional
 * description) and slots the children inside. Forwards a ref to the
 * underlying `<section>` so the editor's scroll-spy IntersectionObserver
 * can track when each section is in view.
 *
 * `scroll-mt-24` accounts for the sticky top bar so anchor clicks land
 * with the section title visible, not flush against the header.
 */
export function Section({
  id,
  label,
  description,
  children,
  registerRef,
}: {
  id: string
  label: string
  description?: string
  children: React.ReactNode
  registerRef: (el: HTMLElement | null) => void
}) {
  return (
    <section
      id={id}
      ref={registerRef}
      className="scroll-mt-24 rounded-2xl border"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <header
        className="px-6 pt-5 pb-3 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <h2
          className="text-[15px] font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </h2>
        {description && (
          <p
            className="mt-1 text-[12.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {description}
          </p>
        )}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}
